"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ErrorState, NotFoundState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/constants";
import { usePublicPortfolio } from "@/hooks/use-portfolio";
import { isApiError } from "@/lib/errors/api-error";

/**
 * UI-PUB-019. Renders ONLY the backend's `PublicPortfolioView` DTO — never
 * enriched from `useOwnPortfolio`'s cache (separate query-key namespace,
 * Wave 2 Phase 39), so a private item can never leak here.
 */
export default function PublicPortfolioPage() {
  const { publicSlug } = useParams<{ publicSlug: string }>();
  const { data, isPending, isError, error } = usePublicPortfolio(publicSlug);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link href="/" className="font-semibold">
          {APP_NAME}
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 p-6">
        {isPending && <PageLoading />}
        {isError &&
          (isApiError(error) && error.status === 404 ? <NotFoundState /> : <ErrorState />)}

        {!isPending && !isError && data && (
          <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold">Portfolio</h1>

            {data.projects.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-medium">Projects</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.projects.map((project) => (
                    <Card key={project.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{project.title}</CardTitle>
                        {project.description && (
                          <CardDescription>{project.description}</CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {data.certificates.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-medium">Certificates</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.certificates.map((certificate) => (
                    <Card key={certificate.verificationPath}>
                      <CardHeader className="flex-row items-center justify-between">
                        <CardTitle className="text-base">
                          {certificate.programmeTitleSnapshot}
                        </CardTitle>
                        <StatusBadge status={certificate.status} />
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        <Link
                          href={`/certificates/verify/${certificate.verificationPath}`}
                          className="underline underline-offset-4"
                        >
                          Verify
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {data.skills.length > 0 && (
              <section className="flex flex-col gap-2">
                <h2 className="text-lg font-medium">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="rounded-full border px-3 py-1 text-sm text-muted-foreground"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {data.certifications.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-medium">Certifications</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.certifications.map((cert) => (
                    <Card key={cert.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{cert.title}</CardTitle>
                        {cert.issuer && <CardDescription>{cert.issuer}</CardDescription>}
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {data.evidence.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-medium">Evidence</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.evidence.map((item) => (
                    <Card key={item.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        {item.description && <CardDescription>{item.description}</CardDescription>}
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {data.achievements.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-medium">Achievements</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.achievements.map((item) => (
                    <Card key={item.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        {item.description && <CardDescription>{item.description}</CardDescription>}
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {data.links.length > 0 && (
              <section className="flex flex-col gap-2">
                <h2 className="text-lg font-medium">Links</h2>
                <div className="flex flex-col gap-1">
                  {data.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm underline underline-offset-4"
                    >
                      {link.label || link.url}
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
