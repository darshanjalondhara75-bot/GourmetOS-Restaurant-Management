"use client";
import { Suspense } from "react";
import InventoryPanel from "@/components/InventoryPanel";

export default function ChefInventoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Loading inventory...</div>}>
      <InventoryPanel mode="chef" />
    </Suspense>
  );
}
