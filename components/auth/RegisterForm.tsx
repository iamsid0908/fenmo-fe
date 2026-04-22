"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { authService } from "@/lib/api/auth.service";
import { ApiError } from "@/lib/api/client";
import type { RegisterUserRequest } from "@/types/auth";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(values: RegisterUserRequest & { confirmPassword: string }): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Full name is required.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export function RegisterForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // clear field error on change
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setServerError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setServerError(null);

    try {
      const res = await authService.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      // Navigate to OTP verification using the redirect path from backend
      router.push(res.data.redirect);
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
      className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
    >
      {open ? (
        // eye-slash
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.002 1.002 0 000-.704 10.978 10.978 0 00-9.84-6.27c-1.54 0-3.01.3-4.35.85L3.28 2.22zm7.72 4.03a4 4 0 014 4c0 .69-.18 1.34-.49 1.91l-1.1-1.1A2.5 2.5 0 0011 10a2.5 2.5 0 00-2.5 2.5c0 .28.05.55.13.8l-1.66-1.66A4 4 0 0111 6.25z" />
          <path d="M10.9 17.74A9.96 9.96 0 011 10a1 1 0 00-.002-.352A10.024 10.024 0 014.42 5.52l1.065 1.065A8.478 8.478 0 002.5 10a8.478 8.478 0 008.5 8.5c.88 0 1.73-.14 2.53-.4l-1.1-1.1a8.564 8.564 0 01-1.53.74z" />
        </svg>
      ) : (
        // eye
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Server-level error */}
      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {serverError}
        </div>
      )}

      <Input
        label="Full Name"
        name="name"
        type="text"
        autoComplete="name"
        placeholder="John Doe"
        value={form.name}
        onChange={handleChange}
        error={fieldErrors.name}
        disabled={loading}
        required
      />

      <Input
        label="Email Address"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={handleChange}
        error={fieldErrors.email}
        disabled={loading}
        required
      />

      <Input
        label="Password"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Min. 8 characters"
        value={form.password}
        onChange={handleChange}
        error={fieldErrors.password}
        disabled={loading}
        required
        rightIcon={
          <span onClick={() => setShowPassword((p) => !p)}>
            <EyeIcon open={showPassword} />
          </span>
        }
      />

      <Input
        label="Confirm Password"
        name="confirmPassword"
        type={showConfirm ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Repeat your password"
        value={form.confirmPassword}
        onChange={handleChange}
        error={fieldErrors.confirmPassword}
        disabled={loading}
        required
        rightIcon={
          <span onClick={() => setShowConfirm((p) => !p)}>
            <EyeIcon open={showConfirm} />
          </span>
        }
      />

      <Button type="submit" loading={loading} size="lg" className="mt-1 w-full">
        Create Account
      </Button>

      {/* OR divider */}
      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <GoogleButton label="Sign up with Google" />

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-700 underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
