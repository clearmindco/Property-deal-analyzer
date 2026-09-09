import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const createContactSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  trade: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  category: z.enum(["PREFERRED", "BACKUP", "DO_NOT_USE"]).default("BACKUP"),
  notes: z.string().optional(),
});

export async function GET() {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contacts = await prisma.contact.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(contacts);
}

export async function POST(request: Request) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const contact = await prisma.contact.create({ data: { ...parsed.data, userId } });
  return NextResponse.json(contact, { status: 201 });
}
