import React from 'react';
import { 
  Users, MessageSquare, Calendar, TrendingUp, Settings, 
  CreditCard, Wifi, WifiOff, Moon, Sun, ShieldAlert, LogOut, Sparkles
} from 'lucide-react';
import { UserRole, TranslationSchema } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
  userEmail: string;
  onLogout: () => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  lang: 'pt' | 'en' | 'es';
  setLang: (lang: 'pt' | 'en' | 'es') => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  t: TranslationSchema;
  onOpenEduAI: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  role,
  userEmail,
  onLogout,
  isOffline,
  setIsOffline,
  lang,
  setLang,
  darkMode,
  setDarkMode,
  t,
  onOpenEduAI
}: SidebarProps) {
  
  const getRoleBadge = () => {
    switch(role) {
      case 'teacher':
        return { text: 'Professor', style: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' };
      case 'parent':
        return { text: 'Responsável', style: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' };
      case 'admin':
        return { text: 'Administrador', style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
      case 'student':
        return { text: 'Aluno Dojo', style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      default:
        return { text: 'Usuário', style: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    }
  };

  const badge = getRoleBadge();

  return (
    <aside className="w-full lg:w-72 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 p-6 z-10" id="sidebar-container">
      {/* Upper Brand Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
              <span className="font-bold text-lg">D</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-slate-100 font-sans leading-none">EduClass</h1>
              <span className="text-xs text-slate-400 font-mono tracking-widest">DOJO SYSTEM</span>
            </div>
          </div>

          {/* Quick Offline Simulator switch in header */}
          <button
            onClick={() => setIsOffline(!isOffline)}
            title={isOffline ? t.offlineMode : t.onlineMode}
            className={`p-2 rounded-xl border transition duration-200 flex items-center justify-center ${
              isOffline 
                ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900'
            }`}
          >
            {isOffline ? <WifiOff className="w-4 h-4 animate-bounce" /> : <Wifi className="w-4 h-4" />}
          </button>
        </div>

        {/* User Card */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
              {role === 'teacher' ? 'RS' : role === 'parent' ? 'JS' : role === 'student' ? 'AL' : 'AD'}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate">
                {role === 'teacher' ? 'Prof. Ricardo Silva' : role === 'parent' ? 'João Santos' : role === 'student' ? 'Davi Santos (Aluno)' : 'Admin Geral'}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate mb-1">{userEmail}</p>
              <span className={`inline-block text-[10px] px-2 py-0.5 font-bold rounded-full border ${badge.style}`}>
                {badge.text}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-1.5">
          {role === 'student' ? (
            <>
              <button
                onClick={() => setActiveTab('student_dashboard')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition duration-150 ${
                  activeTab === 'student_dashboard'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Dojo do Aluno</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('classroom')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition duration-150 ${
                  activeTab === 'classroom'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>Minha Turma</span>
                </div>
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab('classroom')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition duration-150 ${
                activeTab === 'classroom'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>{t.classroom}</span>
              </div>
            </button>
          )}

          <button
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition duration-150 ${
              activeTab === 'messages'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4" />
              <span>{t.messages}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition duration-150 ${
              activeTab === 'calendar'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4" />
              <span>{t.calendar}</span>
            </div>
          </button>

          {role !== 'student' && (
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition duration-150 ${
                activeTab === 'reports'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4" />
                <span>{t.reports}</span>
              </div>
            </button>
          )}

          {role !== 'student' && (
            <button
              onClick={() => setActiveTab('payment')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition duration-150 ${
                activeTab === 'payment'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4" />
                <span>{t.payment}</span>
              </div>
            </button>
          )}

          {(role === 'admin' || role === 'teacher') && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition duration-150 ${
                activeTab === 'admin'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                <span>{t.adminPanel}</span>
              </div>
            </button>
          )}
        </nav>
      </div>

      {/* Footer Settings & AI Shortcut */}
      <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800 mt-auto">
        
        {/* Interactive Pedagogical AI Helper Shortcut */}
        <button
          onClick={onOpenEduAI}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 transition duration-200"
        >
          <Sparkles className="w-4 h-4" />
          {t.aiHelp}
        </button>

        {/* Preferences Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Theme switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-center gap-2 py-2 px-3 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition"
          >
            {darkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </>
            )}
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as any)}
              className="w-full appearance-none flex items-center justify-center text-center py-2 px-3 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 focus:outline-none"
            >
              <option value="pt">🇧🇷 PT</option>
              <option value="en">🇺🇸 EN</option>
              <option value="es">🇪🇸 ES</option>
            </select>
          </div>
        </div>

        {/* Offline Simulation Info Line */}
        {isOffline && (
          <div className="flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl animate-pulse">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span>{t.offlineMode} Ativo</span>
          </div>
        )}

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.logout}</span>
        </button>
      </div>
    </aside>
  );
}
