"use client";

import { useState, useEffect, useCallback } from "react";
import {
    dashboardApi,
    DashboardData,
    UserDashboardData,
} from "../services/dashboardApi";

type DashboardUser = { role?: string } | null | undefined;

export const useDashboardData = (user: DashboardUser) => {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [userDashboardData, setUserDashboardData] =
        useState<UserDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAdminData = useCallback(async (showRefresh = false) => {
        if (user?.role !== "admin") return;

        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            const data = await dashboardApi.getDashboardData();
            setDashboardData(data);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError("Failed to load dashboard data");
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user?.role]);

    const fetchUserData = useCallback(async (showRefresh = false) => {
        if (user?.role === "admin" || !user) return;

        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            const data = await dashboardApi.getUserDashboardData();
            setUserDashboardData(data);
        } catch (err) {
            console.error("Error fetching user dashboard data:", err);
            setError("Failed to load dashboard data");
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    const handleRefresh = useCallback(() => {
        if (user?.role === "admin") {
            fetchAdminData(true);
        } else {
            fetchUserData(true);
        }
    }, [user?.role, fetchAdminData, fetchUserData]);

    useEffect(() => {
        if (user?.role === "admin") {
            fetchAdminData();
        } else if (user) {
            fetchUserData();
        }
    }, [user, fetchAdminData, fetchUserData]);

    return {
        dashboardData,
        userDashboardData,
        isLoading,
        error,
        refreshing,
        handleRefresh,
    };
};
