// ── Request types ────────────────────────────────────────────────────────────

export interface RegisterUserRequest {
  email: string;
  password: string;
  name: string;
}

export interface ResendOTPRequest {
  id: number;
  email: string;
}

export interface VerifyOTPRequest {
  id: number;
  email: string;
  otp: string;
}

export interface LoginUserRequest {
  email: string;
  password: string;
}

// ── Response types ───────────────────────────────────────────────────────────

export interface RegisterUserData {
  user_id: number;
  email: string;
  name: string;
  redirect: string;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface LoginUserData {
  email: string;
  name: string;
  role: string;
  user_id: number;
}

export type RegisterUserResponse = ApiResponse<RegisterUserData>;
export type VerifyOTPResponse = ApiResponse<string>;
export type ResendOTPResponse = ApiResponse<string>;
export type LoginUserResponse = ApiResponse<LoginUserData>;

export interface GoogleAuthURLData {
  url: string;
}
export type GoogleAuthURLResponse = ApiResponse<GoogleAuthURLData>;
