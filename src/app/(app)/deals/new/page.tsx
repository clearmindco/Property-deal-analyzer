"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function NewDealPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    address: "", city: "", state: "", zip: "", askingPrice: "",
    propertyType: "Single Family", units: "1", bedrooms: "", bathrooms: "", sqft: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: form.address,
        city: form.city || undefined,
        state: form.state || undefined,
        zip: form.zip || undefined,
        askingPrice: form.askingPrice ? Number(form.askingPrice) : undefined,
        propertyType: form.propertyType || undefined,
        units: form.units ? Number(form.units) : 1,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        sqft: form.sqft ? Number(form.sqft) : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push(`/deals/${data.id}`);
  }

  const inputClass = "mt-1 w-full rounded-card border border-silver/60 bg-canvas px-3 py-2 text-sm text-text-primary";
  const labelClass = "text-sm font-medium text-text-secondary";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-navy">New deal</h1>
      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <label className={`${labelClass} col-span-2`}>
            Property address
            <input required value={form.address} onChange={(e) => update("address", e.target.value)} className={inputClass} placeholder="123 Main St, Rochester, NY 14606" />
          </label>
          <label className={labelClass}>
            City
            <input value={form.city} onChange={(e) => update("city", e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            State
            <input value={form.state} onChange={(e) => update("state", e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Zip
            <input value={form.zip} onChange={(e) => update("zip", e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Asking price
            <input type="number" value={form.askingPrice} onChange={(e) => update("askingPrice", e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Property type
            <select value={form.propertyType} onChange={(e) => update("propertyType", e.target.value)} className={inputClass}>
              <option>Single Family</option>
              <option>2-Unit</option>
              <option>3-Unit</option>
              <option>4-Unit</option>
              <option>Multi-Family (5+)</option>
              <option>Condo</option>
              <option>Other</option>
            </select>
          </label>
          <label className={labelClass}>
            Units
            <input type="number" min={1} value={form.units} onChange={(e) => update("units", e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Bedrooms
            <input type="number" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Bathrooms
            <input type="number" step="0.5" value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Square footage
            <input type="number" value={form.sqft} onChange={(e) => update("sqft", e.target.value)} className={inputClass} />
          </label>

          {error && <p className="col-span-2 text-sm text-danger">{error}</p>}
          <div className="col-span-2 mt-2 flex justify-end">
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create deal"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
