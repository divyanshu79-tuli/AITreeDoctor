import React from 'react';
import { Leaf, Bot, Sprout, Calculator, Sparkles, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../firebase';

interface NavbarProps {
  activeTab: 'scanner' | 'chat' | 'garden' | 'calculator';
  setActiveTab: (tab: 'scanner' | 'chat' | 'garden' | 'calculator') => void;
  user: User | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#fdfcf6]/95 backdrop-blur-md border-b border-stone-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20 gap-2">
          {/* Logo & Title */}
          <div 
            id="brand-header" 
            onClick={() => setActiveTab('scanner')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-900 flex items-center justify-center text-emerald-100 shadow-md group-hover:scale-105 transition-transform border border-emerald-800 shrink-0">
              <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-base sm:text-2xl text-emerald-950 tracking-tight truncate">
                  VANANSH <span className="text-emerald-700 font-medium text-xs sm:text-xl">- AI Tree Doctor</span>
                </span>
                <span className="hidden md:inline-flex text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 shrink-0">
                  Agro-Botanist
                </span>
              </div>
              <p className="hidden sm:block text-xs text-stone-500 font-medium tracking-tight truncate">
                Plant Pathology, Diagnosis & Precision Tree Care
              </p>
            </div>
          </div>

          {/* Navigation Tabs - Desktop */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200">
            <button
              id="nav-tab-scanner"
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'scanner'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>Diagnosis</span>
            </button>

            <button
              id="nav-tab-chat"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'chat'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Dr. Vriksha</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              id="nav-tab-garden"
              onClick={() => setActiveTab('garden')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'garden'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>Garden Tracker</span>
            </button>

            <button
              id="nav-tab-calculator"
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'calculator'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Fertilizer Guide</span>
            </button>
          </nav>

          {/* Right Action Tools: Auth */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Firebase Auth Button */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-stone-200">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-stone-800 truncate max-w-[110px]">
                    {user.displayName || user.email?.split('@')[0] || 'Gardener'}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Cloud Synced</span>
                </div>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="User"
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-emerald-600"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-900 text-emerald-100 flex items-center justify-center font-bold text-xs">
                    {user.displayName ? user.displayName[0].toUpperCase() : 'G'}
                  </div>
                )}
                <button
                  id="btn-auth-signout"
                  onClick={onSignOut}
                  title="Sign Out"
                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-auth-signin"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-stone-900 hover:bg-emerald-900 text-white rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all shadow-xs min-h-[36px]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Sub-Bar */}
        <div className="lg:hidden grid grid-cols-4 py-1.5 border-t border-stone-200 gap-1">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all min-h-[44px] ${
              activeTab === 'scanner' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 active:bg-stone-100'
            }`}
          >
            <Leaf className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[10px] sm:text-[11px] truncate">Diagnose</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all min-h-[44px] ${
              activeTab === 'chat' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 active:bg-stone-100'
            }`}
          >
            <Bot className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[10px] sm:text-[11px] truncate">Doctor</span>
          </button>
          <button
            onClick={() => setActiveTab('garden')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all min-h-[44px] ${
              activeTab === 'garden' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 active:bg-stone-100'
            }`}
          >
            <Sprout className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[10px] sm:text-[11px] truncate">Garden</span>
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all min-h-[44px] ${
              activeTab === 'calculator' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 active:bg-stone-100'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[10px] sm:text-[11px] truncate">Fertilizer</span>
          </button>
        </div>
      </div>
    </header>
  );
};
