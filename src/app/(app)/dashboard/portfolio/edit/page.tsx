"use client";

import { useState } from "react";

import { ErrorState, PageLoading } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  useCreateAchievement,
  useCreateCertification,
  useCreateEvidence,
  useCreateLink,
  useCreateProject,
  useCreateSkill,
  useDeleteAchievement,
  useDeleteCertification,
  useDeleteEvidence,
  useDeleteLink,
  useDeleteProject,
  useDeleteSkill,
  useOwnPortfolio,
  useUpdateAchievement,
  useUpdateCertification,
  useUpdateEvidence,
  useUpdateLink,
  useUpdateProject,
  useUpdateSkill,
} from "@/hooks/use-portfolio";

interface ItemRow {
  id: string;
  isPublic: boolean;
}

function ItemList<T extends ItemRow>({
  items,
  renderLabel,
  onTogglePublic,
  onDelete,
}: {
  items: T[];
  renderLabel: (item: T) => string;
  onTogglePublic: (item: T) => void;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing added yet.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-lg border p-2 text-sm"
        >
          <span>{renderLabel(item)}</span>
          <div className="flex items-center gap-2">
            <label
              htmlFor={`item-public-${item.id}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Checkbox
                id={`item-public-${item.id}`}
                checked={item.isPublic}
                onCheckedChange={() => onTogglePublic(item)}
              />
              Public
            </label>
            <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PortfolioEditorPage() {
  const { data, isPending, isError, refetch } = useOwnPortfolio();

  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();
  const [skillName, setSkillName] = useState("");

  const createLink = useCreateLink();
  const updateLink = useUpdateLink();
  const deleteLink = useDeleteLink();
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const createCertification = useCreateCertification();
  const updateCertification = useUpdateCertification();
  const deleteCertification = useDeleteCertification();
  const [certTitle, setCertTitle] = useState("");
  const [certIssuer, setCertIssuer] = useState("");

  const createEvidence = useCreateEvidence();
  const updateEvidence = useUpdateEvidence();
  const deleteEvidence = useDeleteEvidence();
  const [evidenceTitle, setEvidenceTitle] = useState("");

  const createAchievement = useCreateAchievement();
  const updateAchievement = useUpdateAchievement();
  const deleteAchievement = useDeleteAchievement();
  const [achievementTitle, setAchievementTitle] = useState("");

  if (isPending) return <PageLoading />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Edit Portfolio</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ItemList
            items={data.skills}
            renderLabel={(s) => s.name}
            onTogglePublic={(s) =>
              updateSkill.mutate({ id: s.id, input: { isPublic: !s.isPublic } })
            }
            onDelete={(id) => deleteSkill.mutate(id)}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Skill name"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
            />
            <Button
              onClick={() => {
                createSkill.mutate({ name: skillName, isPublic: false });
                setSkillName("");
              }}
              disabled={!skillName.trim()}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Links</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ItemList
            items={data.links}
            renderLabel={(l) => l.label || l.url}
            onTogglePublic={(l) =>
              updateLink.mutate({ id: l.id, input: { isPublic: !l.isPublic } })
            }
            onDelete={(id) => deleteLink.mutate(id)}
          />
          <div className="flex gap-2">
            <Input placeholder="URL" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            <Input
              placeholder="Label (optional)"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
            />
            <Button
              onClick={() => {
                createLink.mutate({ url: linkUrl, label: linkLabel || undefined, isPublic: false });
                setLinkUrl("");
                setLinkLabel("");
              }}
              disabled={!linkUrl.trim()}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projects</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ItemList
            items={data.projects}
            renderLabel={(p) => p.title}
            onTogglePublic={(p) =>
              updateProject.mutate({ id: p.id, input: { isPublic: !p.isPublic } })
            }
            onDelete={(id) => deleteProject.mutate(id)}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Project title"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
            />
            <Button
              onClick={() => {
                createProject.mutate({
                  title: projectTitle,
                  description: projectDescription || undefined,
                  isPublic: false,
                });
                setProjectTitle("");
                setProjectDescription("");
              }}
              disabled={!projectTitle.trim()}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">External Certifications</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ItemList
            items={data.certifications}
            renderLabel={(c) => c.title}
            onTogglePublic={(c) =>
              updateCertification.mutate({ id: c.id, input: { isPublic: !c.isPublic } })
            }
            onDelete={(id) => deleteCertification.mutate(id)}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Certification title"
              value={certTitle}
              onChange={(e) => setCertTitle(e.target.value)}
            />
            <Input
              placeholder="Issuer (optional)"
              value={certIssuer}
              onChange={(e) => setCertIssuer(e.target.value)}
            />
            <Button
              onClick={() => {
                createCertification.mutate({
                  title: certTitle,
                  issuer: certIssuer || undefined,
                  isPublic: false,
                });
                setCertTitle("");
                setCertIssuer("");
              }}
              disabled={!certTitle.trim()}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evidence</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ItemList
            items={data.evidence}
            renderLabel={(e) => e.title}
            onTogglePublic={(e) =>
              updateEvidence.mutate({ id: e.id, input: { isPublic: !e.isPublic } })
            }
            onDelete={(id) => deleteEvidence.mutate(id)}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Evidence title"
              value={evidenceTitle}
              onChange={(e) => setEvidenceTitle(e.target.value)}
            />
            <Button
              onClick={() => {
                createEvidence.mutate({ title: evidenceTitle, isPublic: false });
                setEvidenceTitle("");
              }}
              disabled={!evidenceTitle.trim()}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Achievements</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ItemList
            items={data.achievements}
            renderLabel={(a) => a.title}
            onTogglePublic={(a) =>
              updateAchievement.mutate({ id: a.id, input: { isPublic: !a.isPublic } })
            }
            onDelete={(id) => deleteAchievement.mutate(id)}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Achievement title"
              value={achievementTitle}
              onChange={(e) => setAchievementTitle(e.target.value)}
            />
            <Button
              onClick={() => {
                createAchievement.mutate({ title: achievementTitle, isPublic: false });
                setAchievementTitle("");
              }}
              disabled={!achievementTitle.trim()}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
