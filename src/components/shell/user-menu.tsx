"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS } from "@/config/navigation";
import { ROUTES } from "@/constants";
import { useLogout } from "@/hooks/use-auth-mutations";
import type { SessionUser } from "@/types/auth";

export function UserMenu({ user }: { user: SessionUser }) {
  const router = useRouter();
  const logout = useLogout();

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    // Backend owns cookie revocation; this only clears frontend cache
    // (see `useLogout`) and sends the user to a public screen.
    await logout.mutateAsync();
    router.push(ROUTES.login);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <Avatar size="sm">
          <AvatarFallback>{initials || "?"}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex flex-col">
          <span className="font-medium">{user.name}</span>
          <span className="font-normal text-muted-foreground">{user.email}</span>
          <span className="font-normal text-muted-foreground">{ROLE_LABELS[user.role]}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
