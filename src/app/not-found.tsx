import Link from "next/link";
import { NotFoundState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <NotFoundState />
        <Button asChild variant="outline">
          <Link href={ROUTES.home}>Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
