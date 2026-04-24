import { useEffect, useState, useCallback, useRef } from "react";
import { predict } from "../api/predict";

export default function useModel(features) {
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);
    const timerRef = useRef(null);

    const run = useCallback((feat) => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await predict(feat);
                setData(result);
            } catch (err) {
                setError("Could not reach the prediction server. Make sure the backend is running.");
            } finally {
                setLoading(false);
            }
        }, 250);
    }, []);

    useEffect(() => {
        if (features) run(features);
        return () => clearTimeout(timerRef.current);
    }, [features, run]);

    return { data, loading, error };
}
