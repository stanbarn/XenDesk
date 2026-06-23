"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { LogoGlyph } from "@/components/ui/Logo";
import { DEMO_AGENT_EMAIL, DEMO_CUSTOMER_EMAIL, DEMO_PASSWORD } from "@/lib/demo";

const PANEL_BG =
  "radial-gradient(820px 520px at 16% 6%, rgba(255,255,255,.16), transparent 55%)," +
  "radial-gradient(700px 540px at 96% 98%, rgba(0,0,0,.18), transparent 55%)," +
  "linear-gradient(150deg,#0F9F6E 0%,#0B8E63 52%,#0A7A57 100%)";

const STATS = [
  { value: "18m", label: "Avg first response" },
  { value: "94%", label: "Resolved in SLA" },
  { value: "24/7", label: "Coverage" },
];

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_AGENT_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function authenticate(withEmail: string, withPassword: string, dest: string) {
    setPending(true);
    setError(null);
    const result = await signIn("credentials", {
      email: withEmail,
      password: withPassword,
      redirect: false,
    });
    if (result?.error) {
      setError("Invalid email or password.");
      setPending(false);
      return;
    }
    router.push(dest);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Brand panel */}
      <div
        className="relative hidden flex-1 flex-col justify-between overflow-hidden p-[52px_56px] text-white lg:flex"
        style={{ background: PANEL_BG }}
      >
        <LogoGlyph size={40} variant="panel" />
        <div className="max-w-[440px]">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold text-[#EAFBF3]">
            Support &amp; Ticketing · XenFi Systems
          </span>
          <h1 className="font-display text-[42px] font-bold leading-[1.1] tracking-[-0.02em]">
            Resolve every customer issue in one calm, organized place.
          </h1>
          <p className="mt-[18px] max-w-[404px] text-base leading-relaxed text-white/80">
            Submit, triage, assign and resolve support tickets with threaded
            conversations, priorities and tags — built for XenFi customers and agents.
          </p>
          <div className="mt-[38px] flex gap-[30px]">
            {STATS.map((s, i) => (
              <div key={s.label} className="flex gap-[30px]">
                {i > 0 && <div className="w-px bg-white/20" />}
                <div>
                  <div className="font-display text-[26px] font-bold">{s.value}</div>
                  <div className="mt-0.5 text-[13px] text-white/70">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-[12.5px] text-white/60">© 2026 XenFi Systems · All rights reserved</div>
      </div>

      {/* Form column */}
      <div className="flex w-full flex-shrink-0 items-center justify-center p-12 lg:w-[540px]">
        <form
          className="w-full max-w-[368px]"
          onSubmit={(e) => {
            e.preventDefault();
            void authenticate(email, password, "/");
          }}
        >
          <h2 className="font-display text-[25px] font-bold tracking-[-0.01em] text-ink">
            Sign in to XenDesk
          </h2>
          <p className="mb-[30px] mt-1.5 text-sm text-muted">
            Welcome back. Enter your credentials to continue.
          </p>

          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-[18px]"
            autoComplete="email"
            required
          />

          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-3.5"
            autoComplete="current-password"
            required
          />

          <div className="mb-6 flex items-center justify-between text-[13px]">
            <span className="flex cursor-pointer items-center gap-2 text-muted">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-[5px] border border-brand bg-brand">
                <Check size={10} className="text-white" strokeWidth={3.5} />
              </span>
              Remember me
            </span>
            <span className="cursor-pointer font-semibold text-brand">Forgot password?</span>
          </div>

          {error && (
            <p className="mb-3 text-[13px] font-semibold text-[#C2341D]">{error}</p>
          )}

          <Button type="submit" disabled={pending} className="w-full py-3.5 text-[15px]">
            {pending ? "Signing in…" : "Sign in"}
          </Button>

          <div className="my-[26px] flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-faint">or explore a demo</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              className="flex-1 py-[11px] text-[13.5px] font-semibold"
              onClick={() => void authenticate(DEMO_AGENT_EMAIL, DEMO_PASSWORD, "/dashboard")}
            >
              Enter as Agent
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              className="flex-1 py-[11px] text-[13.5px] font-semibold"
              onClick={() => void authenticate(DEMO_CUSTOMER_EMAIL, DEMO_PASSWORD, "/tickets")}
            >
              Enter as Customer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
