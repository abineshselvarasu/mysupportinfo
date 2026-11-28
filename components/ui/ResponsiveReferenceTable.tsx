import React from "react";

export type ReferenceBadgeTone = "emerald" | "amber" | "neutral";

export interface ReferenceTableRow {
    id: string;
    primary: string;
    primaryMono?: boolean;
    badge: string;
    badgeTone?: ReferenceBadgeTone;
    badgeMono?: boolean;
    description: string;
    highlighted?: boolean;
    highlightLabel?: string;
}

export interface ResponsiveReferenceTableProps {
    headers: [string, string, string];
    mobileSummaryLabel?: string;
    caption?: string;
    rows: ReferenceTableRow[];
}

const BADGE_CLASSES: Record<ReferenceBadgeTone, string> = {
    emerald: "bg-secondary/10 text-secondary border-secondary/25",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
    neutral: "bg-well text-muted border-line",
};

/**
 * Renders a single semantic HTML table that adapts its layout cleanly via CSS Grid on
 * mobile (< md) and standard columns on tablet/desktop (>= md), with zero DOM duplication.
 */
export default function ResponsiveReferenceTable({
    headers,
    mobileSummaryLabel,
    caption,
    rows,
}: ResponsiveReferenceTableProps) {
    return (
        <div className="bg-surface border border-line rounded-2xl overflow-hidden md:overflow-x-auto shadow-subtle">
            <table className="block md:table w-full text-left border-collapse text-xs">
                {caption && <caption className="sr-only">{caption}</caption>}

                <thead className="block md:table-header-group bg-brand text-white">
                    <tr className="flex items-center justify-between gap-2 px-4 py-2.5 md:p-0 md:table-row">
                        <th
                            scope="col"
                            className="p-0 md:px-5 md:py-3.5 text-[11px] md:text-xs font-semibold uppercase md:normal-case tracking-wider md:tracking-normal whitespace-nowrap"
                        >
                            {mobileSummaryLabel ? (
                                <>
                                    <span className="md:hidden">{mobileSummaryLabel}</span>
                                    <span className="hidden md:inline">{headers[0]}</span>
                                </>
                            ) : (
                                headers[0]
                            )}
                        </th>
                        <th
                            scope="col"
                            className="p-0 md:px-5 md:py-3.5 text-[11px] md:text-xs font-semibold uppercase md:normal-case tracking-wider md:tracking-normal text-white/75 md:text-white whitespace-nowrap"
                        >
                            {headers[1]}
                        </th>
                        <th scope="col" className="hidden md:table-cell md:px-5 md:py-3.5 font-semibold">
                            {headers[2]}
                        </th>
                    </tr>
                </thead>

                <tbody className="block md:table-row-group divide-y divide-line">
                    {rows.map((row) => {
                        const toneClass = BADGE_CLASSES[row.badgeTone || "emerald"];
                        return (
                            <tr
                                key={row.id}
                                className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-2.5 gap-y-2 px-4 py-3.5 md:p-0 md:table-row transition-colors ${
                                    row.highlighted ? "bg-well/55 hover:bg-hover/70" : "hover:bg-hover/65"
                                }`}
                            >
                                <td
                                    className={`col-start-1 row-start-1 self-center p-0 md:px-5 md:py-3.5 font-bold text-ink text-sm md:text-xs leading-snug md:whitespace-nowrap ${
                                        row.primaryMono ? "font-mono" : ""
                                    }`}
                                >
                                    <div className="inline-flex items-center gap-2 flex-wrap">
                                        <span>{row.primary}</span>
                                        {row.highlighted && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/15 border border-primary/30 text-primary text-3xs font-semibold font-sans">
                                                {row.highlightLabel || "Current"}
                                            </span>
                                        )}
                                    </div>
                                </td>

                                <td className="col-start-2 row-start-1 self-start justify-self-end md:self-center p-0 md:px-5 md:py-3.5 whitespace-nowrap">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold border ${toneClass} ${
                                            row.badgeMono ? "font-mono tabular-nums" : ""
                                        }`}
                                    >
                                        {row.badge}
                                    </span>
                                </td>

                                <td className="col-span-2 row-start-2 p-0 md:px-5 md:py-3.5 text-xs text-muted leading-relaxed">
                                    {row.description}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
