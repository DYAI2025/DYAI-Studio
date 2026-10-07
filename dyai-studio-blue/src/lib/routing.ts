import { useEffect, useState } from "react";
import { ROUTES, type Route } from "@/data/model";

/**
 * Routing mode.
 *  - "hash":    #/organisations … — survives reload anywhere, including the hosted single-file preview.
 *  - "history": /organisations … — for a real deployment behind a server that rewrites to index.html.
 * The prototype ships in hash mode on purpose; switch the constant for production hosting.
 */
export const ROUTING_MODE: "hash" | "history" = "hash";

const LEGACY: Record<string, Route> = { "/principles": "/approach" };

export function normalizeRoute(path: string): Route {
  const value = (path.replace(/^#/, "").replace(/\/$/, "") || "/") as string;
  const mapped = LEGACY[value] ?? value;
  return (ROUTES.includes(mapped as Route) ? mapped : "/") as Route;
}

function currentRoute(): Route {
  return ROUTING_MODE === "hash" ? normalizeRoute(window.location.hash || "/") : normalizeRoute(window.location.pathname);
}

export function hrefFor(route: Route): string {
  return ROUTING_MODE === "hash" ? `#${route}` : route;
}

export function useRoute(): [Route, (next: Route) => void] {
  const [route, setRoute] = useState<Route>(currentRoute);
  useEffect(() => {
    const onChange = () => setRoute(currentRoute());
    window.addEventListener("popstate", onChange);
    window.addEventListener("hashchange", onChange);
    return () => { window.removeEventListener("popstate", onChange); window.removeEventListener("hashchange", onChange); };
  }, []);
  const navigate = (next: Route) => {
    if (next === route) return;
    if (ROUTING_MODE === "hash") window.location.hash = next;
    else { window.history.pushState({}, "", next); setRoute(next); }
  };
  return [route, navigate];
}
