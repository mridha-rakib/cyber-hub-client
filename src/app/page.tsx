import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME } from "@/constants";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="font-semibold">{APP_NAME}</span>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">{APP_NAME}</h1>
        <p className="max-w-md text-muted-foreground">
          Production-ready Next.js 16 setup with shadcn/ui, next-themes, Biome, TanStack Query,
          Zustand, Axios, React Hook Form, and Zod. Edit{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">src/app/page.tsx</code>{" "}
          to get started.
        </p>
      </main>
    </div>
  );
}
