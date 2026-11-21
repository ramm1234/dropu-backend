import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const messagesRouter = new Hono();

type Conversation = {
  rideId: string;
  otherName: string;
  otherPhone: string | null;
  myName: string;
  lastMessage: string | null;
  lastAt: string | null;
};

// GET /api/chat/conversations?phone= — all active chats for a user
messagesRouter.get("/conversations", async (c) => {
  const phone = c.req.query("phone");
  if (!phone) return c.json({ error: { message: "phone required" } }, 400);

  // Chats where user is the DRIVER (they posted the ride, someone was accepted)
  const driverRides = await prisma.rides.findMany({
    where: { driverPhone: phone },
    include: {
      ride_requests: { where: { status: "accepted" }, take: 1 },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  const driverChats: Conversation[] = driverRides
    .filter((r) => r.ride_requests.length > 0)
    .map((r) => ({
      rideId: r.id,
      otherName: r.ride_requests[0]!.userName,
      otherPhone: r.ride_requests[0]!.userPhone,
      myName: r.driverName,
      lastMessage: r.messages[0]?.text ?? null,
      lastAt: r.messages[0]?.createdAt ?? null,
    }));

  // Chats where user is the PASSENGER (their request was accepted)
  const passengerRequests = await prisma.ride_requests.findMany({
    where: { userPhone: phone, status: "accepted" },
    include: {
      rides: { include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } } },
    },
  });
  const passengerChats: Conversation[] = passengerRequests.map((rr) => ({
    rideId: rr.rideId,
    otherName: rr.rides.driverName,
    otherPhone: rr.rides.driverPhone,
    myName: rr.userName,
    lastMessage: rr.rides.messages[0]?.text ?? null,
    lastAt: rr.rides.messages[0]?.createdAt ?? null,
  }));

  const all = [...driverChats, ...passengerChats].sort((a, b) => {
    if (!a.lastAt && !b.lastAt) return 0;
    if (!a.lastAt) return 1;
    if (!b.lastAt) return -1;
    return b.lastAt.localeCompare(a.lastAt);
  });

  return c.json({ data: all });
});

// GET /api/chat/:rideId — fetch all messages for a ride chatroom
messagesRouter.get("/:rideId", async (c) => {
  const rideId = c.req.param("rideId");
  const rows = await prisma.messages.findMany({
    where: { rideId },
    orderBy: { createdAt: "asc" },
  });
  return c.json({ data: rows });
});

// POST /api/chat/:rideId — send a message
messagesRouter.post(
  "/:rideId",
  zValidator(
    "json",
    z.object({
      senderPhone: z.string(),
      senderName: z.string(),
      text: z.string().min(1),
    })
  ),
  async (c) => {
    const rideId = c.req.param("rideId");
    const body = c.req.valid("json");
    const id = `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
    const createdAt = new Date().toISOString();
    await prisma.messages.create({
      data: { id, rideId, senderPhone: body.senderPhone, senderName: body.senderName, text: body.text, createdAt },
    });
    return c.json({ data: { id, rideId, ...body, createdAt } });
  }
);

export { messagesRouter };
