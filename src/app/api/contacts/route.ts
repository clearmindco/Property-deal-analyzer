import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { CONTACT_JSON_FIELDS, deserializeJsonFields, serializeJsonFields } from "@/lib/jsonFields";
import { CONTACT_ROLES } from "@/lib/types/contact";

const createContactSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  trade: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  category: z.enum(["PREFERRED", "BACKUP", "DO_NOT_USE"]).optional(),
  notes: z.string().optional(),
  roles: z.array(z.enum(CONTACT_ROLES as [string, ...string[]])).default([]),
  market: z.string().optional(),
  leadSource: z.string().optional(),
  relationshipStatus: z.enum(["ACTIVE", "COLD", "DO_NOT_CONTACT"]).optional(),
  preferredContactMethod: z.enum(["CALL", "TEXT", "FACEBOOK_DM", "EMAIL"]).optional(),
});

export async function GET() {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contacts = await prisma.contact.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(contacts.map((c) => deserializeJsonFields(c, CONTACT_JSON_FIELDS)));
}

export async function POST(request: Request) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const data = serializeJsonFields({ ...parsed.data, userId }, CONTACT_JSON_FIELDS);
  const contact = await prisma.contact.create({ data: data as any });
  return NextResponse.json(deserializeJsonFields(contact, CONTACT_JSON_FIELDS), { status: 201 });
}
