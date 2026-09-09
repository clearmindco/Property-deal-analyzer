"use client";

import { signOut, useSession } from "next-auth/react";
import { ModeToggle } from "./ModeToggle";
import { Button } from "@/components/ui/Button";

export function Topbar() {
  const { data: session } = useSession();
  return (
    <header className="flex items-center justify-between border-b border-silver/40 bg-card px-6 py-4">
      <div className="text-sm text-text-secondary">
        {session?.user?.email ? `Signed in as ${session.user.email}` : ""}
      </div>
      <div className="flex items-center gap-3">
        <ModeToggle />
        <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/login" })}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
