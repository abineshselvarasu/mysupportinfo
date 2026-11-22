import type { Metadata } from "next";
import WhatIsMyBrowserClient from "./WhatIsMyBrowserClient";

export const metadata: Metadata = {
    title: "What Is My Browser? Check Browser Name, Version & Engine",
    description: "Instantly detect what browser and version you are using. Check rendering engine, JavaScript, cookies, and user agent string with zero tracking.",
    keywords: [
        "what is my browser",
        "what browser am I using",
        "check browser version",
        "my browser details",
        "detect browser",
        "browser rendering engine",
        "user agent checker",
        "chrome version test",
        "safari version check"
    ],
    alternates: {
        canonical: "/what-is-my-browser",
    },
    openGraph: {
        title: "What Is My Browser? Check Browser Name, Version & Engine",
        description: "Instantly detect what browser and version you are using. Free in-browser diagnostic tool with zero tracking.",
        url: "/what-is-my-browser",
    },
};

export default function WhatIsMyBrowserPage() {
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
                                "name": "How does MySupportInfo detect my web browser?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "MySupportInfo reads your browser's user-agent string and modern Navigator User-Agent Client Hints API entirely client-side. No data is logged or stored on our servers."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "What is the difference between a browser and a rendering engine?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "The browser is the user interface and features (Chrome, Edge, Brave, Opera). The rendering engine is the internal software that formats HTML and CSS (e.g. Blink for Chromium, Gecko for Firefox, and WebKit for Safari)."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "How do I update my browser to the latest version?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "In Google Chrome and Microsoft Edge, open Menu > Help > About to trigger automatic updates. In Safari, update macOS via System Settings > General > Software Update. In Firefox, open Menu > Help > About Firefox."
                                }
                            }
                        ]
                    })
                }}
            />
            <WhatIsMyBrowserClient />
        </>
    );
}
