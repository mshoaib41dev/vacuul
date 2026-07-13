import { useState } from "react";
import { Clock } from "@untitledui/icons";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { InputBase, TextField } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import type { MachineSchedule } from "@/types/machine";

interface ScheduleInputProps {
    value?: MachineSchedule;
    onChange: (schedule: MachineSchedule) => void;
    isDisabled?: boolean;
    label?: string;
    hint?: string;
}

const WEEKDAYS = [
    { id: 0, label: "Sun", fullLabel: "Sunday" },
    { id: 1, label: "Mon", fullLabel: "Monday" },
    { id: 2, label: "Tue", fullLabel: "Tuesday" },
    { id: 3, label: "Wed", fullLabel: "Wednesday" },
    { id: 4, label: "Thu", fullLabel: "Thursday" },
    { id: 5, label: "Fri", fullLabel: "Friday" },
    { id: 6, label: "Sat", fullLabel: "Saturday" },
];

export const ScheduleInput = ({ 
    value = { startTime: "", endTime: "", weekdays: [] },
    onChange, 
    isDisabled = false, 
    label = "Schedule",
    hint = "Set operating hours and available days"
}: ScheduleInputProps) => {
    const [timeError, setTimeError] = useState<string | null>(null);
    const normalizedValue: MachineSchedule = {
        startTime: value.startTime ?? "",
        endTime: value.endTime ?? "",
        weekdays: Array.isArray(value.weekdays) ? value.weekdays : [],
    };

    const handleTimeChange = (field: "startTime" | "endTime", newTime: string) => {
        const newSchedule = { ...normalizedValue, [field]: newTime };
        
        // Validate that end time is after start time
        if (newSchedule.startTime && newSchedule.endTime) {
            if (newSchedule.startTime >= newSchedule.endTime) {
                setTimeError("End time must be after start time");
            } else {
                setTimeError(null);
            }
        } else {
            setTimeError(null);
        }
        
        onChange(newSchedule);
    };

    const handleWeekdayChange = (dayId: number, isSelected: boolean) => {
        const newWeekdays = isSelected
            ? [...normalizedValue.weekdays, dayId].sort((a, b) => a - b)
            : normalizedValue.weekdays.filter(day => day !== dayId);
        
        onChange({ ...normalizedValue, weekdays: newWeekdays });
    };

    return (
        <div className="flex flex-col gap-4">
            {label && <Label>{label}</Label>}
            
            {/* Time Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField 
                    name="startTime" 
                    value={normalizedValue.startTime} 
                    onChange={(newValue) => handleTimeChange("startTime", newValue)}
                    isDisabled={isDisabled}
                >
                    <Label className="text-sm font-medium">Start Time</Label>
                    <InputBase 
                        type="time" 
                        size="md" 
                        icon={Clock}
                        isInvalid={!!timeError}
                    />
                </TextField>

                <TextField 
                    name="endTime" 
                    value={normalizedValue.endTime} 
                    onChange={(newValue) => handleTimeChange("endTime", newValue)}
                    isDisabled={isDisabled}
                >
                    <Label className="text-sm font-medium">End Time</Label>
                    <InputBase 
                        type="time" 
                        size="md" 
                        icon={Clock}
                        isInvalid={!!timeError}
                    />
                </TextField>
            </div>

            {/* Time validation error */}
            {timeError && (
                <p className="text-sm text-error-600">{timeError}</p>
            )}

            {/* Weekday Selection */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Available Days</Label>
                <div className="grid grid-cols-7 gap-2">
                    {WEEKDAYS.map((day) => (
                        <Checkbox
                            key={day.id}
                            size="sm"
                            isSelected={normalizedValue.weekdays.includes(day.id)}
                            onChange={(isSelected) => handleWeekdayChange(day.id, isSelected)}
                            isDisabled={isDisabled}
                            label={day.label}
                            className="flex-col items-center text-center"
                        />
                    ))}
                </div>
            </div>

            {/* Hint text */}
            {hint && (
                <p className="text-sm text-tertiary">{hint}</p>
            )}
        </div>
    );
};
