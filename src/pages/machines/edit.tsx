import { useEffect, useState } from "react";
import { CpuChip01, HomeLine, MarkerPin01, Tag01, Type02 } from "@untitledui/icons";
import { GeoPoint } from "firebase/firestore";
import { geohashForLocation } from "geofire-common";
import { useParams } from "react-router-dom";
import { useListData } from "react-stately";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { IconNotification } from "@/components/application/notifications/notifications";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { SectionLabel } from "@/components/application/section-headers/section-label";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { InputBase, TextField } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { ScheduleInput } from "@/components/base/input/schedule-input";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Select } from "@/components/base/select/select";
import type { SelectItemType } from "@/components/base/select/select";
import { Slider } from "@/components/base/slider/slider";
import Page from "@/components/page";
import { timezones, wifiCountries } from "@/constants/machine-options";
import useContent from "@/hooks/use-content";
import { useGooglePlaces } from "@/hooks/use-google-places";
import useMachine from "@/hooks/use-machines";
import useUsersByRole from "@/hooks/use-users-by-role";
import { useTranslations } from "@/lib/LanguageContext";
import { MACHINE_OWNER_ROLE_ID } from "@/config";
import type { Machine, MachineSchedule } from "@/types/machine";

export default function EditMachine() {
    const { id } = useParams<{ id: string }>();
    const t = useTranslations();
    const { getMachine, updateMachine } = useMachine();

    // Hook to get users with specific roleId
    const { users: ownerUsers, loading: usersLoading } = useUsersByRole({
        roleId: MACHINE_OWNER_ROLE_ID,
    });
    // Hook to get available content for video selection - load all content without pagination
    const { contents, loading: contentsLoading } = useContent({
        limit: 1000, // Set a high limit to load all content
        page: 1,
    });

    const [machine, setMachine] = useState<Machine | null>(null);
    const [isLoadingMachine, setIsLoadingMachine] = useState(true);
    const [machineError, setMachineError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [status, setStatus] = useState<"online" | "offline">("offline");
    const [address, setAddress] = useState("");
    const [longitude, setLongitude] = useState("");
    const [latitude, setLatitude] = useState("");
    const [ownerUserId, setOwnerUserId] = useState<string>("");
    const [schedule, setSchedule] = useState<MachineSchedule>({
        startTime: "",
        endTime: "",
        weekdays: [],
    });
    const [timezone, setTimezone] = useState("");
    const [wifiCountry, setWifiCountry] = useState("");
    const [languageCode, setLanguageCode] = useState("");
    const [volume, setVolume] = useState(80);
    const [brightness, setBrightness] = useState(80);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdatingFromGeocode, setIsUpdatingFromGeocode] = useState(false);

    // Use useListData for managing selected videos
    const idleVideosListData = useListData<SelectItemType>({
        initialItems: [],
    });

    const pauseVideosListData = useListData<SelectItemType>({
        initialItems: [],
    });

    const duringSessionVideosListData = useListData<SelectItemType>({
        initialItems: [],
    });

    const { inputRef, reverseGeocode } = useGooglePlaces((place) => {
        setIsUpdatingFromGeocode(true);
        setAddress(place.address);
        setLatitude(place.latitude.toString());
        setLongitude(place.longitude.toString());
        setTimeout(() => setIsUpdatingFromGeocode(false), 100);
    });

    const handleCoordinateChange = async (lat: string, lng: string) => {
        if (isUpdatingFromGeocode) return; // Prevent loop when auto-filling from address

        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);

        if (!isNaN(latNum) && !isNaN(lngNum) && lat.trim() !== "" && lng.trim() !== "") {
            try {
                setIsUpdatingFromGeocode(true);
                const address = await reverseGeocode(latNum, lngNum);
                if (address) {
                    setAddress(address);
                }
                setTimeout(() => setIsUpdatingFromGeocode(false), 100);
            } catch (error) {
                console.error("Failed to reverse geocode:", error);
                setIsUpdatingFromGeocode(false);
            }
        }
    };

    // Fetch machine data on component mount
    useEffect(() => {
        if (!id) {
            setMachineError(t("machines.machineIdRequired"));
            setIsLoadingMachine(false);
            return;
        }

        const fetchMachine = async () => {
            try {
                setIsLoadingMachine(true);
                setMachineError(null);
                const machineData = await getMachine(id);

                if (!machineData) {
                    setMachineError(t("machines.machineNotFound"));
                    return;
                }

                setMachine(machineData);
                setName(machineData.name);
                setStatus(machineData.status);
                setAddress(machineData.address);
                setLatitude(machineData.geo.geopoint.latitude.toString());
                setLongitude(machineData.geo.geopoint.longitude.toString());
                setOwnerUserId(machineData.ownerUserId || "");
                setSchedule(
                    machineData.schedule || {
                        startTime: "",
                        endTime: "",
                        weekdays: [],
                    },
                );
                setTimezone(machineData.timezone || "");
                setWifiCountry(machineData.wifiCountry || "");
                setLanguageCode(machineData.languageCode || "");
                setVolume(machineData.volume || 80);
                setBrightness(machineData.brightness || 80);
            } catch (error) {
                console.error("Error fetching machine:", error);
                setMachineError(t("machines.failedToLoadData"));
            } finally {
                setIsLoadingMachine(false);
            }
        };

        fetchMachine();
    }, [id]);

    // Initialize video lists when both machine and content data are available
    useEffect(() => {
        if (!machine || contentsLoading || contents.length === 0) {
            return;
        }

        // Clear existing items first
        idleVideosListData.remove(...idleVideosListData.items.map((item) => item.id));
        pauseVideosListData.remove(...pauseVideosListData.items.map((item) => item.id));
        duringSessionVideosListData.remove(...duringSessionVideosListData.items.map((item) => item.id));

        // Initialize idle videos
        if (machine.idleVideos) {
            const idleVideoItems = machine.idleVideos.map((idOrUrl) => {
                // Try to find content by ID first (new format), then by URL (old format)
                let content = contents.find((c) => c.id === idOrUrl);
                if (!content) {
                    content = contents.find((c) => c.url === idOrUrl);
                }
                return {
                    id: content ? content.id : idOrUrl,
                    label: content?.name || t("machines.unknownVideo"),
                };
            });
            idleVideosListData.append(...idleVideoItems);
        }

        // Initialize pause videos
        if (machine.pauseVideos) {
            const pauseVideoItems = machine.pauseVideos.map((idOrUrl) => {
                let content = contents.find((c) => c.id === idOrUrl);
                if (!content) {
                    content = contents.find((c) => c.url === idOrUrl);
                }
                return {
                    id: content ? content.id : idOrUrl,
                    label: content?.name || t("machines.unknownVideo"),
                };
            });
            pauseVideosListData.append(...pauseVideoItems);
        }

        // Initialize during session videos
        if (machine.duringSessionVideos) {
            const duringSessionVideoItems = machine.duringSessionVideos.map((idOrUrl) => {
                let content = contents.find((c) => c.id === idOrUrl);
                if (!content) {
                    content = contents.find((c) => c.url === idOrUrl);
                }
                return {
                    id: content ? content.id : idOrUrl,
                    label: content?.name || t("machines.unknownVideo"),
                };
            });
            duringSessionVideosListData.append(...duringSessionVideoItems);
        }
    }, [machine, contents, contentsLoading]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!id || !machine) {
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={t("machines.dataNotAvailable")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
            return;
        }

        setIsLoading(true);

        try {
            if (!name || !address || !latitude || !longitude) {
                throw new Error(t("machines.allFieldsRequired"));
            }

            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);

            if (isNaN(lat) || isNaN(lng)) {
                throw new Error(t("machines.invalidLatLng"));
            }

            await updateMachine(id, {
                name,
                status,
                address,
                geo: {
                    geopoint: new GeoPoint(lat, lng),
                    geohash: geohashForLocation([lat, lng]),
                },
                ownerUserId: ownerUserId || undefined,
                idleVideos: idleVideosListData.items.map((item) => item.id as string),
                pauseVideos: pauseVideosListData.items.map((item) => item.id as string),
                duringSessionVideos: duringSessionVideosListData.items.map((item) => item.id as string),
                schedule: schedule.startTime && schedule.endTime && schedule.weekdays.length > 0 ? schedule : undefined,
                timezone: timezone || undefined,
                wifiCountry: wifiCountry || undefined,
                languageCode: languageCode || undefined,
                volume,
                brightness,
            });

            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.success")}
                    description={t("machines.updateSuccess")}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } catch (error) {
            console.error("Error updating machine:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={error instanceof Error ? error.message : t("machines.updateFailed")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } finally {
            setIsLoading(false);
        }
    };

    // Filter content to show only video files and convert to SelectItemType format
    const videoContent = contents
        .filter(
            (content) =>
                content.type.startsWith("video/") ||
                content.name.toLowerCase().endsWith(".mp4") ||
                content.name.toLowerCase().endsWith(".mov") ||
                content.name.toLowerCase().endsWith(".avi") ||
                content.name.toLowerCase().endsWith(".mkv"),
        )
        .map((content) => ({
            id: content.id, // Use content ID instead of URL for consistency
            label: content.name,
            url: content.url, // Keep URL as additional property if needed
        }));

    // Show loading state while fetching machine data
    if (isLoadingMachine) {
        return (
            <Page title={t("machines.editMachine")} className="p-8">
                <Breadcrumbs className="mb-4">
                    <Breadcrumbs.Item icon={HomeLine} href="/app" />
                    <Breadcrumbs.Item href="/app/machines">{t("nav.machines")}</Breadcrumbs.Item>
                    <Breadcrumbs.Item>{t("machines.editMachine")}</Breadcrumbs.Item>
                </Breadcrumbs>
                <div className="flex items-center justify-center py-8">
                    <span className="text-sm text-tertiary">{t("machines.loadingMachineData")}</span>
                </div>
            </Page>
        );
    }

    // Show error state if machine couldn't be loaded
    if (machineError || !machine) {
        return (
            <Page title={t("machines.editMachine")} className="p-8">
                <Breadcrumbs className="mb-4">
                    <Breadcrumbs.Item icon={HomeLine} href="/app" />
                    <Breadcrumbs.Item href="/app/machines">{t("nav.machines")}</Breadcrumbs.Item>
                    <Breadcrumbs.Item>{t("machines.editMachine")}</Breadcrumbs.Item>
                </Breadcrumbs>
                <div className="flex items-center justify-center py-8">
                    <span className="text-sm text-tertiary">{machineError || t("machines.machineNotFound")}</span>
                </div>
            </Page>
        );
    }

    return (
        <Page title={t("machines.editMachine")} className="p-8">
            <Breadcrumbs className="mb-4">
                <Breadcrumbs.Item icon={HomeLine} href="/app" />
                <Breadcrumbs.Item href="/app/machines">{t("nav.machines")}</Breadcrumbs.Item>
                <Breadcrumbs.Item>{t("machines.editMachine")}</Breadcrumbs.Item>
            </Breadcrumbs>

            <Form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                <SectionHeader.Root>
                    <SectionHeader.Group>
                        <div className="flex flex-1 flex-col justify-center gap-0.5 self-stretch">
                            <SectionHeader.Heading>{t("machines.machineInfo")}</SectionHeader.Heading>
                            <SectionHeader.Subheading>{t("machines.machineDetails")}</SectionHeader.Subheading>
                        </div>

                        <SectionHeader.Actions>
                            <Button type="button" color="secondary" size="md" href="/app/machines">
                                {t("common.cancel")}
                            </Button>
                            <Button type="submit" color="primary" size="md" isLoading={isLoading}>
                                {t("machines.editMachine")}
                            </Button>
                        </SectionHeader.Actions>
                    </SectionHeader.Group>
                </SectionHeader.Root>

                <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root size="sm" title={t("machines.machineId")} className="max-lg:hidden" />

                        <TextField name="machineId" value={machine.id} onChange={() => {}} isDisabled>
                            <Label className="lg:hidden">{t("machines.machineId")}</Label>
                            <InputBase size="md" icon={CpuChip01} />
                        </TextField>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root size="sm" title={t("machines.commissionId")} className="max-lg:hidden" />

                        <TextField name="commissionId" value={machine.commissionId} onChange={() => {}} isDisabled>
                            <Label className="lg:hidden">{t("machines.commissionId")}</Label>
                            <InputBase size="md" icon={Tag01} />
                        </TextField>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root isRequired size="sm" title={t("machines.machineName")} className="max-lg:hidden" />

                        <TextField isRequired name="name" value={name} onChange={setName}>
                            <Label className="lg:hidden">{t("machines.machineName")}</Label>
                            <InputBase size="md" icon={Type02} />
                        </TextField>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root isRequired size="sm" title={t("machines.status")} className="max-lg:hidden" />

                        <Select
                            isRequired
                            label={t("machines.status")}
                            placeholder={t("machines.selectStatus")}
                            selectedKey={status}
                            onSelectionChange={(key) => setStatus(key as "online" | "offline")}
                            items={[
                                { id: "online", label: t("common.online") },
                                { id: "offline", label: t("common.offline") },
                            ]}
                        >
                            {(item) => (
                                <Select.Item key={item.id} id={item.id}>
                                    {item.label}
                                </Select.Item>
                            )}
                        </Select>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root size="sm" title={t("machines.ownerUser")} description={t("machines.ownerUserDescription")} className="max-lg:hidden" />

                        <Select
                            label={t("machines.ownerUser")}
                            placeholder={usersLoading ? t("machines.loadingUsers") : t("machines.ownerUserPlaceholder")}
                            selectedKey={ownerUserId}
                            onSelectionChange={(key) => setOwnerUserId(key as string)}
                            isDisabled={usersLoading}
                            items={ownerUsers.map((user) => ({
                                id: user.id,
                                label: user.email || t("machines.unknownUser"),
                            }))}
                        >
                            {(item) => (
                                <Select.Item key={item.id} id={item.id}>
                                    <div className="flex flex-col">
                                        <span>{item.label}</span>
                                    </div>
                                </Select.Item>
                            )}
                        </Select>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root
                            isRequired
                            size="sm"
                            title={t("machines.address")}
                            description={t("machines.addressDescription")}
                            className="max-lg:hidden"
                        />

                        <TextField isRequired name="address" value={address} onChange={setAddress}>
                            <Label className="lg:hidden">{t("machines.address")}</Label>
                            <InputBase ref={inputRef} size="md" icon={MarkerPin01} placeholder={t("machines.addressPlaceholder")} />
                        </TextField>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root
                            isRequired
                            size="sm"
                            title={t("machines.longitude")}
                            description={t("machines.longitudeDescription")}
                            className="max-lg:hidden"
                        />

                        <TextField
                            isRequired
                            name="longitude"
                            value={longitude}
                            onChange={(value) => {
                                setLongitude(value);
                                if (latitude) {
                                    handleCoordinateChange(latitude, value);
                                }
                            }}
                        >
                            <Label className="lg:hidden">{t("machines.longitude")}</Label>
                            <InputBase size="md" icon={MarkerPin01} />
                        </TextField>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root
                            isRequired
                            size="sm"
                            title={t("machines.latitude")}
                            description={t("machines.latitudeDescription")}
                            className="max-lg:hidden"
                        />

                        <TextField
                            isRequired
                            name="latitude"
                            value={latitude}
                            onChange={(value) => {
                                setLatitude(value);
                                if (longitude) {
                                    handleCoordinateChange(value, longitude);
                                }
                            }}
                        >
                            <Label className="lg:hidden">{t("machines.latitude")}</Label>
                            <InputBase size="md" icon={MarkerPin01} />
                        </TextField>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root size="sm" title={t("machines.idleVideos")} description={t("machines.idleVideosDescription")} className="max-lg:hidden" />

                        <MultiSelect
                            label={t("machines.idleVideos")}
                            placeholder={t("machines.idleVideosPlaceholder")}
                            items={videoContent}
                            selectedItems={idleVideosListData}
                            isDisabled={contentsLoading}
                        >
                            {(item) => (
                                <MultiSelect.Item key={item.id} id={item.id}>
                                    {item.label}
                                </MultiSelect.Item>
                            )}
                        </MultiSelect>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root
                            size="sm"
                            title={t("machines.pauseVideos")}
                            description={t("machines.pauseVideosDescription")}
                            className="max-lg:hidden"
                        />

                        <MultiSelect
                            label={t("machines.pauseVideos")}
                            placeholder={t("machines.pauseVideosPlaceholder")}
                            items={videoContent}
                            selectedItems={pauseVideosListData}
                            isDisabled={contentsLoading}
                        >
                            {(item) => (
                                <MultiSelect.Item key={item.id} id={item.id}>
                                    {item.label}
                                </MultiSelect.Item>
                            )}
                        </MultiSelect>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root
                            size="sm"
                            title={t("machines.duringSessionVideos")}
                            description={t("machines.duringSessionVideosDescription")}
                            className="max-lg:hidden"
                        />

                        <MultiSelect
                            label={t("machines.duringSessionVideos")}
                            placeholder={t("machines.duringSessionVideosPlaceholder")}
                            items={videoContent}
                            selectedItems={duringSessionVideosListData}
                            isDisabled={contentsLoading}
                        >
                            {(item) => (
                                <MultiSelect.Item key={item.id} id={item.id}>
                                    {item.label}
                                </MultiSelect.Item>
                            )}
                        </MultiSelect>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root
                            size="sm"
                            title={t("machines.schedule")}
                            description={t("machines.scheduleDescription")}
                            className="max-lg:hidden"
                        />

                        <ScheduleInput
                            value={schedule}
                            onChange={setSchedule}
                            label={t("machines.schedule")}
                            hint={t("machines.scheduleHint")}
                        />
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root size="sm" title={t("machines.timezone")} description={t("machines.timezoneDescription")} className="max-lg:hidden" />

                        <Select
                            label={t("machines.timezone")}
                            placeholder={t("machines.timezonePlaceholder")}
                            selectedKey={timezone}
                            onSelectionChange={(key) => setTimezone(key as string)}
                            items={timezones.map((tz) => ({
                                id: tz.value,
                                label: tz.label,
                            }))}
                        >
                            {(item) => (
                                <Select.Item key={item.id} id={item.id}>
                                    {item.label}
                                </Select.Item>
                            )}
                        </Select>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root
                            size="sm"
                            title={t("machines.wifiCountry")}
                            description={t("machines.wifiCountryDescription")}
                            className="max-lg:hidden"
                        />

                        <Select
                            label={t("machines.wifiCountry")}
                            placeholder={t("machines.wifiCountryPlaceholder")}
                            selectedKey={wifiCountry}
                            onSelectionChange={(key) => setWifiCountry(key as string)}
                            items={wifiCountries.map((country) => ({
                                id: country.code,
                                label: `${country.name} (${country.code})`,
                            }))}
                        >
                            {(item) => (
                                <Select.Item key={item.id} id={item.id}>
                                    {item.label}
                                </Select.Item>
                            )}
                        </Select>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root
                            size="sm"
                            title={t("machines.languageCode")}
                            description={t("machines.languageCodeDescription")}
                            className="max-lg:hidden"
                        />

                        <TextField name="languageCode" value={languageCode} onChange={setLanguageCode}>
                            <Label className="lg:hidden">{t("machines.languageCode")}</Label>
                            <InputBase size="md" placeholder={t("machines.languageCodePlaceholder")} />
                        </TextField>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root size="sm" title={t("machines.volume")} description={t("machines.volumeDescription")} className="max-lg:hidden" />

                        <div className="flex flex-col gap-2">
                            <Label className="lg:hidden">{t("machines.volume")}</Label>
                            <Slider
                                defaultValue={volume}
                                value={volume}
                                onChange={(v) => setVolume(v as number)}
                                labelPosition="top-floating"
                                minValue={1}
                                maxValue={100}
                                step={1}
                            />
                        </div>
                    </div>

                    <hr className="h-px w-full border-none bg-border-secondary" />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root size="sm" title={t("machines.brightness")} description={t("machines.brightnessDescription")} className="max-lg:hidden" />

                        <div className="flex flex-col gap-2">
                            <Label className="lg:hidden">{t("machines.brightness")}</Label>
                            <Slider
                                defaultValue={brightness}
                                value={brightness}
                                onChange={(v) => setBrightness(v as number)}
                                labelPosition="top-floating"
                                minValue={1}
                                maxValue={100}
                                step={1}
                            />
                        </div>
                    </div>
                </div>
            </Form>
        </Page>
    );
}
