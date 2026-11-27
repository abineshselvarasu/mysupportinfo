import type { Metadata } from "next";
import WhatIsMyBrowserClient from "./WhatIsMyBrowserClient";
import type { DiagnosticFaqItem } from "@/components/ui/DiagnosticFaqSection";
import { buildToolJsonLd } from "@/lib/seo-schema";

export const metadata: Metadata = {
    title: "What Is My Browser? Check Browser Name, Version & Engine",
    description:
        "Instantly detect what browser and version you are using. Check rendering engine, JavaScript, cookies, and full user-agent string locally with zero tracking.",
    keywords: [
        "what is my browser",
        "what browser am I using",
        "check browser version",
        "my browser details",
        "detect browser",
        "browser rendering engine",
        "user agent checker",
        "chrome version test",
        "safari version check",
    ],
    alternates: {
        canonical: "/what-is-my-browser",
    },
    openGraph: {
        title: "What Is My Browser? Check Browser Name, Version & Engine",
        description:
            "Instantly detect what browser and version you are using. Free in-browser diagnostic tool with zero tracking.",
        url: "/what-is-my-browser",
    },
};

const browserFaqs: DiagnosticFaqItem[] = [
    {
        q: "How does MySupportInfo detect my web browser?",
        a: "MySupportInfo inspects your browser's navigator.userAgent string alongside modern User-Agent Client Hints APIs entirely inside client-side JavaScript. No personal identifiers or device specs are logged or transmitted to any database.",
    },
    {
        q: "What is the difference between a browser and a rendering engine?",
        a: "The browser is the application interface you interact with (Chrome, Edge, Brave, Firefox, Safari). The rendering engine is the underlying software that parses HTML, CSS, and WebAssembly—specifically Blink for Chromium-based browsers, Gecko for Firefox, and WebKit for Safari.",
    },
    {
        q: "How do I update my browser manually to fix compatibility issues?",
        a: "In Google Chrome, Edge, or Brave, open the top-right three-dot menu, click Help, and open About to install updates. In Safari on macOS, updates arrive through System Settings > General > Software Update. In Firefox, open Menu > Help > About Firefox.",
    },
    {
        q: "Why does my Chrome User-Agent say 0.0.0 minor versions?",
        a: "Modern Chromium browsers implement User-Agent Reduction to prevent passive device fingerprinting. They freeze minor version numbers at .0.0.0 in the raw HTTP User-Agent string and require developers to query User-Agent Client Hints (navigator.userAgentData) for granular platform details.",
    },
    {
        q: "Why do websites fail if cookies or JavaScript are blocked?",
        a: "Modern web applications store encrypted authentication session tokens using cookies or localStorage and rely on JavaScript to render interactive UI state. If an extension, strict browser privacy mode, or corporate firewall strips cookies or scripts, logins, checkouts, and forms frequently fail.",
    },
];

export default function WhatIsMyBrowserPage() {
    const schemas = buildToolJsonLd({
        name: "MySupportInfo — What Is My Browser & User-Agent Checker",
        description:
            "Free in-browser web browser detector showing exact browser version, rendering engine, operating system, JavaScript, cookies, and full user-agent string.",
        path: "/what-is-my-browser",
        breadcrumbLabel: "What Is My Browser",
        featureList: [
            "Browser name and version detection (Chrome, Firefox, Safari, Edge, Brave, Opera)",
            "Rendering engine identification (Blink, Gecko, WebKit)",
            "JavaScript and browser cookie persistence verification",
            "One-click full HTTP User-Agent string copy for IT support tickets",
        ],
        faqs: browserFaqs,
    });

    return (
        <>
            {schemas.map((schema, i) => (
                <script
                    key={i}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
            <WhatIsMyBrowserClient faqs={browserFaqs} />
        </>
    );
}
