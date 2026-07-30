// ─── User Types ──────────────────────────────

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EVENT_MANAGER' | 'USER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  referralCode: string;
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  wallet?: { balance: number };
  _count?: {
    registrations?: number;
    referralsMade?: number;
    payments?: number;
  };
}

// ─── Auth Request Types ──────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  referralCode?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ─── Auth Response Types ─────────────────────

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

// ─── Profile Types ───────────────────────────

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
}
