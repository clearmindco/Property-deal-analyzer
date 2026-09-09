import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Every data-access function in this app calls this first -- deals, lenders, leads, etc.
 * are always scoped to the signed-in user's id (multi-tenant by construction). */
export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) throw new Error("UNAUTHENTICATED");
  return id;
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}
