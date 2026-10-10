"use client";

import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CircleCheck,
  Contact,
  Info,
  Layers,
  MessageSquareWarning,
  ServerCog,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type * as React from "react";
import type { Path, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateConsultingRequest } from "@/hooks/use-consulting";
import { useZodForm } from "@/hooks/use-zod-form";
import { isApiError } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import { showNotification } from "@/stores/notification.store";
import { CONSULTING_SERVICES, type ConsultingRequestInput } from "@/types/consulting";
import { describeConsultingError } from "./consulting-errors";
import { CONSULTING_SERVICE_DESCRIPTIONS, CONSULTING_SERVICE_LABELS } from "./consulting-labels";
import { SectionHeading } from "./consulting-ui";

const optionalText = z.string().trim();

const requestSchema = z.object({
  companyName: z.string().trim().min(1, "Enter your company name"),
  businessSize: z.string().trim().min(1, "Describe your business size"),
  requestedService: z.enum(CONSULTING_SERVICES, { message: "Choose the service you need" }),
  securityConcern: z.string().trim().min(1, "Describe the security concern"),
  businessImpact: optionalText,
  websiteOrDomain: optionalText,
  environmentSummary: optionalText,
  contactName: z.string().trim().min(1, "Enter a contact name"),
  contactEmail: z.string().trim().pipe(z.email("Enter a valid email address")),
  contactPhone: optionalText,
});

type RequestValues = z.input<typeof requestSchema>;
type RequestOutput = z.output<typeof requestSchema>;

/** Builds the strict API-CON-001 payload; optional groups are omitted, never sent empty. */
function toPayload(values: RequestOutput): ConsultingRequestInput {
  const environmentDetails = {
    ...(values.websiteOrDomain ? { websiteOrDomain: values.websiteOrDomain } : {}),
    ...(values.environmentSummary ? { summary: values.environmentSummary } : {}),
  };
  return {
    companyDetails: { companyName: values.companyName },
    businessSize: values.businessSize,
    requestedService: values.requestedService,
    securityConcern: values.securityConcern,
    ...(values.businessImpact ? { businessImpact: values.businessImpact } : {}),
    ...(Object.keys(environmentDetails).length > 0 ? { environmentDetails } : {}),
    contactInformation: {
      name: values.contactName,
      email: values.contactEmail,
      ...(values.contactPhone ? { phone: values.contactPhone } : {}),
    },
  };
}

/** Server field paths (API-CON-001 DTO) → the form control that captured them. */
const SERVER_FIELD_MAP: Record<string, Path<RequestValues>> = {
  companyDetails: "companyName",
  businessSize: "businessSize",
  requestedService: "requestedService",
  securityConcern: "securityConcern",
  businessImpact: "businessImpact",
  environmentDetails: "environmentSummary",
  contactInformation: "contactEmail",
};

