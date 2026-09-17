import { api } from "@/services/api";
import type { Certificate, CertificatePublicVerification } from "@/types/certificate";

interface Envelope<T> {
  success: true;
  message: string;
  data: T;
  requestId: string;
}

async function unwrap<T>(promise: Promise<{ data: Envelope<T> }>): Promise<T> {
  const response = await promise;
  return response.data.data;
}

/** Typed wrappers around the backend's real Certificate endpoints (`api/src/modules/certificate`). */
export const certificateService = {
  async listOwn(): Promise<Certificate[]> {
    return unwrap(api.get("/me/certificates"));
  },

  async getOwn(certificateId: string): Promise<Certificate> {
    return unwrap(api.get(`/me/certificates/${certificateId}`));
  },

  /** Public — no session required. */
  async verifyPublic(verificationPath: string): Promise<CertificatePublicVerification> {
    return unwrap(api.get(`/certificates/verify/${verificationPath}`));
  },

  async issue(enrollmentId: string, completedSkills: string[]): Promise<Certificate> {
    return unwrap(
      api.post(`/admin/internship-enrollments/${enrollmentId}/certificate`, { completedSkills }),
    );
  },

  async revoke(certificateId: string, reason: string): Promise<Certificate> {
    return unwrap(api.post(`/admin/certificates/${certificateId}/revoke`, { reason }));
  },
};
