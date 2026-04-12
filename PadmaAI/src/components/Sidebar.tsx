import { Home, History, Settings, HelpCircle, X, Calendar } from 'lucide-react';
import { View } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentView, onViewChange, isOpen, onClose }: SidebarProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ] as const;

  const SidebarContent = (
    <div className="h-full w-64 flex flex-col p-6 bg-surface-container-low border-r border-surface-variant/20 transition-colors duration-300">
      <div className="mb-10 px-4 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xl font-bold tracking-tighter text-primary font-headline">Padma AI</span>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">Active Intelligence</span>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex flex-col gap-2 flex-grow">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                onClose();
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-headline text-sm font-medium tracking-tight transition-all ${
                isActive
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-4 py-6 bg-surface-container-low rounded-xl">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            System Status
          </span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Online</span>
          </div>
          <p className="text-[10px] text-on-surface-variant leading-tight">
            Padma Neural Engine is active and synchronized.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full z-50">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 h-full z-[70] shadow-2xl"
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
