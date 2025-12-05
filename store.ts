import { create } from 'zustand';
import { Transaction, Category, Language, TenantId, Currency, TransactionType, DateFilter, DefaultCategory, UserProfile, UserRole, Task, TaskType } from './types';
import { DEFAULT_TENANT } from './constants';
import { db, generateUUID } from './services/db';
import { logger } from './services/logger';
import { cryptoService } from './services/crypto'; // Import Crypto Service
import { LogLevel } from './types';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- Types ---
interface AppState {
  theme: 'dark' | 'light';
  language: Language;
  currency: Currency;
  tenantId: TenantId;
  isDebugMode: boolean;
  toggleDebugMode: () => void;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  setCurrency: (currency: Currency) => void;
}

interface AuthState {
  currentUser: UserProfile | null;
  profiles: UserProfile[];
  loading: boolean;
  isAuthenticated: boolean;
  loadProfiles: (tenantId: TenantId) => Promise<void>;
  createProfile: (name: string, role: UserRole, pin: string, avatar: string, tenantId: TenantId) => Promise<void>;
  login: (profileId: string, pin: string) => boolean;
  logout: () => void;
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  loadTasks: (tenantId: TenantId) => Promise<void>;
  addTask: (title: string, date: number, type: TaskType, assignedTo: string, tenantId: TenantId) => Promise<void>;
  toggleTaskCompletion: (taskId: string, tenantId: TenantId) => Promise<void>;
  deleteTask: (taskId: string, tenantId: TenantId) => Promise<void>;
}

interface TransactionState {
  transactions: Transaction[]; // In-memory state is ALWAYS decrypted
  loading: boolean;
  currentDateFilter: DateFilter;
  setMonthFilter: (month: number, year: number) => void;
  loadTransactions: (tenantId: TenantId) => Promise<void>;
  addTransaction: (amount: number, categoryId: string, type: TransactionType, description: string, tenantId: TenantId, userId?: string) => Promise<void>;
  deleteTransaction: (id: string, tenantId: TenantId) => Promise<void>;
  getBalance: () => { income: number; expense: number; total: number };
}

interface CategoryState {
  categories: Category[];
  loadCategories: (tenantId: TenantId) => Promise<void>;
  addCategory: (name: string, type: TransactionType, tenantId: TenantId) => Promise<void>;
  deleteCategory: (id: string, tenantId: TenantId) => Promise<void>;
}

