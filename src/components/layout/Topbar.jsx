import React from 'react';
import { Menu, Moon, Sun, LogOut, ShieldCheck, User } from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import { ROLE_LABELS } from '../../permissions/roles.js';

export const Topbar = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAdminAuth();
  const { isDark, toggleTheme } = useTheme();

  const roleDisplay = ROLE_LABELS[user?.role] || user?.role || 'Staff Member';

  return (
    <header className="h-16 px-4 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
      {/* Mobile Menu Trigger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Operations & Admin Gateway</span>
        </div>
      </div>

      {/* User Controls & Profile */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* User Identity pill */}
        <div className="flex items-center gap-3 pl-1">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold text-xs border border-blue-200 dark:border-blue-900">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {user?.name || 'Administrator'}
            </div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
              {roleDisplay}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign out of Admin Portal"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
