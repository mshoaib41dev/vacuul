import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionSettingsApi } from "@/api/session-settings";
import type { SessionSettings } from "@/types/session-setting";

interface UseSessionSettingsReturn {
    settings: SessionSettings | null;
    loading: boolean;
    error: string | null;
    getSettings: () => Promise<void>;
    updateSettings: (data: SessionSettings) => Promise<void>;
    isUpdating: boolean;
}

const sessionSettingsQueryKey = ["session-settings"] as const;

export const useSessionSettings = (): UseSessionSettingsReturn => {
    const queryClient = useQueryClient();

    const settingsQuery = useQuery({
        queryKey: sessionSettingsQueryKey,
        queryFn: sessionSettingsApi.getSessionSettings,
    });

    const updateSettingsMutation = useMutation({
        mutationFn: sessionSettingsApi.updateSessionSettings,
        onSuccess: (settings) => {
            queryClient.setQueryData(sessionSettingsQueryKey, settings);
            queryClient.invalidateQueries({ queryKey: sessionSettingsQueryKey });
        },
    });

    const getSettings = useCallback(async (): Promise<void> => {
        await queryClient.fetchQuery({
            queryKey: sessionSettingsQueryKey,
            queryFn: sessionSettingsApi.getSessionSettings,
        });
    }, [queryClient]);

    const updateSettings = useCallback(
        async (data: SessionSettings): Promise<void> => {
            await updateSettingsMutation.mutateAsync(data);
        },
        [updateSettingsMutation],
    );

    return {
        settings: settingsQuery.data ?? null,
        loading: settingsQuery.isLoading,
        error: settingsQuery.error instanceof Error ? settingsQuery.error.message : null,
        getSettings,
        updateSettings,
        isUpdating: updateSettingsMutation.isPending,
    };
};
