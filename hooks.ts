import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore, useTransactionStore, useCategoryStore, useAuthStore, useTaskStore } from './store';
import { logger } from './services/logger';
import { AppLog, DefaultCategory, TenantId, TransactionType, Category, TaskType, Transaction, Currency } from './types';
import { UI_LABELS, CATEGORY_LABELS } from './constants';
import Swal from 'sweetalert2';

// --- Logic for Money Formatting ---
export const useCurrencyFormatter = () => {
  const { language, currency: globalCurrency } = useAppStore();

  const formatCurrency = useCallback((value: number, currencyOverride?: Currency) => {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: currencyOverride || globalCurrency,
    }).format(value);
  }, [language, globalCurrency]);

  return formatCurrency;
};

// --- Logic for History Grouping ---
export const useHistoryGrouping = (transactions: Transaction[]) => {
  const { language } = useAppStore();

  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};

    transactions.forEach(tx => {
      const date = new Date(tx.date);
      // Create a key YYYY-MM-DD for sorting
      const key = date.toISOString().split('T')[0];
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });

    // Sort keys descending (newest first)
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    return sortedKeys.map(dateKey => {
        const date = new Date(dateKey + 'T12:00:00'); // Safe timezone parsing
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        let label = date.toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long' });
        
        // Relative labels
        if (date.toDateString() === today.toDateString()) {
            label = language === 'pt-BR' ? 'Hoje' : 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            label = language === 'pt-BR' ? 'Ontem' : 'Yesterday';
        }

        return {
            title: label,
            dateKey,
            items: groups[dateKey]
        };
    });
  }, [transactions, language]);

  return grouped;
};

// --- Logic for Theme Sync ---
export const useThemeSync = () => {
  const { theme } = useAppStore();
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
};

// --- Logic for App Initialization ---
export const useAppInitialization = () => {
  const { tenantId } = useAppStore();
  const { loadTransactions } = useTransactionStore();
  const { loadCategories } = useCategoryStore();
  const { loadTasks } = useTaskStore();

  useEffect(() => {
    loadTransactions(tenantId);
    loadCategories(tenantId);
    useAuthStore.getState().loadProfiles(tenantId);
    loadTasks(tenantId);
  }, [tenantId, loadTransactions, loadCategories, loadTasks]);
};

// --- Notifications Hook ---
export const useNotifications = () => {
  const [permission, setPermission] = useState(Notification.permission);
  
  const requestPermission = useCallback(async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/icon.png', // Assuming pwa icon
        badge: '/badge.png',
        ...options
      });
    }
  }, [permission]);

  return { permission, requestPermission, sendNotification };
};

// --- Logic for Debug Features ---
export const useDebugFeatures = () => {
  const { isDebugMode, toggleDebugMode } = useAppStore();
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<any>(null);

  const showDebugToast = (willEnable: boolean) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: willEnable ? 'Debug Mode Enabled' : 'Debug Mode Disabled',
      background: 'var(--app-card)',
      color: 'var(--app-text)',
      timer: 2000,
      showConfirmButton: false
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
        const willEnable = !isDebugMode;
        toggleDebugMode();
        showDebugToast(willEnable);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDebugMode, isDebugMode]);

  const handleSecretTap = useCallback(() => {
    setTapCount(prev => prev + 1);
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = setTimeout(() => setTapCount(0), 500);

    if (tapCount + 1 >= 5) {
       const willEnable = !isDebugMode;
       toggleDebugMode();
       showDebugToast(willEnable);
       setTapCount(0);
       clearTimeout(tapTimeoutRef.current);
    }
  }, [tapCount, isDebugMode, toggleDebugMode]);

  return { isDebugMode, handleSecretTap, toggleDebugMode };
};

