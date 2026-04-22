"use client";

import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { authService } from "@/lib/api/auth.service";
import { ApiError } from "@/lib/api/client";

const OTP_LENGTH = 6;

interface Props {
  userId: number;
  email: string;
}

export function OTPForm({ userId, email }: Props) {
  const router = useRouter();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // auto-focus first box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  function updateDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1); // only last numeric char
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    setServerError(null);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        updateDigit(index, "");
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        updateDigit(index - 1, "");
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    setDigits((prev) => {
      const next = [...prev];
      pasted.split("").forEach((ch, i) => {
        if (i < OTP_LENGTH) next[i] = ch;
      });
      return next;
    });

    const nextFocus = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextFocus]?.focus();
    setServerError(null);
  }

  const otp = digits.join("");
  const isComplete = otp.length === OTP_LENGTH && digits.every(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isComplete) return;

    setLoading(true);
    setServerError(null);
    setSuccessMsg(null);

    try {
      const res = await authService.verifyOTP({ id: userId, email, otp });
      setSuccessMsg(res.data);
      // redirect to login after a short delay so user sees the success state
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
      // clear OTP boxes on error
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    setServerError(null);
    setSuccessMsg(null);

    try {
      await authService.resendOTP({ id: userId, email });
      setResendCooldown(60);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("Could not resend OTP. Please try again.");
      }
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {/* Status banners */}
      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {serverError}
        </div>
      )}
      {successMsg && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {successMsg} — Redirecting…
        </div>
      )}

      {/* OTP boxes */}
      <div className="flex justify-center gap-3" aria-label="One-time password input">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => updateDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={loading || !!successMsg}
            aria-label={`Digit ${i + 1}`}
            className={[
              "h-14 w-12 rounded-xl border-2 text-center text-xl font-bold text-gray-900 outline-none",
              "transition-all duration-150 bg-white",
              "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200",
              digit ? "border-indigo-400" : "border-gray-300",
              loading || successMsg ? "opacity-60 cursor-not-allowed" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        ))}
      </div>

      <Button
        type="submit"
        loading={loading}
        disabled={!isComplete || !!successMsg}
        size="lg"
        className="w-full"
      >
        Verify OTP
      </Button>

      {/* Resend */}
      <div className="text-center text-sm text-gray-500">
        Didn&apos;t receive the code?{" "}
        {resendCooldown > 0 ? (
          <span className="font-medium text-gray-400">
            Resend in {resendCooldown}s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading || loading}
            className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading ? "Sending…" : "Resend OTP"}
          </button>
        )}
      </div>
    </form>
  );
}
