"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  isSidebarOpen: boolean;
  isMobileOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  hideSidebar: () => void;
  showSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isSidebarOpen: true,
  isMobileOpen: false,
  toggleSidebar: () => {},
  toggleMobileSidebar: () => {},
  closeMobileSidebar: () => {},
  hideSidebar: () => {},
  showSidebar: () => {},
});

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gourmet_sidebar_open");
      if (saved !== null) {
        setIsSidebarOpen(saved === "true");
      }
    } catch {
      // Ignore SSR/Storage errors
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("gourmet_sidebar_open", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  const hideSidebar = () => {
    setIsSidebarOpen(false);
    try {
      localStorage.setItem("gourmet_sidebar_open", "false");
    } catch {
      // ignore
    }
  };

  const showSidebar = () => {
    setIsSidebarOpen(true);
    try {
      localStorage.setItem("gourmet_sidebar_open", "true");
    } catch {
      // ignore
    }
  };

  return (
    <SidebarContext.Provider
      value={{
        isSidebarOpen,
        isMobileOpen,
        toggleSidebar,
        toggleMobileSidebar,
        closeMobileSidebar,
        hideSidebar,
        showSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
