import Link from "next/link";
import FAQItem from './FAQItem';

const faqs = [
    {
        question: "What is bufferbloat and why does it cause lag in gaming and video calls?",
        answer: "Bufferbloat is unwanted latency and jitter that occurs when network equipment (such as your home router or modem) buffers too many data packets. When large downloads or uploads saturate your bandwidth, packets sit waiting in oversized memory queues. High-priority, time-sensitive packets—such as competitive gaming keystrokes, Discord voice data, or Zoom video streams—get stuck behind bulk file transfers, causing sudden ping spikes from 20 ms to 200+ ms.",
        category: "Network & Bufferbloat",
        initialOpen: true,
    },
    {
        question: "How does the Bufferbloat Test work?",
        answer: "The test executes a multi-phase diagnostic: First, it measures your clean baseline (idle) round-trip ping. Next, it saturates your downstream pipe to measure download bloat. Then, it saturates your upstream pipe to measure upload bloat. Finally, it calculates the latency delta (how many milliseconds ping increased under load) and awards an official grade from A to F.",
        category: "Network & Bufferbloat",
    },
    {
        question: "What is a good bufferbloat score and how can I fix a poor grade?",
        answer: "An 'A' or 'A+' grade (0–5 ms increase under load) is ideal for competitive gaming and seamless remote work. A 'B' grade (6–30 ms) is good for everyday use. If you receive a C, D, or F, the #1 fix is enabling Smart Queue Management (SQM) with CAKE or FQ-CoDel in your router settings. Alternatively, set a QoS bandwidth cap at 90%–95% of your plan's maximum line speed, or connect your computer via Cat6 Ethernet instead of Wi-Fi.",
        category: "Network & Bufferbloat",
    },
    {
        question: "Do you store or log my IP address or personal data?",
        answer: "No. MySupportInfo is engineered with a strict privacy-first architecture. All user-agent parsing, hardware querying, screen resolution detection, and latency calculations happen 100% client-side inside your browser sandbox. We maintain zero database logs, store no IP addresses, use no tracking cookies, and never build cross-session device fingerprints. We are fully GDPR and CCPA compliant by design.",
        category: "Privacy & Security",
    },
    {
        question: "What is a WebRTC leak and how does MySupportInfo detect it?",
        answer: "WebRTC (Web Real-Time Communication) allows browsers to make direct peer-to-peer audio and video calls. However, WebRTC can query your computer's STUN interfaces and expose your real public or local IP address even if you are connected to a VPN proxy. MySupportInfo runs a local STUN ice-candidate test to verify whether your actual IP address is leaking through your browser.",
        category: "Privacy & Security",
    },
    {
        question: "How do I share my technical diagnostic results with an IT support technician?",
        answer: "You have two quick options: (1) Click 'Copy All Info' at the top of the homepage to copy a cleanly formatted plain-text diagnostic summary into your clipboard—perfect for pasting into Zendesk, Jira, Freshdesk, email, or GitHub issues. (2) Click 'Download Screenshot Report' to generate a high-resolution PNG summary card directly on your device.",
        category: "Support & Troubleshooting",
    },
    {
        question: "Why does my detected RAM or CPU core count differ from my computer's exact specs?",
        answer: "Modern browsers deliberately restrict hardware reporting to protect user privacy against device fingerprinting. The Device Memory API rounds RAM into privacy buckets (typically capped at 8 GB), and navigator.hardwareConcurrency reports logical hyperthreaded CPU threads rather than physical CPU cores. These values represent the computing capacity accessible to your web browser.",
        category: "Hardware & Display",
    },
    {
        question: "What is the difference between Screen Resolution and Viewport Size?",
        answer: "Screen Resolution represents the physical hardware pixel dimensions of your monitor (e.g. 1920 × 1080 or 3840 × 2160). Viewport Size represents the actual usable pixel area inside your browser window. If you resize your window, use browser zoom (e.g. 125%), or have an OS display scaling factor applied (Device Pixel Ratio / DPR), your viewport size will adjust dynamically while your screen resolution remains fixed.",
        category: "Hardware & Display",
    },
    {
        question: "How does MySupportInfo compare to MySupportDetails and other diagnostic tools?",
        answer: "While older legacy tools like MySupportDetails provide basic system text, MySupportInfo offers a modern, interactive Neobrutalist design with zero server-side data logging, an integrated real-time Bufferbloat Latency Diagnostic with live SVG charting, WebRTC VPN privacy leak audits, and instant client-side PNG report card exports.",
        category: "Comparison & Features",
    },
    {
        question: "Why does my bufferbloat grade differ from a standard Ookla speed test?",
        answer: "Standard speed tests measure maximum raw throughput (Mbps) under clean, unencumbered conditions. They do not evaluate Quality of Experience (QoE) under congestion. You can have a 1,000 Mbps fiber connection that downloads files blazingly fast, but if your router lacks queue management, your latency can spike to 300 ms whenever someone uploads a file or streams 4K video.",
        category: "Network & Bufferbloat",
    },
    {
        question: "Is MySupportInfo completely free for personal and commercial use?",
        answer: "Yes, MySupportInfo is 100% free with no account creation, no paywalls, and no subscription requirements. IT technicians, MSP helpdesks, network administrators, remote workers, and gamers can use it freely for diagnostic and support workflows.",
        category: "General & Licensing",
    },
    {
        question: "Which browsers and operating systems are supported?",
        answer: "MySupportInfo is fully compatible with all modern web browsers, including Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge, Brave, Opera, and Vivaldi across Windows, macOS, Linux, ChromeOS, iOS, iPadOS, and Android.",
        category: "Compatibility",
    },
    {
        question: "What should I do if my browser or operating system is detected incorrectly?",
        answer: "Certain privacy browsers (like Brave with Shields, or Firefox with resistFingerprinting enabled), virtual machines, and privacy extensions intentionally spoof or freeze user-agent headers. If a specification looks inaccurate, click 'Report a detection error' on the home dashboard or email our team directly at support@mysupportinfo.com.",
        category: "Compatibility",
    },
];

