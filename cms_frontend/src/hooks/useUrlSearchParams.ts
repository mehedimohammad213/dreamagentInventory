"use client";

import { useCallback, useMemo, useTransition } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from "next/navigation";

type SetSearchParams = (
  nextInit:
    | URLSearchParams
    | Record<string, string>
    | ((prev: URLSearchParams) => URLSearchParams),
  navigateOpts?: { replace?: boolean },
) => void;

/**
 * Mutable URL search params helper (Next's useSearchParams is read-only).
 */
export function useUrlSearchParams(): [URLSearchParams, SetSearchParams] {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const nextParams = useNextSearchParams();
  const [, startTransition] = useTransition();

  const searchParams = useMemo(
    () => new URLSearchParams(nextParams?.toString() || ""),
    [nextParams],
  );

  const setSearchParams = useCallback<SetSearchParams>(
    (nextInit, navigateOpts) => {
      const prev = new URLSearchParams(nextParams?.toString() || "");
      let next: URLSearchParams;

      if (typeof nextInit === "function") {
        next = nextInit(prev);
      } else if (nextInit instanceof URLSearchParams) {
        next = nextInit;
      } else {
        next = new URLSearchParams(nextInit as Record<string, string>);
      }

      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;

      startTransition(() => {
        if (navigateOpts?.replace) {
          router.replace(url);
        } else {
          router.push(url);
        }
      });
    },
    [nextParams, pathname, router],
  );

  return [searchParams, setSearchParams];
}
