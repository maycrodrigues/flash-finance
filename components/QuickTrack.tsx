import React from 'react';
import { TransactionType } from '../types';
import { Button, Input, Select, Tabs } from './DesignSystem';
import { Plus, X } from 'lucide-react';
import { useQuickAddForm, useMergedCategories } from '../hooks';

// Composition: Trigger Button
const TriggerButton = ({ onClick }: { onClick: () => void }) => (
    <div className="fixed bottom-6 right-6 z-40">
        <Button 
          onClick={onClick}
          className="rounded-full w-16 h-16 !p-0 bg-primary hover:bg-primary/90 shadow-primary/40 shadow-xl hover:scale-110 transition-transform"
        >
          <Plus size={32} className="text-white" />
        </Button>
    </div>
);

// Composition: Modal Content
const QuickTrackModal = ({ 
    onClose, 
    children, 
    title 
}: { 
    onClose: () => void, 
    children: React.ReactNode, 
    title: string 
}) => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-app-card w-full max-w-md p-6 rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 border border-primary/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-app-text">{title}</h3>
          <button onClick={onClose} className="text-app-text-muted hover:text-app-text p-2">
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
);

export const QuickTrack = () => {
  const { 
    isOpen, setIsOpen, amount, setAmount, categoryId, setCategoryId, type, setType,
    desc, setDesc, isSubmitting, submitTransaction, labels
  } = useQuickAddForm();

  const { options: categoryOptions } = useMergedCategories(type);

  if (!isOpen) {
    return <TriggerButton onClick={() => setIsOpen(true)} />;
  }

  return (
    <QuickTrackModal onClose={() => setIsOpen(false)} title={labels.quickAdd}>
        <form onSubmit={submitTransaction} className="space-y-4">
          
          <Tabs 
            value={type}
            onChange={setType}
            options={[
                { value: TransactionType.EXPENSE, label: labels.expense },
                { value: TransactionType.INCOME, label: labels.income }
            ]}
          />

          <Input 
            type="number" 
            label={labels.amount}
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            placeholder="0.00"
            autoFocus
            step="0.01"
            min="0.01"
            required
            className={`text-2xl font-bold text-center !py-4 ${type === TransactionType.INCOME ? 'text-green-500' : 'text-red-500'}`}
          />

          <Select
            label={labels.category}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categoryOptions}
          />

          <Input 
            label={labels.description}
            value={desc} 
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Ex: Almoço, Projeto X"
          />

          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
              {labels.save}
            </Button>
          </div>
        </form>
    </QuickTrackModal>
  );
};
