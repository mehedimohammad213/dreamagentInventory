"use client";

import Redirect from "@/components/auth/Redirect";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import CarCatalog from "./CarCatalog";
/** Car catalog is for guests and admins only; `user` role uses Current Stock instead. */
export default function CarCatalogRoute() {
  const { user } = useAuth();
  if (user?.role === "user") {
    return <Redirect href="/dashboard" />;
  }
  return <CarCatalog />;
}
