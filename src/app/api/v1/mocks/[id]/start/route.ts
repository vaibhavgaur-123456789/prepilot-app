import { api } from "@/server/http";
import { startAttempt } from "@/server/services/mock.service";

export const POST = api<{ id: string }>(async ({ user, params }) => startAttempt(user.id, params.id));
