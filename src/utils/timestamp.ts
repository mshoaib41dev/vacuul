interface SerializedTimestamp {
    seconds?: number;
    nanoseconds?: number;
    _seconds?: number;
    _nanoseconds?: number;
}

const isValidDate = (date: Date): boolean => Number.isFinite(date.getTime());

export const timestampToDate = (value: unknown): Date | null => {
    if (!value) return null;

    if (value instanceof Date) {
        return isValidDate(value) ? value : null;
    }

    // Supports Firestore-like objects with a toDate() method without importing firebase.
    if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
        const date = value.toDate();
        return date instanceof Date && isValidDate(date) ? date : null;
    }

    if (typeof value === "number") {
        const milliseconds = value > 1_000_000_000_000 ? value : value * 1000;
        const date = new Date(milliseconds);
        return isValidDate(date) ? date : null;
    }

    if (typeof value === "string") {
        const date = new Date(value);
        return isValidDate(date) ? date : null;
    }

    if (typeof value === "object") {
        const timestamp = value as SerializedTimestamp;
        const seconds = timestamp.seconds ?? timestamp._seconds;
        const nanoseconds = timestamp.nanoseconds ?? timestamp._nanoseconds ?? 0;

        if (typeof seconds === "number") {
            const date = new Date(seconds * 1000 + Math.floor(nanoseconds / 1_000_000));
            return isValidDate(date) ? date : null;
        }
    }

    return null;
};
