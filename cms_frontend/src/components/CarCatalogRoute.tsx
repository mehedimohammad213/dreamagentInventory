"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import Car from "@/views/car/Car";
import { Navigate } from "react-router-dom";

/** Car catalog is for guests and admins only; `user` role uses Current Stock instead. */
export default function CarCatalogRoute() {
  const { user } = useAuth();
  if (user?.role === "user") {
    return <Navigate to="/dashboard" replace />;
  }
  return <Car />;
}
