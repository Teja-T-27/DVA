import { BACKEND_URL } from "../utils/constants";

export async function predict(features) {
    const res = await fetch(`${BACKEND_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(features),
    });
    if (!res.ok) throw new Error(`Predict failed: ${res.status}`);
    return res.json();
}
