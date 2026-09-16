"use client";

import { MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { UserMenu } from "@/components/shell/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ROLE_NAVIGATION } from "@/config/navigation";
import { APP_NAME, ROUTES } from "@/constants";
import { useUIStore } from "@/stores/ui.store";
import type { SessionUser } from "@/types/auth";

/**
 * One shared, role-configured shell for all 5 roles — not five separate
 * layout implementations. Navigation is derived from `ROLE_NAVIGATION`, a
 * UX affordance only; it hides links, it does not enforce anything.
 */
export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const closeSidebar = useUIStore((s) => s.closeSidebar);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const items = ROLE_NAVIGATION[user.role];

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-56 shrink-0 border-r p-4 md:flex md:flex-col md:gap-6">
        <Link href={ROUTES.dashboard} className="font-heading text-base font-medium">
          {APP_NAME}
        </Link>
        <SidebarNav items={items} />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={closeSidebar}
          />
          <aside className="relative z-50 flex h-full w-64 flex-col gap-6 bg-background p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-heading text-base font-medium">{APP_NAME}</span>
              <Button variant="ghost" size="icon-sm" onClick={closeSidebar} aria-label="Close menu">
                <XIcon />
              </Button>
            </div>
            <SidebarNav items={items} onNavigate={closeSidebar} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={toggleSidebar}
            aria-label="Open menu"
          >
            <MenuIcon />
          </Button>
          <span className="font-medium md:hidden">{APP_NAME}</span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
