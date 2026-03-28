import { create } from "zustand";

function makeId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_DURATION = 4500;

export const useToast = create((set) => ({
    items: [],
    push: (t) =>
        set((s) => ({
            items: [
                {
                    id: makeId(),
                    duration:
                        typeof t?.duration === "number" && t.duration > 0
                            ? t.duration
                            : DEFAULT_DURATION,
                    ...t,
                },
                ...s.items,
            ].slice(0, 4),
        })),
    remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));