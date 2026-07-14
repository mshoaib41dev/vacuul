import { apiFetch } from "@/lib/api-client";
import type { GiftCard } from "@/types/gift-card";

export type ListGiftCardsResponse = {
    giftCards: GiftCard[];
};

export type CreateGiftCardRequest = {
    sessions: number;
};

export type DeleteGiftCardResponse = {
    success: boolean;
};

type RawGiftCard = Record<string, unknown>;

type RawListGiftCardsResponse =
    | RawGiftCard[]
    | {
          giftCards?: RawGiftCard[];
          cards?: RawGiftCard[];
          data?: RawGiftCard[];
      };

type RawGiftCardResponse =
    | RawGiftCard
    | {
          giftCard?: RawGiftCard;
          card?: RawGiftCard;
          data?: RawGiftCard;
          result?: RawGiftCard;
      };

const toStringValue = (value: unknown, fallback = ""): string => {
    return typeof value === "string" ? value : fallback;
};

const toOptionalString = (value: unknown): string | undefined => {
    return typeof value === "string" && value.trim() ? value : undefined;
};

const toNumberValue = (value: unknown, fallback: number): number => {
    const parsed = Number(value ?? fallback);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toBooleanValue = (value: unknown): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "true";
    return Boolean(value);
};

const normalizeTimestamp = (value: unknown): unknown => {
    if (!value || typeof value !== "object") {
        return value;
    }

    const timestamp = value as { seconds?: unknown; _seconds?: unknown; nanoseconds?: unknown; _nanoseconds?: unknown };
    const seconds = Number(timestamp.seconds ?? timestamp._seconds);
    if (!Number.isFinite(seconds)) {
        return value;
    }

    const nanoseconds = Number(timestamp.nanoseconds ?? timestamp._nanoseconds ?? 0);
    const milliseconds = seconds * 1000 + (Number.isFinite(nanoseconds) ? Math.floor(nanoseconds / 1_000_000) : 0);
    return new Date(milliseconds).toISOString();
};

const getGiftCardCode = (giftCard: RawGiftCard, index: number): string => {
    return String(giftCard.code ?? giftCard.id ?? giftCard._id ?? giftCard.objectID ?? `gift-card-${index}`);
};

const normalizeGiftCard = (giftCard: RawGiftCard, index: number): GiftCard => {
    const used = giftCard.used ?? giftCard.isUsed ?? giftCard.redeemed;

    return {
        ...giftCard,
        code: getGiftCardCode(giftCard, index),
        amount: toNumberValue(giftCard.amount ?? giftCard.price ?? giftCard.value, 0),
        currency: toStringValue(giftCard.currency, "usd"),
        paymentId: toStringValue(giftCard.paymentId ?? giftCard.paymentID ?? giftCard.stripePaymentId),
        purchaseDate: normalizeTimestamp(giftCard.purchaseDate ?? giftCard.createdAt),
        purchasedBy: toStringValue(giftCard.purchasedBy ?? giftCard.userId ?? giftCard.uid ?? giftCard.email),
        sessions: toNumberValue(giftCard.sessions, 0),
        used: toBooleanValue(used),
        usedBy: toOptionalString(giftCard.usedBy ?? giftCard.redeemedBy),
        usedDate: normalizeTimestamp(giftCard.usedDate ?? giftCard.redeemedAt),
    };
};

const extractGiftCardArray = (response: RawListGiftCardsResponse): RawGiftCard[] => {
    if (Array.isArray(response)) {
        return response;
    }

    return response.giftCards ?? response.cards ?? response.data ?? [];
};

const hasNestedGiftCard = (value: unknown, key: "giftCard" | "card" | "data" | "result"): value is Record<typeof key, RawGiftCard> => {
    if (!value || typeof value !== "object" || !(key in value)) return false;

    const nested = (value as Record<string, unknown>)[key];
    return Boolean(nested && typeof nested === "object" && !Array.isArray(nested));
};

const extractGiftCard = (response: RawGiftCardResponse): RawGiftCard => {
    if (hasNestedGiftCard(response, "giftCard")) return response.giftCard;
    if (hasNestedGiftCard(response, "card")) return response.card;
    if (hasNestedGiftCard(response, "data")) return response.data;
    if (hasNestedGiftCard(response, "result")) return response.result;

    return response as RawGiftCard;
};

const assertGiftCardCode = (code: string) => {
    if (!code.trim()) {
        throw new Error("Gift card code is required.");
    }
};

const assertCreateGiftCardRequest = ({ sessions }: CreateGiftCardRequest) => {
    if (!Number.isInteger(sessions) || sessions <= 0) {
        throw new Error("Sessions must be a positive integer.");
    }
};

export const giftCardsApi = {
    listGiftCards: async (): Promise<ListGiftCardsResponse> => {
        const response = await apiFetch<RawListGiftCardsResponse>("/v1/api/gift-cards", {
            method: "GET",
        });

        return {
            giftCards: extractGiftCardArray(response).map(normalizeGiftCard),
        };
    },

    createGiftCard: (request: CreateGiftCardRequest): Promise<GiftCard> => {
        assertCreateGiftCardRequest(request);

        return apiFetch<RawGiftCardResponse>("/v1/api/createGiftCard", {
            method: "POST",
            body: request,
        }).then((response) => normalizeGiftCard(extractGiftCard(response), 0));
    },

    deleteGiftCard: async (code: string): Promise<DeleteGiftCardResponse> => {
        assertGiftCardCode(code);

        const response = await apiFetch<DeleteGiftCardResponse | undefined>(`/v1/api/gift-cards/${encodeURIComponent(code)}`, {
            method: "DELETE",
        });

        return response ?? { success: true };
    },
};
