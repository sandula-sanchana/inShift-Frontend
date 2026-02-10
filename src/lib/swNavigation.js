import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useServiceWorkerNavigation() {

    const navigate = useNavigate();

    useEffect(() => {

        if (!navigator.serviceWorker) return;

        navigator.serviceWorker.addEventListener("message", (event) => {

            if (event.data?.type === "NAVIGATE") {
                navigate(event.data.url);
            }

        });

    }, []);
}
