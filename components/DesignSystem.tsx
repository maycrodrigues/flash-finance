import React, { ReactNode } from 'react';

// --- Card ---
export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`bg-app-card border border-app-border rounded-xl shadow-lg p-4 transition-colors duration-300 ${className}`}>
    {children}
  </div>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button = ({ children, variant = 'primary', isLoading, className = "", ...props }: ButtonProps) => {
  const baseStyle = "px-4 py-3 rounded-lg font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-primary hover:bg-primary/90 text-white shadow-primary/30 shadow-lg",
    secondary: "bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 dark:text-primary-light dark:border-accent/50", 
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/50",
    ghost: "text-app-text-muted hover:text-app-text hover:bg-app-text/5",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? <span className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></span> : children}
    </button>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = ({ label, className = "", ...props }: InputProps) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-xs font-medium text-app-text-muted ml-1">{label}</label>}
    <input
      className={`bg-app-input border border-app-border rounded-lg px-4 py-3 text-app-text placeholder-app-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 ${className}`}
      {...props}
    />
  </div>
);

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select = ({ label, options, className = "", ...props }: SelectProps) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-xs font-medium text-app-text-muted ml-1">{label}</label>}
    <select
      className={`bg-app-input border border-app-border rounded-lg px-4 py-3 text-app-text focus:outline-none focus:ring-2 focus:ring-primary appearance-none transition-all duration-300 ${className}`}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-app-card text-app-text">
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

// --- Tabs ---
export const Tabs = ({ options, value, onChange }: { options: { value: string, label: string }[], value: string, onChange: (val: any) => void }) => (
    <div className="flex p-1 bg-app-input rounded-xl border border-app-border mb-4">
        {options.map(opt => (
            <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    value === opt.value 
                    ? 'bg-app-card text-primary shadow-sm' 
                    : 'text-app-text-muted hover:text-app-text'
                }`}
            >
                {opt.label}
            </button>
        ))}
    </div>
);
