import { prisma } from "./lib/prisma";

export async function seedDatabase() {
  console.log("🌱 Seeding database from dropUdb2_dump.sql records...");

  // 1. Seed Users
  const users = [
    {
      phone: "+914444444444",
      fullName: "Chat Test Driver",
      email: "chattest-driver@example.com",
      dateOfBirth: "01/01/1990",
      role: "driver",
      createdAt: "2026-08-27T07:29:49.216Z",
      lateCancellationCount: 0,
      avatarUrl: null,
      bio: null,
      vehicleColor: null,
      vehicleModel: null,
      vehicleNumber: null,
    },
    {
      phone: "+915555555555",
      fullName: "Chat Test Passenger",
      email: "chattest-passenger@example.com",
      dateOfBirth: "01/01/1995",
      role: "customer",
      createdAt: "2026-08-27T07:29:49.316Z",
      lateCancellationCount: 0,
      avatarUrl: null,
      bio: null,
      vehicleColor: null,
      vehicleModel: null,
      vehicleNumber: null,
    },
    {
      phone: "+918700429264",
      fullName: "Ashmit Mishra",
      email: "sm.1272.sm@gmail.com",
      dateOfBirth: "16/08/1997",
      role: "driver",
      createdAt: "2026-08-27T05:25:19.847Z",
      lateCancellationCount: 0,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
      bio: "Professional campus and city driver with 5+ years experience. Clean WagonR.",
      vehicleColor: "white",
      vehicleModel: "WagonR",
      vehicleNumber: "DL4SDB7466",
    },
    {
      phone: "+919557802968",
      fullName: "Ram singh mehta",
      email: "ramm59026@gmail.com",
      dateOfBirth: "11/01/1999",
      role: "customer",
      createdAt: "2026-11-20T11:18:01.870Z",
      lateCancellationCount: 0,
      avatarUrl: null,
      bio: "Regular DropU commuter",
      vehicleColor: null,
      vehicleModel: null,
      vehicleNumber: null,
    },
    {
      phone: "+919876543210",
      fullName: "Scroll Test",
      email: "scrolltest1787811484467@example.com",
      dateOfBirth: "01/01/2000",
      role: "customer",
      createdAt: "2026-08-27T05:55:22.929Z",
      lateCancellationCount: 0,
      avatarUrl: null,
      bio: null,
      vehicleColor: null,
      vehicleModel: null,
      vehicleNumber: null,
    },
  ];

  for (const user of users) {
    await prisma.users.upsert({
      where: { phone: user.phone },
      update: user,
      create: user,
    });
  }
  console.log(`✅ Seeded ${users.length} users`);

  // 2. Seed Rides (Active rides for both Intercity and Outstation)
  const rides = [
    {
      id: "chattest-ride-1787815797",
      driverPhone: "+914444444444",
      driverName: "Chat Test Driver",
      category: "Intercity",
      tripType: "Oneway",
      cars: JSON.stringify(["Sedan"]),
      hours: 2,
      date: "2026-11-25",
      pricePerHour: 200,
      pickupDate: "2026-11-25T09:00:00.000Z",
      dropoffDate: "2026-11-25T11:00:00.000Z",
      fromLocation: "Delhi University North Campus",
      createdAt: "2026-11-20T07:29:57.485Z",
      carNumber: "DL1CAB1234",
      alwaysAvailable: true,
    },
    {
      id: "ride-ashmit-intercity-1",
      driverPhone: "+918700429264",
      driverName: "Ashmit Mishra",
      category: "Intercity",
      tripType: "Oneway",
      cars: JSON.stringify(["Hatchback", "Sedan"]),
      hours: 3,
      date: "2026-11-25",
      pricePerHour: 180,
      pickupDate: "2026-11-25T10:00:00.000Z",
      dropoffDate: "2026-11-25T13:00:00.000Z",
      fromLocation: "Connaught Place, Delhi",
      createdAt: "2026-11-20T08:00:00.000Z",
      carNumber: "DL4SDB7466",
      alwaysAvailable: true,
    },
    {
      id: "ride-ashmit-outstation-1",
      driverPhone: "+918700429264",
      driverName: "Ashmit Mishra",
      category: "Outstation",
      tripType: "Roundtrip",
      cars: JSON.stringify(["Hatchback", "SUV"]),
      hours: 8,
      date: "2026-11-26",
      pricePerHour: 220,
      pickupDate: "2026-11-26T06:00:00.000Z",
      dropoffDate: "2026-11-26T18:00:00.000Z",
      fromLocation: "Delhi to Jaipur / Agra",
      createdAt: "2026-11-20T08:30:00.000Z",
      carNumber: "DL4SDB7466",
      alwaysAvailable: true,
    },
    {
      id: "ride-driver-outstation-2",
      driverPhone: "+914444444444",
      driverName: "Chat Test Driver",
      category: "Outstation",
      tripType: "Oneway",
      cars: JSON.stringify(["Sedan", "SUV"]),
      hours: 6,
      date: "2026-11-26",
      pricePerHour: 240,
      pickupDate: "2026-11-26T07:00:00.000Z",
      dropoffDate: "2026-11-26T13:00:00.000Z",
      fromLocation: "Delhi to Chandigarh",
      createdAt: "2026-11-20T09:00:00.000Z",
      carNumber: "HR26DK9988",
      alwaysAvailable: true,
    },
  ];

  for (const ride of rides) {
    await prisma.rides.upsert({
      where: { id: ride.id },
      update: ride,
      create: ride,
    });
  }
  console.log(`✅ Seeded ${rides.length} rides`);

  // 3. Seed Ride Requests
  const requests = [
    {
      id: "1787815797602",
      rideId: "chattest-ride-1787815797",
      userName: "Chat Test Passenger",
      userPhone: "+915555555555",
      userAge: null,
      userRating: null,
      fromLocation: "Test City",
      toLocation: "Other City",
      departureTime: null,
      arrivalTime: null,
      durationHours: null,
      tripType: null,
      category: null,
      totalPrice: null,
      date: null,
      status: "accepted",
      createdAt: "2026-08-27T07:29:57.602Z",
      acceptedAt: null,
      cancellationFeeApplicable: false,
      cancelledBy: null,
      endedAt: null,
      finalPrice: null,
      lateCancellation: false,
      priceBreakdown: null,
      rideCode: null,
      startedAt: null,
      tripStatus: "not_started",
    },
  ];

  for (const req of requests) {
    await prisma.ride_requests.upsert({
      where: { id: req.id },
      update: req,
      create: req,
    });
  }
  console.log(`✅ Seeded ${requests.length} ride requests`);

  // 4. Seed Messages
  const messages = [
    {
      id: "17878160681368p7yl",
      rideId: "chattest-ride-1787815797",
      senderPhone: "+914444444444",
      senderName: "Chat Test Driver",
      text: "Hello from automated test 1787816068060",
      createdAt: "2026-08-27T07:34:28.136Z",
    },
  ];

  for (const msg of messages) {
    await prisma.messages.upsert({
      where: { id: msg.id },
      update: msg,
      create: msg,
    });
  }
  console.log(`✅ Seeded ${messages.length} messages`);

  console.log("🎉 Database seeding completed successfully!");
}

if (import.meta.main || process.argv[1]?.endsWith("seed.ts")) {
  seedDatabase()
    .catch((e) => {
      console.error("❌ Seeding failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
