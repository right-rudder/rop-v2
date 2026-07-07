import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password – Flight School Finder",
  description: "Reset your Flight School Finder account password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-800 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              Forgot Your Password?
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
