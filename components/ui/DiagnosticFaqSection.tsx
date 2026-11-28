"use client";

import React, { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface DiagnosticFaqItem {
    q: string;
    a: string;
}

interface DiagnosticFaqSectionProps {
    title?: string;
    items: DiagnosticFaqItem[];
}

/**
 * Accessible FAQ disclosure list keeping all answers present in SSR HTML
 * via CSS grid-template-rows transitions so crawlers and screen readers see full content.
 */
export default function DiagnosticFaqSection({
    title = "Frequently Asked Questions",
    items,
}: DiagnosticFaqSectionProps) {
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const baseId = useId();

    return (
        <section className="space-y-4">
            {title && (
                <h2 className="text-fluid-h2 font-bold text-ink tracking-tight">
                    {title}
                </h2>
            )}
            <div className="bg-surface border border-line rounded-2xl divide-y divide-line overflow-hidden">
                {items.map((item, idx) => {
                    const isOpen = openFaq === idx;
                    const btnId = `${baseId}-btn-${idx}`;
                    const panelId = `${baseId}-panel-${idx}`;

                    return (
                        <div key={item.q}>
                            <button
                                id={btnId}
                                type="button"
                                onClick={() => setOpenFaq(isOpen ? null : idx)}
                                aria-expanded={isOpen}
                                aria-controls={panelId}
                                className="w-full px-5 py-4 text-left flex justify-between items-center gap-4 hover:bg-hover/65 transition-colors cursor-pointer"
                            >
                                <span className="font-semibold text-ink text-sm sm:text-base">{item.q}</span>
                                <ChevronDown
                                    size={18}
                                    aria-hidden="true"
                                    className={`text-muted transition-transform duration-200 flex-shrink-0 ${
                                        isOpen ? "rotate-180 text-primary" : ""
                                    }`}
                                />
                            </button>
                            <div
                                id={panelId}
                                role="region"
                                aria-labelledby={btnId}
                                className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                }`}
                            >
                                <div className="overflow-hidden">
                                    <div
                                        className={`px-5 pb-5 pt-1 text-sm text-muted leading-relaxed transition-opacity duration-200 ${
                                            isOpen ? "opacity-100" : "opacity-0"
                                        }`}
                                    >
                                        {item.a}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
