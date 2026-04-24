import { useEffect, useState } from "react";
import { fetchMetrics } from "../api/metrics";

export default function useMetrics() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);

    useEffect(() => {
        fetchMetrics()
            .then(setMetrics)
            .catch(() => setError("Could not load model metrics."))
            .finally(() => setLoading(false));
    }, []);

    return { metrics, loading, error };
}
