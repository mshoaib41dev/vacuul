type MachineTimestamp = unknown;

interface MachineGeoPoint {
    latitude: number;
    longitude: number;
}

interface MachineSchedule {
    startTime: string; // Format: "HH:MM" (24-hour)
    endTime: string; // Format: "HH:MM" (24-hour)
    weekdays: number[]; // Array of weekday numbers (0=Sunday, 1=Monday, etc.)
}

interface Machine {
    id: string;
    commissionId: string;
    name: string;
    address: string;
    lat?: number;
    lng?: number;
    geo: {
        geopoint: MachineGeoPoint;
        geohash?: string;
    };
    status: "online" | "offline";
    lastOnline?: MachineTimestamp;
    ownerUserId?: string;
    createdByUserId?: string;
    idleVideos?: string[];
    pauseVideos?: string[];
    duringSessionVideos?: string[];
    schedule?: MachineSchedule;
    timezone?: string;
    volume?: number;
    brightness?: number;
    wifiCountry?: string;
    languageCode?: string;
    createdAt?: MachineTimestamp;
    updatedAt?: MachineTimestamp;
}

interface UseMachine {
    machines: Machine[];
    loading: boolean;
    error: Error | null;
    count: number | null;
    countLoading: boolean;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    getMachine: (machineId: string) => Promise<Machine | null>;
    registerMachine: (
        machine: Omit<
            Machine,
            "id" | "timezone" | "wifiCountry" | "languageCode" | "createdAt" | "updatedAt" | "lastOnline" | "volume" | "brightness" | "createdByUserId"
        >,
    ) => Promise<Machine>;
    updateMachine: (machineId: string, machine: Omit<Partial<Machine>, "id" | "createdAt" | "updatedAt" | "lastOnline">) => Promise<void>;
    deleteMachine: (machineId: string) => Promise<void>;
    // Search functionality
    searchResults: Machine[];
    searchLoading: boolean;
    searchError: string | null;
    searchTotalHits: number;
    searchMachines: (query: string) => Promise<void>;
    clearSearch: () => void;
}

export type { Machine, MachineSchedule, UseMachine };
