import type { Metadata } from "next";
import WhatIsMyScreenResolutionClient from "./WhatIsMyScreenResolutionClient";

export const metadata: Metadata = {
    title: "What Is My Screen Resolution? Viewport, DPR & Aspect Ratio",
    description: "Check your screen resolution, browser viewport size, device pixel ratio (DPR), and color depth live in your browser. Free display checker.",
    keywords: [
        "what is my screen resolution",
        "check screen size",
        "viewport size online",
        "screen resolution tester",
        "device pixel ratio",
        "DPR checker",
        "color depth tester",
        "display aspect ratio"
    ],
    alternates: {
        canonical: "/what-is-my-screen-resolution",
    },
    openGraph: {
        title: "What Is My Screen Resolution? Viewport, DPR & Aspect Ratio",
        description: "Check your screen resolution, browser viewport size, and device pixel ratio live in your browser.",
        url: "/what-is-my-screen-resolution",
    },
};

export default function WhatIsMyScreenResolutionPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": [
                            {
                                "@type": "Question",
                                "name": "What is the difference between screen resolution and browser viewport?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Screen resolution is the total physical pixel grid of your monitor hardware (e.g. 1920x1080 or 3840x2160). Viewport size is the inner pixel area of your browser window where web pages render, excluding toolbars, scrollbars, and bookmarks."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "What is Device Pixel Ratio (DPR)?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Device Pixel Ratio (DPR) represents the ratio between physical hardware pixels and logical CSS pixels. On high-DPI displays (such as Apple Retina or 4K monitors), a DPR of 2x means that 4 physical pixels render each logical CSS pixel for crisp text rendering."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "What is the most common screen resolution in 2026?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "1920x1080 (Full HD) remains the most prevalent desktop resolution globally, followed by 2560x1440 (2K QHD). On mobile devices, 390x844 and 412x915 logical pixels account for the majority of smartphones."
                                }
                            }
                        ]
                    })
                }}
            />
            <WhatIsMyScreenResolutionClient />
        </>
    );
}
