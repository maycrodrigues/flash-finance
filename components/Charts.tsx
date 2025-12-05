import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Transaction, TransactionType } from '../types';
import { UI_LABELS } from '../constants';
import { useMergedCategories, useCurrencyFormatter } from '../hooks';

interface ChartsProps {
  transactions: Transaction[];
}

const COLORS = ['#A000FF', '#0FFF80', '#FFAB0F', '#43AA73', '#806C47', '#6B4780', '#94a3b8', '#ef4444', '#3b82f6'];

export const BalanceChart = ({ income, expense, labels }: any) => {
    const formatCurrency = useCurrencyFormatter();
    
    const data = [
        { name: labels.income, value: income, fill: '#43AA73' },
        { name: labels.expense, value: expense, fill: '#ef4444' },
    ];

    if (income === 0 && expense === 0) return null;

    return (
        <div className="h-32 w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={70} tick={{fill: 'var(--app-text)', fontSize: 12}} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-border)', borderRadius: '8px' }}
                        cursor={{fill: 'transparent'}}
                        formatter={(val: number) => formatCurrency(val)}
                    />
                    <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export const ExpensePieChart: React.FC<ChartsProps> = ({ transactions }) => {
  const { getLabel } = useMergedCategories(TransactionType.EXPENSE);
  const formatCurrency = useCurrencyFormatter();

  // Filter only expenses for the pie chart
  const expenseTx = transactions.filter(t => t.type === TransactionType.EXPENSE);

  const dataMap = expenseTx.reduce((acc, curr) => {
    acc[curr.categoryId] = (acc[curr.categoryId] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.keys(dataMap).map((key) => ({
    name: getLabel(key),
    value: dataMap[key]
  })).filter(d => d.value > 0).sort((a,b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-app-text-muted text-sm italic">
        Sem despesas para gráfico
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--app-card)', 
              borderColor: 'var(--app-border)', 
              borderRadius: '12px', 
              color: 'var(--app-text)',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
            }}
            itemStyle={{ color: 'var(--app-text)' }}
            formatter={(value: number) => [formatCurrency(value), '']}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};