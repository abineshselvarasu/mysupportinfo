"use client";

import React, { useId, useState } from "react";

export interface DiagnosticFaqItem {
    q: string;
    a: string;
}

interface DiagnosticFaqSectionProps {
    title?: string;
    items: DiagnosticFaqItem[];
}

/**
 * Accessible FAQ accordion that keeps all answer text in the SSR HTML DOM
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
            <h2 className="font-serif text-fluid-h2 font-bold text-background-dark">
                {title}
            </h2>
            <div className="space-y-3">
                {items.map((item, idx) => {
                    const isOpen = openFaq === idx;
                    const btnId = `${baseId}-btn-${idx}`;
                    const panelId = `${baseId}-panel-${idx}`;

                    return (
                        <div
                            key={item.q}
                            className="bg-white border-2 border-background-dark rounded-2xl overflow-hidden shadow-block-sm"
                        >
                            <button
                                id={btnId}
                                type="button"
                                onClick={() => setOpenFaq(isOpen ? null : idx)}
                                aria-expanded={isOpen}
                                aria-controls={panelId}
                                className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-background/20 transition-colors cursor-pointer"
                            >
                                <span className="font-bold text-background-dark text-base">{item.q}</span>
                                <span
                                    aria-hidden="true"
                                    className={`material-symbols-outlined text-background-dark/60 transition-transform duration-200 flex-shrink-0 ${
                                        isOpen ? "rotate-180 text-primary" : ""
                                    }`}
                                >
                                    expand_more
                                </span>
                            </button>
                            <div
                                id={panelId}
                                role="region"
                                aria-labelledby={btnId}
                                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                }`}
                            >
                                <div className="overflow-hidden">
                                    <div
                                        className={`px-5 pb-5 pt-1 text-sm text-background-dark/75 leading-relaxed font-medium border-t border-background-dark/10 transition-opacity duration-200 ${
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
