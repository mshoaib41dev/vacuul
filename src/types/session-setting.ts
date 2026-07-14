interface SessionFrequency {
    min: number;
    max: number;
}

interface SessionTemperature {
    min: number;
    max: number;
}

interface SessionPressure {
    min: number;
    max: number;
}

interface LedColorModel {
    color: string;
    nameEN: string;
    nameDE: string;
}

interface PresetModel {
    nameEN: string;
    nameDE: string;
    frequency: number;
    temperature: number;
    led: LedColorModel;
}

interface SessionSettings {
    defaultPressure?: number;
    frequency: SessionFrequency;
    temperature: SessionTemperature;
    pressure: SessionPressure;
    ledColors: LedColorModel[];
    presets: PresetModel[];
}

export type { SessionFrequency, SessionTemperature, SessionPressure, LedColorModel, PresetModel, SessionSettings };
