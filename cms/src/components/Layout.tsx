import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Layout: React.FC = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);


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
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <Header />
        <main className="bg-white dark:bg-gray-900 min-h-[calc(100vh-4rem)] p-3 sm:p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
