import { Suspense } from "react";
import { LoginView } from "@/components/LoginView";

export default function ChefLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">Loading login...</div>}>
      <LoginView />
    </Suspense>
  );
}
