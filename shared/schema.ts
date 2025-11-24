import { z } from "zod";

// ============================================================================
// MILITARY RANKS CONSTANTS
// ============================================================================

export const ENLISTED_RANKS = [
  { code: "PV1", name: "Private", level: 1 },
  { code: "PV2", name: "Private", level: 2 },
  { code: "PFC", name: "Private First Class", level: 3 },
  { code: "SPC", name: "Specialist", level: 4 },
  { code: "CPL", name: "Corporal", level: 4 },
  { code: "SGT", name: "Sergeant", level: 5 },
  { code: "SSG", name: "Staff Sergeant", level: 6 },
  { code: "SFC", name: "Sergeant First Class", level: 7 },
  { code: "MSG", name: "Master Sergeant", level: 8 },
  { code: "1SG", name: "First Sergeant", level: 8 },
  { code: "SGM", name: "Sergeant Major", level: 9 },
  { code: "CSM", name: "Command Sergeant Major", level: 9 },
  { code: "SMA", name: "Sergeant Major of the Army", level: 10 }
] as const;

export const WARRANT_RANKS = [
  { code: "WO1", name: "Warrant Officer 1", level: 11 },
  { code: "CW2", name: "Chief Warrant Officer 2", level: 12 },
  { code: "CW3", name: "Chief Warrant Officer 3", level: 13 },
  { code: "CW4", name: "Chief Warrant Officer 4", level: 14 },
  { code: "CW5", name: "Chief Warrant Officer 5", level: 15 }
] as const;

export const OFFICER_RANKS = [
  { code: "2LT", name: "Second Lieutenant", level: 16 },
  { code: "1LT", name: "First Lieutenant", level: 17 },
  { code: "CPT", name: "Captain", level: 18 },
  { code: "MAJ", name: "Major", level: 19 },
  { code: "LTC", name: "Lieutenant Colonel", level: 20 },
  { code: "COL", name: "Colonel", level: 21 },
  { code: "BG", name: "Brigadier General", level: 22 },
  { code: "MG", name: "Major General", level: 23 },
  { code: "LTG", name: "Lieutenant General", level: 24 },
  { code: "GEN", name: "General", level: 25 },
  { code: "GA", name: "General of the Army", level: 26 }
] as const;

export const ALL_RANKS = [...ENLISTED_RANKS, ...WARRANT_RANKS, ...OFFICER_RANKS];

export type RankCode = typeof ALL_RANKS[number]['code'];

export const RANK_CODES = ALL_RANKS.map(r => r.code);

// ============================================================================
// ROLE SYSTEM
// ============================================================================

export const USER_ROLES = ["Soldier", "MP", "Colonel", "General", "Admin"] as const;
export type UserRole = typeof USER_ROLES[number];

export const ROLE_PERMISSIONS = {
  Soldier: [
    "view_own_profile",
    "view_own_duty",
    "view_own_disciplinary",
    "view_own_promotions",
    "duty_on_off"
  ],
  MP: [
    "view_own_profile",
    "view_own_duty",
    "view_all_disciplinary",
    "create_disciplinary",
    "update_disciplinary",
    "revoke_disciplinary",
    "view_unit_reports",
    "duty_on_off"
  ],
  Colonel: [
    "view_own_profile",
    "view_own_duty",
    "view_all_disciplinary",
    "create_disciplinary",
    "update_disciplinary",
    "revoke_disciplinary",
    "view_unit_reports",
    "view_all_reports",
    "duty_on_off"
  ],
  General: [
    "view_own_profile",
    "view_own_duty",
    "view_all_disciplinary",
    "create_disciplinary",
    "update_disciplinary",
    "revoke_disciplinary",
    "promote",
    "demote",
    "view_all_reports",
    "manage_merit_points",
    "override_disciplinary",
    "view_audit_logs",
    "duty_on_off"
  ],
  Admin: [
    "manage_users",
    "manage_roles_map",
    "manage_units",
    "export_import_json",
    "configure_bot",
    "view_audit_logs",
    "view_all_reports",
    "view_all_disciplinary"
  ]
} as const;

// ============================================================================
// USER SCHEMA
// ============================================================================

