import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { LogoMark } from "@/components/ui/Logo";
import { SectionalMotif } from "@/components/ui/SectionalMotif";

const browse = [
  { href: "/states", label: "By state" },
  { href: "/cities", label: "By city" },
  { href: "/airports", label: "By airport" },
  { href: "/programs", label: "Programs" },
  { href: "/aircraft", label: "Aircraft" },
  { href: "/search", label: "Advanced search" },
  { href: "/near-me", label: "Near me" },
];

const account = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Sign up" },
  { href: "/schools/add", label: "Add a school" },
];

const linkCls = "transition-colors hover:text-white";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-night-line bg-night text-night-fg">
      <SectionalMotif
        animate={false}
        className="pointer-events-none absolute -bottom-64 -left-40 h-[32rem] w-[32rem] opacity-[0.12]"
      />
      <Container className="relative py-14">
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-3 flex items-center gap-2.5">
              <LogoMark size={22} />
              <p className="font-display text-lg font-bold tracking-tight text-white">
                Flight School Finder
              </p>
            </div>
            <p className="max-w-xs text-sm leading-relaxed">
              Find and compare flight training schools across the USA — built to
              help students discover the right path to their pilot certificate.
            </p>
          </div>
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-white/80">
              Browse
            </p>
            <ul className="space-y-2 text-sm">
              {browse.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkCls}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-white/80">
              Account
            </p>
            <ul className="space-y-2 text-sm">
              {account.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkCls}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-night-line pt-6 text-sm sm:flex-row">
          <p>
            © {new Date().getFullYear()} Flight School Finder · Built by{" "}
            <a
              href="https://timjedrek.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 underline-offset-4 transition-colors hover:text-accent"
            >
              Tim Jedrek
            </a>{" "}
            &amp;{" "}
            <a
              href="https://rightruddermarketing.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 underline-offset-4 transition-colors hover:text-accent"
            >
              Right Rudder Marketing
            </a>
          </p>
          <div className="flex gap-5">
            <Link href="/terms-of-service" className={linkCls}>
              Terms
            </Link>
            <Link href="/privacy-policy" className={linkCls}>
              Privacy
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
