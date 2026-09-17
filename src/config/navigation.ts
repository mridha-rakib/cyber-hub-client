import type { LucideIcon } from "lucide-react";
import { Award, Briefcase, LayoutDashboard, ShieldCheck, User, UserCog, Users } from "lucide-react";

import { ROUTES } from "@/constants";
import type { Role } from "@/types/auth";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** True for sections that are navigation placeholders, not yet built. */
  comingSoon?: boolean;
}

/**
 * Role-aware navigation is a UX convenience only — hiding a link here does
 * not stop a user from typing the URL, and the backend enforces the real
 * access decision on every request regardless of what this file says. There
 * is deliberately no "Admin sees everything" rule: Admin gets its own
 * explicit, short list, not a union of every other role's items.
 *
 * Every non-dashboard entry is `comingSoon` because no Wave 1+ product
 * module exists yet — this only establishes where those modules will attach.
 */
export const ROLE_NAVIGATION: Record<Role, NavItem[]> = {
  ROLE_LEARNER: [
    { label: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
    { label: "Browse Internships", href: "/internships", icon: Briefcase },
    { label: "My Applications", href: "/dashboard/internships/applications", icon: Briefcase },
    { label: "My Programmes", href: "/dashboard/internships/programmes", icon: Briefcase },
    { label: "My Certificates", href: "/dashboard/certificates", icon: Award },
    { label: "My Portfolio", href: "/dashboard/portfolio", icon: User },
  ],
  ROLE_BUSINESS: [
    { label: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
    { label: "Postings", href: "#", icon: Briefcase, comingSoon: true },
  ],
  ROLE_MENTOR: [
    { label: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
    { label: "Review Queue", href: "/mentor", icon: Users },
  ],
  ROLE_CONSULTANT: [
    { label: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
    { label: "Consulting requests", href: "#", icon: ShieldCheck, comingSoon: true },
  ],
  ROLE_ADMIN: [
    { label: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
    { label: "Internship Programmes", href: "/admin/internships", icon: UserCog },
    { label: "Internship Applications", href: "/admin/internship-applications", icon: UserCog },
  ],
};

export const ROLE_LABELS: Record<Role, string> = {
  ROLE_LEARNER: "Learner",
  ROLE_BUSINESS: "Business",
  ROLE_MENTOR: "Mentor",
  ROLE_CONSULTANT: "Consultant",
  ROLE_ADMIN: "Admin",
};

/**
 * Single deterministic post-login destination for every role today — all
 * roles land on the same shared `/dashboard` shell (see Wave 25). Kept as an
 * explicit typed map (not a hardcoded string in the login flow) so a future
 * per-role landing route is a one-line change here, not a scattered one.
 */
export const ROLE_LANDING_ROUTE: Record<Role, string> = {
  ROLE_LEARNER: ROUTES.dashboard,
  ROLE_BUSINESS: ROUTES.dashboard,
  ROLE_MENTOR: ROUTES.dashboard,
  ROLE_CONSULTANT: ROUTES.dashboard,
  ROLE_ADMIN: ROUTES.dashboard,
};
