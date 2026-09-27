import { api, body } from "@/server/http";
import { customMockSchema } from "@/lib/validation/schemas";
import { createCustomMock, listMocks, mockHistory } from "@/server/services/mock.service";

export const GET = api(async ({ user }) => ({ mocks: await listMocks(user.id), history: await mockHistory(user.id) }));

export const POST = api(async ({ req, user }) => createCustomMock(user.id, await body(req, customMockSchema)), { rate: { limit: 20, windowSec: 60 } });
