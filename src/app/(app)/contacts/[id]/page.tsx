import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { CONTACT_JSON_FIELDS, deserializeJsonFields } from "@/lib/jsonFields";
import { ContactDetail } from "@/components/contacts/ContactDetail";

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const contact = await prisma.contact.findFirst({ where: { id: params.id, userId } });
  if (!contact) notFound();

  const deals = await prisma.deal.findMany({
    where: { sourceContactId: contact.id, userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, address: true, stage: true, sourceType: true, askingPrice: true, contractPrice: true, assignmentFee: true },
  });

  const serialized = deserializeJsonFields(JSON.parse(JSON.stringify(contact)), CONTACT_JSON_FIELDS);
  return <ContactDetail contact={serialized} deals={JSON.parse(JSON.stringify(deals))} />;
}
