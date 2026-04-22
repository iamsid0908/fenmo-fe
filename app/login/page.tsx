import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in | Fenmo",
  description: "Sign in to your Fenmo account.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-extrabold tracking-tight text-indigo-600">
              Fenmo
            </span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to continue to your account.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          By signing in, you agree to our{" "}
          <Link
            href="/terms"
            className="text-indigo-500 hover:underline underline-offset-2"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-indigo-500 hover:underline underline-offset-2"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
