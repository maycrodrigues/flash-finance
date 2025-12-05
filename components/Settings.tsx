import React from 'react';
import { useAppStore } from '../store';
import { Card, Button, Select } from './DesignSystem';
import { X, Moon, Sun, Globe, Coins } from 'lucide-react';
import { UI_LABELS } from '../constants';
import { Language, Currency } from '../types';
import { CategoryManager } from './CategoryManager';

export const Settings = ({ onClose }: { onClose: () => void }) => {
  const { theme, toggleTheme, language, setLanguage, currency, setCurrency } = useAppStore();
  const labels = UI_LABELS[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md bg-app-card border-2 border-primary/20 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-app-text">{labels.settings}</h2>
          <Button variant="ghost" onClick={onClose} className="!p-2 rounded-full">
            <X size={24} />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-app-input border border-app-border">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-primary/20 text-primary' : 'bg-orange-100 text-orange-500'}`}>
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <h3 className="font-medium text-app-text">{labels.appearance}</h3>
                <p className="text-xs text-app-text-muted">
                  {theme === 'dark' ? labels.darkMode : labels.lightMode}
                </p>
              </div>
            </div>
            
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                theme === 'dark' ? 'bg-primary' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Language Selector */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-app-input border border-app-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20 text-accent">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="font-medium text-app-text">{labels.languageLabel}</h3>
                <p className="text-xs text-app-text-muted">
                  {language === 'pt-BR' ? 'Português (BR)' : 'English (US)'}
                </p>
              </div>
            </div>
            
            <div className="w-36">
              <Select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                options={[
                  { value: 'pt-BR', label: '🇧🇷 Português' },
                  { value: 'en-US', label: '🇺🇸 English' }
                ]}
                className="!py-2 !text-sm bg-app-card"
              />
            </div>
          </div>

          {/* Currency Selector */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-app-input border border-app-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20 text-green-500">
                <Coins size={20} />
              </div>
              <div>
                <h3 className="font-medium text-app-text">{labels.currencyLabel}</h3>
                <p className="text-xs text-app-text-muted">
                  {currency}
                </p>
              </div>
            </div>
            
            <div className="w-36">
              <Select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                options={[
                  { value: 'BRL', label: '🇧🇷 Real' },
                  { value: 'USD', label: '🇺🇸 Dollar' },
                  { value: 'EUR', label: '🇪🇺 Euro' },
                  { value: 'GBP', label: '🇬🇧 Libra' }
                ]}
                className="!py-2 !text-sm bg-app-card"
              />
            </div>
          </div>

          <CategoryManager />
          
          {/* Info */}
          <div className="text-center text-xs text-app-text-muted pt-4 border-t border-app-border mt-6">
            <p>FlashFinance v2.0</p>
            <p className="mt-1">Tenant ID: <span className="font-mono opacity-70">default-tenant</span></p>
          </div>
        </div>
      </Card>
    </div>
  );
};
