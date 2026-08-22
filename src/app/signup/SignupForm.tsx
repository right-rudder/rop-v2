"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "@/app/actions/auth";
import { LIMITS } from "@/lib/types";
import { useActionToast } from "@/components/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";

type Props = {
  /** Pre-filled values (e.g. carried over from a lead form) */
  defaults?: { firstName?: string; lastName?: string; email?: string };
  /** Same-site path to land on after the confirmation email link */
  next?: string;
};

export function SignupForm({ defaults, next }: Props = {}) {
  const [state, action, pending] = useActionState(signup, {});
  useActionToast(state, {
    ok: (s) => ({ title: "Account created", description: s.message }),
    errorTitle: "Couldn't create account",
  });

  if (state.message) {
    return (
      <Notice tone="ok" className="py-5">
        {state.message}
      </Notice>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {next && <input type="hidden" name="next" value={next} />}

      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" htmlFor="firstName">
          <Input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            placeholder="Charles"
            defaultValue={defaults?.firstName}
          />
        </Field>
        <Field label="Last name" htmlFor="lastName">
          <Input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
            placeholder="Lindbergh"
            defaultValue={defaults?.lastName}
          />
        </Field>
      </div>

      <Field label="Email address" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          defaultValue={defaults?.email}
        />
      </Field>

      <Field label="Phone number" htmlFor="phone" hint="Optional">
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={LIMITS.phone}
          placeholder="(123) 456-6789"
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
      </Field>

      <Field label="Confirm password" htmlFor="confirmPassword">
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
        />
      </Field>

      <p className="text-xs leading-relaxed text-muted">
        By creating an account you agree to our{" "}
        <Link href="/terms-of-service" className="text-accent-ink hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="text-accent-ink hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      <Button type="submit" full size="lg" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
