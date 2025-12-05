import React from 'react';
import { Transaction, TransactionType, UserProfile } from '../types';
import { useAppStore, useAuthStore } from '../store';
import { UI_LABELS } from '../constants';
import { Trash2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useTransactionDeletion, useMergedCategories, useCurrencyFormatter, useHistoryGrouping } from '../hooks';

// --- Atomic Components ---

const TransactionIcon = ({ type }: { type: TransactionType }) => {
    const isIncome = type === TransactionType.INCOME;
    return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
            isIncome 
            ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
            : 'bg-red-500/10 text-red-500 border border-red-500/20'
        }`}>
            {isIncome ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
        </div>
    );
};

const UserAvatar = ({ userId, profiles }: { userId?: string, profiles: UserProfile[] }) => {
    if (!userId) return null;
    const user = profiles.find(p => p.id === userId);
    if (!user) return null;

    return (
        <div 
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-app-card shadow-sm -ml-2 z-10 ${user.avatar || 'bg-gray-400'}`}
            title={user.name}
        >
            {user.name[0]}
        </div>
    );
};

const TransactionRow = ({ transaction, language, profiles, onDelete }: { 
    transaction: Transaction, 
    language: string, 
    profiles: UserProfile[],
    onDelete: () => void 
}) => {
    // Pass undefined to search all types of categories
    const { getLabel } = useMergedCategories();
    const formatCurrency = useCurrencyFormatter();
    
    return (
        <div className="flex items-center gap-3 p-3 bg-app-card hover:bg-app-input/50 transition-colors rounded-xl border border-transparent hover:border-app-border group relative overflow-hidden">
            <TransactionIcon type={transaction.type} />
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-app-text text-sm truncate pr-2">
                        {transaction.description || getLabel(transaction.categoryId)}
                    </h4>
                    <span className={`font-bold text-sm whitespace-nowrap ${
                        transaction.type === TransactionType.INCOME ? 'text-green-500' : 'text-app-text'
                    }`}>
                        {transaction.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(transaction.amount, transaction.currency)}
                    </span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center">
                         <span className="text-xs text-app-text-muted truncate mr-2">
                            {getLabel(transaction.categoryId)}
                         </span>
                         <UserAvatar userId={transaction.userId} profiles={profiles} />
                    </div>
                    
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="text-app-text-muted/50 hover:text-red-500 p-1 rounded-full hover:bg-red-500/10 transition-all"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export const HistoryList = ({ transactions, loading }: { transactions: Transaction[], loading: boolean }) => {
    const { language } = useAppStore();
    const { profiles } = useAuthStore();
    const { confirmAndDelete } = useTransactionDeletion();
    const groups = useHistoryGrouping(transactions);
    const labels = UI_LABELS[language];

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1,2,3].map(i => (
                    <div key={i} className="h-20 bg-app-card/50 rounded-xl" />
                ))}
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-app-text-muted border border-dashed border-app-border rounded-xl bg-app-input/30">
                <TrendingUp size={48} className="mb-2 opacity-20" />
                <p>{labels.emptyState}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 md:pb-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {groups.map((group) => (
                <div key={group.dateKey} className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-app-text-muted ml-1 sticky top-0 bg-app-bg/95 backdrop-blur-sm py-2 z-10 w-fit px-2 rounded-r-lg">
                        {group.title}
                    </h3>
                    <div className="space-y-2">
                        {group.items.map(tx => (
                            <TransactionRow 
                                key={tx.id}
                                transaction={tx}
                                language={language}
                                profiles={profiles}
                                onDelete={() => tx.id && confirmAndDelete(tx.id)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};