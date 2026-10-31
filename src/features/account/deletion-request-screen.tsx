"use client";

import Link from "next/link";
import { useState } from "react";

import { ErrorState, PageLoading } from "@/components/common/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { accountMutationMessage } from "@/features/account/account-errors";
import { formatUtc } from "@/features/admin-governance/admin-governance-ui";
import { ConfirmPanel } from "@/features/consulting/lifecycle-actions";
import { useAccountSelf, useRequestAccountDeletion } from "@/hooks/use-account";
import { DELETION_REASON_MAX_LENGTH, type UserSelfView } from "@/types/account";

/**
 * UI-ACC-003 Account Deletion Request (API-ACC-005). Recording a request
 * deletes nothing: the account keeps working and the request waits for the
 * data-retention process (GAP-012). Only Learners may submit (D1); other
 * account types see why the option isn't available, and no request is sent.
 */
export function DeletionRequestScreen() {
  const { data: user, isPending, isError, refetch } = useAccountSelf();

  if (isPending) return <PageLoading />;
  if (isError || !user) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/account/profile"
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          ← My profile
        </Link>
        <h1 className="mt-1 text-xl font-semibold">Account deletion request</h1>
      </div>
      {user.deletionRequestedAt ? (
        <RequestRecorded at={user.deletionRequestedAt} />
      ) : user.role === "ROLE_LEARNER" ? (
        <RequestForm user={user} />
      ) : (
        <NotAvailable />
      )}
    </div>
  );
}

function RequestRecorded({ at }: { at: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Request received</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <p>
          We received your deletion request on <span className="font-medium">{formatUtc(at)}</span>.
        </p>
        <p className="text-muted-foreground">
          Your account has not been deleted and still works as normal. The request will be handled
          under the platform&apos;s data retention policy. You don&apos;t need to send it again.
        </p>
      </CardContent>
    </Card>
  );
}

function NotAvailable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Not available for this account type yet</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Deletion requests for this kind of account depend on a data-retention policy that
        hasn&apos;t been decided yet. Contact the platform team if you need help with your account.
      </CardContent>
    </Card>
  );
}

function RequestForm({ user }: { user: UserSelfView }) {
  const request = useRequestAccountDeletion();
  const [reason, setReason] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tooLong = reason.length > DELETION_REASON_MAX_LENGTH;

  const submit = async () => {
    setError(null);
    try {
      await request.mutateAsync(reason.trim() || undefined);
      // The cache now holds the recorded timestamp, so the screen switches to "Request received".
    } catch (caught) {
      setError(accountMutationMessage(caught));
      setConfirming(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Before you send a request</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <section aria-label="What happens next" className="space-y-2 text-sm">
          <p>Sending this request does not delete your account straight away.</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Your account, learning records and portfolio stay as they are for now.</li>
            <li>
              The request is recorded with today&apos;s date and handled under the platform&apos;s
              data retention policy.
            </li>
            <li>You can keep signing in and using the platform after sending it.</li>
            <li>A request can&apos;t be withdrawn from this page once sent.</li>
          </ul>
        </section>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="deletion-reason">Reason (optional)</Label>
          <Textarea
            id="deletion-reason"
            value={reason}
            disabled={request.isPending || confirming}
            aria-invalid={tooLong}
            aria-describedby="deletion-reason-help"
            onChange={(event) => setReason(event.target.value)}
            rows={4}
          />
          <p
            id="deletion-reason-help"
            className={tooLong ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
          >
            {reason.length}/{DELETION_REASON_MAX_LENGTH} characters. Seen only by platform
            administrators.
          </p>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="deletion-ack"
            checked={acknowledged}
            disabled={request.isPending || confirming}
            onCheckedChange={(value) => setAcknowledged(value === true)}
          />
          <Label htmlFor="deletion-ack" className="text-sm leading-5 font-normal">
            I understand that this sends a request for {user.email} to be deleted under the data
            retention policy.
          </Label>
        </div>

        {confirming ? (
          <ConfirmPanel
            title="Send deletion request?"
            confirmLabel={request.isPending ? "Sending…" : "Send request"}
            pending={request.isPending}
            onConfirm={submit}
            onCancel={() => setConfirming(false)}
          >
            <p>This records your request. Nothing is deleted now.</p>
          </ConfirmPanel>
        ) : (
          <div>
            <Button
              type="button"
              variant="destructive"
              disabled={!acknowledged || tooLong}
              onClick={() => {
                setError(null);
                setConfirming(true);
              }}
            >
              Request account deletion
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
