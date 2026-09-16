import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { APP_NAME, ROUTES } from "@/constants";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="font-semibold">{APP_NAME}</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link href={ROUTES.login}>Sign in</Link>
          </Button>
          <Button asChild>
            <Link href={ROUTES.registerChoice}>Register</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">{APP_NAME}</h1>
        <p className="max-w-md text-muted-foreground">
          A frontend foundation for the Cyber Security Hub platform — sign in or register to get
          started.
        </p>
      </main>
    </div>
  );
}
