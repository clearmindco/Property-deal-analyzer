import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { LenderForm, type LenderFormValue } from "@/components/lender/LenderForm";

export default async function LenderDetailPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const lender = await prisma.lender.findFirst({ where: { id: params.id, userId } });
  if (!lender) notFound();

  const initial: LenderFormValue = {
    id: lender.id,
    name: lender.name,
    contact: lender.contact ?? "",
    email: lender.email ?? "",
    phone: lender.phone ?? "",
    website: lender.website ?? "",
    geography: lender.geography ?? "",
    loanType: lender.loanType ?? "hard_money",
    verified: lender.verified,
    notes: lender.notes ?? "",
    terms: JSON.parse(lender.terms),
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-navy">{lender.name}</h1>
      <LenderForm initial={initial} />
    </div>
  );
}
