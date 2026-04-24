import { BACKEND_URL } from "../utils/constants";

export async function fetchMetrics() {
    const res = await fetch(`${BACKEND_URL}/metrics`);
    if (!res.ok) throw new Error(`Metrics failed: ${res.status}`);
    return res.json();
}

export async function fetchTopFeatures(condition, n = 10) {
    const res = await fetch(`${BACKEND_URL}/top_features/${condition}?n=${n}`);
    if (!res.ok) throw new Error(`Top features failed: ${res.status}`);
    return res.json();
}
