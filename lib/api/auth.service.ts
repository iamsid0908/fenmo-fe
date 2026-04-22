import { apiClient } from "./client";
import type {
  GoogleAuthURLResponse,
  LoginUserRequest,
  LoginUserResponse,
  RegisterUserRequest,
  RegisterUserResponse,
  ResendOTPRequest,
  ResendOTPResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
} from "@/types/auth";

const AUTH = "/auth";

export const authService = {
  /**
   * Register a new user.
   * POST /auth/register
   */
  register: (payload: RegisterUserRequest) =>
    apiClient.post<RegisterUserResponse>(`${AUTH}/register`, payload),

  /**
   * Resend OTP to user email.
   * POST /auth/resend-otp
   */
  resendOTP: (payload: ResendOTPRequest) =>
    apiClient.post<ResendOTPResponse>(`${AUTH}/resend-otp`, payload),

  /**
   * Verify OTP for the registered user.
   * POST /auth/verify-otp
   */
  verifyOTP: (payload: VerifyOTPRequest) =>
    apiClient.post<VerifyOTPResponse>(`${AUTH}/verify-otp`, payload),

  /**
   * Login existing user.
   * POST /auth/login
   */
  login: (payload: LoginUserRequest) =>
    apiClient.post<LoginUserResponse>(`${AUTH}/login`, payload),

  /**
   * Get Google OAuth consent page URL.
   * GET /auth/google
   * Backend sets an oauth_state HTTP-only cookie, then returns the URL.
   * The browser must be redirected to this URL (not fetched in background).
   */
  getGoogleAuthURL: () =>
    apiClient.get<GoogleAuthURLResponse>(`${AUTH}/google`),
};
