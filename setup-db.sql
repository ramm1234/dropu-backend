CREATE DATABASE IF NOT EXISTS dropu_app;
USE dropu_app;

CREATE TABLE IF NOT EXISTS users (
  phone VARCHAR(191) NOT NULL,
  fullName VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL,
  dateOfBirth VARCHAR(191) NULL,
  avatarUrl VARCHAR(1024) NULL,
  bio TEXT NULL,
  vehicleModel VARCHAR(191) NULL,
  vehicleColor VARCHAR(191) NULL,
  vehicleNumber VARCHAR(191) NULL,
  role VARCHAR(191) NOT NULL,
  createdAt VARCHAR(191) NOT NULL,
  lateCancellationCount INT NOT NULL DEFAULT 0,
  PRIMARY KEY (phone),
  UNIQUE KEY users_email_key (email)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rides (
  id VARCHAR(191) NOT NULL,
  driverPhone VARCHAR(191) NOT NULL,
  driverName VARCHAR(191) NOT NULL,
  category VARCHAR(191) NOT NULL,
  tripType VARCHAR(191) NOT NULL,
  cars TEXT NOT NULL,
  hours INT NOT NULL,
  date VARCHAR(191) NOT NULL,
  pricePerHour INT NOT NULL,
  pickupDate VARCHAR(191) NOT NULL,
  dropoffDate VARCHAR(191) NOT NULL,
  fromLocation VARCHAR(191) NOT NULL DEFAULT '',
  createdAt VARCHAR(191) NOT NULL,
  carNumber VARCHAR(191) NULL,
  alwaysAvailable BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (id),
  INDEX rides_carNumber_idx (carNumber)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(191) NOT NULL,
  rideId VARCHAR(191) NOT NULL,
  senderPhone VARCHAR(191) NOT NULL,
  senderName VARCHAR(191) NOT NULL,
  text TEXT NOT NULL,
  createdAt VARCHAR(191) NOT NULL,
  PRIMARY KEY (id),
  INDEX messages_rideId_idx (rideId),
  CONSTRAINT messages_rideId_fkey FOREIGN KEY (rideId) REFERENCES rides(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ride_requests (
  id VARCHAR(191) NOT NULL,
  rideId VARCHAR(191) NOT NULL,
  userName VARCHAR(191) NOT NULL,
  userPhone VARCHAR(191) NULL,
  userAge INT NULL,
  userRating DOUBLE NULL,
  fromLocation VARCHAR(191) NOT NULL,
  toLocation VARCHAR(191) NOT NULL,
  departureTime VARCHAR(191) NULL,
  arrivalTime VARCHAR(191) NULL,
  durationHours INT NULL,
  tripType VARCHAR(191) NULL,
  category VARCHAR(191) NULL,
  totalPrice DOUBLE NULL,
  date VARCHAR(191) NULL,
  status VARCHAR(191) NOT NULL DEFAULT 'pending',
  createdAt VARCHAR(191) NOT NULL,
  acceptedAt VARCHAR(191) NULL,
  cancellationFeeApplicable BOOLEAN NOT NULL DEFAULT false,
  cancelledBy VARCHAR(191) NULL,
  endedAt VARCHAR(191) NULL,
  finalPrice DOUBLE NULL,
  lateCancellation BOOLEAN NOT NULL DEFAULT false,
  priceBreakdown TEXT NULL,
  rideCode VARCHAR(191) NULL,
  startedAt VARCHAR(191) NULL,
  tripStatus VARCHAR(191) NOT NULL DEFAULT 'not_started',
  PRIMARY KEY (id),
  INDEX ride_requests_rideId_idx (rideId),
  CONSTRAINT ride_requests_rideId_fkey FOREIGN KEY (rideId) REFERENCES rides(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
