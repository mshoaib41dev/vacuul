import Skeleton from "react-loading-skeleton";
import { Table } from "@/components/application/table/table";

type TableSkeletonRowsProps = {
    /** Number of columns to render skeleton cells for. */
    columns: number;
    /** Number of placeholder rows. */
    rows?: number;
};

export const TableSkeletonRows = ({ columns, rows = 5 }: TableSkeletonRowsProps) => {
    return (
        <>
            {Array.from({ length: rows }, (_, rowIndex) => (
                <Table.Row key={`skeleton-row-${rowIndex}`} id={`skeleton-row-${rowIndex}`}>
                    {Array.from({ length: columns }, (_, columnIndex) => (
                        <Table.Cell key={`skeleton-cell-${rowIndex}-${columnIndex}`}>
                            <Skeleton
                                height={14}
                                borderRadius={6}
                                baseColor="var(--color-gray-100)"
                                highlightColor="var(--color-gray-50)"
                                className={columnIndex === 0 ? "max-w-40" : columnIndex === columns - 1 ? "ml-auto max-w-16" : "max-w-full"}
                            />
                        </Table.Cell>
                    ))}
                </Table.Row>
            ))}
        </>
    );
};

type ListSkeletonProps = {
    rows?: number;
};

/** Non-table list/card skeleton for pages like system logs. */
export const ListSkeleton = ({ rows = 5 }: ListSkeletonProps) => {
    return (
        <div className="flex flex-col gap-3">
            {Array.from({ length: rows }, (_, index) => (
                <div key={`list-skeleton-${index}`} className="rounded-xl bg-primary p-4 ring-1 ring-secondary">
                    <Skeleton height={16} width="40%" borderRadius={6} baseColor="var(--color-gray-100)" highlightColor="var(--color-gray-50)" />
                    <div className="mt-3">
                        <Skeleton height={12} borderRadius={6} baseColor="var(--color-gray-100)" highlightColor="var(--color-gray-50)" />
                    </div>
                    <div className="mt-2">
                        <Skeleton height={12} width="70%" borderRadius={6} baseColor="var(--color-gray-100)" highlightColor="var(--color-gray-50)" />
                    </div>
                </div>
            ))}
        </div>
    );
};
