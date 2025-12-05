import { db } from './db';
import { AppLog, LogLevel, TenantId } from '../types';

class LoggerService {
  private static instance: LoggerService;

  private constructor() {}

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  async log(
    level: LogLevel,
    message: string,
    origin: string,
    tenantId: TenantId,
    context?: object
  ) {
    const entry: AppLog = {
      tenantId,
      timestamp: Date.now(),
      level,
      message,
      origin,
      context: context ? JSON.stringify(context) : undefined,
    };

    try {
      await db.logs.add(entry);
      // Optional: console output for dev environment
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${level}] ${message}`, context);
      }
    } catch (e) {
      console.error("Critical: Failed to write to log DB", e);
    }
  }

  async getLogs(tenantId: TenantId, limit = 100) {
    return await db.logs
      .where('tenantId')
      .equals(tenantId)
      .reverse()
      .limit(limit)
      .toArray();
  }
}

export const logger = LoggerService.getInstance();