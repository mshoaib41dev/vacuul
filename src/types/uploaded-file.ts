interface UploadedFile {
    name: string;
    size: number;
    progress: number;
    type?: string;
    failed?: boolean;
}
export type { UploadedFile };
