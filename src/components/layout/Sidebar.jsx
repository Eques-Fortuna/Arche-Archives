import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Book,
  FileText,
  Image,
  ShieldCheck,
  RotateCcw,
  UploadCloud,
  Database,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canRunAutomation } from '../../lib/auth';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const { user } = useAuth();

  const mainNavItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Books Catalog', path: '/dashboard/books', icon: Book },
    { label: 'Recovery Panel', path: '/dashboard/recovery', icon: RotateCcw },
    { label: 'Platform Data', path: '/dashboard/data', icon: Database },
  ];

  const reviewNavItems = [
    { label: 'Text Review', path: '/dashboard/review/text', icon: FileText },
    { label: 'Cover Review', path: '/dashboard/review/covers', icon: Image },
    { label: 'Rights Review', path: '/dashboard/review/rights', icon: ShieldCheck },
    { label: 'Publishing Feed', path: '/dashboard/publishing', icon: UploadCloud },
  ];

  const phaseNavItems = [
    { label: 'P1', fullName: 'P1: Ingest & Normalize', path: '/dashboard/phases/1' },
    { label: 'P2', fullName: 'P2: Structure Parsing', path: '/dashboard/phases/2' },
    { label: 'P3', fullName: 'P3: Layout Render', path: '/dashboard/phases/3' },
    { label: 'P4', fullName: 'P4: Approved Text Copy', path: '/dashboard/phases/4' },
    { label: 'P5', fullName: 'P5: Cover Gen', path: '/dashboard/phases/5' },
    { label: 'P6', fullName: 'P6: Cover Copy', path: '/dashboard/phases/6' },
    { label: 'P8', fullName: 'P8: Final Assembly', path: '/dashboard/phases/8' },
    { label: 'P10', fullName: 'P10: Data Packaging', path: '/dashboard/phases/10' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const renderNavLinks = (items) => {
    return items.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.path);
      return (
        <Link
          key={item.path}
          to={item.path}
          className={`flex items-center gap-3 px-4 py-2 rounded transition-all duration-250 group ${
            active
              ? 'bg-[#2A473E] text-[#FAF6EE] font-bold shadow-sm'
              : 'text-[#3A352F] hover:text-[#2A473E] hover:bg-[#FFFDF8]/40'
          }`}
        >
          {Icon && <Icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-[#FAF6EE]' : 'text-[#3A352F] group-hover:text-[#2A473E]'}`} />}
          <span className="font-sans text-xs uppercase tracking-wider">{item.label}</span>
        </Link>
      );
    });
  };

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[#DED2BE] bg-[#F1E7D6] shrink-0 h-screen overflow-y-auto justify-between">
        <div className="flex flex-col">
          {/* Brand */}
          <div className="py-6 px-6 border-b border-[#DED2BE]">
            <h2 className="text-xl font-bold tracking-wide text-[#2A473E] font-serif">
              The Scriptorium
            </h2>
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#5F5A52] block mt-0.5">
              Arche Archives
            </span>
          </div>

          {/* Navigation */}
          <nav className="px-4 py-6 space-y-6">
            {/* Operations Section */}
            <div className="space-y-1">
              <span className="px-4 text-[9px] font-bold text-[#5F5A52] uppercase tracking-widest block mb-2">Ingestion Ops</span>
              {renderNavLinks(mainNavItems)}
            </div>

            {/* Editorial Approvals */}
            <div className="space-y-1">
              <span className="px-4 text-[9px] font-bold text-[#5F5A52] uppercase tracking-widest block mb-2">Human Approvals</span>
              {renderNavLinks(reviewNavItems)}
            </div>

            {/* Automation Pipelines */}
            <div className="space-y-2">
              <span className="px-4 text-[9px] font-bold text-[#5F5A52] uppercase tracking-widest block mb-1">Automation Phases</span>
              <div className="grid grid-cols-4 gap-1.5 px-2">
                {phaseNavItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-center p-2 rounded border text-[10px] font-mono transition-all ${
                        active
                          ? 'bg-[#2A473E] text-[#FAF6EE] border-[#2A473E] font-bold shadow-md'
                          : 'bg-[#FFFDF8] text-[#1A1A1A] border-[#DED2BE] hover:bg-[#FAF6EE] hover:border-[#2A473E]'
                      }`}
                      title={item.fullName}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* User profile & Action widget at bottom */}
        <div className="flex flex-col border-t border-[#DED2BE] bg-[#F1E7D6]">
          {/* Add New Collection button */}
          {canRunAutomation(user) && (
            <div className="p-4 border-b border-[#DED2BE]">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-register-book'))}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-[#2A473E] hover:bg-[#1E342D] text-[#FAF6EE] font-bold transition-all text-xs uppercase tracking-widest font-sans cursor-pointer shadow-sm"
              >
                + New Collection
              </button>
            </div>
          )}

          {/* User Widget */}
          <div className="p-4 flex items-center gap-3 bg-[#EAE0CD]">
            <div className="w-10 h-10 rounded bg-[#2A473E] flex items-center justify-center text-[#FAF6EE] font-serif font-bold text-base shadow-sm shrink-0 border border-[#DED2BE]">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold truncate text-[#1A1A1A] font-serif uppercase tracking-wider">{user?.name || 'Publisher'}</h4>
              <p className="text-[10px] text-[#5F5A52] truncate font-sans uppercase tracking-widest">{user?.role || 'Operator'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Menu */}
          <aside className="relative flex flex-col w-72 max-w-xs bg-[#F1E7D6] border-r border-[#DED2BE] text-[#1A1A1A]">
            <div className="py-6 px-6 border-b border-[#DED2BE] flex justify-between items-center bg-[#EAE0CD]">
              <div>
                <h2 className="text-lg font-bold tracking-wide text-[#2A473E] font-serif">The Scriptorium</h2>
                <span className="text-[9px] uppercase font-bold tracking-widest text-[#5F5A52]">Arche Archives</span>
              </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto" onClick={() => setMobileOpen(false)}>
              <div className="space-y-1">
                <span className="px-4 text-[9px] font-bold text-[#5F5A52] uppercase tracking-widest block mb-2">Ingestion Ops</span>
                {renderNavLinks(mainNavItems)}
              </div>

              <div className="space-y-1">
                <span className="px-4 text-[9px] font-bold text-[#5F5A52] uppercase tracking-widest block mb-2">Human Approvals</span>
                {renderNavLinks(reviewNavItems)}
              </div>

              <div className="space-y-2">
                <span className="px-4 text-[9px] font-bold text-[#5F5A52] uppercase tracking-widest block mb-1">Automation Phases</span>
                <div className="grid grid-cols-4 gap-1.5 px-2">
                  {phaseNavItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center justify-center p-2 rounded border text-[10px] font-mono transition-all ${
                          active
                            ? 'bg-[#2A473E] text-[#FAF6EE] border-[#2A473E] font-bold'
                            : 'bg-[#FFFDF8] text-[#1A1A1A] border-[#DED2BE]'
                        }`}
                        title={item.fullName}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </nav>

            {canRunAutomation(user) && (
              <div className="border-t border-[#DED2BE] bg-[#EAE0CD] p-4">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    window.dispatchEvent(new CustomEvent('open-register-book'));
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-[#2A473E] text-[#FAF6EE] font-bold text-xs uppercase tracking-widest font-sans"
                >
                  + New Collection
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
