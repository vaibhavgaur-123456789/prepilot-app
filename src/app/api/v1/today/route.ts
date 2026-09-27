import { api } from "@/server/http";
import { getHome } from "@/server/services/dashboard.service";

// Cached by the service worker (network-first) so today's plan is visible offline.
export const GET = api(async ({ user }) => getHome(user.id));
