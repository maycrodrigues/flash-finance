import React, { useState } from 'react';
import { useAuthStore, useAppStore } from '../store';
import { UserRole } from '../types';
import { Card, Button, Input, Select } from './DesignSystem';
import { UI_LABELS } from '../constants';
import { User, Shield, Baby, ArrowRight, Lock } from 'lucide-react';

const Avatar = ({ char, color }: { char: string, color: string }) => (
  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg ${color}`}>
    {char}
  </div>
);

export const LoginScreen = () => {
  const { profiles, createProfile, login } = useAuthStore();
  const { language, tenantId } = useAppStore();
  const labels = UI_LABELS[language];
  const [view, setView] = useState<'SELECT' | 'CREATE'>('SELECT');
  
  // Create Form State
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN);

  // Login Form State
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [loginPin, setLoginPin] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || pin.length !== 4) return;
    
    // Simple color generation based on name length
    const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-warning', 'bg-blue-500', 'bg-pink-500'];
    const color = colors[name.length % colors.length];
    
    await createProfile(name, role, pin, color, tenantId);
    setView('SELECT');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProfileId && loginPin) {
      const success = login(selectedProfileId, loginPin);
      if (!success) setError('PIN Incorreto');
    }
  };

  if (profiles.length === 0 || view === 'CREATE') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-app-bg">
        <Card className="w-full max-w-md animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-center mb-6 text-app-text">{labels.createProfile}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
                <Input 
                    label={labels.name}
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Ex: João"
                    required
                />
                <Select
                    label={labels.role}
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    options={[
                        { value: UserRole.ADMIN, label: labels.father },
                        { value: UserRole.ADMIN, label: labels.mother },
                        { value: UserRole.MEMBER, label: labels.child }
                    ]}
                />
                <Input 
                    label={labels.pin}
                    type="tel"
                    maxLength={4}
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    placeholder="****"
                    className="text-center tracking-widest text-xl"
                    required
                />
                <div className="pt-4 flex gap-2">
                    {profiles.length > 0 && (
                        <Button type="button" variant="secondary" onClick={() => setView('SELECT')} className="flex-1">
                            {labels.cancel}
                        </Button>
                    )}
                    <Button type="submit" className="flex-1">
                        {labels.save}
                    </Button>
                </div>
            </form>
        </Card>
      </div>
    );
  }

  if (selectedProfileId) {
    const profile = profiles.find(p => p.id === selectedProfileId);
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-app-bg">
            <Card className="w-full max-w-sm animate-in fade-in zoom-in duration-300 text-center">
                <div className="flex justify-center mb-4">
                    <Avatar char={profile?.name[0] || '?'} color={profile?.avatar || 'bg-gray-500'} />
                </div>
                <h2 className="text-xl font-bold text-app-text mb-2">{labels.welcome}, {profile?.name}</h2>
                <p className="text-app-text-muted text-sm mb-6">{labels.pin}</p>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <Input 
                        type="password"
                        maxLength={4}
                        value={loginPin}
                        onChange={e => { setLoginPin(e.target.value); setError(''); }}
                        placeholder="****"
                        className="text-center tracking-widest text-2xl !py-4"
                        autoFocus
                    />
                    {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
                    <div className="pt-2 flex gap-2">
                         <Button type="button" variant="ghost" onClick={() => { setSelectedProfileId(null); setLoginPin(''); }}>
                            Voltar
                         </Button>
                         <Button type="submit" className="flex-1">
                            {labels.login} <ArrowRight size={16} />
                         </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-app-bg space-y-8">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-primary mb-2">FlashFamily</h1>
            <p className="text-app-text-muted">{labels.selectProfile}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            {profiles.map(profile => (
                <button 
                    key={profile.id}
                    onClick={() => setSelectedProfileId(profile.id)}
                    className="bg-app-card border border-app-border rounded-xl p-6 flex flex-col items-center gap-3 hover:border-primary transition-all hover:scale-105 shadow-sm"
                >
                    <Avatar char={profile.name[0]} color={profile.avatar} />
                    <span className="font-semibold text-app-text">{profile.name}</span>
                </button>
            ))}
            
            <button 
                onClick={() => setView('CREATE')}
                className="bg-app-input border border-dashed border-app-border rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-app-text-muted hover:text-primary hover:border-primary transition-all"
            >
                <div className="w-16 h-16 rounded-full bg-app-card flex items-center justify-center">
                    <PlusIcon />
                </div>
                <span className="font-medium">{labels.createProfile}</span>
            </button>
        </div>
    </div>
  );
};

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
