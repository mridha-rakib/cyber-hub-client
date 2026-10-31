import { api } from "@/services/api";
import {
  type BusinessProfileUpdate,
  type BusinessSelfView,
  businessSelfViewSchema,
  type UserProfileUpdate,
  type UserSelfView,
  userSelfViewSchema,
} from "@/types/account";

interface Envelope {
  data: unknown;
}

/**
 * Wave 7D self-service account API (API-ACC-001..005). Every route is a
 * `/me` route, so the server always acts on the signed-in account. The API
 * client attaches the CSRF header to PATCH/POST; responses are re-parsed so
 * only approved fields reach components.
 */
export const accountService = {
  // API-ACC-001
  getSelf: async (): Promise<UserSelfView> =>
    userSelfViewSchema.parse((await api.get<Envelope>("/me")).data.data),
  // API-ACC-002
  updateProfile: async (input: UserProfileUpdate): Promise<UserSelfView> =>
    userSelfViewSchema.parse((await api.patch<Envelope>("/me/profile", input)).data.data),
  // API-ACC-003
  getBusiness: async (): Promise<BusinessSelfView> =>
    businessSelfViewSchema.parse((await api.get<Envelope>("/me/business")).data.data),
  // API-ACC-004
  updateBusiness: async (input: BusinessProfileUpdate): Promise<BusinessSelfView> =>
    businessSelfViewSchema.parse((await api.patch<Envelope>("/me/business", input)).data.data),
  // API-ACC-005 — the reason is sent only when the user wrote one.
  requestDeletion: async (reason?: string): Promise<UserSelfView> =>
    userSelfViewSchema.parse(
      (await api.post<Envelope>("/me/account-deletion-request", reason ? { reason } : {})).data
        .data,
    ),
};
