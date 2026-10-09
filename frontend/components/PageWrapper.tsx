"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { usePathname } from "next/navigation";

interface PageWrapperProps {
  children: React.ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  const { loading } = useAuth();
  const pathname = usePathname();

  // Clear any stale inline overflow locks left behind by modals/drawers so the
  // document always stays scrollable with the mouse wheel on every route.
  useEffect(() => {
    document.body.style.removeProperty("overflow");
    document.documentElement.style.removeProperty("overflow");
  }, [pathname]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f7f8fc] dark:bg-slate-950 transition-colors duration-300">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-t-indigo-600 dark:border-t-indigo-400 animate-spin"></div>
          </div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse">
            Synchronizing Session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition w-full h-full">
      {children}
    </div>
  );
}
