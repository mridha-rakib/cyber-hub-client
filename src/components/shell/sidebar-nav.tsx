"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function SidebarNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;

        if (item.comingSoon) {
          return (
            <span
              key={item.label}
              className="flex cursor-not-allowed items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground/60"
              aria-disabled="true"
              title="Coming soon"
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
              <span className="ml-auto text-xs">Soon</span>
            </span>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
              active ? "bg-muted text-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
