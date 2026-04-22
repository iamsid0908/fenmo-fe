import type { Metadata } from "next";
import Link from "next/link";
import { OTPForm } from "@/components/auth/OTPForm";

export const metadata: Metadata = {
  title: "Verify your email | Fenmo",
  description: "Enter the OTP sent to your email to verify your account.",
};

interface Props {
  params: Promise<{ id: string; email: string }>;
}

export default async function VerifyOTPPage({ params }: Props) {
  const { id, email } = await params;

  // email in the URL is encoded (e.g. %40 for @)
  const decodedEmail = decodeURIComponent(email);
  const userId = Number(id);

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
            Check your inbox
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-gray-700">{decodedEmail}</span>
            . Enter it below to verify your account.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
          <OTPForm userId={userId} email={decodedEmail} />
        </div>

        {/* Back link */}
        <p className="mt-6 text-center text-sm text-gray-400">
          Wrong account?{" "}
          <Link
            href="/register"
            className="text-indigo-500 hover:underline underline-offset-2"
          >
            Go back
          </Link>
        </p>
      </div>
    </main>
  );
}
