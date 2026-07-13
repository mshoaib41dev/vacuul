import { apiFetch } from "@/lib/api-client";
import type { LedColorModel, PresetModel, SessionFrequency, SessionPressure, SessionSettings, SessionTemperature } from "@/types/session-setting";

type RawSessionSettings = Record<string, unknown>;

type RawRange = {
    min?: unknown;
    max?: unknown;
};

type RawPreset = {
    nameEN?: unknown;
    nameDE?: unknown;
    frequency?: unknown;
    temperature?: unknown;
    led?: unknown;
};

const DEFAULT_FREQUENCY: SessionFrequency = { min: 20, max: 60 };
const DEFAULT_TEMPERATURE: SessionTemperature = { min: 35, max: 45 };
const DEFAULT_PRESSURE: SessionPressure = { min: 20, max: 80 };
const DEFAULT_LED_COLOR: LedColorModel = { color: "#000000", nameEN: "Default", nameDE: "Standard" };

const toFiniteNumber = (value: unknown, fallback: number): number => {
    const parsed = Number(value ?? fallback);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeRange = <T extends SessionFrequency | SessionTemperature | SessionPressure>(value: unknown, fallback: T): T => {
    const range = value && typeof value === "object" ? (value as RawRange) : {};

    return {
        min: toFiniteNumber(range.min, fallback.min),
        max: toFiniteNumber(range.max, fallback.max),
    } as T;
};

const getRangeMidpoint = (range: SessionPressure): number => {
    return Math.round((range.min + range.max) / 2);
};

const normalizeDefaultPressure = (value: unknown, pressure: SessionPressure): number => {
    const fallback = getRangeMidpoint(pressure);
    const parsed = toFiniteNumber(value, fallback);

    return parsed >= pressure.min && parsed <= pressure.max ? parsed : fallback;
};

const normalizeLedColor = (value: unknown): LedColorModel => {
    const ledColor = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

    return {
        color: typeof ledColor.color === "string" && ledColor.color.trim() ? ledColor.color : DEFAULT_LED_COLOR.color,
        nameEN: typeof ledColor.nameEN === "string" ? ledColor.nameEN : "",
        nameDE: typeof ledColor.nameDE === "string" ? ledColor.nameDE : "",
    };
};

const normalizeLedColors = (value: unknown): LedColorModel[] => {
    return Array.isArray(value) ? value.map(normalizeLedColor) : [];
};

const resolvePresetLedColor = (led: unknown, ledColors: LedColorModel[]): LedColorModel => {
    if (typeof led === "number" && led >= 0 && led < ledColors.length) {
        return ledColors[led];
    }

    if (typeof led === "string") {
        return ledColors.find((color) => color.color === led) ?? ledColors[0] ?? DEFAULT_LED_COLOR;
    }

    if (led && typeof led === "object") {
        return normalizeLedColor(led);
    }

    return ledColors[0] ?? DEFAULT_LED_COLOR;
};

const normalizePreset = (value: unknown, ledColors: LedColorModel[]): PresetModel => {
    const preset = value && typeof value === "object" ? (value as RawPreset) : {};

    return {
        nameEN: typeof preset.nameEN === "string" ? preset.nameEN : "",
        nameDE: typeof preset.nameDE === "string" ? preset.nameDE : "",
        frequency: toFiniteNumber(preset.frequency, DEFAULT_FREQUENCY.min),
        temperature: toFiniteNumber(preset.temperature, DEFAULT_TEMPERATURE.min),
        led: resolvePresetLedColor(preset.led, ledColors),
    };
};

const extractSessionSettings = (response: RawSessionSettings): RawSessionSettings => {
    const nestedSettings = response.settings;

    if (nestedSettings && typeof nestedSettings === "object") {
        return nestedSettings as RawSessionSettings;
    }

    return response;
};

const normalizeSessionSettings = (response: RawSessionSettings): SessionSettings => {
    const settings = extractSessionSettings(response);
    const pressure = normalizeRange(settings.pressure, DEFAULT_PRESSURE);
    const ledColors = normalizeLedColors(settings.ledColors);

    return {
        defaultPressure: normalizeDefaultPressure(settings.defaultPressure, pressure),
        frequency: normalizeRange(settings.frequency, DEFAULT_FREQUENCY),
        temperature: normalizeRange(settings.temperature, DEFAULT_TEMPERATURE),
        pressure,
        ledColors,
        presets: Array.isArray(settings.presets) ? settings.presets.map((preset) => normalizePreset(preset, ledColors)) : [],
    };
};

const assertRange = (range: SessionFrequency | SessionTemperature | SessionPressure, label: string) => {
    if (!Number.isFinite(range.min) || !Number.isFinite(range.max)) {
        throw new Error(`${label} range must include valid min and max values.`);
    }

    if (range.min > range.max) {
        throw new Error(`${label} min cannot be greater than max.`);
    }
};

const buildPresetPayload = (preset: PresetModel, ledColors: LedColorModel[]): RawPreset => {
    const ledIndex = ledColors.findIndex(
        (color) => color.color === preset.led.color && color.nameEN === preset.led.nameEN && color.nameDE === preset.led.nameDE,
    );

    return {
        nameEN: preset.nameEN,
        nameDE: preset.nameDE,
        frequency: preset.frequency,
        temperature: preset.temperature,
        led: ledIndex >= 0 ? ledIndex : 0,
    };
};

const buildSessionSettingsPayload = (settings: SessionSettings): RawSessionSettings => {
    assertRange(settings.frequency, "Frequency");
    assertRange(settings.temperature, "Temperature");
    assertRange(settings.pressure, "Pressure");

    return {
        defaultPressure: normalizeDefaultPressure(settings.defaultPressure, settings.pressure),
        frequency: settings.frequency,
        temperature: settings.temperature,
        pressure: settings.pressure,
        ledColors: settings.ledColors,
        presets: settings.presets.map((preset) => buildPresetPayload(preset, settings.ledColors)),
    };
};

export const sessionSettingsApi = {
    getSessionSettings: async (): Promise<SessionSettings> => {
        const response = await apiFetch<RawSessionSettings>("/v1/api/session-settings", {
            method: "GET",
        });

        return normalizeSessionSettings(response);
    },

    updateSessionSettings: async (settings: SessionSettings): Promise<SessionSettings> => {
        const response = await apiFetch<RawSessionSettings>("/v1/api/session-settings", {
            method: "PUT",
            body: buildSessionSettingsPayload(settings),
        });

        return normalizeSessionSettings(response);
    },
};
