
export type TenantId = string;

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  ACTION = 'ACTION', // User Actions
}

export interface AppLog {
  id?: number;
  tenantId: TenantId;
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: string; // JSON string
  userId?: string;
  origin: string; // Component or Service name
}

export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME'
}

// Default categories (can be extended by user)
export enum DefaultCategory {
  FOOD = 'FOOD',
  TRANSPORT = 'TRANSPORT',
  HOUSING = 'HOUSING',
  ENTERTAINMENT = 'ENTERTAINMENT',
  HEALTH = 'HEALTH',
  SHOPPING = 'SHOPPING',
  SALARY = 'SALARY',
  INVESTMENT = 'INVESTMENT',
  FREELANCE = 'FREELANCE',
  OTHER = 'OTHER',
}

export type Theme = 'dark' | 'light';
export type Language = 'pt-BR' | 'en-US';
export type Currency = 'BRL' | 'USD' | 'EUR' | 'GBP';

export interface Category {
  id: string;
  tenantId: TenantId;
  name: string; // User defined name
  type: TransactionType;
  isCustom: boolean;
}

// Domain Entity (Decrypted, used in UI/Store)
export interface Transaction {
  id?: string; // UUID
  tenantId: TenantId;
  amount: number;
  description: string;
  categoryId: string; 
  categoryName?: string; 
  type: TransactionType;
  date: number; // Unix timestamp
  createdAt: number;
  synced: boolean;
  currency: Currency;
  userId?: string; 
}

// Database Entity (Encrypted)
export interface EncryptedTransaction extends Omit<Transaction, 'amount' | 'description'> {
  amount: string; // Ciphertext
  description: string; // Ciphertext
  isEncrypted: true;
}

export interface DateFilter {
  month: number; // 0-11
  year: number;
}

// --- NEW FAMILY FEATURES TYPES ---

export enum UserRole {
  ADMIN = 'ADMIN', // Father/Mother
  MEMBER = 'MEMBER' // Children
}

export interface UserProfile {
  id: string;
  tenantId: TenantId;
  name: string;
  role: UserRole;
  pin: string; // Simple 4 digit pin
  avatar: string; // Emoji or Initials
  createdAt: number;
}

export enum TaskType {
  EVENT = 'EVENT', // Calendar Event
  TODO = 'TODO', // One-time task
  DAILY = 'DAILY' // Resets every day
}

export interface Task {
  id?: string;
  tenantId: TenantId;
  title: string;
  description?: string;
  date: number; // Due date or Event date
  isCompleted: boolean;
  assignedTo: string; // UserProfile ID
  createdBy: string; // UserProfile ID
  type: TaskType;
  createdAt: number;
}