// --- Stores ---

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  language: 'pt-BR',
  currency: 'BRL',
  tenantId: DEFAULT_TENANT,
  isDebugMode: false,
  toggleDebugMode: () => set((state) => ({ isDebugMode: !state.isDebugMode })),
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    return { theme: newTheme };
  }),
  setLanguage: (lang) => set({ language: lang }),
  setCurrency: (currency) => set({ currency }),
}));

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      profiles: [],
      loading: false,
      isAuthenticated: false,

      loadProfiles: async (tenantId) => {
        set({ loading: true });
        try {
          const profiles = await db.profiles.where('tenantId').equals(tenantId).toArray();
          set({ profiles, loading: false });
        } catch (e) {
          logger.log(LogLevel.ERROR, 'Failed to load profiles', 'AuthStore', tenantId, { error: e });
          set({ loading: false });
        }
      },

      createProfile: async (name, role, pin, avatar, tenantId) => {
        const newProfile: UserProfile = {
          id: generateUUID(),
          tenantId,
          name,
          role,
          pin,
          avatar,
          createdAt: Date.now()
        };
        await db.profiles.add(newProfile);
        set((state) => ({ profiles: [...state.profiles, newProfile] }));
        logger.log(LogLevel.ACTION, 'Profile Created', 'AuthStore', tenantId, { name, role });
      },

      login: (profileId, pin) => {
        const { profiles } = get();
        const profile = profiles.find(p => p.id === profileId);
        if (profile && profile.pin === pin) {
          set({ currentUser: profile, isAuthenticated: true });
          logger.log(LogLevel.ACTION, 'User Login', 'AuthStore', profile.tenantId, { user: profile.name });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      }
    }),
    {
      name: 'flashfinance-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, currentUser: state.currentUser }),
    }
  )
);

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  loading: false,

  loadTasks: async (tenantId) => {
    set({ loading: true });
    try {
      // Load tasks. Logic for Daily Tasks: Reset completion if day changed (Optional, handled in UI for now)
      const tasks = await db.tasks.where('tenantId').equals(tenantId).toArray();
      set({ tasks: tasks.sort((a,b) => a.date - b.date), loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },

  addTask: async (title, date, type, assignedTo, tenantId) => {
    const { currentUser } = useAuthStore.getState();
    const newTask: Task = {
      id: generateUUID(),
      tenantId,
      title,
      date,
      type,
      assignedTo,
      isCompleted: false,
      createdBy: currentUser?.id || 'unknown',
      createdAt: Date.now()
    };
    await db.tasks.add(newTask);
    set((state) => ({ tasks: [...state.tasks, newTask] }));
    
    // Local Notification Trigger (If browser supported and allowed)
    if (Notification.permission === 'granted' && type !== TaskType.DAILY) {
       // Schedule logic would go here. For now, we just notify immediate creation
       // In a real app, use ServiceWorkers for scheduled notifications
    }
  },

  toggleTaskCompletion: async (taskId, tenantId) => {
    const { tasks } = useTaskStore.getState();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedStatus = !task.isCompleted;
      await db.tasks.update(taskId, { isCompleted: updatedStatus });
      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, isCompleted: updatedStatus } : t)
      }));
    }
  },

  deleteTask: async (taskId, tenantId) => {
    await db.tasks.delete(taskId);
    set((state) => ({ tasks: state.tasks.filter(t => t.id !== taskId) }));
  }
}));

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  loading: false,
  currentDateFilter: {
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  },

  setMonthFilter: (month, year) => {
    set({ currentDateFilter: { month, year } });
    const { tenantId } = useAppStore.getState();
    get().loadTransactions(tenantId);
  },

  loadTransactions: async (tenantId) => {
    set({ loading: true });
    const { month, year } = get().currentDateFilter;
    
    try {
      const startOfMonth = new Date(year, month, 1).getTime();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).getTime();
      
      // 1. Fetch encrypted data
      const rawTransactions = await db.transactions
        .where('tenantId')
        .equals(tenantId)
        .filter(e => e.date >= startOfMonth && e.date <= endOfMonth)
        .reverse()
        .sortBy('date');

      // 2. Decrypt data for UI state
      const decryptedTransactions = await Promise.all(
        rawTransactions.map(tx => cryptoService.decryptTransaction(tx))
      );
        
      set({ transactions: decryptedTransactions, loading: false });
    } catch (error) {
      logger.log(LogLevel.ERROR, 'Failed to load transactions', 'Store', tenantId, { error });
      set({ loading: false });
    }
  },

  addTransaction: async (amount, categoryId, type, description, tenantId, userId) => {
    const currentCurrency = useAppStore.getState().currency;
    const { currentUser } = useAuthStore.getState();

    // 1. Create Domain Entity (Decrypted)
    const newTx: Transaction = {
      id: generateUUID(),
      tenantId,
      amount,
      categoryId,
      type,
      description,
      date: Date.now(),
      createdAt: Date.now(),
      synced: false,
      currency: currentCurrency,
      userId: userId || currentUser?.id
    };

    try {
      // 2. Encrypt Entity (For DB)
      const encryptedTx = await cryptoService.encryptTransaction(newTx);

      // 3. Save Encrypted Version to DB
      await db.transactions.add(encryptedTx);
      
      // 4. Update State with Decrypted Version (Optimistic UI)
      const { month, year } = get().currentDateFilter;
      const txDate = new Date(newTx.date);
      if (txDate.getMonth() === month && txDate.getFullYear() === year) {
        set((state) => ({
            transactions: [newTx, ...state.transactions].sort((a, b) => b.date - a.date)
        }));
      }
      logger.log(LogLevel.ACTION, 'Transaction Added', 'QuickAdd', tenantId, { amount: '***', type, categoryId, currency: currentCurrency });
    } catch (error) {
      logger.log(LogLevel.ERROR, 'Failed to save transaction', 'Store', tenantId, { error });
      throw error;
    }
  },

  deleteTransaction: async (id, tenantId) => {
    const { transactions } = get();
    // Snapshot item for logging (Using memory state which is decrypted)
    const txToDelete = transactions.find(t => t.id === id);

    try {
      await db.transactions.delete(id);
      set((state) => ({
        transactions: state.transactions.filter(e => e.id !== id)
      }));

      // Audit Log
      if (txToDelete) {
        const currentUser = useAuthStore.getState().currentUser;
        logger.log(
            LogLevel.ACTION, 
            'Transaction Deleted', 
            'TransactionStore', 
            tenantId, 
            { 
                id,
                amount: '***', // Masked for security
                description: '***', // Mask description in logs
                category: txToDelete.categoryId,
                deletedBy: currentUser?.name || 'System',
                currency: txToDelete.currency
            }
        );
      }
    } catch (error) {
       logger.log(LogLevel.ERROR, 'Failed to delete transaction', 'Store', tenantId, { error });
    }
  },

  getBalance: () => {
    const { transactions } = get();
    let income = 0;
    let expense = 0;

    transactions.forEach(tx => {
        if (tx.type === TransactionType.INCOME) income += tx.amount;
        else expense += tx.amount;
    });

    return { income, expense, total: income - expense };
  }
}));

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  loadCategories: async (tenantId) => {
    try {
      const customCats = await db.categories.where('tenantId').equals(tenantId).toArray();
      set({ categories: customCats });
    } catch (error) {
      logger.log(LogLevel.ERROR, 'Failed to load categories', 'Store', tenantId, { error });
    }
  },
  addCategory: async (name, type, tenantId) => {
    const newCat: Category = {
      id: generateUUID(),
      tenantId,
      name,
      type,
      isCustom: true
    };
    try {
      await db.categories.add(newCat);
      set((state) => ({ categories: [...state.categories, newCat] }));
    } catch (error) {
       logger.log(LogLevel.ERROR, 'Failed to add category', 'Store', tenantId, { error });
    }
  },
  deleteCategory: async (id, tenantId) => {
     try {
       await db.categories.delete(id);
       set((state) => ({ categories: state.categories.filter(c => c.id !== id) }));
     } catch (error) {
        logger.log(LogLevel.ERROR, 'Failed to delete category', 'Store', tenantId, { error });
     }
  }
}));