import { useEffect, useState } from "react";
import { Calendar, Clock, Star01, ThermometerCold } from "@untitledui/icons";
import { Heading as AriaHeading } from "react-aria-components";
import { Badge } from "@/components/base/badges/badges";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { CloseButton } from "@/components/base/buttons/close-button";
import useBookings from "@/hooks/use-bookings";
import type { BookingWithDetails } from "@/types/booking";
import { timestampToDate } from "@/utils/timestamp";

interface BookingDetailModalProps {
    bookingId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function BookingDetailModal({ bookingId, isOpen, onClose }: BookingDetailModalProps) {
    const [bookingDetails, setBookingDetails] = useState<BookingWithDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { getBookingWithDetails } = useBookings();

    useEffect(() => {
        if (!bookingId || !isOpen) {
            setBookingDetails(null);
            setError(null);
            return;
        }

        const fetchBookingDetails = async () => {
            setLoading(true);
            setError(null);

            try {
                const details = await getBookingWithDetails(bookingId);
                setBookingDetails(details);
            } catch (err) {
                console.error("Error fetching booking details:", err);
                setError("Failed to load booking details");
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [bookingId, isOpen]); // Removed getBookingWithDetails dependency

    const formatDate = (timestamp: unknown): string => {
        const date = timestampToDate(timestamp);
        if (!date) return "N/A";

        return date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long", 
            year: "numeric",
        });
    };

    const formatTime = (timestamp: unknown): string => {
        const date = timestampToDate(timestamp);
        if (!date) return "N/A";

        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={onClose}>
            <Modal className="max-w-3xl">
                <Dialog>
                    <div className="relative flex h-full max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-primary shadow-xl">
                        <CloseButton onClick={onClose} theme="light" size="lg" className="absolute top-3 right-3 z-10" />
                        
                        {/* Header */}
                        <div className="shrink-0 border-b border-secondary px-4 pt-5 pb-4 sm:px-6 sm:pt-6">
                            <AriaHeading slot="title" className="text-lg font-semibold text-primary">
                                Booking Details
                            </AriaHeading>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                            {loading && (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <Clock className="mx-auto mb-3 size-12 text-gray-400" />
                                        <p className="text-sm font-medium text-primary">Loading booking details...</p>
                                        <p className="text-xs text-tertiary">Please wait while we fetch the information</p>
                                    </div>
                                </div>
                            )}

                            {error && !loading && (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <Calendar className="mx-auto mb-3 size-12 text-error-400" />
                                        <p className="text-sm font-medium text-primary">Unable to load booking details</p>
                                        <p className="text-xs text-tertiary">{error}</p>
                                    </div>
                                </div>
                            )}

                            {bookingDetails && !loading && (
                                <div className="space-y-8">
                                    {/* Booking Overview */}
                                    <div>
                                        <div className="mb-4 flex items-center gap-3">
                                            <Calendar className="size-5 text-brand-600" />
                                            <div>
                                                <h2 className="text-md font-semibold text-primary">
                                                    {formatDate(bookingDetails.startTime)}
                                                </h2>
                                                <p className="text-sm text-tertiary">
                                                    {formatTime(bookingDetails.startTime)} - {formatTime(bookingDetails.endTime)} • {bookingDetails.duration} min
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {/* Machine */}
                                            <div className="rounded-lg border border-border-secondary bg-secondary p-4">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-tertiary mb-2">Machine</h3>
                                                <p className="text-sm font-medium text-primary">{bookingDetails.machineName}</p>
                                                {bookingDetails.location?.address && (
                                                    <p className="mt-1 text-xs text-tertiary">{bookingDetails.location.address}</p>
                                                )}
                                                <p className="mt-1 text-xs font-mono text-quaternary">
                                                    ID: {bookingDetails.machineCommissionId || bookingDetails.machineId}
                                                </p>
                                            </div>

                                            {/* User */}
                                            <div className="rounded-lg border border-border-secondary bg-secondary p-4">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-tertiary mb-2">User</h3>
                                                <p className="text-sm font-medium text-primary">{bookingDetails.userName}</p>
                                                <p className="mt-1 text-xs text-tertiary">{bookingDetails.userEmail}</p>
                                            </div>

                                            {/* Status */}
                                            <div className="rounded-lg border border-border-secondary bg-secondary p-4">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-tertiary mb-2">Status</h3>
                                                <div className="flex gap-2">
                                                    <Badge 
                                                        color={bookingDetails.status === "completed" ? "success" : bookingDetails.status === "cancelled" ? "error" : "warning"}
                                                        size="sm"
                                                    >
                                                        {bookingDetails.status}
                                                    </Badge>
                                                    {bookingDetails.sessionStatus && (
                                                        <Badge 
                                                            color={bookingDetails.sessionStatus === "done" ? "success" : "warning"}
                                                            size="sm"
                                                        >
                                                            {bookingDetails.sessionStatus}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Rating */}
                                            {bookingDetails.rating && (
                                                <div className="rounded-lg border border-border-secondary bg-secondary p-4">
                                                    <h3 className="text-xs font-medium uppercase tracking-wider text-tertiary mb-2">Rating</h3>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Star01 className="size-4 text-warning-500 fill-warning-500" />
                                                        <span className="text-sm font-medium text-primary">{bookingDetails.rating.toFixed(1)}</span>
                                                    </div>
                                                    {bookingDetails.review && (
                                                        <div className="rounded-md border border-border-primary bg-primary p-3">
                                                            <p className="text-sm text-secondary leading-relaxed">{bookingDetails.review}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Session Summary */}
                                    {bookingDetails.sessionSummary && (
                                        <div>
                                            <div className="mb-4 flex items-center gap-3">
                                                <Clock className="size-5 text-success-600" />
                                                <h2 className="text-md font-semibold text-primary">Session Summary</h2>
                                            </div>
                                            
                                            <div className="grid gap-4 sm:grid-cols-3">
                                                {/* Check if data is nested under summary or flat */}
                                                {(bookingDetails.sessionSummary.summary?.duration || (bookingDetails.sessionSummary as any).duration) && (
                                                    <div className="rounded-lg border border-border-secondary bg-secondary p-4">
                                                        <h3 className="text-xs font-medium uppercase tracking-wider text-tertiary mb-2">Duration</h3>
                                                        <p className="text-2xl font-semibold text-primary">
                                                            {Math.round((bookingDetails.sessionSummary.summary?.duration || (bookingDetails.sessionSummary as any).duration) / 60)} 
                                                            <span className="ml-1 text-sm font-normal text-tertiary">min</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {(bookingDetails.sessionSummary.summary?.minTemperature || (bookingDetails.sessionSummary as any).minTemperature) !== undefined && (
                                                    <div className="rounded-lg border border-border-secondary bg-secondary p-4">
                                                        <h3 className="text-xs font-medium uppercase tracking-wider text-tertiary mb-2">Min Temp</h3>
                                                        <p className="text-2xl font-semibold text-primary">
                                                            {bookingDetails.sessionSummary.summary?.minTemperature ?? (bookingDetails.sessionSummary as any).minTemperature}
                                                            <span className="text-sm font-normal text-tertiary">°C</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {(bookingDetails.sessionSummary.summary?.maxTemperature || (bookingDetails.sessionSummary as any).maxTemperature) !== undefined && (
                                                    <div className="rounded-lg border border-border-secondary bg-secondary p-4">
                                                        <h3 className="text-xs font-medium uppercase tracking-wider text-tertiary mb-2">Max Temp</h3>
                                                        <p className="text-2xl font-semibold text-primary">
                                                            {bookingDetails.sessionSummary.summary?.maxTemperature ?? (bookingDetails.sessionSummary as any).maxTemperature}
                                                            <span className="text-sm font-normal text-tertiary">°C</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {(bookingDetails.sessionSummary.summary?.averageHeartRate || (bookingDetails.sessionSummary as any).averageHeartRate) && (
                                                    <div className="rounded-lg border border-border-secondary bg-secondary p-4">
                                                        <h3 className="text-xs font-medium uppercase tracking-wider text-tertiary mb-2">Avg Heart Rate</h3>
                                                        <p className="text-2xl font-semibold text-primary">
                                                            {bookingDetails.sessionSummary.summary?.averageHeartRate ?? (bookingDetails.sessionSummary as any).averageHeartRate}
                                                            <span className="ml-1 text-sm font-normal text-tertiary">bpm</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {(bookingDetails.sessionSummary.summary?.averageSpo2 || (bookingDetails.sessionSummary as any).averageSpo2) && (
                                                    <div className="rounded-lg border border-border-secondary bg-secondary p-4">
                                                        <h3 className="text-xs font-medium uppercase tracking-wider text-tertiary mb-2">Avg SpO2</h3>
                                                        <p className="text-2xl font-semibold text-primary">
                                                            {bookingDetails.sessionSummary.summary?.averageSpo2 ?? (bookingDetails.sessionSummary as any).averageSpo2}
                                                            <span className="text-sm font-normal text-tertiary">%</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {(bookingDetails.sessionSummary.summary?.completedAt || (bookingDetails.sessionSummary as any).completedAt) && (
                                                    <div className="rounded-lg border border-border-secondary bg-secondary p-4">
                                                        <h3 className="text-xs font-medium uppercase tracking-wider text-tertiary mb-2">Completed At</h3>
                                                        <p className="text-sm font-medium text-primary">
                                                            {new Date(bookingDetails.sessionSummary.summary?.completedAt ?? (bookingDetails.sessionSummary as any).completedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Treatment Config */}
                                    {bookingDetails.treatmentConfig && (
                                        <div>
                                            <div className="mb-4 flex items-center gap-3">
                                                <ThermometerCold className="size-5 text-purple-600" />
                                                <h2 className="text-md font-semibold text-primary">Treatment Configuration</h2>
                                            </div>
                                            
                                            <div className="grid gap-4 sm:grid-cols-3">
                                                <div className="rounded-lg border border-border-secondary bg-secondary p-4">
                                                    <h3 className="text-xs font-medium uppercase tracking-wider text-tertiary mb-2">LED Color</h3>
                                                    <div className="flex items-center gap-2">
                                                        <div 
                                                            className="size-4 rounded border border-gray-300" 
                                                            style={{ backgroundColor: bookingDetails.treatmentConfig.led.staticColour }}
                                                        />
                                                        <span className="text-sm font-mono text-primary">
                                                            {bookingDetails.treatmentConfig.led.staticColour}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="rounded-lg border border-border-secondary bg-secondary p-4">
                                                    <h3 className="text-xs font-medium uppercase tracking-wider text-tertiary mb-2">Frequency</h3>
                                                    <p className="text-sm font-medium text-primary">{bookingDetails.treatmentConfig.frequency} Hz</p>
                                                </div>

                                                <div className="rounded-lg border border-border-secondary bg-secondary p-4 sm:col-span-3">
                                                    <h3 className="text-xs font-medium uppercase tracking-wider text-tertiary mb-3">Temperature Blocks</h3>
                                                    <div className="space-y-3">
                                                        {bookingDetails.treatmentConfig.blocks.map((block, index) => (
                                                            <div key={index} className="flex items-center justify-between rounded-lg border border-border-secondary bg-primary p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex size-8 items-center justify-center rounded-full bg-blue-50">
                                                                        <ThermometerCold className="size-4 text-blue-600" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-base font-semibold text-primary">{block.temperature}°C</span>
                                                                            <Badge size="sm" color={block.type === 0 ? "blue" : "gray"}>
                                                                                {block.type === 0 ? "Cooling" : "Rest"}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="text-sm font-medium text-secondary">{block.duration}s</span>
                                                                    <p className="text-xs text-tertiary">Duration</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
