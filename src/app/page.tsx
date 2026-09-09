import Link from "next/link";
import { getCurrentUserId } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const userId = await getCurrentUserId();
  if (userId) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <h1 className="max-w-2xl text-4xl font-bold text-navy">
        From address to answer. Understand the deal. Know the risk. Know your next move.
      </h1>
      <p className="mt-4 max-w-xl text-text-secondary">
        A real-estate investor command center: analyze, finance, and decide on your next deal --
        professional underwriting underneath, a first-deal-friendly experience on top.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/login" className="rounded-card bg-primary-blue px-5 py-2.5 font-medium text-white">
          Sign in
        </Link>
        <Link href="/register" className="rounded-card border border-primary-blue px-5 py-2.5 font-medium text-primary-blue">
          Create an account
        </Link>
      </div>
    </main>
  );
}
