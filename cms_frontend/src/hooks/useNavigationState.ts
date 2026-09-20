"use client";

import { useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { peekNavigationState } from "@/lib/nav-state";

/** Reads session navigation state after route changes (sync before paint). */
export function useNavigationState<T = unknown>(): T | null {
  const pathname = usePathname() || "/";
  const [state, setState] = useState<T | null>(null);

  useLayoutEffect(() => {
    setState(peekNavigationState<T>());
  }, [pathname]);

  return state;
}
