import { Bell, Settings, Search, MessageSquareQuote, Menu } from 'lucide-react';
import { View } from '../types';

interface TopNavProps {
  currentView: View;
  onViewChange: (view: View) => void;
  userName: string;
  onMenuToggle: () => void;
}

export default function TopNav({ currentView, onViewChange, userName, onMenuToggle }: TopNavProps) {
  const viewTitles: Record<View, string> = {
    home: 'Padma Intelligence',
    history: 'Padma Intelligence',
    settings: 'Padma Intelligence',
    help: 'Padma Intelligence',
    schedule: 'Padma Intelligence',
  };

  const subTitles: Record<View, string | null> = {
    home: null,
    history: 'Archive & Intent',
    settings: null,
    help: null,
    schedule: 'My Schedule',
  };

  return (
    <header className="flex justify-between items-center h-16 w-full lg:pl-72 pr-4 lg:pr-8 z-40 fixed top-0 bg-surface-container-lowest/70 backdrop-blur-xl transition-all shadow-sm border-b border-surface-variant/10">
      <div className="flex items-center gap-2 lg:gap-4">
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <span className="text-base lg:text-lg font-black text-on-surface tracking-tight font-headline truncate max-w-[120px] lg:max-w-none">
          {viewTitles[currentView]}
        </span>
        {subTitles[currentView] && (
          <>
            <div className="h-6 w-px bg-surface-container-high mx-2" />
            <span className="text-sm font-semibold text-primary px-3 py-1 bg-surface-container-low rounded-full">
              {subTitles[currentView]}
            </span>
          </>
        )}
        {currentView === 'home' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"></div>
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Connected</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        {(currentView === 'history' || currentView === 'help') && (
          <div className="relative hidden md:flex items-center">
            <Search className="absolute left-3 text-outline" size={18} />
            <input
              type="text"
              placeholder={currentView === 'help' ? "How can I assist you today?" : "Search commands..."}
              className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-sm focus:ring-2 focus:ring-primary w-48 lg:w-64 transition-all"
            />
          </div>
        )}

        <div className="flex items-center gap-2 lg:gap-4">
          <Settings 
            className={`cursor-pointer transition-colors ${currentView === 'settings' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`} 
            size={20} 
            onClick={() => onViewChange('settings')}
          />
        </div>

        <div 
          className="flex items-center gap-2 border-l border-surface-container-high pl-2 lg:pl-4 cursor-pointer group"
          onClick={() => onViewChange('settings')}
        >
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Intelligence</span>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Connected</span>
          </div>
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant editorial-shadow border-2 border-surface-container-lowest group-hover:border-primary/20 transition-all">
            <span className="text-[10px] lg:text-xs font-black uppercase tracking-tighter">
              {userName.charAt(0) || 'U'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
