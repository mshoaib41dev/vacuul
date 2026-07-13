import { useCallback, useState } from "react";
import { HomeLine, MarkerPin01, Tag01, Type02 } from "@untitledui/icons";
import { GeoPoint } from "firebase/firestore";
import { geohashForLocation } from "geofire-common";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { IconNotification } from "@/components/application/notifications/notifications";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { SectionLabel } from "@/components/application/section-headers/section-label";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { InputBase, TextField } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import Page from "@/components/page";
import { useGooglePlaces, type PlaceDetails } from "@/hooks/use-google-places";
import useMachine from "@/hooks/use-machines";
import { useTranslations } from "@/lib/LanguageContext";

export default function RegisterMachine() {
    const t = useTranslations();
    const navigate = useNavigate();
    const [commissionId, setCommissionId] = useState("");
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [longitude, setLongitude] = useState("");
    const [latitude, setLatitude] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdatingFromGeocode, setIsUpdatingFromGeocode] = useState(false);

    const { registerMachine } = useMachine();

    const handlePlaceSelected = useCallback((place: PlaceDetails) => {
        setIsUpdatingFromGeocode(true);
        setAddress(place.address);
        setLatitude(place.latitude.toString());
        setLongitude(place.longitude.toString());
        setTimeout(() => setIsUpdatingFromGeocode(false), 100);
    }, []);

    const { inputRef, reverseGeocode } = useGooglePlaces(handlePlaceSelected);

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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!commissionId || !name || !address || !latitude || !longitude) {
                throw new Error(t("machines.allFieldsRequired"));
            }

            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);

            if (isNaN(lat) || isNaN(lng)) {
                throw new Error(t("machines.invalidLatLng"));
            }

            await registerMachine({
                commissionId,
                name,
                address,
                geo: {
                    geopoint: new GeoPoint(lat, lng),
                    geohash: geohashForLocation([lat, lng]),
                },
                status: "offline",
            });

            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.success")}
                    description={t("machines.registerSuccess")}
                    color="success"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
            navigate("/app/machines");
        } catch (error) {
            console.error("Error registering machine:", error);
            toast.custom((toastId) => (
                <IconNotification
                    title={t("common.error")}
                    description={error instanceof Error ? error.message : t("machines.registerFailed")}
                    color="error"
                    hideDismissLabel={true}
                    onClose={() => toast.dismiss(toastId)}
                />
            ));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Page title={t("machines.registerMachine")} className="p-8">
            <Breadcrumbs className="mb-4">
                <Breadcrumbs.Item icon={HomeLine} href="/app" />
                <Breadcrumbs.Item href="/app/machines">{t("nav.machines")}</Breadcrumbs.Item>
                <Breadcrumbs.Item>{t("machines.registerMachine")}</Breadcrumbs.Item>
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
                                {t("machines.registerMachine")}
                            </Button>
                        </SectionHeader.Actions>
                    </SectionHeader.Group>
                </SectionHeader.Root>

                <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(200px,280px)_minmax(400px,512px)] lg:gap-8">
                        <SectionLabel.Root isRequired size="sm" title={t("machines.commissionId")} className="max-lg:hidden" />

                        <TextField isRequired name="commissionId" value={commissionId} onChange={setCommissionId}>
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
                </div>
            </Form>
        </Page>
    );
}
