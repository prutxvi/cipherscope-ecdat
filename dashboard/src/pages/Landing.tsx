import {
  ArrowRight,
  Atom,
  Fingerprint,
  Globe,
  Hash,
  KeyRound,
  LockKeyhole,
  Radar,
  Route,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { BackgroundPaths } from "@/components/ui/background-paths";
import GatewayFlow from "@/components/ui/gateway-flow";
import dashboardShot from "../../screenshots/dashboard-top.png";

const GITHUB_URL = "https://github.com/prutxvi/cipherscope-ecdat";

function GithubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const STATS = [
  { value: "74", label: "findings surfaced" },
  { value: "55%", label: "quantum-vulnerable" },
  { value: "20", label: "files · 6 services" },
  { value: "22", label: "tests · CI-gated" },
];

const STEPS = [
  {
    icon: Upload,
    title: "Upload",
    body: "Point CipherScope at a repository, a zip, or a single file. Static analysis only — your code is never executed.",
  },
  {
    icon: Radar,
    title: "Detect",
    body: "Regex + AST rules and certificate parsing surface every primitive: hashes, ciphers, keys, TLS policy, SSH config.",
  },
  {
    icon: Route,
    title: "Migrate",
    body: "Every finding ships with its post-quantum replacement — ML-KEM, ML-DSA, AES-256-GCM, TLS 1.3 — ranked by real risk.",
  },
];

const MIGRATIONS = [
  { from: "RSA-2048", to: "ML-KEM-768", note: "FIPS 203 · hybrid X25519 + ML-KEM", FromIcon: KeyRound, ToIcon: ShieldCheck },
  { from: "ECDSA / ECDH", to: "ML-DSA-65", note: "FIPS 204 · signatures & key exchange", FromIcon: Fingerprint, ToIcon: ShieldCheck },
  { from: "SHA-1 / MD5", to: "SHA-256", note: "collision-resistant hashing", FromIcon: Hash, ToIcon: ShieldCheck },
  { from: "DES / 3DES / RC4", to: "AES-256-GCM", note: "authenticated encryption (AEAD)", FromIcon: LockKeyhole, ToIcon: ShieldCheck },
  { from: "TLS 1.0 / 1.1", to: "TLS 1.3", note: "RFC 8446 · modern transport", FromIcon: Globe, ToIcon: ShieldCheck },
  { from: "ECB / CBC mode", to: "AEAD (GCM)", note: "eliminates padding-oracle class", FromIcon: LockKeyhole, ToIcon: ShieldCheck },
];

export default function Landing({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="min-h-screen bg-[#070b13] text-slate-200 antialiased">
      {/* top nav */}
      <nav className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
        <span className="text-lg font-extrabold tracking-tight text-white">
          ◢ Cipher<span className="text-violet-400">Scope</span>
        </span>
        <div className="flex items-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:border-violet-400/40 hover:text-white"
            aria-label="GitHub repository"
          >
            <GithubIcon size={18} />
          </a>
          <button
            onClick={onLaunch}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-violet-400/40 hover:text-white"
          >
            View report
          </button>
        </div>
      </nav>

      {/* hero */}
      <BackgroundPaths
        title="CipherScope"
        subtitle="Find every weak and quantum-vulnerable cryptographic primitive in your codebase — and get the exact migration path to post-quantum standards. Static analysis. Zero setup. Open source."
        ctaLabel="Run a live scan"
        onCta={onLaunch}
        secondaryLabel="See the sample report"
        onSecondary={onLaunch}
      />

      {/* stats strip */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-mono text-4xl font-extrabold text-violet-300">{s.value}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            From unknown to quantum-safe in three steps
          </h2>
          <p className="mt-3 text-slate-400">
            Most organisations cannot inventory their own cryptography. CipherScope answers in seconds.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition duration-300 hover:border-violet-400/40 hover:bg-white/[0.05]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-400/10 text-violet-300">
                  <s.icon size={20} />
                </span>
                <span className="font-mono text-xs text-slate-600">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* pipeline visual */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">Every primitive flows into one map</h2>
          <p className="mt-3 text-slate-400">
            Hashes, ciphers, keys, certificates and TLS policy — correlated, scored and ranked by real risk.
          </p>
        </div>
        <div className="relative h-[420px] overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_90px_rgba(167,139,250,0.12)] md:h-[540px]">
          <GatewayFlow className="h-full w-full" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#070b13] via-[#070b13]/60 to-transparent pb-5 pt-16 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-slate-400">
              live pipeline · static analysis only
            </p>
          </div>
        </div>
      </section>

      {/* PQC migration map */}
      <section className="border-y border-white/5 bg-white/[0.02] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Every finding ships with its replacement</h2>
            <p className="mt-3 text-slate-400">
              Not just a vulnerability list — a migration map aligned to the NIST post-quantum standards.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MIGRATIONS.map((m) => (
              <div
                key={m.from}
                className="rounded-2xl border border-white/10 bg-[#0d1520] p-6 transition duration-300 hover:border-emerald-400/30"
              >
                <div className="flex items-center gap-2.5 text-slate-300">
                  <m.FromIcon size={16} className="text-rose-300" />
                  <span className="font-mono text-sm">{m.from}</span>
                </div>
                <ArrowRight size={16} className="my-2.5 text-violet-400" />
                <div className="flex items-center gap-2.5">
                  <m.ToIcon size={16} className="text-emerald-300" />
                  <span className="font-mono text-sm font-bold text-emerald-300">{m.to}</span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">{m.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mosca clock */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">The clock is already running</h2>
          <p className="mt-3 text-slate-400">
            Mosca's theorem turns quantum risk into arithmetic — and the arithmetic says <b className="text-rose-300">move now</b>.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0d1520] p-7 md:p-10">
          <div className="relative">
            <div className="flex h-16 overflow-hidden rounded-xl font-mono text-xs sm:text-sm">
              <div className="flex w-[55.5%] items-center justify-center border-r-2 border-[#070b13] bg-amber-400/15 px-2 text-center text-amber-200">
                10y — data must stay secret
              </div>
              <div className="flex w-[33.3%] items-center justify-center bg-rose-400/15 px-2 text-center text-rose-200">
                6y — time to migrate
              </div>
              <div className="flex flex-1 items-center justify-center bg-white/[0.04] text-slate-600">runway</div>
            </div>
            <div className="absolute -top-2 bottom-[-8px] w-0.5 bg-violet-300 shadow-[0_0_12px_rgba(167,139,250,0.9)]" style={{ left: "83.3%" }}>
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-violet-400/50 bg-violet-400/10 px-2.5 py-1 text-[11px] font-semibold text-violet-200">
                <Atom size={11} className="mr-1 inline" />
                quantum computer ~15y
              </span>
            </div>
          </div>
          <div className="mt-8 rounded-xl border border-rose-400/30 bg-rose-400/10 px-5 py-4 text-sm text-rose-200">
            <b>16y {'>'} 15y — too late.</b> Data outlives the migration window, so harvest-now-decrypt-later is
            already rational for attackers. Every quantum-vulnerable finding is escalated today, not someday.
          </div>
        </div>
      </section>

      {/* product screenshot */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">The report, in plain language</h2>
          <p className="mt-3 text-slate-400">
            Verdict first. Jargon-free. Built to be read by executives and engineers in the same meeting.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_90px_rgba(167,139,250,0.15)]">
          <img src={dashboardShot} alt="CipherScope findings report dashboard" className="w-full" />
        </div>
      </section>

      {/* final CTA */}
      <section className="relative overflow-hidden border-t border-white/5 py-28 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-[120px]" />
        </div>
        <div className="relative">
          <h2 className="text-4xl font-extrabold text-white md:text-5xl">
            Run your first scan in 30 seconds
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            No agents. No SonarQube stack. One command — or one click.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onLaunch}
              className="group flex items-center gap-2 rounded-xl bg-violet-500 px-9 py-4 text-lg font-semibold text-white shadow-[0_0_40px_rgba(139,92,246,0.35)] transition hover:-translate-y-0.5 hover:bg-violet-400"
            >
              Run a live scan
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-4 text-lg font-semibold text-slate-300 transition hover:border-white/25 hover:text-white"
            >
              <GithubIcon size={18} />
              Star on GitHub
            </a>
          </div>
          <p className="mt-8 font-mono text-xs text-slate-600">
            $ python3 scanner/scanner.py demo-repo -o dashboard/src/findings.json
          </p>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-white/5 py-10 text-center text-xs text-slate-600">
        CipherScope · open source · MIT · built for the post-quantum transition
      </footer>
    </div>
  );
}