export const userSchema = z.object({
  id: z.string(),
  discordId: z.string(),
  discordUsername: z.string(),
  robloxUserId: z.string().optional(),
  robloxUsername: z.string().optional(),
  firstName: z.string(),
  lastName: z.string(),
  callsign: z.string().optional(),
  rank: z.enum(RANK_CODES as [string, ...string[]]),
  role: z.enum(USER_ROLES),
  unit: z.string(),
  mos: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  joinDate: z.string(),
  lastActivity: z.string().optional(),
  meritPoints: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const insertUserSchema = userSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// ============================================================================
// DUTY LOG SCHEMA
// ============================================================================

export const dutyLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  duration: z.number().optional(),
  createdAt: z.string()
});

export const insertDutyLogSchema = dutyLogSchema.omit({ id: true, createdAt: true });

export type DutyLog = z.infer<typeof dutyLogSchema>;
export type InsertDutyLog = z.infer<typeof insertDutyLogSchema>;

// ============================================================================
// DISCIPLINARY RECORD SCHEMA
// ============================================================================

export const disciplinaryRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  issuedBy: z.string(),
  reason: z.string(),
  category: z.enum(["minor", "moderate", "severe"]),
  status: z.enum(["active", "appealed", "closed"]),
  evidence: z.array(z.string()).optional(),
  notes: z.string().optional(),
  date: z.string(),
  version: z.number().default(1),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const insertDisciplinaryRecordSchema = disciplinaryRecordSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  version: true 
});

export type DisciplinaryRecord = z.infer<typeof disciplinaryRecordSchema>;
export type InsertDisciplinaryRecord = z.infer<typeof insertDisciplinaryRecordSchema>;

// ============================================================================
// PROMOTION SCHEMA
// ============================================================================

export const promotionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fromRank: z.enum(RANK_CODES as [string, ...string[]]),
  toRank: z.enum(RANK_CODES as [string, ...string[]]),
  approvedBy: z.string(),
  reason: z.string().optional(),
  date: z.string(),
  version: z.number().default(1),
  createdAt: z.string()
});

export const insertPromotionSchema = promotionSchema.omit({ id: true, createdAt: true, version: true });

export type Promotion = z.infer<typeof promotionSchema>;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;

// ============================================================================
// MERIT POINT TRANSACTION SCHEMA
// ============================================================================

export const meritPointTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number(),
  reason: z.string(),
  issuedBy: z.string(),
  relatedMissionId: z.string().optional(),
  date: z.string(),
  createdAt: z.string()
});

export const insertMeritPointTransactionSchema = meritPointTransactionSchema.omit({ 
  id: true, 
  createdAt: true 
});

export type MeritPointTransaction = z.infer<typeof meritPointTransactionSchema>;
export type InsertMeritPointTransaction = z.infer<typeof insertMeritPointTransactionSchema>;

// ============================================================================
// MISSION SCHEMA
// ============================================================================

export const missionSchema = z.object({
  id: z.string(),
  title: z.string(),
  missionCode: z.string(),
  description: z.string(),
  commanderId: z.string(),
  participants: z.array(z.string()),
  date: z.string(),
  duration: z.number(),
  outcome: z.enum(["success", "partial", "failed"]),
  meritPointsAwarded: z.number().default(0),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const insertMissionSchema = missionSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type Mission = z.infer<typeof missionSchema>;
export type InsertMission = z.infer<typeof insertMissionSchema>;

// ============================================================================
// UNIT SCHEMA
// ============================================================================

export const unitSchema = z.object({
  id: z.string(),
  name: z.string(),
  abbreviation: z.string(),
  commanderId: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.string()
});

export const insertUnitSchema = unitSchema.omit({ id: true, createdAt: true });

export type Unit = z.infer<typeof unitSchema>;
export type InsertUnit = z.infer<typeof insertUnitSchema>;

// ============================================================================
// AUDIT LOG SCHEMA
// ============================================================================

export const auditLogSchema = z.object({
  id: z.string(),
  action: z.string(),
  performedBy: z.string(),
  targetUserId: z.string().optional(),
  targetResourceType: z.string().optional(),
  targetResourceId: z.string().optional(),
  previousValue: z.string().optional(),
  newValue: z.string().optional(),
  timestamp: z.string(),
  metadata: z.record(z.any()).optional()
});

export const insertAuditLogSchema = auditLogSchema.omit({ id: true });

export type AuditLog = z.infer<typeof auditLogSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
