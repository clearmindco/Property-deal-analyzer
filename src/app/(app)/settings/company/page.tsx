import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { CompanySettingsForm } from "@/components/settings/CompanySettingsForm";

export default async function CompanySettingsPage() {
  const userId = await requireUserId();
  const settings = await prisma.companySettings.findUnique({ where: { userId } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Company Settings</h1>
        <p className="text-text-secondary">Real cash facts only -- the CFO capital-position check on the Dashboard reads these.</p>
      </div>
      <CompanySettingsForm
        initial={settings ? {
          cashOnHand: settings.cashOnHand, reserveMinimum: settings.reserveMinimum, committedCapital: settings.committedCapital,
        } : null}
      />
    </div>
  );
}
