import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { ContactsBoard } from "@/components/contacts/ContactsBoard";
import { CONTACT_JSON_FIELDS, deserializeJsonFields } from "@/lib/jsonFields";

export default async function ContactsPage() {
  const userId = await requireUserId();
  const contacts = await prisma.contact.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  const deserialized = contacts.map((c) => deserializeJsonFields(c, CONTACT_JSON_FIELDS));
  return <ContactsBoard initialContacts={JSON.parse(JSON.stringify(deserialized))} />;
}
