import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useDateFilters } from '../hooks';

export const DashboardFilters = () => {
    const { monthName, currentYear, prevMonth, nextMonth } = useDateFilters();

    return (
        <div className="flex items-center justify-between bg-app-card rounded-xl border border-app-border p-2 mb-6">
            <button onClick={prevMonth} className="p-2 text-app-text-muted hover:text-primary transition-colors">
                <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-2 text-app-text font-medium select-none">
                <Calendar size={16} className="text-primary" />
                <span className="capitalize">{monthName}</span>
                <span className="opacity-50">{currentYear}</span>
            </div>

            <button onClick={nextMonth} className="p-2 text-app-text-muted hover:text-primary transition-colors">
                <ChevronRight size={20} />
            </button>
        </div>
    );
};
