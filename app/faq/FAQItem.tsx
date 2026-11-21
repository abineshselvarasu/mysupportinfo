"use client";
import { useState } from 'react';

interface FAQItemProps {
    question: string;
    answer: string;
    initialOpen?: boolean;
}

export default function FAQItem({ question, answer, initialOpen = false }: FAQItemProps) {
    const [isOpen, setIsOpen] = useState(initialOpen);

    return (
        <div className="border-2 border-background-dark rounded-2xl bg-white shadow-block-sm overflow-hidden transition-all duration-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-background/40 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-2xl flex-shrink-0">help</span>
                    <span className="font-bold text-base sm:text-lg text-background-dark">{question}</span>
                </div>
                <span className={`material-symbols-outlined transition-transform duration-300 ease-out text-background-dark/50 flex-shrink-0 ml-3 ${isOpen ? 'rotate-180 text-primary' : ''}`}>
                    expand_more
                </span>
            </button>
            <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className={`border-t border-background-dark/10 p-5 sm:p-6 pt-3 text-background-dark/80 text-sm sm:text-base leading-relaxed font-medium transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                        {answer}
                    </div>
                </div>
            </div>
        </div>
    );
}
