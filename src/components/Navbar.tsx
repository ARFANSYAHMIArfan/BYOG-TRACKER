import React from 'react';
import { Tablet, QrCode, ClipboardList, Sheet, Printer, ShieldCheck, RefreshCw, Smartphone } from 'lucide-react';
import { InventoryStats } from '../types';

interface NavbarProps {
  activeTab: 'inventory' | 'scanner' | 'logs' | 'sheets' | 'printer';
  setActiveTab: (tab: 'inventory' | 'scanner' | 'logs' | 'sheets' | 'printer') => void;
  stats: InventoryStats;
  isSheetsConnected: boolean;
  onRefreshData: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  stats,
  isSheetsConnected,
  onRefreshData,
  isRefreshing,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-mono">BYOG Tracker</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Smart Device Tracking System for Schools</p>
            </div>
          </div>

          {/* Quick Stats Banner & Actions */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <div className="text-slate-400">
                Total: <span className="text-white font-bold">{stats.totalDevices}</span>
              </div>
              <div className="w-px h-3 bg-slate-700"></div>
              <div className="text-emerald-400">
                In: <span className="font-bold">{stats.checkedIn}</span>
              </div>
              <div className="w-px h-3 bg-slate-700"></div>
              <div className="text-amber-400">
                Out: <span className="font-bold">{stats.checkedOut}</span>
              </div>
              {(stats.inRepair > 0 || stats.missing > 0) && (
                <>
                  <div className="w-px h-3 bg-slate-700"></div>
                  <div className="text-rose-400">
                    Alerts: <span className="font-bold">{stats.inRepair + stats.missing}</span>
                  </div>
                </>
              )}
            </div>

            {/* Google Sheets Sync Pill */}
            <button
              onClick={() => setActiveTab('sheets')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isSheetsConnected
                  ? 'bg-emerald-950/50 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Google Sheets Roster Connection Status"
            >
              <Sheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isSheetsConnected ? 'Sheets Synced' : 'Sync Sheets'}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefreshData}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-transform active:scale-95 disabled:opacity-50"
              title="Refresh inventory & logs"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 border-t border-slate-800 pt-2 pb-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tablet className="w-4 h-4" />
            Device Inventory
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'scanner'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            QR Check-In / Out
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Activity Logs
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'sheets'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sheet className="w-4 h-4 text-emerald-400" />
            Google Sheets Roster
          </button>

          <button
            onClick={() => setActiveTab('printer')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'printer'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Printer className="w-4 h-4" />
            QR Label Printer
          </button>
        </nav>
      </div>
    </header>
  );
};
