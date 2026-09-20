"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { setNavigationState } from "@/lib/nav-state";

type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

/**
 * App navigation helper on top of next/navigation.
 * Supports optional `state` via sessionStorage (see `@/lib/nav-state`).
 */
export function useNavigate() {
  const router = useRouter();

  return useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        router.back();
        return;
      }

      if (options && "state" in options) {
        setNavigationState(options.state);
      } else {
        setNavigationState(undefined);
      }

      if (options?.replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    },
    [router],
  );
}
