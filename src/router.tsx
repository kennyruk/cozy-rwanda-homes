import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { PageLoader } from "./components/smart-rent/loader";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Start loading a page as soon as someone hovers or touches a link, so clicks feel instant.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    // Only show the loading screen for genuinely slow pages, and keep it up long enough not to flash.
    defaultPendingComponent: PageLoader,
    defaultPendingMs: 200,
    defaultPendingMinMs: 300,
  });

  return router;
};
