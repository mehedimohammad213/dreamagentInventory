"use client";
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useDashboardData } from "../hooks/useDashboardData";
import { AdminDashboard } from "./dashboard/AdminDashboard";
import { UserDashboard } from "./dashboard/UserDashboard";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    dashboardData,
    userDashboardData,
    isLoading,
    error,
    handleRefresh,
  } = useDashboardData(user);

  if (user?.role === "admin") {
    return (
      <AdminDashboard
        data={dashboardData}
        isLoading={isLoading}
        error={error}
        onRefresh={handleRefresh}
      />
    );
  }

  return (
    <UserDashboard
      data={userDashboardData}
      isLoading={isLoading}
      error={error}
      onRefresh={handleRefresh}
    />
  );
};

export default Dashboard;
