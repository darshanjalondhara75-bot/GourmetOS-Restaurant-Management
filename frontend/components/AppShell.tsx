"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { PageWrapper } from "@/components/PageWrapper";

interface AppShellProps {
  children: React.ReactNode;
  extras?: React.ReactNode;
}

export function AppShell({ children, extras }: AppShellProps) {
  return (
    <PageWrapper>
      <div className="app-shell">
        <Navbar />
        <div className="app-shell-body">
          <Sidebar />
          <main className="app-main">
            <div className="app-main-inner">{children}</div>
          </main>
        </div>
        {extras}
      </div>
    </PageWrapper>
  );
}
