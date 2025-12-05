import { Dexie } from 'dexie';
import type { Table } from 'dexie';
import { AppLog, Transaction, EncryptedTransaction, Category, UserProfile, Task } from '../types';

export class FlashFinanceDB extends Dexie {
  // transactions table can hold both plain (legacy) or encrypted (new) types
  // We use 'any' in generic here to simplify the store logic, but conceptually it's Transaction | EncryptedTransaction
  transactions!: Table<any>; 
  categories!: Table<Category>;
  logs!: Table<AppLog>;
  profiles!: Table<UserProfile>;
  tasks!: Table<Task>;

  constructor() {
    super('FlashFinanceDB');
    
    // Schema definition
    this.version(1).stores({
      expenses: 'id, tenantId, date, category, synced',
      logs: '++id, tenantId, level, timestamp, origin'
    });

    this.version(2).stores({
      expenses: 'id, tenantId, date, category, synced, currency',
      logs: '++id, tenantId, level, timestamp, origin'
    });

    this.version(3).stores({
      expenses: 'id, tenantId, date, categoryId, type, synced, currency',
      categories: 'id, tenantId, type',
      logs: '++id, tenantId, level, timestamp, origin'
    });

    // Version 4: Add profiles and tasks, add userId to transactions
    this.version(4).stores({
      expenses: 'id, tenantId, date, categoryId, type, synced, currency, userId',
      categories: 'id, tenantId, type',
      logs: '++id, tenantId, level, timestamp, origin',
      profiles: 'id, tenantId, name',
      tasks: 'id, tenantId, date, assignedTo, type, isCompleted'
    }).upgrade(tx => {
       // Migration can be handled here if needed
    });
    
    this.transactions = this.table('expenses'); 
  }
}

export const db = new FlashFinanceDB();

export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
