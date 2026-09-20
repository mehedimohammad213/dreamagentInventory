"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "./Header";
import Sidebar from "./Sidebar";

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
      {/* Desktop */}
      <div
        className={`hidden lg:grid gap-4 items-start ${
          collapsed ? "grid-cols-[4rem_1fr]" : "grid-cols-[16rem_1fr]"
        }`}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

        <div className="flex flex-col gap-4">
          <Header />
          <main className="bg-white dark:bg-gray-900 min-h-[calc(100vh-4rem)] p-3 sm:p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <Header />
        <main className="bg-white dark:bg-gray-900 min-h-[calc(100vh-4rem)] p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
