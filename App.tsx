import React, { useState } from 'react';
import { useAppStore, useTransactionStore, useAuthStore } from './store';
import { UI_LABELS, CURRENCY_SYMBOLS } from './constants';
import { Card } from './components/DesignSystem';
import { QuickTrack } from './components/QuickTrack';
import { ExpensePieChart, BalanceChart } from './components/Charts';
import { LogViewer } from './components/LogViewer';
import { Settings } from './components/Settings';
import { HistoryList } from './components/HistoryList';
import { DashboardFilters } from './components/DashboardFilters';
import { LoginScreen } from './components/LoginScreen';
import { FamilyDashboard } from './components/FamilyDashboard';
import { Wallet, Settings as SettingsIcon, Home, DollarSign, Calendar, LogOut } from 'lucide-react';
import { useThemeSync, useAppInitialization, useDebugFeatures, useCurrencyFormatter } from './hooks';

// --- Structural Components ---

const AppLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-app-bg text-app-text pb-24 md:pb-8 transition-colors duration-300">
        {children}
    </div>
);

const AppContainer = ({ children }: { children: React.ReactNode }) => (
    <main className="max-w-md mx-auto md:max-w-2xl space-y-6 p-4 md:p-8">
        {children}
    </main>
);

const NavBar = ({ activeTab, onTabChange, labels }: any) => (
    <div className="fixed bottom-0 left-0 right-0 bg-app-card border-t border-app-border p-2 z-30 flex justify-around md:hidden shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
        <button 
            onClick={() => onTabChange('FINANCE')}
            className={`flex flex-col items-center p-2 rounded-xl w-20 transition-all ${activeTab === 'FINANCE' ? 'text-primary bg-primary/10' : 'text-app-text-muted'}`}
        >
            <DollarSign size={24} />
            <span className="text-[10px] font-bold mt-1">{labels.dashboard}</span>
        </button>
        <button 
             onClick={() => onTabChange('FAMILY')}
             className={`flex flex-col items-center p-2 rounded-xl w-20 transition-all ${activeTab === 'FAMILY' ? 'text-primary bg-primary/10' : 'text-app-text-muted'}`}
        >
            <Calendar size={24} />
            <span className="text-[10px] font-bold mt-1">{labels.family}</span>
        </button>
    </div>
);

const Header = ({ onSecretTap, onOpenSettings, isDebugMode, currentUser, onLogout }: any) => (
    <header className="flex justify-between items-center mb-4 max-w-md mx-auto md:max-w-2xl select-none px-4 pt-4 md:px-0">
        <div 
          className="flex items-center gap-3 cursor-pointer active:scale-95 transition-transform"
          onClick={onSecretTap}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg" style={{ backgroundColor: currentUser?.avatar?.replace('bg-', '') || '#A000FF' }}>
             {currentUser?.name?.[0] || 'F'}
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-app-text leading-tight">FlashFinance</h1>
            <p className="text-xs text-app-text-muted">{currentUser?.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isDebugMode && <div className="text-xs bg-warning/20 text-warning px-2 py-1 rounded border border-warning/50">DEBUG</div>}
          <button 
            onClick={onLogout}
            className="p-2 text-app-text-muted hover:text-red-500 transition-colors bg-app-card border border-app-border rounded-lg shadow-sm"
          >
            <LogOut size={18} />
          </button>
          <button 
            onClick={onOpenSettings}
            className="p-2 text-app-text-muted hover:text-primary transition-colors bg-app-card border border-app-border rounded-lg shadow-sm"
          >
            <SettingsIcon size={18} />
          </button>
        </div>
    </header>
);

const SummarySection = ({ formattedTotal, label }: { formattedTotal: string, label: string }) => (
    <Card className="bg-gradient-to-br from-primary via-accent to-app-card border-primary/30 text-white">
        <h2 className="text-primary-light text-sm font-medium mb-1">{label}</h2>
        <div className="text-4xl font-bold tracking-tighter">
        {formattedTotal}
        </div>
    </Card>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-app-text-muted ml-1">{children}</h3>
);

// --- Main App ---

const App = () => {
  // 1. Hooks for Logic
  useThemeSync();
  useAppInitialization();
  const { isDebugMode, handleSecretTap, toggleDebugMode } = useDebugFeatures();
  const formatCurrency = useCurrencyFormatter();
  
  // 2. Data Stores
  const { language } = useAppStore();
  const { transactions, getBalance, loading } = useTransactionStore();
  const { isAuthenticated, currentUser, logout } = useAuthStore();
  
  // 3. Local UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'FINANCE' | 'FAMILY'>('FINANCE');

  // 4. Computed Values
  const labels = UI_LABELS[language];
  const { total, income, expense } = getBalance();

  // 5. Auth Guard
  if (!isAuthenticated) {
      return (
        <AppLayout>
            <LoginScreen />
        </AppLayout>
      );
  }

  return (
    <AppLayout>
      <Header 
        onSecretTap={handleSecretTap} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        isDebugMode={isDebugMode} 
        currentUser={currentUser}
        onLogout={logout}
      />

      <AppContainer>
        {activeTab === 'FINANCE' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <DashboardFilters />

                <SummarySection 
                    label={labels.totalMonth} 
                    formattedTotal={formatCurrency(total)} 
                />

                <div className="space-y-2">
                    <SectionTitle>{labels.chartTitle}</SectionTitle>
                    <Card className="p-2 border-accent/20">
                        <BalanceChart 
                            income={income} 
                            expense={expense} 
                            labels={labels}
                        />
                        <div className="border-t border-app-border pt-4">
                            <ExpensePieChart transactions={transactions} />
                        </div>
                    </Card>
                </div>

                <div className="space-y-3">
                    <SectionTitle>{labels.history}</SectionTitle>
                    <HistoryList transactions={transactions} loading={loading} />
                </div>
            </div>
        ) : (
            <FamilyDashboard />
        )}
      </AppContainer>
      
      {activeTab === 'FINANCE' && <QuickTrack />}
      
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} labels={labels} />

      {isSettingsOpen && <Settings onClose={() => setIsSettingsOpen(false)} />}
      {isDebugMode && <LogViewer onClose={toggleDebugMode} />}
    </AppLayout>
  );
};

export default App;