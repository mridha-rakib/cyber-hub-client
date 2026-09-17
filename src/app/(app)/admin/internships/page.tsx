"use client";

import Link from "next/link";
import { useState } from "react";

import { EmptyState, ErrorState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAdminInternships, useCreateInternship } from "@/hooks/use-internship";

export default function AdminInternshipsPage() {
  const { data, isPending, isError, refetch } = useAdminInternships({ limit: 50 });
  const createInternship = useCreateInternship();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    await createInternship.mutateAsync({
      title,
      description,
      requirements: {},
      duration: {},
      completionCriteria: [],
    });
    setTitle("");
    setDescription("");
    setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Internship Programmes</h1>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "New programme"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New programme</CardTitle>
            <CardDescription>Created as DRAFT — publish it separately when ready.</CardDescription>
          </CardHeader>
          <div className="flex flex-col gap-3 px-4 pb-4">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea
              placeholder="Description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button
              onClick={handleCreate}
              disabled={createInternship.isPending || !title.trim() || !description.trim()}
            >
              {createInternship.isPending ? "Creating…" : "Create draft"}
            </Button>
          </div>
        </Card>
      )}

      {isPending && <PageLoading />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isPending && !isError && data?.length === 0 && (
        <EmptyState title="No programmes yet" description="Create one to get started." />
      )}
      {!isPending &&
        !isError &&
        data?.map((internship) => (
          <Link key={internship.id} href={`/admin/internships/${internship.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">{internship.title}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {internship.description}
                  </CardDescription>
                </div>
                <StatusBadge status={internship.status} />
              </CardHeader>
            </Card>
          </Link>
        ))}
    </div>
  );
}
