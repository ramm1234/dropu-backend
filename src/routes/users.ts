import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const usersRouter = new Hono();

// Check if phone is registered
usersRouter.get("/check", async (c) => {
  const phone = c.req.query("phone");
  if (!phone) return c.json({ error: { message: "phone required" } }, 400);
  const user = await prisma.users.findUnique({ where: { phone }, select: { phone: true } });
  return c.json({ data: { registered: !!user } });
});

// Get user profile by phone
usersRouter.get("/:phone", async (c) => {
  const phone = c.req.param("phone");
  const user = await prisma.users.findUnique({ where: { phone } });
  if (!user) return c.json({ error: { message: "User not found" } }, 404);
  return c.json({ data: user });
});

// Get user profile by email (used for email-OTP login)
usersRouter.get("/by-email/:email", async (c) => {
  const email = c.req.param("email");
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) return c.json({ error: { message: "User not found" } }, 404);
  return c.json({ data: user });
});

// Create or update user profile
usersRouter.post(
  "/",
  zValidator("json", z.object({
    phone: z.string(),
    fullName: z.string(),
    email: z.string().email(),
    dateOfBirth: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    role: z.string(),
  })),
  async (c) => {
    const body = c.req.valid("json");
    try {
      const user = await prisma.users.upsert({
        where: { phone: body.phone },
        create: {
          phone: body.phone,
          fullName: body.fullName,
          email: body.email,
          dateOfBirth: body.dateOfBirth,
          avatarUrl: body.avatarUrl,
          role: body.role,
          createdAt: new Date().toISOString(),
        },
        update: {
          fullName: body.fullName,
          email: body.email,
          dateOfBirth: body.dateOfBirth,
          avatarUrl: body.avatarUrl,
          role: body.role,
        },
      });
      return c.json({ data: user });
    } catch (err: any) {
      if (err?.code === "P2002") {
        return c.json(
          { error: { message: "This email is already registered to another account.", code: "EMAIL_TAKEN" } },
          409
        );
      }
      throw err;
    }
  }
);

// Partially update profile fields (bio, vehicle details) without touching the rest
usersRouter.patch(
  "/:phone",
  zValidator("json", z.object({
    bio: z.string().max(500).optional(),
    vehicleModel: z.string().max(191).optional(),
    vehicleColor: z.string().max(191).optional(),
    vehicleNumber: z.string().max(191).optional(),
  })),
  async (c) => {
    const phone = c.req.param("phone");
    const body = c.req.valid("json");

    const existing = await prisma.users.findUnique({ where: { phone } });
    if (!existing) return c.json({ error: { message: "User not found" } }, 404);

    const user = await prisma.users.update({
      where: { phone },
      data: body,
    });
    return c.json({ data: user });
  }
);

export { usersRouter };
