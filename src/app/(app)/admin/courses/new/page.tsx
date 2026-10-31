"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CourseForm,
  type CourseFormErrors,
  EMPTY_COURSE_FORM,
  toCourseCreateInput,
  validateCourseForm,
} from "@/features/learning-content/course-form";
import { classifyMutationError } from "@/features/learning-content/mutation-errors";
import { useCreateCourse } from "@/hooks/use-courses";
import { showNotification } from "@/stores/notification.store";

/** UI-ADM-007 create (API-ADMCRS-001): a new deal always starts as a DRAFT. */
export default function NewCourseDealPage() {
  const router = useRouter();
  const create = useCreateCourse();
  const [values, setValues] = useState(EMPTY_COURSE_FORM);
  const [errors, setErrors] = useState<CourseFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async () => {
    const clientErrors = validateCourseForm(values);
    setErrors(clientErrors);
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) {
      setFormError("Check the highlighted fields.");
      return;
    }
    try {
      const created = await create.mutateAsync(toCourseCreateInput(values));
      showNotification({ type: "success", message: "Draft course deal created." });
      router.push(`/admin/courses/${created.id}`);
    } catch (error) {
      const info = classifyMutationError(error);
      setErrors(info.fieldErrors);
      setFormError(info.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/courses" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to course deals
      </Link>
      <div>
        <h1 className="text-xl font-semibold">New course deal</h1>
        <p className="text-sm text-muted-foreground">
          Saved as a draft. It appears publicly only after you verify and approve it.
        </p>
      </div>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Deal details</CardTitle>
          <CardDescription>
            Prices are exact amounts; the deal price can't exceed the original.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formError && (
            <p className="mb-4 text-sm font-medium text-destructive" role="alert">
              {formError}
            </p>
          )}
          <CourseForm
            values={values}
            onChange={setValues}
            errors={errors}
            disabled={create.isPending}
            onSubmit={submit}
            actions={
              <>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? "Creating…" : "Create draft"}
                </Button>
                <Button type="button" variant="ghost" asChild>
                  <Link href="/admin/courses">Cancel</Link>
                </Button>
              </>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
