import { storage } from "./storage";
import type { InsertUser } from "@shared/schema";

export async function seedDatabase() {
  await storage.init();

  // Check if already seeded
  const existingUsers = await storage.getAllUsers();
  if (existingUsers.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database...");

  // Create admin user
  const admin: InsertUser = {
    discordId: "123456789",
    discordUsername: "admin_user",
    firstName: "John",
    lastName: "Smith",
    rank: "GEN",
    role: "Admin",
    unit: "Command",
    status: "active",
    joinDate: new Date().toISOString()
  };

  // Create general
  const general: InsertUser = {
    discordId: "987654321",
    discordUsername: "gen_jackson",
    firstName: "Robert",
    lastName: "Jackson",
    rank: "COL",
    role: "General",
    unit: "1st Division",
    status: "active",
    callsign: "Havoc-1",
    joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  };

  // Create colonel
  const colonel: InsertUser = {
    discordId: "555666777",
    discordUsername: "col_davis",
    firstName: "Michael",
    lastName: "Davis",
    rank: "MAJ",
    role: "Colonel",
    unit: "2nd Battalion",
    status: "active",
    callsign: "Eagle-6",
    joinDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
  };

  // Create MP
  const mp: InsertUser = {
    discordId: "111222333",
    discordUsername: "mp_johnson",
    firstName: "Sarah",
    lastName: "Johnson",
    rank: "SGT",
    role: "MP",
    unit: "Military Police",
    status: "active",
    callsign: "Charlie-5",
    joinDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  };

  // Create soldiers
  const soldiers: InsertUser[] = [
    {
      discordId: "444555666",
      discordUsername: "soldier_wilson",
      firstName: "David",
      lastName: "Wilson",
      rank: "CPL",
      role: "Soldier",
      unit: "Alpha Company",
      status: "active",
      callsign: "Alpha-1",
      joinDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      discordId: "777888999",
      discordUsername: "soldier_brown",
      firstName: "Emily",
      lastName: "Brown",
      rank: "SPC",
      role: "Soldier",
      unit: "Bravo Company",
      status: "active",
      callsign: "Bravo-2",
      joinDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      discordId: "222333444",
      discordUsername: "soldier_martinez",
      firstName: "Carlos",
      lastName: "Martinez",
      rank: "PFC",
      role: "Soldier",
      unit: "Charlie Company",
      status: "active",
      callsign: "Charlie-3",
      joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      discordId: "333444555",
      discordUsername: "soldier_garcia",
      firstName: "Maria",
      lastName: "Garcia",
      rank: "PV2",
      role: "Soldier",
      unit: "Delta Company",
      status: "active",
      callsign: "Delta-4",
      joinDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      discordId: "666777888",
      discordUsername: "soldier_lee",
      firstName: "James",
      lastName: "Lee",
      rank: "PV1",
      role: "Soldier",
      unit: "Echo Company",
      status: "active",
      joinDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Create all users
  await storage.createUser(admin);
  await storage.createUser(general);
  await storage.createUser(colonel);
  await storage.createUser(mp);
  
  for (const soldier of soldiers) {
    await storage.createUser(soldier);
  }

  // Create some units
  await storage.createUnit({
    name: "1st Division",
    abbreviation: "1ST DIV",
    description: "Primary combat division",
    commanderId: (await storage.getUserByDiscordId("987654321"))!.id
  });

  await storage.createUnit({
    name: "2nd Battalion",
    abbreviation: "2ND BN",
    description: "Infantry battalion",
    commanderId: (await storage.getUserByDiscordId("555666777"))!.id
  });

  console.log("Database seeded successfully!");
  console.log("\nTest Users:");
  console.log("  Admin:   Discord ID: 123456789 (John Smith)");
  console.log("  General: Discord ID: 987654321 (Robert Jackson)");
  console.log("  Colonel: Discord ID: 555666777 (Michael Davis)");
  console.log("  MP:      Discord ID: 111222333 (Sarah Johnson)");
  console.log("  Soldier: Discord ID: 444555666 (David Wilson)");
  console.log("\nUse these Discord IDs to log in!");
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
