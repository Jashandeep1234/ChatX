export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:8080/ws",
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
} as const;
