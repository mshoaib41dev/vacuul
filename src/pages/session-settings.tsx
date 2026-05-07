import { useState, useEffect } from "react";
import { HomeLine, Plus, Trash01, Palette } from "@untitledui/icons";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { SectionLabel } from "@/components/application/section-headers/section-label";
import { IconNotification } from "@/components/application/notifications/notifications";
import Page from "@/components/page";
import { Form } from "@/components/base/form/form";
import { InputBase, TextField } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { Select } from "@/components/base/select/select";
import { Button } from "@/components/base/buttons/button";
import { useSessionSettings } from "@/hooks/use-session-settings";
import { SessionSettings, LedColorModel, PresetModel } from "@/types/session-setting";
import { useTranslations } from "@/lib/LanguageContext";

export default function SessionSettingsPage() {
    const t = useTranslations();
    const { settings, loading, error, updateSettings, isUpdating } = useSessionSettings();

    const [frequency, setFrequency] = useState({ min: 20, max: 60 });
    const [temperature, setTemperature] = useState({ min: 35, max: 45 });
    const [ledColors, setLedColors] = useState<LedColorModel[]>([]);
    const [presets, setPresets] = useState<PresetModel[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (settings) {
            setFrequency(settings.frequency);
            setTemperature(settings.temperature);
            setLedColors(settings.ledColors);
            setPresets(settings.presets);
        }
    }, [settings]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!frequency.min || !frequency.max || !temperature.min || !temperature.max) {
                throw new Error(t("sessionSettings.fieldsRequired"));
            }

            const updatedSettings: SessionSettings = {
                frequency,
                temperature,
                ledColors,
                presets
            };

            await updateSettings(updatedSettings);

            toast.custom((toastId) => (
                <IconNotification
                    title={t("sessionSettings.updateSuccess")}
                    description={t("sessionSettings.updateSuccess")}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } catch (error) {
            console.error("Error updating session settings:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("sessionSettings.updateFailed")}
                    description={error instanceof Error ? error.message : t("sessionSettings.updateFailed")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const addLedColor = () => {
        setLedColors([...ledColors, { color: "#000000", nameEN: "", nameDE: "" }]);
    };

    const removeLedColor = (index: number) => {
        setLedColors(ledColors.filter((_, i) => i !== index));
    };

    const updateLedColor = (index: number, field: keyof LedColorModel, value: string) => {
        const updated = ledColors.map((color, i) =>
            i === index ? { ...color, [field]: value } : color
        );
        setLedColors(updated);
    };

    const addPreset = () => {
        const defaultLed = ledColors.length > 0 ? ledColors[0] : { color: "#000000", nameEN: "Default", nameDE: "Standard" };
        setPresets([...presets, {
            nameEN: "",
            nameDE: "",
            frequency: frequency.min,
            temperature: temperature.min,
            led: defaultLed
        }]);
    };

    const removePreset = (index: number) => {
        setPresets(presets.filter((_, i) => i !== index));
    };

    const updatePreset = (index: number, field: keyof PresetModel, value: string | number | LedColorModel) => {
        const updated = presets.map((preset, i) =>
            i === index ? { ...preset, [field]: value } : preset
        );
        setPresets(updated);
    };

    // Show loading state while fetching settings data
    if (loading) {
        return (
            <Page title={t("sessionSettings.title")} className="p-8">
                <Breadcrumbs className="mb-4">
                    <Breadcrumbs.Item icon={HomeLine} href="/app" />
                    <Breadcrumbs.Item>{t("sessionSettings.title")}</Breadcrumbs.Item>
                </Breadcrumbs>
                <div className="flex items-center justify-center py-8">
                    <span className="text-sm text-tertiary">{t("sessionSettings.loadingSettings")}</span>
                </div>
            </Page>
        );
    }

    // Show error state if settings couldn't be loaded
    if (error) {
        return (
            <Page title={t("sessionSettings.title")} className="p-8">
                <Breadcrumbs className="mb-4">
                    <Breadcrumbs.Item icon={HomeLine} href="/app" />
                    <Breadcrumbs.Item>{t("sessionSettings.title")}</Breadcrumbs.Item>
                </Breadcrumbs>
                <div className="flex items-center justify-center py-8">
                    <span className="text-sm text-tertiary">{error}</span>
                </div>
            </Page>
        );
    }

    return (
        <Page title={t("sessionSettings.title")} className="p-8">
            <Breadcrumbs className="mb-4">
                <Breadcrumbs.Item icon={HomeLine} href="/app" />
                <Breadcrumbs.Item>{t("sessionSettings.title")}</Breadcrumbs.Item>
            </Breadcrumbs>

            <Form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                <SectionHeader.Root>
                    <SectionHeader.Group>
                        <div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch">
                            <SectionHeader.Heading>{t("sessionSettings.title")}</SectionHeader.Heading>
                            <SectionHeader.Subheading>
                                {t("sessionSettings.description")}
                            </SectionHeader.Subheading>
                        </div>
                        <SectionHeader.Actions>
                            <Button type="button" color="secondary" size="md" href="/app">
                                {t("common.cancel")}
                            </Button>
                            <Button type="submit" color="primary" size="md" isLoading={isLoading || isUpdating}>
                                {t("sessionSettings.saveSettings")}
                            </Button>
                        </SectionHeader.Actions>
                    </SectionHeader.Group>
                </SectionHeader.Root>

                <div className="flex flex-col gap-5">
                    {/* Frequency Settings */}
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root
                            isRequired
                            size="sm"
                            title={t("sessionSettings.frequencyRange")}
                            description={t("sessionSettings.frequencyRangeDescription")}
                            className="max-lg:hidden"
                        />

                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-4">
                                <TextField
                                    isRequired
                                    name="minFrequency"
                                    value={frequency.min.toString()}
                                    onChange={(value) => setFrequency({ ...frequency, min: parseInt(value) || 0 })}
                                >
                                    <Label className="lg:hidden">{t("sessionSettings.minFrequency")}</Label>
                                    <InputBase size="md" />
                                </TextField>

                                <TextField
                                    isRequired
                                    name="maxFrequency"
                                    value={frequency.max.toString()}
                                    onChange={(value) => setFrequency({ ...frequency, max: parseInt(value) || 0 })}
                                >
                                    <Label className="lg:hidden">{t("sessionSettings.maxFrequency")}</Label>
                                    <InputBase size="md" />
                                </TextField>
                            </div>
                        </div>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    {/* Temperature Settings */}
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root
                            isRequired
                            size="sm"
                            title={t("sessionSettings.temperatureRange")}
                            description={t("sessionSettings.temperatureRangeDescription")}
                            className="max-lg:hidden"
                        />

                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-4">
                                <TextField
                                    isRequired
                                    name="minTemperature"
                                    value={temperature.min.toString()}
                                    onChange={(value) => setTemperature({ ...temperature, min: parseInt(value) || 0 })}
                                >
                                    <Label className="lg:hidden">{t("sessionSettings.minTemperature")}</Label>
                                    <InputBase size="md" />
                                </TextField>

                                <TextField
                                    isRequired
                                    name="maxTemperature"
                                    value={temperature.max.toString()}
                                    onChange={(value) => setTemperature({ ...temperature, max: parseInt(value) || 0 })}
                                >
                                    <Label className="lg:hidden">{t("sessionSettings.maxTemperature")}</Label>
                                    <InputBase size="md" />
                                </TextField>
                            </div>
                        </div>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    {/* LED Colors */}
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root
                            size="sm"
                            title={t("sessionSettings.ledColors")}
                            description={t("sessionSettings.ledColorsDescription")}
                            className="max-lg:hidden"
                        />

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <Label className="lg:hidden">{t("sessionSettings.ledColors")}</Label>
                                <Button type="button" size="sm" color="secondary" onClick={addLedColor} iconLeading={Plus}>
                                    {t("sessionSettings.addColor")}
                                </Button>
                            </div>

                            {ledColors.map((color, index) => (
                                <div key={index} className="flex flex-col gap-3 p-4 border border-border-secondary rounded-lg">
                                    <div className="grid grid-cols-2 gap-3">
                                        <TextField
                                            name={`colorNameEN-${index}`}
                                            value={color.nameEN}
                                            onChange={(value) => updateLedColor(index, 'nameEN', value)}
                                        >
                                            <Label>{t("sessionSettings.nameEN")}</Label>
                                            <InputBase size="md" />
                                        </TextField>

                                        <TextField
                                            name={`colorNameDE-${index}`}
                                            value={color.nameDE}
                                            onChange={(value) => updateLedColor(index, 'nameDE', value)}
                                        >
                                            <Label>{t("sessionSettings.nameDE")}</Label>
                                            <InputBase size="md" />
                                        </TextField>
                                    </div>

                                    <div className="flex items-end gap-3">
                                        <TextField
                                            name={`color-${index}`}
                                            value={color.color}
                                            onChange={(value) => updateLedColor(index, 'color', value)}
                                        >
                                            <Label>{t("sessionSettings.color")}</Label>
                                            <InputBase size="md" icon={Palette} />
                                        </TextField>

                                        <Button
                                            type="button"
                                            size="lg"
                                            color="secondary-destructive"
                                            onClick={() => removeLedColor(index)}
                                            iconLeading={Trash01}
                                        />
                                    </div>
                                </div>
                            ))}

                            {ledColors.length === 0 && (
                                <div className="text-center py-8 text-fg-secondary">
                                    {t("sessionSettings.noLedColors")}
                                </div>
                            )}
                        </div>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    {/* Presets */}
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root
                            size="sm"
                            title={t("sessionSettings.presets")}
                            description={t("sessionSettings.presetsDescription")}
                            className="max-lg:hidden"
                        />

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <Label className="lg:hidden">{t("sessionSettings.presets")}</Label>
                                <Button
                                    type="button"
                                    size="sm"
                                    color="secondary"
                                    onClick={addPreset}
                                    iconLeading={Plus}
                                    isDisabled={ledColors.length === 0}
                                >
                                    {t("sessionSettings.addPreset")}
                                </Button>
                            </div>

                            {presets.map((preset, index) => (
                                <div key={index} className="flex flex-col gap-3 p-4 border border-border-secondary rounded-lg">
                                    <div className="grid grid-cols-2 gap-3">
                                        <TextField
                                            name={`presetNameEN-${index}`}
                                            value={preset.nameEN}
                                            onChange={(value) => updatePreset(index, 'nameEN', value)}
                                        >
                                            <Label>{t("sessionSettings.nameEN")}</Label>
                                            <InputBase size="md" />
                                        </TextField>

                                        <TextField
                                            name={`presetNameDE-${index}`}
                                            value={preset.nameDE}
                                            onChange={(value) => updatePreset(index, 'nameDE', value)}
                                        >
                                            <Label>{t("sessionSettings.nameDE")}</Label>
                                            <InputBase size="md" />
                                        </TextField>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <TextField
                                            name={`presetFrequency-${index}`}
                                            value={preset.frequency.toString()}
                                            onChange={(value) => updatePreset(index, 'frequency', parseInt(value) || 0)}
                                        >
                                            <Label>{t("sessionSettings.frequency")}</Label>
                                            <InputBase size="md" />
                                        </TextField>

                                        <TextField
                                            name={`presetTemperature-${index}`}
                                            value={preset.temperature.toString()}
                                            onChange={(value) => updatePreset(index, 'temperature', parseInt(value) || 0)}
                                        >
                                            <Label>{t("sessionSettings.temperature")}</Label>
                                            <InputBase size="md" />
                                        </TextField>
                                    </div>

                                    <Select
                                        label={t("sessionSettings.ledColor")}
                                        size="md"
                                        selectedKey={preset.led.color}
                                        onSelectionChange={(key) => {
                                            const selectedColor = ledColors.find(c => c.color === key);
                                            if (selectedColor) {
                                                updatePreset(index, 'led', selectedColor);
                                            }
                                        }}
                                        items={ledColors.map(color => ({
                                            id: color.color,
                                            label: color.nameEN || t("sessionSettings.unnamed"),
                                            icon: (
                                                <div
                                                    className="w-4 h-4 flex-shrink-0 rounded border border-gray-300"
                                                    style={{ backgroundColor: color.color }}
                                                />
                                            )
                                        }))}
                                    >
                                        {(item) => (
                                            <Select.Item key={item.id} id={item.id}>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-4 h-4 flex-shrink-0 rounded border border-gray-300"
                                                        style={{ backgroundColor: item.id }}
                                                    />
                                                    <span className="truncate">{item.label}</span>
                                                </div>
                                            </Select.Item>
                                        )}
                                    </Select>

                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            size="lg"
                                            color="secondary-destructive"
                                            onClick={() => removePreset(index)}
                                            iconLeading={Trash01}
                                        >
                                            {t("sessionSettings.removePreset")}
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {presets.length === 0 && (
                                <div className="text-center py-8 text-fg-secondary">
                                    {t("sessionSettings.noPresets")}
                                    {ledColors.length === 0 && (
                                        <div className="text-xs text-fg-tertiary mt-1">
                                            {t("sessionSettings.addLedFirst")}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Form>
        </Page>
    );
}
