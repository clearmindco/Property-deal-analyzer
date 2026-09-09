import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { TeamBoard } from "@/components/team/TeamBoard";

export default async function TeamPage() {
  const userId = await requireUserId();
  const contacts = await prisma.contact.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return <TeamBoard initialContacts={JSON.parse(JSON.stringify(contacts))} />;
}
