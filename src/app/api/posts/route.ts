import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const createPostSchema = z.object({
  groupId: z.string().min(1),
  postType: z.string().min(1),
  copy: z.string().min(1),
  status: z.enum(["DRAFT", "POSTED", "SKIPPED"]).default("POSTED"),
});

export async function GET(request: Request) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groupId = new URL(request.url).searchParams.get("groupId");
  const posts = await prisma.post.findMany({
    where: { userId, ...(groupId ? { groupId } : {}) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const group = await prisma.group.findFirst({ where: { id: parsed.data.groupId, userId } });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const now = new Date();
  const post = await prisma.post.create({
    data: {
      ...parsed.data,
      userId,
      postedAt: parsed.data.status === "POSTED" ? now : undefined,
    },
  });

  if (parsed.data.status === "POSTED") {
    await prisma.group.update({ where: { id: group.id }, data: { lastPostDate: now } });
  }

  return NextResponse.json(post, { status: 201 });
}
