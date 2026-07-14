import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiError } from "@/lib/api-client";

const shouldRetry = (failureCount: number, error: Error): boolean => {
    if (error instanceof ApiError && error.status < 500) {
        return false;
    }

    return failureCount < 2;
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000,
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: shouldRetry,
        },
        mutations: {
            retry: false,
        },
    },
});

export const AppQueryClientProvider = ({ children }: { children: ReactNode }) => {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
