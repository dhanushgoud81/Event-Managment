import api from './axios';
import type { ApiSuccessResponse } from '@/types/api.types';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  RefreshTokenResponse,
  User,
} from '@/types/auth.types';

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<ApiSuccessResponse<User>>('/auth/register', data).then((r) => r.data),

  login: (data: LoginRequest) =>
    api.post<ApiSuccessResponse<LoginResponse>>('/auth/login', data).then((r) => r.data),

  logout: () =>
    api.post<ApiSuccessResponse<null>>('/auth/logout', {}).then((r) => r.data),

  refreshToken: () =>
    api
      .post<ApiSuccessResponse<RefreshTokenResponse>>('/auth/refresh-token', {})
      .then((r) => r.data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post<ApiSuccessResponse<null>>('/auth/forgot-password', data).then((r) => r.data),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<ApiSuccessResponse<null>>('/auth/reset-password', data).then((r) => r.data),

  verifyEmail: (token: string) =>
    api.get<ApiSuccessResponse<null>>(`/auth/verify-email/${token}`).then((r) => r.data),

  changePassword: (data: ChangePasswordRequest) =>
    api.post<ApiSuccessResponse<null>>('/auth/change-password', data).then((r) => r.data),
};
