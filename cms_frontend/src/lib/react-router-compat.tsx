"use client";

/**
 * Compatibility layer so existing Vite/React Router code works under Next.js App Router.
 * Aliased as `react-router-dom` via next.config.mjs.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import NextLink from "next/link";
import {
  useRouter,
  usePathname,
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from "next/navigation";

const NAV_STATE_KEY = "__cm_nav_state__";

type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

type To = string | number;

function readNavState(): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(NAV_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeNavState(state: unknown) {
  if (typeof window === "undefined") return;
  try {
    if (state === undefined) {
      sessionStorage.removeItem(NAV_STATE_KEY);
    } else {
      sessionStorage.setItem(NAV_STATE_KEY, JSON.stringify(state));
    }
  } catch {
    // ignore quota / private mode
  }
}

/** Sync read for pages that need navigation state before useEffect (e.g. bulk LC edit). */
export function peekNavigationState<T = unknown>(): T | null {
  return readNavState() as T | null;
}

export function useNavigate() {
  const router = useRouter();

  return useCallback(
    (to: To, options?: NavigateOptions) => {
      if (typeof to === "number") {
        router.back();
        return;
      }
      // Always update stored state so a prior navigation's payload does not leak,
      // and so "state: undefined" clears the previous value.
      if (options && "state" in options) {
        writeNavState(options.state);
      } else {
        writeNavState(undefined);
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

export function useLocation() {
  const pathname = usePathname() || "/";
  const searchParams = useNextSearchParams();
  // SSR/hydration starts as null; layout effect restores sessionStorage before paint.
  const [state, setState] = useState<unknown>(null);

  React.useLayoutEffect(() => {
    setState(readNavState());
  }, [pathname]);

  const search = searchParams?.toString()
    ? `?${searchParams.toString()}`
    : "";

  return useMemo(
    () => ({
      pathname,
      search,
      hash: "",
      state,
      key: pathname + search,
    }),
    [pathname, search, state],
  );
}

export function useParams<
  T extends Record<string, string | string[] | undefined> = Record<
    string,
    string
  >,
>() {
  return (useNextParams() ?? {}) as T;
}

type SetSearchParams = (
  nextInit:
    | URLSearchParams
    | Record<string, string>
    | ((prev: URLSearchParams) => URLSearchParams),
  navigateOpts?: { replace?: boolean },
) => void;

export function useSearchParams(): [URLSearchParams, SetSearchParams] {
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

type LinkProps = React.ComponentPropsWithoutRef<"a"> & {
  to?: string;
  href?: string;
  replace?: boolean;
  children?: React.ReactNode;
};

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  function CompatLink({ to, href, replace, children, ...rest }, ref) {
    const destination = href ?? to ?? "#";
    return (
      <NextLink href={destination} replace={replace} ref={ref} {...rest}>
        {children}
      </NextLink>
    );
  },
);

export function Navigate({
  to,
  replace = false,
}: {
  to: string;
  replace?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router]);

  return null;
}

/** Not used in App Router pages (children instead); kept for API parity. */
export function Outlet() {
  return null;
}

export function NavLink({
  className,
  children,
  ...rest
}: Omit<LinkProps, "className"> & {
  className?: string | ((args: { isActive: boolean }) => string);
  children?: React.ReactNode;
}) {
  const pathname = usePathname() || "/";
  const destination = rest.href ?? rest.to ?? "#";
  const isActive =
    pathname === destination ||
    (destination !== "/" && pathname.startsWith(String(destination)));

  const resolvedClassName =
    typeof className === "function" ? className({ isActive }) : className;

  return (
    <Link {...rest} className={resolvedClassName}>
      {children}
    </Link>
  );
}

// Unused stubs for completeness
export const BrowserRouter = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
export const Routes = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
export const Route = (_props: unknown) => null;
