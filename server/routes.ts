import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import {
  insertUserSchema,
  insertDutyLogSchema,
  insertDisciplinaryRecordSchema,
  insertPromotionSchema,
  insertMeritPointTransactionSchema,
  insertMissionSchema,
  RankCode,
  ROLE_PERMISSIONS,
  ALL_RANKS,
  type User
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";

// ============================================================================
// MIDDLEWARE
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Rate limiter for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: { error: "Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Login body validation schema
const loginBodySchema = z.object({
  username: z.string().min(1, "Nazwa użytkownika jest wymagana").trim(),
  password: z.string().min(1, "Hasło jest wymagane")
});

// Simple auth middleware - checks if user exists in session/storage
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(401).json({ error: "Invalid user" });
  }

  req.user = user;
  next();
}

function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const permissions = ROLE_PERMISSIONS[req.user.role] || [];
    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

// Audit logging middleware
async function createAudit(
  performedBy: string,
  action: string,
  targetResourceType?: string,
  targetResourceId?: string,
  previousValue?: string,
  newValue?: string
) {
  try {
    await storage.createAuditLog({
      performedBy,
      action,
      targetResourceType,
      targetResourceId,
      previousValue,
      newValue,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

// ============================================================================
// ROUTES
// ============================================================================

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize storage
  await storage.init();
  
  // Seed database with test data
  await seedDatabase();

  // Start Discord bot (if token is configured)
  if (process.env.DISCORD_BOT_TOKEN) {
    try {
      const { startDiscordBot } = await import("./discord/index");
      await startDiscordBot();
      console.log("✅ Discord bot started successfully");
    } catch (error) {
      console.error("❌ Failed to start Discord bot:", error);
      console.error("Bot will not be available. Check DISCORD_BOT_TOKEN configuration.");
    }
  } else {
    console.log("⚠️  DISCORD_BOT_TOKEN not configured - Discord bot will not start");
  }

  // ============================================================================
  // AUTH ROUTES
  // ============================================================================

  app.post("/api/auth/reset-password", requireAuth, requirePermission("reset_passwords"), async (req: Request, res: Response) => {
    try {
      const { userId, newPassword } = req.body;
      
      if (!userId || !newPassword) {
        return res.status(400).json({ error: "User ID and new password required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await storage.updateUser(userId, { hashedPassword });

      await createAudit(
        req.user!.id,
        "password_reset",
        "user",
        userId
      );

      return res.json({ success: true, message: "Password reset successfully" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", loginLimiter, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validation = loginBodySchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }

      const { username, password } = validation.data;

      // Find user by username (case-insensitive)
      const allUsers = await storage.getAllUsers();
      const user = allUsers.find(u => u.username?.toLowerCase() === username.toLowerCase());
      
      if (!user) {
        await createAudit("system", "failed_login_attempt_unknown_user", "user", undefined, undefined, username);
        return res.status(401).json({ error: "Nieprawidłowa nazwa użytkownika lub hasło" });
      }

      // Check if user has password set
      if (!user.hashedPassword) {
        await createAudit(user.id, "failed_login_attempt_no_password");
        return res.status(401).json({ error: "Konto nie ma ustawionego hasła. Skontaktuj się z administratorem." });
      }

      // Check if user is active
      if (user.status !== "active") {
        await createAudit(user.id, "failed_login_attempt_inactive_user");
        return res.status(403).json({ error: "Konto jest nieaktywne. Skontaktuj się z administratorem." });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.hashedPassword);
      
      if (!isValidPassword) {
        await createAudit(user.id, "failed_login_attempt");
        return res.status(401).json({ error: "Nieprawidłowa nazwa użytkownika lub hasło" });
      }

      // Update last activity
      await storage.updateUser(user.id, {
        lastActivity: new Date().toISOString()
      });

      await createAudit(user.id, "user_login");

      // Don't send password hash to client
      const { hashedPassword, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Wystąpił błąd podczas logowania. Spróbuj ponownie później." });
    }
  });

  // ============================================================================
  // USER ROUTES
  // ============================================================================

  app.get("/api/users", requireAuth, requirePermission("manage_users"), async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      return res.json(users);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/users/:id", requireAuth, requirePermission("modify_all_users"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { password, ...updates } = req.body;

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Hash password if provided
      if (password) {
        const saltRounds = 12;
        updates.hashedPassword = await bcrypt.hash(password, saltRounds);
      }

      const updatedUser = await storage.updateUser(id, updates);

      await createAudit(
        req.user!.id,
        "user_updated",
        "user",
        id,
        JSON.stringify(user),
        JSON.stringify(updates)
      );

      // Don't send password hash to client
      const { hashedPassword: _, ...userWithoutPassword } = updatedUser;
      return res.json(userWithoutPassword);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", requireAuth, requirePermission("manage_users"), async (req: Request, res: Response) => {
    try {
      const { password, ...userData } = req.body;
      
      // Hash password if provided
      let hashedPassword: string | undefined;
      if (password) {
        const saltRounds = 12;
        hashedPassword = await bcrypt.hash(password, saltRounds);
      }

      const result = insertUserSchema.safeParse({
        ...userData,
        hashedPassword
      });
      
      if (!result.success) {
        const error = fromZodError(result.error);
        return res.status(400).json({ error: error.message });
      }

      const user = await storage.createUser(result.data);

      await createAudit(
        req.user!.id,
        "user_created",
        "user",
        user.id
      );

      // Don't send password hash to client
      const { hashedPassword: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // DUTY ROUTES
  // ============================================================================

  app.get("/api/duty/current", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentDuty = await storage.getCurrentDutyLog(req.user!.id);
      return res.json(currentDuty);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/duty/active", requireAuth, async (req: Request, res: Response) => {
    try {
      const activeLogs = await storage.getAllActiveDutyLogs();
      const usersMap = new Map<string, User>();
      
      const users = await storage.getAllUsers();
      users.forEach(u => usersMap.set(u.id, u));

      const result = activeLogs.map(duty => ({
        user: usersMap.get(duty.userId)!,
        duty
      })).filter(item => item.user);

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/duty/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const logs = await storage.getDutyLogsByUser(req.user!.id);
      return res.json(logs);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/duty/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const logs = await storage.getDutyLogsByUser(req.user!.id);
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const calculateHours = (logs: any[], startDate: Date) => {
        return Math.round(
          logs
            .filter(log => new Date(log.startTime) >= startDate && log.duration !== undefined)
            .reduce((sum, log) => sum + (log.duration || 0), 0) / 60
        );
      };

      return res.json({
        todayHours: calculateHours(logs, todayStart),
        weekHours: calculateHours(logs, weekStart),
        monthHours: calculateHours(logs, monthStart)
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/duty/on", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentDuty = await storage.getCurrentDutyLog(req.user!.id);
      
      if (currentDuty && !currentDuty.endTime) {
        return res.status(400).json({ error: "Already on duty" });
      }

      const dutyLog = await storage.createDutyLog({
        userId: req.user!.id,
        startTime: new Date().toISOString()
      });

      await createAudit(req.user!.id, "duty_started", "duty_log", dutyLog.id);

      return res.json(dutyLog);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/duty/off", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentDuty = await storage.getCurrentDutyLog(req.user!.id);
      
      if (!currentDuty || currentDuty.endTime) {
        return res.status(400).json({ error: "Not currently on duty" });
      }

      const endTime = new Date().toISOString();
      const duration = Math.floor(
        (new Date(endTime).getTime() - new Date(currentDuty.startTime).getTime()) / 60000
      );

      const updatedLog = await storage.updateDutyLog(currentDuty.id, {
        endTime,
        duration
      });

      await createAudit(
        req.user!.id,
        "duty_ended",
        "duty_log",
        currentDuty.id,
        undefined,
        `${duration} minutes`
      );

      return res.json(updatedLog);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // DISCIPLINARY ROUTES
  // ============================================================================

  app.get("/api/disciplinary", requireAuth, requirePermission("view_all_disciplinary"), async (req: Request, res: Response) => {
    try {
      const records = await storage.getAllDisciplinaryRecords();
      const usersMap = new Map<string, User>();
      
      const users = await storage.getAllUsers();
      users.forEach(u => usersMap.set(u.id, u));

      const result = records.map(record => ({
        ...record,
        userName: usersMap.get(record.userId)
          ? `${usersMap.get(record.userId)!.firstName} ${usersMap.get(record.userId)!.lastName}`
          : "Unknown"
      }));

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/disciplinary", requireAuth, requirePermission("create_disciplinary"), async (req: Request, res: Response) => {
    try {
      const result = insertDisciplinaryRecordSchema.safeParse(req.body);
      
      if (!result.success) {
        const error = fromZodError(result.error);
        return res.status(400).json({ error: error.message });
      }

      const record = await storage.createDisciplinaryRecord(result.data);

      await createAudit(
        req.user!.id,
        "disciplinary_created",
        "disciplinary_record",
        record.id,
        undefined,
        record.reason
      );

      return res.json(record);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // PROMOTION ROUTES
  // ============================================================================

  app.get("/api/promotions", requireAuth, requirePermission("promote"), async (req: Request, res: Response) => {
    try {
      const promotions = await storage.getAllPromotions();
      const usersMap = new Map<string, User>();
      
      const users = await storage.getAllUsers();
      users.forEach(u => usersMap.set(u.id, u));

      const result = promotions.map(promo => ({
        ...promo,
        userName: usersMap.get(promo.userId)
          ? `${usersMap.get(promo.userId)!.firstName} ${usersMap.get(promo.userId)!.lastName}`
          : "Unknown"
      }));

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/promotions/eligibility/:userId", requireAuth, requirePermission("promote"), async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const reasons: string[] = [];
      let eligible = true;

      // Check merit points (example: minimum 50 points required)
      if (user.meritPoints < 50) {
        eligible = false;
        reasons.push(`Insufficient merit points (${user.meritPoints}/50 required)`);
      }

      // Check for active severe disciplinary records
      const disciplinary = await storage.getDisciplinaryRecordsByUser(userId);
      const activeSevere = disciplinary.filter(d => d.status === "active" && d.category === "severe");
      
      if (activeSevere.length > 0) {
        eligible = false;
        reasons.push("Has active severe disciplinary records");
      }

      if (eligible) {
        reasons.push("All requirements met");
      }

      return res.json({ userId, eligible, reasons });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/promotions", requireAuth, requirePermission("promote"), async (req: Request, res: Response) => {
    try {
      const { userId, toRank, reason } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Validate rank exists
      const currentRankInfo = ALL_RANKS.find(r => r.code === user.rank);
      const targetRankInfo = ALL_RANKS.find(r => r.code === toRank);
      
      if (!currentRankInfo || !targetRankInfo) {
        return res.status(400).json({ error: "Invalid rank" });
      }

      // Prevent "promoting" to a lower rank (use demotion for that)
      if (targetRankInfo.level <= currentRankInfo.level) {
        return res.status(400).json({ error: "Cannot promote to same or lower rank" });
      }

      // Create promotion record
      const promotion = await storage.createPromotion({
        userId,
        fromRank: user.rank,
        toRank: toRank as RankCode,
        approvedBy: req.user!.id,
        reason,
        date: new Date().toISOString()
      });

      // Update user rank
      await storage.updateUser(userId, { rank: toRank as RankCode });

      await createAudit(
        req.user!.id,
        "promotion_approved",
        "promotion",
        promotion.id,
        user.rank,
        toRank
      );

      return res.json(promotion);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // MERIT POINTS ROUTES
  // ============================================================================

  app.get("/api/merit-points", requireAuth, async (req: Request, res: Response) => {
    try {
      const transactions = hasPermission("manage_merit_points")
        ? await storage.getAllMeritPointTransactions()
        : await storage.getMeritPointTransactionsByUser(req.user!.id);

      const usersMap = new Map<string, User>();
      const users = await storage.getAllUsers();
      users.forEach(u => usersMap.set(u.id, u));

      const result = transactions.map(txn => ({
        ...txn,
        userName: usersMap.get(txn.userId)
          ? `${usersMap.get(txn.userId)!.firstName} ${usersMap.get(txn.userId)!.lastName}`
          : "Unknown"
      }));

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }

    function hasPermission(permission: string): boolean {
      if (!req.user) return false;
      const permissions = ROLE_PERMISSIONS[req.user.role] || [];
      return permissions.includes(permission);
    }
  });

  app.get("/api/merit-points/leaderboard", requireAuth, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const leaderboard = users
        .filter(u => u.status === "active")
        .sort((a, b) => b.meritPoints - a.meritPoints)
        .map(u => ({
          userId: u.id,
          userName: `${u.firstName} ${u.lastName}`,
          rank: u.rank,
          points: u.meritPoints
        }));

      return res.json(leaderboard);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/merit-points", requireAuth, requirePermission("manage_merit_points"), async (req: Request, res: Response) => {
    try {
      const { userId, amount, reason } = req.body;
      
      if (!userId || amount === undefined || !reason) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const transaction = await storage.createMeritPointTransaction({
        userId,
        amount: parseInt(amount),
        reason,
        awardedBy: req.user!.id,
        date: new Date().toISOString()
      });

      // Update user's merit points
      const newTotal = user.meritPoints + parseInt(amount);
      await storage.updateUser(userId, { meritPoints: newTotal });

      await createAudit(
        req.user!.id,
        "merit_points_awarded",
        "merit_transaction",
        transaction.id,
        user.meritPoints.toString(),
        newTotal.toString()
      );

      return res.json(transaction);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // MISSION ROUTES
  // ============================================================================

  app.get("/api/missions", requireAuth, requirePermission("view_all_reports"), async (req: Request, res: Response) => {
    try {
      const missions = await storage.getAllMissions();
      const usersMap = new Map<string, User>();
      
      const users = await storage.getAllUsers();
      users.forEach(u => usersMap.set(u.id, u));

      const result = missions.map(mission => ({
        ...mission,
        commanderName: usersMap.get(mission.commanderId)
          ? `${usersMap.get(mission.commanderId)!.firstName} ${usersMap.get(mission.commanderId)!.lastName}`
          : "Unknown"
      }));

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/missions", requireAuth, requirePermission("view_all_reports"), async (req: Request, res: Response) => {
    try {
      const missionData = {
        ...req.body,
        commanderId: req.user!.id,
        date: new Date().toISOString()
      };

      const result = insertMissionSchema.safeParse(missionData);
      
      if (!result.success) {
        const error = fromZodError(result.error);
        return res.status(400).json({ error: error.message });
      }

      const mission = await storage.createMission(result.data);

      await createAudit(
        req.user!.id,
        "mission_created",
        "mission",
        mission.id,
        undefined,
        mission.title
      );

      return res.json(mission);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // UNIT ROUTES
  // ============================================================================

  app.get("/api/units", requireAuth, async (req: Request, res: Response) => {
    try {
      const units = await storage.getAllUnits();
      return res.json(units);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // AUDIT ROUTES
  // ============================================================================

  app.get("/api/audit", requireAuth, requirePermission("view_audit_logs"), async (req: Request, res: Response) => {
    try {
      const logs = await storage.getAllAuditLogs();
      const usersMap = new Map<string, User>();
      
      const users = await storage.getAllUsers();
      users.forEach(u => usersMap.set(u.id, u));

      const result = logs.map(log => ({
        ...log,
        performedByName: usersMap.get(log.performedBy)
          ? `${usersMap.get(log.performedBy)!.firstName} ${usersMap.get(log.performedBy)!.lastName}`
          : "Unknown"
      })).reverse();

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================

  app.get("/api/admin/stats", requireAuth, requirePermission("manage_users"), async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const dutyLogs = await storage.getAllActiveDutyLogs();
      const disciplinary = await storage.getAllDisciplinaryRecords();
      const promotions = await storage.getAllPromotions();

      return res.json({
        totalUsers: users.length,
        totalDutyLogs: dutyLogs.length,
        totalDisciplinary: disciplinary.length,
        totalPromotions: promotions.length
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/export", requireAuth, requirePermission("manage_users"), async (req: Request, res: Response) => {
    try {
      // Return full database export
      const data = {
        users: await storage.getAllUsers(),
        dutyLogs: await storage.getDutyLogsByUser(req.user!.id),
        disciplinary: await storage.getAllDisciplinaryRecords(),
        promotions: await storage.getAllPromotions(),
        meritPoints: await storage.getAllMeritPointTransactions(),
        missions: await storage.getAllMissions(),
        units: await storage.getAllUnits(),
        auditLogs: await storage.getAllAuditLogs()
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=ing-backup.json");
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // AWARDS ROUTES
  // ============================================================================

  // Get all awards (catalog)
  app.get("/api/awards", requireAuth, async (req: Request, res: Response) => {
    try {
      const awards = await storage.getAllAwards();
      return res.json(awards);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Get user's awards
  app.get("/api/users/:userId/awards", requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const userAwards = await storage.getUserAwardsByUser(userId);
      
      // Enrich with award details
      const awards = await storage.getAllAwards();
      const awardsMap = new Map(awards.map(a => [a.id, a]));
      
      const enrichedAwards = userAwards.map(ua => ({
        ...ua,
        award: awardsMap.get(ua.awardId)
      }));

      return res.json(enrichedAwards);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Award a decoration to a user (Admin/General only)
  app.post("/api/users/:userId/awards", requireAuth, requirePermission("manage_merit_points"), async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const validation = z.object({
        awardId: z.string(),
        dateAwarded: z.string().optional(),
        oakLeafClusters: z.number().default(0),
        vDevice: z.boolean().default(false),
        cDevice: z.boolean().default(false),
        citation: z.string().optional()
      }).safeParse(req.body);

      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }

      const data = validation.data;
      const userAward = await storage.createUserAward({
        userId,
        awardId: data.awardId,
        dateAwarded: data.dateAwarded || new Date().toISOString(),
        awardedBy: req.user!.id,
        oakLeafClusters: data.oakLeafClusters,
        vDevice: data.vDevice,
        cDevice: data.cDevice,
        citation: data.citation
      });

      await createAudit(
        req.user!.id,
        "award_granted",
        "user_award",
        userAward.id,
        undefined,
        JSON.stringify({ userId, awardId: data.awardId })
      );

      return res.status(201).json(userAward);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Revoke an award (Admin only)
  app.delete("/api/user-awards/:userAwardId", requireAuth, requirePermission("manage_merit_points"), async (req: Request, res: Response) => {
    try {
      const { userAwardId } = req.params;
      
      const userAward = await storage.getUserAward(userAwardId);
      if (!userAward) {
        return res.status(404).json({ error: "User award not found" });
      }

      await storage.revokeUserAward(userAwardId);

      await createAudit(
        req.user!.id,
        "award_revoked",
        "user_award",
        userAwardId,
        JSON.stringify(userAward),
        undefined
      );

      return res.json({ success: true, message: "Award revoked successfully" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // DASHBOARD ROUTES
  // ============================================================================

  app.get("/api/dashboard/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const activeDuty = await storage.getAllActiveDutyLogs();
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const promotions = await storage.getAllPromotions();
      const recentPromotions = promotions.filter(p => new Date(p.date) >= thirtyDaysAgo);

      const disciplinary = await storage.getAllDisciplinaryRecords();
      const pending = disciplinary.filter(d => d.status === "active");

      return res.json({
        totalPersonnel: users.length,
        activeOnDuty: activeDuty.length,
        recentPromotions: recentPromotions.length,
        pendingDisciplinary: pending.length
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/dashboard/activity", requireAuth, async (req: Request, res: Response) => {
    try {
      const activity: Array<{
        type: "promotion" | "disciplinary" | "duty";
        title: string;
        description: string;
        time: string;
      }> = [];

      // Get recent promotions
      const promotions = await storage.getAllPromotions();
      const users = await storage.getAllUsers();
      const usersMap = new Map<string, User>();
      users.forEach(u => usersMap.set(u.id, u));

      promotions.slice(-5).forEach(promo => {
        const user = usersMap.get(promo.userId);
        if (user) {
          activity.push({
            type: "promotion",
            title: "Promotion",
            description: `${user.firstName} ${user.lastName} promoted to ${promo.toRank}`,
            time: promo.date
          });
        }
      });

      // Sort by time and return latest 10
      activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      return res.json(activity.slice(0, 10));
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
