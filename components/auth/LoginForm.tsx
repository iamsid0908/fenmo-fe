"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { authService } from "@/lib/api/auth.service";
import { ApiError } from "@/lib/api/client";

interface FieldErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return errors;
}

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
    setServerError(null);
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
    setServerError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors = validate(email, password);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setServerError(null);

    try {
      // Cookie is set automatically by the browser (HTTP-only).
      // credentials: "include" is set globally in the API client.
      await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });

      // Navigate to the authenticated dashboard (adjust route as needed)
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const EyeIcon = ({ open }: { open: boolean }) => (
    <button
      type="button"
      tabIndex={-1}
      aria-label={open ? "Hide password" : "Show password"}
      onClick={() => setShowPassword((p) => !p)}
      className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
    >
      {open ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.002 1.002 0 000-.704 10.978 10.978 0 00-9.84-6.27c-1.54 0-3.01.3-4.35.85L3.28 2.22zm7.72 4.03a4 4 0 014 4c0 .69-.18 1.34-.49 1.91l-1.1-1.1A2.5 2.5 0 0011 10a2.5 2.5 0 00-2.5 2.5c0 .28.05.55.13.8l-1.66-1.66A4 4 0 0111 6.25z" />
          <path d="M10.9 17.74A9.96 9.96 0 011 10a1 1 0 00-.002-.352A10.024 10.024 0 014.42 5.52l1.065 1.065A8.478 8.478 0 002.5 10a8.478 8.478 0 008.5 8.5c.88 0 1.73-.14 2.53-.4l-1.1-1.1a8.564 8.564 0 01-1.53.74z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {serverError}
        </div>
      )}

      <Input
        label="Email Address"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={handleEmailChange}
        error={fieldErrors.email}
        disabled={loading}
        required
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline underline-offset-2"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={handlePasswordChange}
          error={fieldErrors.password}
          disabled={loading}
          required
          rightIcon={<EyeIcon open={showPassword} />}
        />
      </div>

      <Button type="submit" loading={loading} size="lg" className="mt-1 w-full">
        Sign In
      </Button>

      {/* OR divider */}
      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <GoogleButton label="Continue with Google" />

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-indigo-600 hover:text-indigo-700 underline-offset-2 hover:underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
