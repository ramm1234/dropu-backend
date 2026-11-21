import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const publishSchema = z.object({
  id: z.string(),
  driverPhone: z.string(),
  driverName: z.string(),
  category: z.enum(["Intercity", "Outstation"]),
  tripType: z.enum(["Oneway", "Roundtrip"]),
  cars: z.array(z.string()),
  hours: z.number(),
  date: z.string(),
  pricePerHour: z.number(),
  pickupDate: z.string(),
  dropoffDate: z.string(),
  fromLocation: z.string().optional(),
});

const ridesRouter = new Hono();

function serializeRide<T extends { cars: string }>(ride: T) {
  return { ...ride, cars: JSON.parse(ride.cars) };
}

// POST /api/rides — publish a ride
ridesRouter.post("/", zValidator("json", publishSchema), async (c) => {
  const body = c.req.valid("json");
  const data = {
    driverPhone: body.driverPhone,
    driverName: body.driverName,
    category: body.category,
    tripType: body.tripType,
    cars: JSON.stringify(body.cars),
    hours: body.hours,
    date: body.date,
    pricePerHour: body.pricePerHour,
    pickupDate: body.pickupDate,
    dropoffDate: body.dropoffDate,
    fromLocation: body.fromLocation ?? "",
  };
  await prisma.rides.upsert({
    where: { id: body.id },
    create: { id: body.id, ...data, createdAt: new Date().toISOString() },
    update: data,
  });
  return c.json({ data: { ...body } });
});

// GET /api/rides/search?category= — search rides for passengers
ridesRouter.get("/search", async (c) => {
  const category = c.req.query("category") || "Intercity";
  const rows = await prisma.rides.findMany({
    where: { category },
    orderBy: { createdAt: "desc" },
  });
  return c.json({ data: rows.map(serializeRide) });
});

// GET /api/rides/driver?phone= — get all rides posted by a specific driver
ridesRouter.get("/driver", async (c) => {
  const phone = c.req.query("phone");
  if (!phone) return c.json({ error: { message: "phone required" } }, 400);
  const rows = await prisma.rides.findMany({
    where: { driverPhone: phone },
    orderBy: { createdAt: "desc" },
  });
  return c.json({ data: rows.map(serializeRide) });
});

const requestSchema = z.object({
  userName: z.string(),
  userPhone: z.string().optional(),
  userAge: z.number().optional(),
  userRating: z.number().optional(),
  fromLocation: z.string(),
  toLocation: z.string(),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
  durationHours: z.number().optional(),
  tripType: z.string().optional(),
  category: z.string().optional(),
  totalPrice: z.number().optional(),
  date: z.string().optional(),
});

// POST /api/rides/:id/requests — user sends a booking request to a driver
ridesRouter.post("/:id/requests", zValidator("json", requestSchema), async (c) => {
  const rideId = c.req.param("id");
  const body = c.req.valid("json");
  const id = Date.now().toString();
  await prisma.ride_requests.create({
    data: {
      id,
      rideId,
      userName: body.userName,
      userPhone: body.userPhone,
      userAge: body.userAge,
      userRating: body.userRating,
      fromLocation: body.fromLocation,
      toLocation: body.toLocation,
      departureTime: body.departureTime,
      arrivalTime: body.arrivalTime,
      durationHours: body.durationHours,
      tripType: body.tripType,
      category: body.category,
      totalPrice: body.totalPrice,
      date: body.date,
      createdAt: new Date().toISOString(),
    },
  });
  return c.json({ data: { id, rideId, ...body } });
});

// GET /api/rides/:id/requests — driver fetches all pending requests for their ride
ridesRouter.get("/:id/requests", async (c) => {
  const rideId = c.req.param("id");
  const rows = await prisma.ride_requests.findMany({
    where: { rideId, status: { not: "cancelled" } },
    orderBy: { createdAt: "desc" },
  });
  return c.json({ data: rows });
});

// PATCH /api/rides/:rideId/requests/:requestId/accept — driver accepts a request
ridesRouter.patch("/:rideId/requests/:requestId/accept", async (c) => {
  const { rideId, requestId } = c.req.param();
  // Accept this request, cancel all others for this ride
  await prisma.ride_requests.update({
    where: { id: requestId, rideId },
    data: { status: "accepted" },
  });
  await prisma.ride_requests.updateMany({
    where: { rideId, id: { not: requestId } },
    data: { status: "cancelled" },
  });
  return c.json({ data: { accepted: true, requestId } });
});

// DELETE /api/rides/:rideId/requests/:requestId — driver cancels/rejects a request
ridesRouter.delete("/:rideId/requests/:requestId", async (c) => {
  const { rideId, requestId } = c.req.param();
  await prisma.ride_requests.update({
    where: { id: requestId, rideId },
    data: { status: "cancelled" },
  });
  return c.json({ data: { cancelled: true } });
});

// PATCH /api/rides/:id — update a ride
ridesRouter.patch("/:id", zValidator("json", publishSchema.partial().omit({ id: true })), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const existing = await prisma.rides.findUnique({ where: { id } });
  if (!existing) return c.json({ error: { message: "Not found" } }, 404);

  const acceptedRequest = await prisma.ride_requests.findFirst({
    where: { rideId: id, status: "accepted" },
  });
  if (acceptedRequest) {
    return c.json({ error: { message: "Cannot edit ride details after accepting a booking request." } }, 400);
  }

  const updated = await prisma.rides.update({
    where: { id },
    data: {
      driverPhone: body.driverPhone,
      driverName: body.driverName,
      category: body.category,
      tripType: body.tripType,
      cars: body.cars ? JSON.stringify(body.cars) : undefined,
      hours: body.hours,
      date: body.date,
      pricePerHour: body.pricePerHour,
      pickupDate: body.pickupDate,
      dropoffDate: body.dropoffDate,
      fromLocation: body.fromLocation ?? existing.fromLocation ?? "",
    },
  });

  return c.json({ data: serializeRide(updated) });
});

// DELETE /api/rides/:id
ridesRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  // Children must go first: MySQL enforces FK constraints from ride_requests/messages -> rides.
  await prisma.messages.deleteMany({ where: { rideId: id } });
  await prisma.ride_requests.deleteMany({ where: { rideId: id } });
  await prisma.rides.delete({ where: { id } });
  return c.json({ data: { deleted: true } });
});

export { ridesRouter };
