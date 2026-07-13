import { apiFetch } from "@/lib/api-client";

export type UploadProfilePhotoResponse = {
    url: string;
};

export const MAX_PROFILE_PHOTO_SIZE_BYTES = 20 * 1024 * 1024;

const assertProfilePhoto = (file: File) => {
    if (!file) {
        throw new Error("Profile photo is required.");
    }

    if (!file.type.startsWith("image/")) {
        throw new Error("Profile photo must be an image.");
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE_BYTES) {
        throw new Error("Profile photo must be 20MB or smaller.");
    }
};

const normalizeUploadResponse = (response: UploadProfilePhotoResponse): UploadProfilePhotoResponse => {
    const url = response.url?.trim();

    if (!url) {
        throw new Error("Profile photo upload response is missing a URL.");
    }

    return { url };
};

export const uploadsApi = {
    uploadProfilePhoto: async (file: File): Promise<UploadProfilePhotoResponse> => {
        assertProfilePhoto(file);

        const body = new FormData();
        body.append("file", file);

        const response = await apiFetch<UploadProfilePhotoResponse>("/v1/upload/profile-photo", {
            method: "POST",
            body,
        });

        return normalizeUploadResponse(response);
    },
};
