// Cloudflare uses the request's env bindings; local Vite handlers also read Node's env.
// Describe only that optional surface without exposing Node APIs to edge functions.
declare const process: {
  readonly env: Readonly<Record<string, string | undefined>>;
} | undefined;
