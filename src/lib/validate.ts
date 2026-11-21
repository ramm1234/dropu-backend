import type { Context, Next } from "hono";

// @hono/zod-validator, with no hook passed, responds to a validation failure
// with the raw { success: false, error: ZodError, data } shape on its own —
// bypassing the rest of the middleware chain entirely, so it can't be fixed
// by a route-level try/catch. This runs after every request and rewrites
// that specific shape into this app's { error: { message, code } } envelope,
// without needing to touch each zValidator call (which fights its generics).
export async function normalizeValidationErrors(c: Context, next: Next) {
  await next();

  if (c.res.status !== 400) return;

  let body: any;
  try {
    body = await c.res.clone().json();
  } catch {
    return; // not JSON
  }

  if (!body || body.success !== false || body.error?.name !== "ZodError") return;

  // ZodError.issues is a getter, so it doesn't survive JSON.stringify — but
  // .message (which does) is itself the JSON-stringified issues array.
  let message = "Invalid request";
  try {
    const issues = JSON.parse(body.error.message);
    const issue = Array.isArray(issues) ? issues[0] : undefined;
    const field = Array.isArray(issue?.path) ? issue.path.join(".") : "";
    if (issue) message = field ? `${field}: ${issue.message}` : issue.message;
  } catch {
    // fall back to the generic message
  }

  c.res = c.json({ error: { message, code: "VALIDATION_ERROR" } }, 400);
}
