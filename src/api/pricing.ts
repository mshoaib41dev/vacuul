import { apiFetch } from "@/lib/api-client";
import type { Pricing } from "@/types/pricing";

export type ListPricingResponse = {
    prices: Pricing[];
};

export type CreatePricingRequest = Omit<Pricing, "id" | "createdAt" | "updatedAt">;

export type UpdatePricingRequest = {
    id: string;
    pricing: Omit<Partial<Pricing>, "id" | "createdAt" | "updatedAt">;
};

export type DeletePricingResponse = {
    success: boolean;
};

type RawPricing = Record<string, unknown>;

type RawListPricingResponse =
    | RawPricing[]
    | {
          pricing?: RawPricing[];
          prices?: RawPricing[];
          tiers?: RawPricing[];
          data?: RawPricing[];
      };

type RawPricingResponse =
    | RawPricing
    | {
          pricing?: RawPricing;
          price?: RawPricing;
          tier?: RawPricing;
          data?: RawPricing;
      };

const toStringValue = (value: unknown, fallback = ""): string => {
    return typeof value === "string" ? value : fallback;
};

const toNumberValue = (value: unknown, fallback: number): number => {
    const parsed = Number(value ?? fallback);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const removeUndefined = <T extends Record<string, unknown>>(payload: T): Partial<T> => {
    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as Partial<T>;
};

const getPricingId = (pricing: RawPricing, index: number): string => {
    return String(pricing.id ?? pricing._id ?? pricing.objectID ?? `pricing-${index}`);
};

const normalizePricing = (pricing: RawPricing, index: number): Pricing => {
    return {
        ...pricing,
        id: getPricingId(pricing, index),
        name: toStringValue(pricing.name),
        price: toNumberValue(pricing.price, 0),
        savings: toNumberValue(pricing.savings, 0),
        sessions: toNumberValue(pricing.sessions, 0),
        currency: toStringValue(pricing.currency, "USD"),
        createdAt: pricing.createdAt,
        updatedAt: pricing.updatedAt,
    };
};

const extractPricingArray = (response: RawListPricingResponse): RawPricing[] => {
    if (Array.isArray(response)) {
        return response;
    }

    return response.pricing ?? response.prices ?? response.tiers ?? response.data ?? [];
};

const hasNestedPricing = (value: unknown, key: "pricing" | "price" | "tier" | "data"): value is Record<typeof key, RawPricing> => {
    if (!value || typeof value !== "object" || !(key in value)) return false;

    const nested = (value as Record<string, unknown>)[key];
    return Boolean(nested && typeof nested === "object" && !Array.isArray(nested));
};

const extractPricing = (response: RawPricingResponse): RawPricing => {
    if (hasNestedPricing(response, "pricing")) return response.pricing;
    if (hasNestedPricing(response, "price")) return response.price;
    if (hasNestedPricing(response, "tier")) return response.tier;
    if (hasNestedPricing(response, "data")) return response.data;

    return response as RawPricing;
};

const assertPricingId = (id: string) => {
    if (!id.trim()) {
        throw new Error("Pricing ID is required.");
    }
};

const assertFiniteNumber = (value: unknown, label: string) => {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new Error(`${label} must be a valid number.`);
    }
};

const assertPricingPayload = (pricing: CreatePricingRequest) => {
    if (!pricing.name?.trim()) {
        throw new Error("Pricing name is required.");
    }

    assertFiniteNumber(pricing.price, "Price");
    assertFiniteNumber(pricing.savings, "Savings");

    if (!Number.isInteger(pricing.sessions) || pricing.sessions <= 0) {
        throw new Error("Sessions must be a positive integer.");
    }

    if (!pricing.currency?.trim()) {
        throw new Error("Currency is required.");
    }
};

const buildPricingPayload = (pricing: Partial<CreatePricingRequest>): Record<string, unknown> => {
    return removeUndefined({
        name: pricing.name?.trim(),
        price: pricing.price,
        savings: pricing.savings,
        sessions: pricing.sessions,
        currency: pricing.currency?.trim(),
    });
};

export const pricingApi = {
    listPricing: async (): Promise<ListPricingResponse> => {
        const response = await apiFetch<RawListPricingResponse>("/v1/api/pricing", {
            method: "GET",
        });

        return {
            prices: extractPricingArray(response).map(normalizePricing),
        };
    },

    createPricing: (pricing: CreatePricingRequest): Promise<Pricing> => {
        assertPricingPayload(pricing);

        return apiFetch<RawPricingResponse>("/v1/api/pricing", {
            method: "POST",
            body: buildPricingPayload(pricing),
        }).then((response) => normalizePricing(extractPricing(response), 0));
    },

    updatePricing: ({ id, pricing }: UpdatePricingRequest): Promise<Pricing> => {
        assertPricingId(id);

        const payload = buildPricingPayload(pricing);
        if (Object.keys(payload).length === 0) {
            throw new Error("At least one pricing field is required.");
        }

        return apiFetch<RawPricingResponse>(`/v1/api/pricing/${encodeURIComponent(id)}`, {
            method: "PUT",
            body: payload,
        }).then((response) => normalizePricing(extractPricing(response), 0));
    },

    deletePricing: async (id: string): Promise<DeletePricingResponse> => {
        assertPricingId(id);

        const response = await apiFetch<DeletePricingResponse | undefined>(`/v1/api/pricing/${encodeURIComponent(id)}`, {
            method: "DELETE",
        });

        return response ?? { success: true };
    },
};