// --- Logic for Logs ---
export const useLogs = () => {
  const { tenantId } = useAppStore();
  const [logs, setLogs] = useState<AppLog[]>([]);

  const fetchLogs = useCallback(async () => {
    const data = await logger.getLogs(tenantId);
    setLogs(data);
  }, [tenantId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, fetchLogs };
};

// --- Logic for Categories Management ---
export const useMergedCategories = (type?: TransactionType) => {
    const { language } = useAppStore();
    const { categories } = useCategoryStore();
    
    // Merge Default Enums + Custom DB Categories
    const options = useMemo(() => {
        // 1. Defaults
        const defaultOptions = Object.values(DefaultCategory).map(key => ({
            value: key,
            label: CATEGORY_LABELS[language][key] || key,
            isCustom: false,
            // Determine type implicitly if needed, or assume valid for both contexts if not strict
            // For simpler logic, we return all defaults.
        }));

        // 2. Customs
        let customOptions = categories;
        if (type) {
            customOptions = categories.filter(c => c.type === type);
        }

        const formattedCustoms = customOptions.map(c => ({
            value: c.id,
            label: c.name,
            isCustom: true
        }));

        return [...defaultOptions, ...formattedCustoms];
    }, [categories, language, type]);

    const getLabel = (id: string) => {
        const found = options.find(o => o.value === id);
        return found ? found.label : id;
    };

    return { options, getLabel };
};

// --- Logic for Quick Add Form ---
export const useQuickAddForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState<string>(DefaultCategory.FOOD);
  const [desc, setDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { language, tenantId } = useAppStore();
  const { addTransaction } = useTransactionStore();
  const labels = UI_LABELS[language];
  
  useEffect(() => {
    if (type === TransactionType.INCOME) setCategoryId(DefaultCategory.SALARY);
    else setCategoryId(DefaultCategory.FOOD);
  }, [type]);

  const submitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      await addTransaction(parseFloat(amount), categoryId, type, desc, tenantId);
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: labels.expenseSaved,
        showConfirmButton: false,
        timer: 1500,
        background: 'var(--app-card)',
        color: 'var(--app-text)',
        iconColor: '#43AA73'
      });

      setAmount('');
      setDesc('');
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isOpen, setIsOpen,
    amount, setAmount,
    type, setType,
    categoryId, setCategoryId,
    desc, setDesc,
    isSubmitting,
    submitTransaction,
    labels,
    language
  };
};

export const useTransactionDeletion = () => {
    const { deleteTransaction } = useTransactionStore();
    const { tenantId } = useAppStore();

    const confirmAndDelete = async (id: string) => {
        const result = await Swal.fire({
          title: 'Tem certeza?',
          text: "Isso não pode ser desfeito.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ef4444',
          cancelButtonColor: '#334155',
          confirmButtonText: 'Sim, excluir',
          cancelButtonText: 'Cancelar',
          background: 'var(--app-card)',
          color: 'var(--app-text)'
        });
    
        if (result.isConfirmed) {
          await deleteTransaction(id, tenantId);
        }
      };

    return { confirmAndDelete };
}

export const useDateFilters = () => {
    const { currentDateFilter, setMonthFilter } = useTransactionStore();
    const { language } = useAppStore();

    const monthName = new Date(currentDateFilter.year, currentDateFilter.month).toLocaleString(language, { month: 'long' });

    const prevMonth = () => {
        let newMonth = currentDateFilter.month - 1;
        let newYear = currentDateFilter.year;
        if (newMonth < 0) {
            newMonth = 11;
            newYear -= 1;
        }
        setMonthFilter(newMonth, newYear);
    };

    const nextMonth = () => {
        let newMonth = currentDateFilter.month + 1;
        let newYear = currentDateFilter.year;
        if (newMonth > 11) {
            newMonth = 0;
            newYear += 1;
        }
        setMonthFilter(newMonth, newYear);
    };

    return { 
        currentMonth: currentDateFilter.month,
        currentYear: currentDateFilter.year,
        monthName,
        prevMonth,
        nextMonth
    };
};