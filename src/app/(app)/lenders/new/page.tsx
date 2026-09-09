import { LenderForm } from "@/components/lender/LenderForm";

export default function NewLenderPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-navy">Add lender</h1>
      <LenderForm />
    </div>
  );
}
