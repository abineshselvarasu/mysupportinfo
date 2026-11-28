import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { CookiePreferencesButton } from "@/components/ui/CookieManager";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="space-y-3 pb-8 border-b border-line last:border-b-0">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <div className="text-muted text-sm leading-relaxed space-y-3">{children}</div>
    </section>
);

export default function PrivacyPage() {
    return (
        <div className="bg-canvas text-ink pb-20">
            <div className="bg-brand text-white border-b border-white/10 py-12 sm:py-14">
                <div className="max-w-site mx-auto px-5 sm:px-6 space-y-4">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/75 font-medium">
                        <Link href="/" className="hover:text-white transition-colors">Overview</Link>
                        <ChevronRight size={14} aria-hidden="true" />
                        <span className="text-white font-semibold" aria-current="page">Privacy Policy</span>
                    </nav>
                    <div className="space-y-2">
                        <h1 className="text-fluid-hero font-extrabold text-white tracking-tight">Privacy Policy</h1>
                        <p className="text-xs font-mono text-accent">Last updated: May 2026</p>
                        <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-xl">
                            MySupportInfo runs diagnostics locally inside your browser. We maintain zero server databases of IP addresses, device specs, or personal sessions.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-site mx-auto px-5 sm:px-6 py-12 space-y-10">
                <div className="bg-surface border border-line rounded-2xl divide-y sm:divide-y-0 sm:divide-x divide-line grid grid-cols-1 sm:grid-cols-3">
                    {[
                        { label: "Zero Tracking", desc: "No ad trackers, persistent fingerprints, or behavioral profiles." },
                        { label: "GDPR & CCPA Aligned", desc: "Your hardware stays local; you control optional analytics." },
                        { label: "Client-Side Only", desc: "Data stays in memory and clears when you close the tab." },
                    ].map((item) => (
                        <div key={item.label} className="p-5 space-y-1">
                            <p className="font-bold text-sm text-ink">{item.label}</p>
                            <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="space-y-8">
                    <Section title="1. Information Detected in Browser Memory">
                        <p>
                            MySupportInfo detects troubleshooting metrics locally on your device:
                        </p>
                        <ul className="list-disc pl-5 space-y-1.5">
                            <li>Browser name, build version, and rendering engine</li>
                            <li>Operating system platform and architecture hints</li>
                            <li>Display resolution, live browser viewport, DPR scaling, and color depth</li>
                            <li>Hardware capabilities exposed by your browser (GPU renderer string, coarse RAM bucket, logical CPU threads, touch points, battery if exposed)</li>
                            <li>Network properties (public IPv4/IPv6, ISP/carrier ASN, round-trip ping, and WebRTC ICE check)</li>
                        </ul>
                        <p>
                            Public IP lookups request data directly from <code className="px-1.5 py-0.5 rounded bg-well border border-line font-mono text-xs text-ink">ipapi.co</code> / <code className="px-1.5 py-0.5 rounded bg-well border border-line font-mono text-xs text-ink">ipwho.is</code>, IPv6 checks query <code className="px-1.5 py-0.5 rounded bg-well border border-line font-mono text-xs text-ink">api64.ipify.org</code>, and WebRTC leak checks query <code className="px-1.5 py-0.5 rounded bg-well border border-line font-mono text-xs text-ink">stun.l.google.com</code> directly from your browser session.
                        </p>
                    </Section>

                    <Section title="2. No Persistent Server Logging or Ad Cookies">
                        <p>
                            We do not store visitor IP addresses, hardware dumps, or diagnostic history in backend databases. Aggregate anonymized page views may run via Vercel Analytics if consented, without recording personal identities.
                        </p>
                        <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                            <span className="text-xs text-muted">Manage your active browser privacy preferences:</span>
                            <CookiePreferencesButton className="inline-flex items-center px-3 py-1.5 rounded-lg border border-line-strong bg-surface text-ink font-semibold text-xs hover:bg-hover transition-colors cursor-pointer">
                                Open Cookie Preferences
                            </CookiePreferencesButton>
                        </div>
                    </Section>

                    <Section title="3. Client-Side Session Caching">
                        <p>
                            A short-lived IP cache (<code className="px-1.5 py-0.5 rounded bg-well border border-line font-mono text-xs text-ink">sessionStorage</code>, 5-minute TTL) avoids redundant API lookups during page reloads and clears automatically when the browser tab closes.
                        </p>
                    </Section>

                    <Section title="4. Contact">
                        <p>
                            Questions about privacy or detection accuracy:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>
                                Technical Detection Feedback:{" "}
                                <a href="mailto:report@mysupportinfo.com" className="text-secondary font-semibold hover:underline">report@mysupportinfo.com</a>
                            </li>
                            <li>
                                Privacy &amp; General Inquiries:{" "}
                                <a href="mailto:contact@mysupportinfo.com" className="text-secondary font-semibold hover:underline">contact@mysupportinfo.com</a>
                            </li>
                        </ul>
                    </Section>
                </div>

                <div className="pt-4 flex flex-wrap gap-3">
                    <Link href="/terms" className="px-4 py-2 bg-brand text-white rounded-lg text-xs font-semibold hover:opacity-95 transition-opacity">
                        Terms of Use
                    </Link>
                    <Link href="/faq" className="px-4 py-2 bg-surface border border-line-strong text-ink rounded-lg text-xs font-semibold hover:bg-hover transition-colors">
                        FAQ
                    </Link>
                    <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface border border-line-strong text-ink rounded-lg text-xs font-semibold hover:bg-hover transition-colors">
                        <ArrowLeft size={13} aria-hidden="true" />
                        <span>Back to Overview</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