export function ConsultingRequestForm({
  defaults,
}: {
  defaults: { companyName?: string; contactName?: string; contactEmail?: string };
}) {
  const router = useRouter();
  const mutation = useCreateConsultingRequest();
  const form = useZodForm(requestSchema, {
    defaultValues: {
      companyName: defaults.companyName ?? "",
      businessSize: "",
      requestedService: undefined,
      securityConcern: "",
      businessImpact: "",
      websiteOrDomain: "",
      environmentSummary: "",
      contactName: defaults.contactName ?? "",
      contactEmail: defaults.contactEmail ?? "",
      contactPhone: "",
    },
  });
  const rootError = form.formState.errors.root;

  const submit = async (values: RequestOutput) => {
    form.clearErrors("root");
    try {
      const created = await mutation.mutateAsync(toPayload(values));
      showNotification({ type: "success", message: "Consulting request submitted." });
      router.push(`/business/consulting/${created.id}`);
    } catch (error) {
      if (isApiError(error) && error.hasValidationErrors) {
        for (const [field, messages] of Object.entries(error.errors)) {
          const target = SERVER_FIELD_MAP[field.split(".")[0] ?? field];
          if (target && messages[0]) form.setError(target, { message: messages[0] });
        }
      }
      const copy = describeConsultingError(error, {
        action: "submit your request",
        preserved: "Everything you entered is still here.",
      });
      form.setError("root", { type: copy.title, message: copy.description });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-6" noValidate>
        <FormSection
          icon={Building2}
          step={1}
          title="Company context"
          description="Which organisation is this request for?"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField form={form} name="companyName" label="Company name" autoComplete="off" />
            <TextField
              form={form}
              name="businessSize"
              label="Business size"
              placeholder="e.g. 40 employees"
              description="A short description, such as approximate headcount."
            />
          </div>
        </FormSection>

        <FormSection
          icon={Layers}
          step={2}
          title="Requested service"
          description="Choose the service that best matches the help you need."
        >
          <FormField
            control={form.control}
            name="requestedService"
            render={({ field, fieldState }) => (
              <fieldset aria-describedby={fieldState.error ? "service-error" : undefined}>
                <legend className="sr-only">Requested cybersecurity service</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {CONSULTING_SERVICES.map((service) => {
                    const selected = field.value === service;
                    return (
                      <label
                        key={service}
                        className={cn(
                          "relative flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                          selected
                            ? "border-foreground/60 bg-muted/60"
                            : "hover:border-foreground/25 hover:bg-muted/30",
                        )}
                      >
                        <input
                          type="radio"
                          name={field.name}
                          value={service}
                          checked={selected}
                          onChange={() => field.onChange(service)}
                          onBlur={field.onBlur}
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={cn(
                            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                            selected ? "border-foreground bg-foreground" : "border-input",
                          )}
                        >
                          {selected && <span className="size-1.5 rounded-full bg-background" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">
                            {CONSULTING_SERVICE_LABELS[service]}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                            {CONSULTING_SERVICE_DESCRIPTIONS[service]}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {fieldState.error && (
                  <p id="service-error" className="mt-3 text-sm text-destructive" role="alert">
                    {fieldState.error.message}
                  </p>
                )}
              </fieldset>
            )}
          />
        </FormSection>

        <FormSection
          icon={MessageSquareWarning}
          step={3}
          title="Security concern and impact"
          description="Enough context for a useful first review."
        >
          <div className="space-y-5">
            <TextAreaField
              form={form}
              name="securityConcern"
              label="What security concern are you facing?"
              description="For example, what you have noticed or what you would like checked."
              minHeight="min-h-32"
            />
            <TextAreaField
              form={form}
              name="businessImpact"
              label="Business impact"
              optional
              description="How this affects, or could affect, your organisation."
              minHeight="min-h-24"
            />
          </div>
        </FormSection>

        <FormSection
          icon={ServerCog}
          step={4}
          title="Environment context"
          description="High-level context only. Exact targets are confirmed later, in a separate authorisation step."
        >
          <div className="space-y-5">
            <TextField
              form={form}
              name="websiteOrDomain"
              label="Website or domain"
              optional
              placeholder="e.g. example.com"
            />
            <TextAreaField
              form={form}
              name="environmentSummary"
              label="Other environment details"
              optional
              description="For example, cloud provider or the kind of systems involved. Never include passwords, keys or other secrets."
              minHeight="min-h-24"
            />
          </div>
        </FormSection>

        <FormSection
          icon={Contact}
          step={5}
          title="Contact information"
          description="Who should be contacted about this request?"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField form={form} name="contactName" label="Contact name" autoComplete="name" />
            <TextField
              form={form}
              name="contactEmail"
              label="Contact email"
              type="email"
              autoComplete="email"
            />
            <TextField
              form={form}
              name="contactPhone"
              label="Contact phone"
              optional
              type="tel"
              autoComplete="tel"
            />
          </div>
        </FormSection>

        <Alert className="gap-1 rounded-xl px-4 py-3.5">
          <Info aria-hidden="true" />
          <AlertTitle>Submitting a request does not authorise technical testing</AlertTitle>
          <AlertDescription className="leading-6">
            Your request starts a review. Explicit scope authorisation — the exact targets,
            activities and dates you permit — is a separate step you confirm on the request once it
            exists.
          </AlertDescription>
        </Alert>

        {rootError?.message && (
          <Alert variant="destructive" className="gap-1 rounded-xl px-4 py-3.5">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>{rootError.type || "Request not submitted"}</AlertTitle>
            <AlertDescription>{rootError.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-end">
          <Button asChild type="button" variant="ghost" size="lg">
            <Link href="/business/consulting">Cancel</Link>
          </Button>
          <Button type="submit" size="lg" disabled={mutation.isPending} className="sm:min-w-56">
            {mutation.isPending ? (
              "Submitting request…"
            ) : (
              <>
                Submit consulting request <ArrowRight aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/** Side panel content: what genuinely happens next under WF-REQ. */
export function RequestNextSteps() {
  const steps = [
    {
      title: "Review",
      body: "The consulting team reviews your request and either accepts or declines it.",
    },
    {
      title: "Authorise scope",
      body: "You confirm exactly which targets and activities are permitted, and for how long.",
    },
    {
      title: "Delivery",
      body: "Technical delivery can begin only once a current scope authorisation exists.",
    },
  ];
  return (
    <Card size="sm" className="gap-4">
      <CardHeader>
        <h2 className="font-medium">What happens next</h2>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-medium">{step.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-5 flex gap-2 border-t pt-4 text-xs leading-5 text-muted-foreground">
          <CircleCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          You can follow progress at any time from Consulting requests.
        </p>
      </CardContent>
    </Card>
  );
}

function FormSection({
  icon,
  step,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  step: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-5 py-5 [--card-spacing:--spacing(5)]">
      <CardHeader className="border-b">
        <SectionHeading icon={icon} title={`${step}. ${title}`} description={description} />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

type FieldProps = {
  form: UseFormReturn<RequestValues, unknown, RequestOutput>;
  name: Path<RequestValues>;
  label: string;
  description?: string;
  placeholder?: string;
  optional?: boolean;
};

function FieldLabel({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <FormLabel>
      {label}
      {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
    </FormLabel>
  );
}

function TextField({
  form,
  name,
  label,
  description,
  placeholder,
  optional,
  type,
  autoComplete,
}: FieldProps & { type?: string; autoComplete?: string }) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FieldLabel label={label} optional={optional} />
          <FormControl>
            <Input
              {...field}
              value={(field.value as string | undefined) ?? ""}
              type={type}
              placeholder={placeholder}
              autoComplete={autoComplete}
              className="h-10"
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function TextAreaField({
  form,
  name,
  label,
  description,
  optional,
  minHeight,
}: FieldProps & { minHeight: string }) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FieldLabel label={label} optional={optional} />
          <FormControl>
            <Textarea
              {...field}
              value={(field.value as string | undefined) ?? ""}
              className={cn(minHeight, "leading-6")}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
