import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useServiceWorkerNavigation() {
    const navigate = useNavigate();

    useEffect(() => {
        if (!navigator.serviceWorker) return;

        const handler = (event) => {
            if (event.data?.type === "NAVIGATE" && event.data?.url) {
                navigate(event.data.url);
            }
        };

        navigator.serviceWorker.addEventListener("message", handler);

        return () => {
            navigator.serviceWorker.removeEventListener("message", handler);
        };
    }, [navigate]);
}