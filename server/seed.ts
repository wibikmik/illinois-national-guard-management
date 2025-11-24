import { storage } from "./storage";
import type { InsertUser, InsertAward } from "@shared/schema";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  await storage.init();

  // Check if already seeded
  const existingUsers = await storage.getAllUsers();
  if (existingUsers.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database...");

  // Import bcrypt for password hashing
  const saltRounds = 12;

  // Create default admin user with known credentials
  const adminPassword = await bcrypt.hash("admin123", saltRounds);

  // Create admin user
  const admin = await storage.createUser({
    discordId: "000000000000000001",
    discordUsername: "admin",
    username: "admin",
    hashedPassword: adminPassword,
    firstName: "System",
    lastName: "Administrator",
    rank: "GEN",
    role: "Admin",
    unit: "HQ",
    status: "active",
    joinDate: new Date().toISOString()
  });

  // Create general (password: general123)
  const general: InsertUser = {
    discordId: "987654321",
    discordUsername: "gen_jackson",
    username: "gen_jackson",
    hashedPassword: await bcrypt.hash("general123", saltRounds),
    firstName: "Robert",
    lastName: "Jackson",
    rank: "COL",
    role: "General",
    unit: "1st Division",
    status: "active",
    callsign: "Havoc-1",
    joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  };

  // Create colonel (password: colonel123)
  const colonel: InsertUser = {
    discordId: "555666777",
    discordUsername: "col_davis",
    username: "col_davis",
    hashedPassword: await bcrypt.hash("colonel123", saltRounds),
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

  // Create Awards (US Army decorations)
  const awards: InsertAward[] = [
    // Valor decorations
    { name: "Medal of Honor", abbreviation: "MOH", category: "valor", precedence: 1, description: "Najwyższe odznaczenie wojskowe USA za waleczność w walce" },
    { name: "Distinguished Service Cross", abbreviation: "DSC", category: "valor", precedence: 2, description: "Drugie najwyższe odznaczenie za niezwykłą odwagę w walce" },
    { name: "Silver Star", abbreviation: "SS", category: "valor", precedence: 3, description: "Odznaczenie za waleczność w działaniach bojowych" },
    { name: "Bronze Star Medal", abbreviation: "BSM", category: "valor", precedence: 4, description: "Odznaczenie za heroizm lub zasługi w strefie działań bojowych" },
    { name: "Purple Heart", abbreviation: "PH", category: "valor", precedence: 5, description: "Odznaczenie za rany odniesione w walce" },
    
    // Achievement decorations
    { name: "Distinguished Service Medal", abbreviation: "DSM", category: "achievement", precedence: 10, description: "Za wyjątkowe zasługi dla rządu USA" },
    { name: "Legion of Merit", abbreviation: "LOM", category: "achievement", precedence: 11, description: "Za wyjątkowo zasłużoną służbę" },
    { name: "Meritorious Service Medal", abbreviation: "MSM", category: "achievement", precedence: 12, description: "Za zasługującą na wyróżnienie służbę" },
    { name: "Army Commendation Medal", abbreviation: "ARCOM", category: "achievement", precedence: 13, description: "Za wyróżniającą się służbę lub osiągnięcia" },
    { name: "Army Achievement Medal", abbreviation: "AAM", category: "achievement", precedence: 14, description: "Za wybitne osiągnięcia lub służbę" },
    
    // Service medals
    { name: "Army Good Conduct Medal", abbreviation: "AGCM", category: "service", precedence: 20, description: "Za wzorowe zachowanie, wydajność i wierność" },
    { name: "National Defense Service Medal", abbreviation: "NDSM", category: "service", precedence: 21, description: "Za służbę w okresie wojny" },
    { name: "Afghanistan Campaign Medal", abbreviation: "ACM", category: "campaign", precedence: 30, description: "Za służbę w Afganistanie" },
    { name: "Iraq Campaign Medal", abbreviation: "ICM", category: "campaign", precedence: 31, description: "Za służbę w Iraku" },
    
    // Skill badges
    { name: "Combat Infantryman Badge", abbreviation: "CIB", category: "skill_badge", precedence: 40, description: "Dla piechoty biorącej udział w walce" },
    { name: "Combat Action Badge", abbreviation: "CAB", category: "skill_badge", precedence: 41, description: "Za bezpośredni udział w walce" },
    { name: "Expert Infantryman Badge", abbreviation: "EIB", category: "skill_badge", precedence: 42, description: "Za umiejętności piechoty" },
    { name: "Parachutist Badge", abbreviation: "Airborne", category: "skill_badge", precedence: 43, description: "Za ukończenie szkolenia spadochronowego" },
    { name: "Air Assault Badge", abbreviation: "Air Assault", category: "skill_badge", precedence: 44, description: "Za ukończenie szkolenia Air Assault" },
    { name: "Ranger Tab", abbreviation: "Ranger", category: "skill_badge", precedence: 45, description: "Za ukończenie szkoły Ranger" }
  ];

  for (const award of awards) {
    await storage.createAward(award);
  }

  // Award some decorations to users
  const generalUser = await storage.getUserByDiscordId("987654321");
  const colonelUser = await storage.getUserByDiscordId("555666777");
  
  if (generalUser) {
    const allAwards = await storage.getAllAwards();
    const bronzeStar = allAwards.find(a => a.abbreviation === "BSM");
    const msmAward = allAwards.find(a => a.abbreviation === "MSM");
    const cabAward = allAwards.find(a => a.abbreviation === "CAB");
    
    if (bronzeStar) {
      await storage.createUserAward({
        userId: generalUser.id,
        awardId: bronzeStar.id,
        dateAwarded: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
        awardedBy: admin.id,
        vDevice: true,
        citation: "Za heroizm podczas operacji bojowej"
      });
    }
    
    if (msmAward) {
      await storage.createUserAward({
        userId: generalUser.id,
        awardId: msmAward.id,
        dateAwarded: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
        awardedBy: admin.id,
        oakLeafClusters: 2
      });
    }

    if (cabAward) {
      await storage.createUserAward({
        userId: generalUser.id,
        awardId: cabAward.id,
        dateAwarded: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        awardedBy: admin.id
      });
    }
  }

  console.log("Database seeded successfully!");
  console.log("\nTest Users:");
  console.log("  Admin:   Discord ID: 000000000000000001 (System Administrator) - Password: admin123");
  console.log("  General: Discord ID: 987654321 (Robert Jackson) - Password: general123");
  console.log("  Colonel: Discord ID: 555666777 (Michael Davis) - Password: colonel123");
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