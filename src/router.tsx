import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "~/routeTree.gen";

export function getRouter() {
  const router = createTanStackRouter({
    // Supress the default not found component warning
    defaultNotFoundComponent: () => <div>Page not found</div>,
    defaultPreload: "intent",
    routeTree,
    scrollRestoration: true,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
