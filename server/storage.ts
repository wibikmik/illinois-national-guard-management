import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type {
  User,
  InsertUser,
  DutyLog,
  InsertDutyLog,
  DisciplinaryRecord,
  InsertDisciplinaryRecord,
  Promotion,
  InsertPromotion,
  MeritPointTransaction,
  InsertMeritPointTransaction,
  Mission,
  InsertMission,
  Unit,
  InsertUnit,
  AuditLog,
  InsertAuditLog,
  Award,
  InsertAward,
  UserAward,
  InsertUserAward
} from "@shared/schema";

// ============================================================================
// STORAGE INTERFACE
// ============================================================================

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Duty Logs
  getDutyLog(id: string): Promise<DutyLog | undefined>;
  getCurrentDutyLog(userId: string): Promise<DutyLog | null>;
  getDutyLogsByUser(userId: string): Promise<DutyLog[]>;
  getAllActiveDutyLogs(): Promise<DutyLog[]>;
  createDutyLog(log: InsertDutyLog): Promise<DutyLog>;
  updateDutyLog(id: string, updates: Partial<DutyLog>): Promise<DutyLog>;
  
  // Disciplinary Records
  getDisciplinaryRecord(id: string): Promise<DisciplinaryRecord | undefined>;
  getDisciplinaryRecordsByUser(userId: string): Promise<DisciplinaryRecord[]>;
  getAllDisciplinaryRecords(): Promise<DisciplinaryRecord[]>;
  createDisciplinaryRecord(record: InsertDisciplinaryRecord): Promise<DisciplinaryRecord>;
  updateDisciplinaryRecord(id: string, updates: Partial<DisciplinaryRecord>): Promise<DisciplinaryRecord>;
  
  // Promotions
  getPromotion(id: string): Promise<Promotion | undefined>;
  getPromotionsByUser(userId: string): Promise<Promotion[]>;
  getAllPromotions(): Promise<Promotion[]>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  
  // Merit Points
  getMeritPointTransaction(id: string): Promise<MeritPointTransaction | undefined>;
  getMeritPointTransactionsByUser(userId: string): Promise<MeritPointTransaction[]>;
  getAllMeritPointTransactions(): Promise<MeritPointTransaction[]>;
  createMeritPointTransaction(transaction: InsertMeritPointTransaction): Promise<MeritPointTransaction>;
  
  // Missions
  getMission(id: string): Promise<Mission | undefined>;
  getAllMissions(): Promise<Mission[]>;
  createMission(mission: InsertMission): Promise<Mission>;
  updateMission(id: string, updates: Partial<Mission>): Promise<Mission>;
  
  // Units
  getUnit(id: string): Promise<Unit | undefined>;
  getAllUnits(): Promise<Unit[]>;
  createUnit(unit: InsertUnit): Promise<Unit>;
  
  // Audit Logs
  getAuditLog(id: string): Promise<AuditLog | undefined>;
  getAllAuditLogs(): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  
  // Awards (catalog)
  getAward(id: string): Promise<Award | undefined>;
  getAllAwards(): Promise<Award[]>;
  createAward(award: InsertAward): Promise<Award>;
  
  // User Awards
  getUserAward(id: string): Promise<UserAward | undefined>;
  getUserAwardsByUser(userId: string): Promise<UserAward[]>;
  getAllUserAwards(): Promise<UserAward[]>;
  createUserAward(userAward: InsertUserAward): Promise<UserAward>;
  updateUserAward(id: string, updates: Partial<UserAward>): Promise<UserAward>;
  revokeUserAward(id: string): Promise<void>;
}

// ============================================================================
// JSON FILE STORAGE IMPLEMENTATION
// ============================================================================

const DATA_DIR = path.join(process.cwd(), "data");

interface Database {
  users: User[];
  dutyLogs: DutyLog[];
  disciplinaryRecords: DisciplinaryRecord[];
  promotions: Promotion[];
  meritPointTransactions: MeritPointTransaction[];
  missions: Mission[];
  units: Unit[];
  auditLogs: AuditLog[];
  awards: Award[];
  userAwards: UserAward[];
}

