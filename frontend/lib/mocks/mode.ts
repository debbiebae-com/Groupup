export function isMockMode(): boolean {
  const setting = process.env.NEXT_PUBLIC_USE_MOCK_API;
  return setting === "true" || (process.env.NODE_ENV === "development" && setting !== "false");
}