export default function FAQPage() {
    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="bg-background-dark px-6 py-16">
                <div className="max-w-4xl mx-auto">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
                        <Link href="/" className="text-accent/60 text-sm font-semibold hover:text-accent transition-colors">Home</Link>
                        <span className="material-symbols-outlined text-sm text-accent/40">chevron_right</span>
                        <span className="text-accent text-sm font-extrabold" aria-current="page">Knowledge Base & FAQ</span>
                    </nav>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-primary rounded-2xl shadow-block-sm">
                            <span className="material-symbols-outlined text-background-dark text-3xl">help</span>
                        </div>
                        <div>
                            <h1 className="text-fluid-hero font-bold text-white font-serif leading-tight">Frequently Asked Questions</h1>
                            <p className="text-accent/70 text-sm mt-1">{faqs.length} expert technical answers on network diagnostics, bufferbloat & privacy</p>
                        </div>
                    </div>
                    <p className="text-accent/80 text-sm md:text-base leading-relaxed max-w-2xl font-medium">
                        Comprehensive answers regarding browser detection, device diagnostic metrics, bufferbloat latency testing, router queue management, and our zero-data-logging privacy policy.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-14">

                {/* Topics summary */}
                <div className="bg-accent/25 border-2 border-background-dark rounded-2xl p-6 md:p-8 mb-12 shadow-block-sm">
                    <p className="text-4xs text-background-dark/60 uppercase tracking-ui-wide font-black mb-4">Core Knowledge Areas</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { icon: "network_ping", label: "Bufferbloat & Network", desc: "How latency under load works, SQM/CAKE router optimization, and fixing gaming lag." },
                            { icon: "shield_lock", label: "Privacy & WebRTC", desc: "Client-side execution, WebRTC IP leak tests, and our zero-server-logging guarantee." },
                            { icon: "devices", label: "Device & Browser Specs", desc: "Understanding screen resolution, viewport DPR, GPU rendering, and CPU thread metrics." },
                        ].map(item => (
                            <div key={item.label} className="flex flex-col gap-2">
                                <span className="material-symbols-outlined text-primary text-3xl">{item.icon}</span>
                                <h2 className="text-background-dark font-extrabold text-base">{item.label}</h2>
                                <p className="text-foreground/70 text-xs leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ Accordion Items */}
                <div className="space-y-4">
                    {faqs.map((faq) => (
                        <div key={faq.question} className="relative">
                            <FAQItem
                                question={faq.question}
                                answer={faq.answer}
                                initialOpen={faq.initialOpen}
                            />
                        </div>
                    ))}
                </div>

                {/* Quick Link Navigation Actions */}
                <div className="border-t-2 border-background-dark/10 pt-10 mt-12 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-4">
                        <Link
                            href="/bufferbloat"
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-background-dark border-2 border-background-dark rounded-xl text-sm font-black hover:bg-primary-dark shadow-block-sm transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">signal_cellular_alt</span>
                            Run Bufferbloat Test
                        </Link>
                        <Link
                            href="/privacy"
                            className="flex items-center gap-2 px-5 py-2.5 bg-background-dark text-white border-2 border-background-dark rounded-xl text-sm font-bold hover:bg-foreground shadow-block-sm transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">shield_person</span>
                            Privacy Centre
                        </Link>
                        <Link
                            href="/terms"
                            className="flex items-center gap-2 px-5 py-2.5 bg-white text-background-dark border-2 border-background-dark rounded-xl text-sm font-bold hover:bg-accent/20 shadow-block-sm transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">gavel</span>
                            Terms of Use
                        </Link>
                    </div>
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-background-dark border-2 border-background-dark rounded-xl text-sm font-bold hover:bg-accent/20 shadow-block-sm transition-all"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Back to Diagnostics
                    </Link>
                </div>
            </div>
        </div>
    );
}
