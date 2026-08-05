import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, LogIn, LayoutDashboard, Menu, X, LogOut, UserPlus, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PublicLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAuthenticated, isAdminUser, isPublicUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#1A1A1A] flex flex-col selection:bg-[#2A473E] selection:text-[#FAF6EE]">
      {/* Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FFFDF8]/90 backdrop-blur-md border-b border-[#DED2BE] shadow-sm'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2 rounded bg-[#2A473E] text-[#FAF6EE] shadow-sm group-hover:scale-105 transition-transform duration-300">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold font-serif text-[#2A473E] tracking-wide mt-0.5">
                  The Scriptorium
                </span>
                <span className="text-[9px] uppercase font-bold tracking-widest text-[#5F5A52]">
                  Arche Archives
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                to="/"
                className={`text-xs font-sans font-bold uppercase tracking-wider transition-colors ${
                  isActive('/') ? 'text-[#2A473E] border-b-2 border-[#2A473E] pb-1' : 'text-[#5F5A52] hover:text-[#2A473E]'
                }`}
              >
                Home
              </Link>
              <Link
                to="/books"
                className={`text-xs font-sans font-bold uppercase tracking-wider transition-colors ${
                  isActive('/books') ? 'text-[#2A473E] border-b-2 border-[#2A473E] pb-1' : 'text-[#5F5A52] hover:text-[#2A473E]'
                }`}
              >
                Browse Catalog
              </Link>
            </nav>

            {/* Action Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-4 select-none">
                  {/* User Profile Info */}
                  <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#F1E7D6] border border-[#DED2BE]">
                    <User className="w-3.5 h-3.5 text-[#5F5A52]" />
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#5F5A52]">
                      {currentUser?.name || 'Reader'}
                    </span>
                  </div>

                  {isAdminUser && (
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 rounded text-xs font-sans font-bold uppercase tracking-widest text-[#FAF6EE] bg-[#2A473E] hover:bg-[#1E342D] shadow-sm transition-all duration-200"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#FAF6EE]" />
                      Dashboard
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#8A2D3B] text-xs font-sans font-bold text-[#8A2D3B] hover:bg-[#8A2D3B]/5 active:scale-95 transition-all uppercase tracking-widest cursor-pointer shadow-sm"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 rounded text-xs font-sans font-bold uppercase tracking-widest text-[#FAF6EE] bg-[#2A473E] hover:bg-[#1E342D] shadow-sm transition-all duration-200"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded text-[#5F5A52] hover:text-[#1A1A1A] hover:bg-[#F1E7D6] focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#DED2BE] bg-[#FFFDF8]/95 backdrop-blur-lg select-none text-left">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/"
                onClick={handleNavClick}
                className={`block px-4 py-2.5 rounded text-sm font-sans font-bold uppercase tracking-widest ${
                  isActive('/') ? 'bg-[#2A473E]/10 text-[#2A473E]' : 'text-[#5F5A52] hover:bg-[#FAF6EE] hover:text-[#1A1A1A]'
                }`}
              >
                Home
              </Link>
              <Link
                to="/books"
                onClick={handleNavClick}
                className={`block px-4 py-2.5 rounded text-sm font-sans font-bold uppercase tracking-widest ${
                  isActive('/books') ? 'bg-[#2A473E]/10 text-[#2A473E]' : 'text-[#5F5A52] hover:bg-[#FAF6EE] hover:text-[#1A1A1A]'
                }`}
              >
                Browse Catalog
              </Link>

              <div className="pt-4 border-t border-[#DED2BE] px-4 pb-2 space-y-2">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded bg-[#F1E7D6]">
                      <User className="w-4 h-4 text-[#5F5A52]" />
                      <span className="text-xs font-sans font-bold uppercase tracking-wider text-[#5F5A52]">
                        {currentUser?.name || 'Reader'}
                      </span>
                    </div>

                    {isAdminUser && (
                      <Link
                        to="/dashboard"
                        onClick={handleNavClick}
                        className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded text-sm font-sans font-bold uppercase tracking-widest text-[#FAF6EE] bg-[#2A473E] transition-all"
                      >
                        <LayoutDashboard className="w-5 h-5 text-[#FAF6EE]" />
                        Dashboard
                      </Link>
                    )}

                    <button
                      onClick={() => { handleNavClick(); handleLogout(); }}
                      className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded text-sm font-sans font-bold uppercase tracking-widest text-[#8A2D3B] border border-[#8A2D3B] bg-transparent hover:bg-[#8A2D3B]/5 transition-all"
                    >
                      <LogOut className="w-5 h-5 text-[#8A2D3B]" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={handleNavClick}
                    className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded text-sm font-sans font-bold uppercase tracking-widest text-[#FAF6EE] bg-[#2A473E] transition-all"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#DED2BE] bg-[#FFFDF8] py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-[#2A473E]/10 text-[#2A473E]">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold tracking-widest text-[#2A473E] font-serif uppercase">
                THE SCRIPTORIUM
              </span>
            </div>
            <p className="text-[10px] text-[#5F5A52] font-sans uppercase tracking-wider font-semibold">
              &copy; {new Date().getFullYear()} Arche Archives. All rights reserved. Premium book publishing automation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
