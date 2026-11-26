import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { normalizeValidationErrors } from "./lib/validate";
import "./env";
import { sampleRouter } from "./routes/sample";
import { otpRouter } from "./routes/otp";
import { ridesRouter } from "./routes/rides";
import { usersRouter } from "./routes/users";
import { messagesRouter } from "./routes/messages";
import { uploadsRouter } from "./routes/uploads";
import { logger } from "hono/logger";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// Rewrite @hono/zod-validator's raw failure responses into this app's error envelope
app.use("*", normalizeValidationErrors);

// Root route
app.get("/", (c) =>
  c.json({
    app: "DropU API",
    status: "ok",
    version: "1.0.0",
    message: "DropU backend is running and connected to Supabase PostgreSQL database.",
  })
);

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// Direct APK download endpoint
app.get("/download", (c) => {
  const file = Bun.file("/Users/ramsinghmehta/Downloads/DropU/DropU.apk");
  return new Response(file, {
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": 'attachment; filename="DropU.apk"',
    },
  });
});

// Serve locally-stored uploads (avatars, etc.)
app.use("/uploads/*", serveStatic({ root: "./" }));

// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/otp", otpRouter);
app.route("/api/rides", ridesRouter);
app.route("/api/users", usersRouter);
app.route("/api/chat", messagesRouter);
app.route("/api/uploads", uploadsRouter);

const port = Number(process.env.PORT) || 3001;

export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
