import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, RefreshCw } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-gray-900 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-8 relative z-10">
        {/* Brand Logo */}
        <div className="flex justify-center">
          <div className="p-3 rounded-2xl bg-slate-900 border border-white/10 text-red-400 animate-pulse">
            <BookOpen className="w-8 h-8" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 leading-none">
            404
          </h1>
          <h2 className="text-lg sm:text-xl font-bold text-white uppercase tracking-wider">
            Page Not Found
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            The database coordinate or route path you requested could not be resolved.
          </p>
        </div>

        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-slate-900 border border-white/10 hover:border-cyan-500/30 hover:bg-slate-800 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            Back to Safety
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
