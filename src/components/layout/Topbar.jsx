import React from 'react';
import { Menu, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';

const Topbar = ({ setMobileOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard Overview';
    if (path.startsWith('/dashboard/books')) return 'Books Catalog';
    if (path.startsWith('/dashboard/review/text')) return 'Text Review';
    if (path.startsWith('/dashboard/review/covers')) return 'Cover Review';
    if (path.startsWith('/dashboard/review/rights')) return 'Rights Review';
    if (path.startsWith('/dashboard/recovery')) return 'Recovery Panel';
    if (path.startsWith('/dashboard/publishing')) return 'Publishing Pipeline';
    if (path.startsWith('/dashboard/data')) return 'Platform Data';
    return 'Dashboard';
  };

  const getRoleLabel = () => {
    const role = user?.role || 'Operator';
    if (role === 'admin') return 'Chief Editor';
    if (role === 'operator') return 'Operator Curation';
    if (role === 'text_reviewer') return 'Text Auditor';
    if (role === 'cover_reviewer') return 'Art Director';
    if (role === 'rights_reviewer') return 'Legal Counsel';
    return 'Catalog Viewer';
  };

  return (
    <header className="h-20 border-b border-[#DED2BE] bg-[#FFFDF8]/80 backdrop-blur-md flex items-center justify-between px-6 sm:px-8 shrink-0 select-none">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl text-[#5F5A52] hover:text-[#1A1A1A] hover:bg-[#FAF6EE] focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-bold text-[#1A1A1A] font-serif uppercase tracking-wide">
            {getPageTitle()}
          </h1>
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF6EE] border border-[#DED2BE] text-[10px] font-sans font-semibold text-[#3F6F5A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3F6F5A]" />
            System: Stable
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* User Context Node info */}
        <div className="hidden sm:flex flex-col items-end text-right">
          <span className="text-xs font-bold text-[#1A1A1A] font-serif uppercase tracking-wider">
            {getRoleLabel()}
          </span>
          <span className="text-[9px] font-sans uppercase tracking-widest text-[#5F5A52] flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3 h-3 text-[#3F6F5A]" />
            Authenticated Session
          </span>
        </div>

        {/* Sign Out Action Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#8A2D3B] text-xs font-sans font-bold text-[#8A2D3B] hover:bg-[#8A2D3B]/5 active:scale-95 transition-all uppercase tracking-widest cursor-pointer shadow-sm"
        >
          <LogOut className="w-3 h-3" />
          Sign Out
        </button>
      </div>
    </header>
  );
};

export default Topbar;
