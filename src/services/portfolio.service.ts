import { api } from "@/services/api";
import type {
  OwnPortfolioView,
  Portfolio,
  PortfolioAchievement,
  PortfolioCertificateDisplay,
  PortfolioCertification,
  PortfolioEvidence,
  PortfolioLink,
  PortfolioProject,
  PortfolioSkill,
  PublicPortfolioView,
} from "@/types/portfolio";

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

export interface PublicationInput {
  isPublic: boolean;
  publicSlug?: string;
}

export interface CertificateDisplayInput {
  isPublic: boolean;
  sortOrder: number;
}

/**
 * Typed wrappers around the backend's real Portfolio endpoints
 * (`api/src/modules/portfolio`). One generic pair of functions per item
 * type — the six §7.12–7.17 child item types share identical operation
 * shapes (create/update/delete), only the path and field shape differ.
 */
export const portfolioService = {
  async getOwn(): Promise<OwnPortfolioView> {
    return unwrap(api.get("/me/portfolio"));
  },

  async updatePublication(input: PublicationInput): Promise<Portfolio> {
    return unwrap(api.patch("/me/portfolio/publication", input));
  },

  async getPublic(publicSlug: string): Promise<PublicPortfolioView> {
    return unwrap(api.get(`/portfolios/${publicSlug}`));
  },

  // --- Projects ---------------------------------------------------------
  async createProject(input: Partial<PortfolioProject>): Promise<PortfolioProject> {
    return unwrap(api.post("/me/portfolio/projects", input));
  },
  async updateProject(id: string, input: Partial<PortfolioProject>): Promise<PortfolioProject> {
    return unwrap(api.patch(`/me/portfolio/projects/${id}`, input));
  },
  async deleteProject(id: string): Promise<void> {
    await api.delete(`/me/portfolio/projects/${id}`);
  },

  // --- Links --------------------------------------------------------------
  async createLink(input: Partial<PortfolioLink>): Promise<PortfolioLink> {
    return unwrap(api.post("/me/portfolio/links", input));
  },
  async updateLink(id: string, input: Partial<PortfolioLink>): Promise<PortfolioLink> {
    return unwrap(api.patch(`/me/portfolio/links/${id}`, input));
  },
  async deleteLink(id: string): Promise<void> {
    await api.delete(`/me/portfolio/links/${id}`);
  },

  // --- Skills -------------------------------------------------------------
  async createSkill(input: Partial<PortfolioSkill>): Promise<PortfolioSkill> {
    return unwrap(api.post("/me/portfolio/skills", input));
  },
  async updateSkill(id: string, input: Partial<PortfolioSkill>): Promise<PortfolioSkill> {
    return unwrap(api.patch(`/me/portfolio/skills/${id}`, input));
  },
  async deleteSkill(id: string): Promise<void> {
    await api.delete(`/me/portfolio/skills/${id}`);
  },

  // --- Certifications -------------------------------------------------------
  async createCertification(
    input: Partial<PortfolioCertification>,
  ): Promise<PortfolioCertification> {
    return unwrap(api.post("/me/portfolio/certifications", input));
  },
  async updateCertification(
    id: string,
    input: Partial<PortfolioCertification>,
  ): Promise<PortfolioCertification> {
    return unwrap(api.patch(`/me/portfolio/certifications/${id}`, input));
  },
  async deleteCertification(id: string): Promise<void> {
    await api.delete(`/me/portfolio/certifications/${id}`);
  },

  // --- Evidence -----------------------------------------------------------
  async createEvidence(input: Partial<PortfolioEvidence>): Promise<PortfolioEvidence> {
    return unwrap(api.post("/me/portfolio/evidence", input));
  },
  async updateEvidence(id: string, input: Partial<PortfolioEvidence>): Promise<PortfolioEvidence> {
    return unwrap(api.patch(`/me/portfolio/evidence/${id}`, input));
  },
  async deleteEvidence(id: string): Promise<void> {
    await api.delete(`/me/portfolio/evidence/${id}`);
  },

  // --- Achievements ---------------------------------------------------------
  async createAchievement(input: Partial<PortfolioAchievement>): Promise<PortfolioAchievement> {
    return unwrap(api.post("/me/portfolio/achievements", input));
  },
  async updateAchievement(
    id: string,
    input: Partial<PortfolioAchievement>,
  ): Promise<PortfolioAchievement> {
    return unwrap(api.patch(`/me/portfolio/achievements/${id}`, input));
  },
  async deleteAchievement(id: string): Promise<void> {
    await api.delete(`/me/portfolio/achievements/${id}`);
  },

  // --- Certificate display linking -----------------------------------------
  async addOrUpdateCertificate(
    certificateId: string,
    input: CertificateDisplayInput,
  ): Promise<PortfolioCertificateDisplay> {
    return unwrap(api.put(`/me/portfolio/certificates/${certificateId}`, input));
  },
  async updateCertificateDisplay(
    certificateId: string,
    input: Partial<CertificateDisplayInput>,
  ): Promise<PortfolioCertificateDisplay> {
    return unwrap(api.patch(`/me/portfolio/certificates/${certificateId}`, input));
  },
  async removeCertificate(certificateId: string): Promise<void> {
    await api.delete(`/me/portfolio/certificates/${certificateId}`);
  },
};
