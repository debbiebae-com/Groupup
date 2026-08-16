import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "@/lib/mocks/server";

process.env.NEXT_PUBLIC_API_URL = "http://localhost/api";

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());