import Link from "next/link";
import AskAI from "@/components/ui/AskAI";
import Logo from "@/components/ui/Logo";
import CookieManager, { CookiePreferencesButton } from "@/components/ui/CookieManager";

export default function Footer() {
    return (
        <footer role="contentinfo" className="w-full bg-brand text-white border-t border-white/10">
            <div className="max-w-site mx-auto px-5 sm:px-6 py-10 md:py-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-white/15 items-start">
                    {/* Col 1: Brand & Mission */}
                    <div className="md:col-span-6 space-y-3">
                        <Logo theme="dark" size="sm" />
                        <p className="text-white/85 text-sm leading-relaxed max-w-md">
                            One link to diagnose any device. Plain-English browser, IP, hardware, and latency checks built to run safely inside your browser with zero stored personal logs.
                        </p>
                        <p className="text-xs font-mono text-accent/90">
                            In-browser execution &middot; No account needed &middot; HTTPS/TLS
                        </p>
                    </div>

                    {/* Col 2: Diagnostic Tools */}
                    <div className="md:col-span-3 space-y-2.5">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
                            Diagnostic Tools
                        </h2>
                        <nav aria-label="Footer diagnostics navigation" className="flex flex-col gap-1.5 text-sm text-white/85">
                            <Link className="hover:text-primary transition-colors w-fit py-0.5" href="/">
                                Device Overview
                            </Link>
                            <Link className="hover:text-primary transition-colors w-fit py-0.5" href="/what-is-my-browser">
                                What Is My Browser
                            </Link>
                            <Link className="hover:text-primary transition-colors w-fit py-0.5" href="/what-is-my-ip">
                                What Is My IP Address
                            </Link>
                            <Link className="hover:text-primary transition-colors w-fit py-0.5" href="/what-is-my-screen-resolution">
                                What Is My Screen Size
                            </Link>
                            <Link className="hover:text-primary transition-colors inline-flex items-center gap-2 w-fit py-0.5" href="/bufferbloat">
                                <span>Bufferbloat Latency Test</span>
                                <span className="text-3xs px-1.5 py-0.5 rounded bg-primary text-foreground font-bold uppercase leading-none">
                                    Lag
                                </span>
                            </Link>
                        </nav>
                    </div>

                    {/* Col 3: Documentation & Legal */}
                    <div className="md:col-span-3 space-y-2.5">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
                            Resources &amp; Legal
                        </h2>
                        <nav aria-label="Footer legal and support navigation" className="flex flex-col gap-1.5 text-sm text-white/85">
                            <Link className="hover:text-primary transition-colors w-fit py-0.5" href="/faq">
                                Help &amp; FAQ
                            </Link>
                            <Link className="hover:text-primary transition-colors w-fit py-0.5" href="/privacy">
                                Privacy Policy
                            </Link>
                            <Link className="hover:text-primary transition-colors w-fit py-0.5" href="/terms">
                                Terms of Use
                            </Link>
                            <div className="py-0.5">
                                <CookiePreferencesButton className="hover:text-primary transition-colors cursor-pointer text-left text-white/85" />
                            </div>
                            <a
                                href="mailto:report@mysupportinfo.com?subject=Detection%20Error%20Report%20-%20MySupportInfo"
                                className="hover:text-primary text-accent transition-colors w-fit py-0.5 font-medium"
                            >
                                Report a Detection Issue
                            </a>
                        </nav>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2.5 flex-wrap justify-center">
                        <span className="text-xs font-medium text-white/75">
                            Ask AI about MySupportInfo
                        </span>
                        <AskAI variant="dark" compact />
                    </div>

                    <div className="text-white/75 font-medium text-center md:text-right">
                        &copy; {new Date().getFullYear()} MySupportInfo.com &middot; Client-Side Device Diagnostics
                    </div>
                </div>
            </div>
            <CookieManager />
        </footer>
    );
}
