import type { DiagnosticFaqItem } from "@/components/ui/DiagnosticFaqSection";

const BASE_URL = "https://mysupportinfo.com";

export interface ToolSchemaOptions {
    name: string;
    description: string;
    path: string;
    breadcrumbLabel: string;
    featureList: string[];
    faqs: DiagnosticFaqItem[];
}

/**
 * Builds consistent JSON-LD structured data (FAQPage, WebApplication, BreadcrumbList)
 * for dedicated tool routes so Google Rich Results and AI search engines see complete context.
 */
export function buildToolJsonLd({
    name,
    description,
    path,
    breadcrumbLabel,
    featureList,
    faqs,
}: ToolSchemaOptions) {
    const fullUrl = `${BASE_URL}${path}`;

    return [
        {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name,
            url: fullUrl,
            description,
            applicationCategory: "UtilityApplication",
            operatingSystem: "Any",
            browserRequirements: "Requires a modern browser with JavaScript enabled",
            offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
            },
            featureList,
            publisher: {
                "@type": "Organization",
                name: "MySupportInfo",
                url: BASE_URL,
            },
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                {
                    "@type": "ListItem",
                    position: 1,
                    name: "Home",
                    item: BASE_URL,
                },
                {
                    "@type": "ListItem",
                    position: 2,
                    name: breadcrumbLabel,
                    item: fullUrl,
                },
            ],
        },
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: item.a,
                },
            })),
        },
    ];
}
