import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import AppLayout from "../layouts/AppLayout";
import HomePage from "../pages/home/HomePage";

const root = createRootRoute({ component: AppLayout });
const home = createRoute({
  getParentRoute: () => root,
  path: "/",
  component: HomePage,
});
export const routeTree = root.addChildren([home]);
export const router = createRouter({ routeTree });
