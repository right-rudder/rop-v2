"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, {});

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

      <Button type="submit" full size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>

      <div className="text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-accent-ink hover:underline">
          Back to log in
        </Link>
      </div>
    </form>
  );
}
