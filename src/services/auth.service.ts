import { api } from "@/services/api";
import type { SessionResponse } from "@/types/auth";

/** Every successful backend response is wrapped in this envelope. */
interface Envelope<T> {
  success: true;
  message: string;
  data: T;
  requestId: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterLearnerPayload {
  name: string;
  email: string;
  password: string;
}

export interface RegisterBusinessPayload {
  name: string;
  email: string;
  password: string;
  companyName: string;
  businessEmail: string;
}

export interface RequestEmailVerificationPayload {
  email: string;
}

export interface ConfirmEmailVerificationPayload {
  token: string;
}

export interface RequestPasswordResetPayload {
  email: string;
}

export interface ConfirmPasswordResetPayload {
  token: string;
  newPassword: string;
}

/**
 * Typed wrappers around the backend's actual auth endpoints
 * (`api/src/modules/auth/controllers/auth.controller.ts`). Registration
 * intentionally exposes only Learner/Business — there is no generic
 * `register(role, payload)` function, so no caller can accidentally send a
 * role that isn't publicly registrable.
 */
export const authService = {
  async getCurrentSession(): Promise<SessionResponse> {
    const response = await api.get<Envelope<SessionResponse>>("/auth/session");
    return response.data.data;
  },

  async login(payload: LoginPayload): Promise<SessionResponse> {
    const response = await api.post<Envelope<SessionResponse>>("/auth/sessions", payload);
    return response.data.data;
  },

  async logout(): Promise<void> {
    await api.delete("/auth/session");
  },

  async registerLearner(payload: RegisterLearnerPayload): Promise<void> {
    await api.post("/auth/register/learner", payload);
  },

  async registerBusiness(payload: RegisterBusinessPayload): Promise<void> {
    await api.post("/auth/register/business", payload);
  },

  async requestEmailVerification(payload: RequestEmailVerificationPayload): Promise<void> {
    await api.post("/auth/email-verification/request", payload);
  },

  async confirmEmailVerification(payload: ConfirmEmailVerificationPayload): Promise<void> {
    await api.post("/auth/email-verification/confirm", payload);
  },

  async requestPasswordReset(payload: RequestPasswordResetPayload): Promise<void> {
    await api.post("/auth/password-reset/request", payload);
  },

  async confirmPasswordReset(payload: ConfirmPasswordResetPayload): Promise<void> {
    await api.post("/auth/password-reset/confirm", payload);
  },
};
