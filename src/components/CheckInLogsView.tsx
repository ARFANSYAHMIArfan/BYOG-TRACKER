import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Tablet,
  Laptop,
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';
import { CheckInLog } from '../types';

interface CheckInLogsViewProps {
  logs: CheckInLog[];
}

export const CheckInLogsView: React.FC<CheckInLogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'CHECK_IN' | 'CHECK_OUT'>('ALL');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.brandModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
      const matchesType = deviceTypeFilter === 'ALL' || log.deviceType === deviceTypeFilter;

      return matchesSearch && matchesAction && matchesType;
    });
  }, [logs, searchTerm, actionFilter, deviceTypeFilter]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Action', 'Student Name', 'Student ID', 'Asset Tag', 'Device Model', 'Device Type', 'Location', 'Inspector', 'Condition', 'Notes'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      l.action,
      `"${l.studentName}"`,
      l.studentId,
      l.assetTag,
      `"${l.brandModel}"`,
      l.deviceType,
      `"${l.location}"`,
      `"${l.inspectorName || ''}"`,
      l.conditionOnReturn || '',
      `"${l.notes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BYOG_CheckIn_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCheckIns = logs.filter((l) => l.action === 'CHECK_IN').length;
  const totalCheckOuts = logs.filter((l) => l.action === 'CHECK_OUT').length;

  return (
    <div className="space-y-6">
      {/* Top Activity Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Check Events</p>
            <p className="text-2xl font-bold text-slate-900">{logs.length}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Check-Ins (Returns)</p>
            <p className="text-2xl font-bold text-emerald-600">{totalCheckIns}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Check-Outs (Issued)</p>
            <p className="text-2xl font-bold text-amber-600">{totalCheckOuts}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search log student, asset tag, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 border border-slate-200 transition-colors self-start md:self-auto"
            >
              <Download className="w-4 h-4" />
              Export Logs to CSV
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center flex-wrap gap-3 pt-2 text-xs border-t border-slate-100">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Action:
            </span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setActionFilter('ALL')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  actionFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActionFilter('CHECK_IN')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  actionFilter === 'CHECK_IN' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Check-Ins
              </button>
              <button
                onClick={() => setActionFilter('CHECK_OUT')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  actionFilter === 'CHECK_OUT' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Check-Outs
              </button>
            </div>

            <select
              value={deviceTypeFilter}
              onChange={(e) => setDeviceTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Device Types</option>
              <option value="Tablet">Tablet</option>
              <option value="iPad">iPad</option>
              <option value="Laptop">Laptop</option>
              <option value="Chromebook">Chromebook</option>
            </select>
          </div>
        </div>

        {/* Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Device & Tag</th>
                <th className="py-3 px-4">Location / Station</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Inspector / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <ClipboardList className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No log entries found</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.action === 'CHECK_IN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          CHECK-IN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                          <Clock className="w-3 h-3 text-amber-600" />
                          CHECK-OUT
                        </span>
                      )}
                    </td>

                    {/* Student */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{log.studentName}</p>
                      <p className="font-mono text-slate-400 text-[11px]">{log.studentId}</p>
                    </td>

                    {/* Device & Tag */}
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{log.brandModel}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                          {log.assetTag}
                        </span>
                        <span className="text-slate-400">{log.deviceType}</span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{log.location}</span>
                      </div>
                    </td>

                    {/* Condition */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium text-[11px]">
                        {log.conditionOnReturn || 'Good'}
                      </span>
                    </td>

                    {/* Inspector / Notes */}
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                      <p className="font-medium text-slate-800 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-indigo-600" />
                        {log.inspectorName || 'System Admin'}
                      </p>
                      {log.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5 truncate">{log.notes}</p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