export class JsonStorage implements IStorage {
  private db: Database;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(DATA_DIR, "database.json");
    this.db = {
      users: [],
      dutyLogs: [],
      disciplinaryRecords: [],
      promotions: [],
      meritPointTransactions: [],
      missions: [],
      units: [],
      auditLogs: [],
      awards: [],
      userAwards: []
    };
  }

  async init() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      try {
        const data = await fs.readFile(this.dbPath, "utf-8");
        this.db = JSON.parse(data);
      } catch {
        await this.save();
      }
    } catch (error) {
      console.error("Failed to initialize JSON storage:", error);
    }
  }

  private async save() {
    await fs.writeFile(this.dbPath, JSON.stringify(this.db, null, 2));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.db.users.find(u => u.id === id);
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    return this.db.users.find(u => u.discordId === discordId);
  }

  async getAllUsers(): Promise<User[]> {
    return this.db.users;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: randomUUID(),
      meritPoints: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.db.users.push(user);
    await this.save();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const index = this.db.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error("User not found");
    
    this.db.users[index] = {
      ...this.db.users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.save();
    return this.db.users[index];
  }

  // Duty Logs
  async getDutyLog(id: string): Promise<DutyLog | undefined> {
    return this.db.dutyLogs.find(d => d.id === id);
  }

  async getCurrentDutyLog(userId: string): Promise<DutyLog | null> {
    const logs = this.db.dutyLogs.filter(d => d.userId === userId && !d.endTime);
    return logs.length > 0 ? logs[logs.length - 1] : null;
  }

  async getDutyLogsByUser(userId: string): Promise<DutyLog[]> {
    return this.db.dutyLogs
      .filter(d => d.userId === userId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async getAllActiveDutyLogs(): Promise<DutyLog[]> {
    return this.db.dutyLogs.filter(d => !d.endTime);
  }

  async createDutyLog(insertLog: InsertDutyLog): Promise<DutyLog> {
    const log: DutyLog = {
      ...insertLog,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    this.db.dutyLogs.push(log);
    await this.save();
    return log;
  }

  async updateDutyLog(id: string, updates: Partial<DutyLog>): Promise<DutyLog> {
    const index = this.db.dutyLogs.findIndex(d => d.id === id);
    if (index === -1) throw new Error("Duty log not found");
    
    this.db.dutyLogs[index] = { ...this.db.dutyLogs[index], ...updates };
    await this.save();
    return this.db.dutyLogs[index];
  }

  // Disciplinary Records
  async getDisciplinaryRecord(id: string): Promise<DisciplinaryRecord | undefined> {
    return this.db.disciplinaryRecords.find(d => d.id === id);
  }

  async getDisciplinaryRecordsByUser(userId: string): Promise<DisciplinaryRecord[]> {
    return this.db.disciplinaryRecords.filter(d => d.userId === userId);
  }

  async getAllDisciplinaryRecords(): Promise<DisciplinaryRecord[]> {
    return this.db.disciplinaryRecords;
  }

  async createDisciplinaryRecord(insertRecord: InsertDisciplinaryRecord): Promise<DisciplinaryRecord> {
    const record: DisciplinaryRecord = {
      ...insertRecord,
      id: randomUUID(),
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.db.disciplinaryRecords.push(record);
    await this.save();
    return record;
  }

  async updateDisciplinaryRecord(id: string, updates: Partial<DisciplinaryRecord>): Promise<DisciplinaryRecord> {
    const index = this.db.disciplinaryRecords.findIndex(d => d.id === id);
    if (index === -1) throw new Error("Disciplinary record not found");
    
    this.db.disciplinaryRecords[index] = {
      ...this.db.disciplinaryRecords[index],
      ...updates,
      version: this.db.disciplinaryRecords[index].version + 1,
      updatedAt: new Date().toISOString()
    };
    await this.save();
    return this.db.disciplinaryRecords[index];
  }

  // Promotions
  async getPromotion(id: string): Promise<Promotion | undefined> {
    return this.db.promotions.find(p => p.id === id);
  }

  async getPromotionsByUser(userId: string): Promise<Promotion[]> {
    return this.db.promotions.filter(p => p.userId === userId);
  }

  async getAllPromotions(): Promise<Promotion[]> {
    return this.db.promotions;
  }

  async createPromotion(insertPromotion: InsertPromotion): Promise<Promotion> {
    const promotion: Promotion = {
      ...insertPromotion,
      id: randomUUID(),
      version: 1,
      createdAt: new Date().toISOString()
    };
    this.db.promotions.push(promotion);
    await this.save();
    return promotion;
  }

  // Merit Points
  async getMeritPointTransaction(id: string): Promise<MeritPointTransaction | undefined> {
    return this.db.meritPointTransactions.find(m => m.id === id);
  }

  async getMeritPointTransactionsByUser(userId: string): Promise<MeritPointTransaction[]> {
    return this.db.meritPointTransactions.filter(m => m.userId === userId);
  }

  async getAllMeritPointTransactions(): Promise<MeritPointTransaction[]> {
    return this.db.meritPointTransactions;
  }

  async createMeritPointTransaction(insertTransaction: InsertMeritPointTransaction): Promise<MeritPointTransaction> {
    const transaction: MeritPointTransaction = {
      ...insertTransaction,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    this.db.meritPointTransactions.push(transaction);
    await this.save();
    return transaction;
  }

  // Missions
  async getMission(id: string): Promise<Mission | undefined> {
    return this.db.missions.find(m => m.id === id);
  }

  async getAllMissions(): Promise<Mission[]> {
    return this.db.missions;
  }

  async createMission(insertMission: InsertMission): Promise<Mission> {
    const mission: Mission = {
      ...insertMission,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.db.missions.push(mission);
    await this.save();
    return mission;
  }

  async updateMission(id: string, updates: Partial<Mission>): Promise<Mission> {
    const index = this.db.missions.findIndex(m => m.id === id);
    if (index === -1) throw new Error("Mission not found");
    
    this.db.missions[index] = {
      ...this.db.missions[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.save();
    return this.db.missions[index];
  }

  // Units
  async getUnit(id: string): Promise<Unit | undefined> {
    return this.db.units.find(u => u.id === id);
  }

  async getAllUnits(): Promise<Unit[]> {
    return this.db.units;
  }

  async createUnit(insertUnit: InsertUnit): Promise<Unit> {
    const unit: Unit = {
      ...insertUnit,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    this.db.units.push(unit);
    await this.save();
    return unit;
  }

  // Audit Logs
  async getAuditLog(id: string): Promise<AuditLog | undefined> {
    return this.db.auditLogs.find(a => a.id === id);
  }

  async getAllAuditLogs(): Promise<AuditLog[]> {
    return this.db.auditLogs;
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const log: AuditLog = {
      ...insertLog,
      id: randomUUID()
    };
    this.db.auditLogs.push(log);
    await this.save();
    return log;
  }

  // Awards
  async getAward(id: string): Promise<Award | undefined> {
    return this.db.awards.find(a => a.id === id);
  }

  async getAllAwards(): Promise<Award[]> {
    return this.db.awards.sort((a, b) => a.precedence - b.precedence);
  }

  async createAward(insertAward: InsertAward): Promise<Award> {
    const award: Award = {
      ...insertAward,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    this.db.awards.push(award);
    await this.save();
    return award;
  }

  // User Awards
  async getUserAward(id: string): Promise<UserAward | undefined> {
    return this.db.userAwards.find(ua => ua.id === id);
  }

  async getUserAwardsByUser(userId: string): Promise<UserAward[]> {
    return this.db.userAwards.filter(ua => ua.userId === userId);
  }

  async getAllUserAwards(): Promise<UserAward[]> {
    return this.db.userAwards;
  }

  async createUserAward(insertUserAward: InsertUserAward): Promise<UserAward> {
    const userAward: UserAward = {
      ...insertUserAward,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };
    this.db.userAwards.push(userAward);
    await this.save();
    return userAward;
  }

  async updateUserAward(id: string, updates: Partial<UserAward>): Promise<UserAward> {
    const index = this.db.userAwards.findIndex(ua => ua.id === id);
    if (index === -1) throw new Error("User award not found");
    
    this.db.userAwards[index] = {
      ...this.db.userAwards[index],
      ...updates
    };
    await this.save();
    return this.db.userAwards[index];
  }

  async revokeUserAward(id: string): Promise<void> {
    const index = this.db.userAwards.findIndex(ua => ua.id === id);
    if (index === -1) throw new Error("User award not found");
    this.db.userAwards.splice(index, 1);
    await this.save();
  }
}

export const storage = new JsonStorage();
