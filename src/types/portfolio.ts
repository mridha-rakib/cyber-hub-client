/**
 * Frontend-owned Portfolio contract types, hand-derived from the actual
 * backend (`api/src/modules/portfolio`, verified against ERD §7.11–7.18
 * and API Contract v1.1 §9). Field names/shapes match the backend
 * responses exactly — no invented fields (skills-as-a-profile-attribute,
 * social links, testimonials, badges, etc. do not exist here beyond what
 * the ERD's own six item tables define).
 */

export interface Portfolio {
  id: string;
  userId: string;
  publicSlug: string | null;
  isPublic: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioProject {
  id: string;
  portfolioId: string;
  title: string;
  description: string | null;
  links: string[];
  skills: string[];
  isPublic: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioLink {
  id: string;
  portfolioId: string;
  url: string;
  label: string | null;
  isPublic: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface PortfolioSkill {
  id: string;
  portfolioId: string;
  name: string;
  isPublic: boolean;
  sortOrder: number;
}

export interface PortfolioCertification {
  id: string;
  portfolioId: string;
  title: string;
  issuer: string | null;
  credentialUrl: string | null;
  isPublic: boolean;
  sortOrder: number;
}

export interface PortfolioEvidence {
  id: string;
  portfolioId: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface PortfolioAchievement {
  id: string;
  portfolioId: string;
  internshipId: string | null;
  title: string;
  description: string | null;
  isPublic: boolean;
  sortOrder: number;
}

export interface PortfolioCertificateDisplay {
  certificateId: string;
  isPublic: boolean;
  sortOrder: number;
  addedAt: string;
  certificateNumber: string;
  verificationPath: string;
  status: "ISSUED" | "REVOKED";
  issuedAt: string;
  programmeTitleSnapshot: string;
  completedSkills: string[];
}

export interface OwnPortfolioView {
  portfolio: Portfolio;
  projects: PortfolioProject[];
  links: PortfolioLink[];
  skills: PortfolioSkill[];
  certifications: PortfolioCertification[];
  evidence: PortfolioEvidence[];
  achievements: PortfolioAchievement[];
  certificates: PortfolioCertificateDisplay[];
}

/** Public projection — every item list here is already server-filtered to isPublic-only. */
export interface PublicPortfolioView {
  publicSlug: string | null;
  projects: PortfolioProject[];
  links: PortfolioLink[];
  skills: PortfolioSkill[];
  certifications: PortfolioCertification[];
  evidence: PortfolioEvidence[];
  achievements: PortfolioAchievement[];
  certificates: (Omit<PortfolioCertificateDisplay, "certificateId"> & {
    certificateNumber: string;
  })[];
}
