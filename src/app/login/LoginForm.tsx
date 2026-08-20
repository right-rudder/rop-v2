"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";

type Props = {
  /** Success notice from a previous step (e.g. password updated) */
  notice?: string;
  /** Error notice from a previous step (e.g. expired confirm link) */
  errorNotice?: string;
  /** Same-site path to return to after login (already validated by the page) */
  next?: string;
};

export function LoginForm({ notice, errorNotice, next }: Props) {
  const [state, action, pending] = useActionState(login, {});
  const error = state.error ?? errorNotice;

  return (
    <form action={action} className="space-y-5">
      {notice && !state.error && <Notice tone="ok">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {next && <input type="hidden" name="next" value={next} />}

      <Field label="Email address" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        action={
          <Link href="/forgot-password" className="text-sm text-accent-ink hover:underline">
            Forgot password?
          </Link>
        }
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </Field>

      <Button type="submit" full size="lg" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
