"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Wraps `next-themes`. Rendered inside `src/app/providers.tsx` so the whole app
 * can read/toggle the theme. The `class` attribute strategy toggles `.dark` on
 * <html>, which drives the CSS-variable tokens defined in `globals.css`.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
