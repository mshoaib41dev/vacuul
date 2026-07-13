import { apiFetch } from "@/lib/api-client";
import type { Machine, MachineSchedule } from "@/types/machine";

export type ListMachinesResponse = {
    machines: Machine[];
};

export type RegisterMachineRequest = Omit<
    Machine,
    "id" | "timezone" | "wifiCountry" | "languageCode" | "createdAt" | "updatedAt" | "lastOnline" | "volume" | "brightness" | "createdByUserId"
>;

export type UpdateMachineRequest = {
    id: string;
    machine: Omit<Partial<Machine>, "id" | "createdAt" | "updatedAt" | "lastOnline">;
};

export type DeleteMachineResponse = {
    success: boolean;
};

type RawMachine = Record<string, unknown>;

type RawListMachinesResponse =
    | {
          machines?: RawMachine[];
      }
    | RawMachine[];

const DEFAULT_LAT = 0;
const DEFAULT_LNG = 0;

const toStringValue = (value: unknown, fallback = ""): string => {
    return typeof value === "string" ? value : fallback;
};

const toNumberValue = (value: unknown, fallback: number): number => {
    const parsed = Number(value ?? fallback);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toStringArray = (value: unknown): string[] | undefined => {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : undefined;
};

const normalizeSchedule = (value: unknown): MachineSchedule | undefined => {
    if (!value || typeof value !== "object") {
        return undefined;
    }

    const schedule = value as Partial<MachineSchedule>;

    return {
        startTime: typeof schedule.startTime === "string" ? schedule.startTime : "",
        endTime: typeof schedule.endTime === "string" ? schedule.endTime : "",
        weekdays: Array.isArray(schedule.weekdays)
            ? schedule.weekdays.map((day) => Number(day)).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
            : [],
    };
};

const getNestedNumber = (value: unknown, keys: string[]): number | null => {
    if (!value || typeof value !== "object") return null;

    let current: unknown = value;
    for (const key of keys) {
        if (!current || typeof current !== "object" || !(key in current)) {
            return null;
        }
        current = (current as Record<string, unknown>)[key];
    }

    const parsed = Number(current);
    return Number.isFinite(parsed) ? parsed : null;
};

const getNestedString = (value: unknown, keys: string[]): string => {
    if (!value || typeof value !== "object") return "";

    let current: unknown = value;
    for (const key of keys) {
        if (!current || typeof current !== "object" || !(key in current)) {
            return "";
        }
        current = (current as Record<string, unknown>)[key];
    }

    return typeof current === "string" ? current : "";
};

const firstFiniteNumber = (values: Array<number | null>): number | null => {
    return values.find((value): value is number => typeof value === "number" && Number.isFinite(value)) ?? null;
};

const getMachineAddress = (machine: RawMachine): string => {
    return (
        toStringValue(machine.address) ||
        getNestedString(machine.location, ["address"]) ||
        getNestedString(machine.geo, ["address"]) ||
        getNestedString(machine.coordinates, ["address"])
    );
};

const getMachineLatitude = (machine: RawMachine): number => {
    return (
        firstFiniteNumber([
            toNumberValue(machine.lat, Number.NaN),
            toNumberValue(machine.latitude, Number.NaN),
            getNestedNumber(machine.location, ["lat"]),
            getNestedNumber(machine.location, ["latitude"]),
            getNestedNumber(machine.geo, ["geopoint", "latitude"]),
            getNestedNumber(machine.geo, ["latitude"]),
            getNestedNumber(machine.coordinates, ["lat"]),
            getNestedNumber(machine.coordinates, ["latitude"]),
        ]) ?? DEFAULT_LAT
    );
};

const getMachineLongitude = (machine: RawMachine): number => {
    return (
        firstFiniteNumber([
            toNumberValue(machine.lng, Number.NaN),
            toNumberValue(machine.longitude, Number.NaN),
            getNestedNumber(machine.location, ["lng"]),
            getNestedNumber(machine.location, ["longitude"]),
            getNestedNumber(machine.geo, ["geopoint", "longitude"]),
            getNestedNumber(machine.geo, ["longitude"]),
            getNestedNumber(machine.coordinates, ["lng"]),
            getNestedNumber(machine.coordinates, ["longitude"]),
        ]) ?? DEFAULT_LNG
    );
};

const normalizeMachine = (machine: RawMachine, index: number): Machine => {
    const lat = getMachineLatitude(machine);
    const lng = getMachineLongitude(machine);
    const status = machine.status === "online" ? "online" : "offline";

    return {
        ...machine,
        id: String(machine.id ?? machine._id ?? machine.objectID ?? `machine-${index}`),
        commissionId: toStringValue(machine.commissionId),
        ownerUserId: toStringValue(machine.ownerUserId) || undefined,
        createdByUserId: toStringValue(machine.createdByUserId) || undefined,
        name: toStringValue(machine.name),
        address: getMachineAddress(machine),
        lat,
        lng,
        geo: {
            ...(typeof machine.geo === "object" && machine.geo ? machine.geo : {}),
            geopoint: {
                latitude: lat,
                longitude: lng,
            },
        },
        status,
        timezone: toStringValue(machine.timezone),
        wifiCountry: toStringValue(machine.wifiCountry),
        languageCode: toStringValue(machine.languageCode),
        volume: toNumberValue(machine.volume, 80),
        brightness: toNumberValue(machine.brightness, 80),
        schedule: normalizeSchedule(machine.schedule),
        idleVideos: toStringArray(machine.idleVideos),
        pauseVideos: toStringArray(machine.pauseVideos),
        duringSessionVideos: toStringArray(machine.duringSessionVideos),
        createdAt: machine.createdAt,
        updatedAt: machine.updatedAt,
        lastOnline: machine.lastOnline,
    };
};

const extractMachineArray = (response: RawListMachinesResponse): RawMachine[] => {
    return Array.isArray(response) ? response : response.machines ?? [];
};

const getPayloadLatitude = (machine: Partial<Machine>): number | undefined => {
    const value = machine.lat ?? machine.geo?.geopoint?.latitude;
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

const getPayloadLongitude = (machine: Partial<Machine>): number | undefined => {
    const value = machine.lng ?? machine.geo?.geopoint?.longitude;
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

const buildMachinePayload = (machine: Partial<Machine>): Record<string, unknown> => {
    return {
        commissionId: machine.commissionId,
        ownerUserId: machine.ownerUserId,
        name: machine.name,
        address: machine.address,
        lat: getPayloadLatitude(machine),
        lng: getPayloadLongitude(machine),
        timezone: machine.timezone,
        wifiCountry: machine.wifiCountry,
        status: machine.status,
        volume: machine.volume,
        brightness: machine.brightness,
        languageCode: machine.languageCode,
        schedule: machine.schedule,
        idleVideos: machine.idleVideos,
        pauseVideos: machine.pauseVideos,
        duringSessionVideos: machine.duringSessionVideos,
    };
};

const assertMachineId = (id: string) => {
    if (!id) {
        throw new Error("Machine ID is required.");
    }
};

const assertRegisterMachine = (machine: RegisterMachineRequest) => {
    if (!machine.commissionId?.trim() || !machine.name?.trim() || !machine.address?.trim()) {
        throw new Error("Commission ID, name, and address are required.");
    }

    if (getPayloadLatitude(machine) === undefined || getPayloadLongitude(machine) === undefined) {
        throw new Error("Machine latitude and longitude are required.");
    }
};

export const machinesApi = {
    listMachines: async (): Promise<ListMachinesResponse> => {
        const response = await apiFetch<RawListMachinesResponse>("/v1/api/machines", {
            method: "GET",
        });

        return {
            machines: extractMachineArray(response).map(normalizeMachine),
        };
    },

    registerMachine: (machine: RegisterMachineRequest): Promise<Machine> => {
        assertRegisterMachine(machine);

        return apiFetch<RawMachine>("/v1/api/machines", {
            method: "POST",
            body: buildMachinePayload(machine),
        }).then((response) => normalizeMachine(response, 0));
    },

    updateMachine: ({ id, machine }: UpdateMachineRequest): Promise<Machine> => {
        assertMachineId(id);

        return apiFetch<RawMachine>(`/v1/api/machines/${id}`, {
            method: "PUT",
            body: buildMachinePayload(machine),
        }).then((response) => normalizeMachine(response, 0));
    },

    deleteMachine: (id: string): Promise<DeleteMachineResponse> => {
        assertMachineId(id);

        return apiFetch<DeleteMachineResponse>(`/v1/api/machines/${id}`, {
            method: "DELETE",
        });
    },
};
