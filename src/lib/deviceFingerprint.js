const DEVICE_FP_KEY = "inshift_device_fingerprint";

export function getOrCreateDeviceFingerprint() {
    let fp = localStorage.getItem(DEVICE_FP_KEY);

    if (fp) return fp;

    fp =
        typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    localStorage.setItem(DEVICE_FP_KEY, fp);
    return fp;
}