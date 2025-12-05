import React, { useState } from 'react';
import { useCategoryStore, useAppStore } from '../store';
import { UI_LABELS } from '../constants';
import { Input, Button, Tabs } from './DesignSystem';
import { TransactionType } from '../types';
import { Trash2, Plus } from 'lucide-react';

export const CategoryManager = () => {
    const { categories, addCategory, deleteCategory } = useCategoryStore();
    const { language, tenantId } = useAppStore();
    const labels = UI_LABELS[language];

    const [newCatName, setNewCatName] = useState('');
    const [activeType, setActiveType] = useState<TransactionType>(TransactionType.EXPENSE);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        await addCategory(newCatName.trim(), activeType, tenantId);
        setNewCatName('');
    };

    const filteredCats = categories.filter(c => c.type === activeType);

    return (
        <div className="mt-4 p-4 border border-app-border rounded-xl bg-app-input/30">
            <h3 className="font-bold text-app-text mb-4">{labels.manageCategories}</h3>
            
            <Tabs 
                value={activeType} 
                onChange={setActiveType} 
                options={[
                    { value: TransactionType.EXPENSE, label: labels.expense },
                    { value: TransactionType.INCOME, label: labels.income }
                ]} 
            />

            <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                <Input 
                    value={newCatName} 
                    onChange={e => setNewCatName(e.target.value)} 
                    placeholder={labels.categoryName} 
                    className="!py-2"
                />
                <Button type="submit" className="!py-2 !px-3" disabled={!newCatName}>
                    <Plus size={20} />
                </Button>
            </form>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {filteredCats.length === 0 && <p className="text-xs text-app-text-muted italic text-center py-2">Sem categorias customizadas.</p>}
                
                {filteredCats.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center bg-app-card p-2 rounded-lg border border-app-border text-sm">
                        <span className="text-app-text">{cat.name}</span>
                        <button 
                            onClick={() => deleteCategory(cat.id, tenantId)}
                            className="text-app-text-muted hover:text-red-500 p-1"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
