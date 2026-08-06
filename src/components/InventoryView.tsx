import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  Filter,
  Tablet,
  Laptop,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  QrCode,
  Edit2,
  Trash2,
  ArrowUpDown,
  Download,
  Printer,
  Sparkles,
  Info,
  Upload,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { Device, DeviceType, DeviceStatus, Student } from '../types';
import { parseExcelOrCsvFile, parseDevicesFromRows } from '../utils/fileImporter';

interface InventoryViewProps {
  devices: Device[];
  students: Student[];
  onAddDevice: () => void;
  onEditDevice: (device: Device) => void;
  onDeleteDevice: (id: string) => void;
  onQuickCheckInOut: (device: Device) => void;
  onShowQRModal: (device: Device) => void;
  onSelectForPrint: (devices: Device[]) => void;
  onImportDevices?: (importedDevices: Device[]) => Promise<void> | void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  devices,
  students,
  onAddDevice,
  onEditDevice,
  onDeleteDevice,
  onQuickCheckInOut,
  onShowQRModal,
  onSelectForPrint,
  onImportDevices,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'studentName' | 'brandModel' | 'registeredDate'>('studentName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // File Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatusMsg, setImportStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Filtered & Sorted Devices
  const filteredDevices = useMemo(() => {
    return devices
      .filter((device) => {
        const matchesSearch =
          device.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          device.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          device.brandModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
          device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          device.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
          device.qrCodeId.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === 'ALL' || device.deviceType === typeFilter;
        const matchesStatus = statusFilter === 'ALL' || device.status === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';
        if (sortOrder === 'asc') {
          return valA.localeCompare(valB);
        } else {
          return valB.localeCompare(valA);
        }
      });
  }, [devices, searchTerm, typeFilter, statusFilter, sortField, sortOrder]);

  const toggleSelectAll = () => {
    if (selectedDeviceIds.length === filteredDevices.length) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(filteredDevices.map((d) => d.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const headers = ['Asset Tag', 'Student Name', 'Student ID', 'Grade', 'Device Type', 'Model', 'Serial Number', 'Status', 'Condition', 'Location'];
    const rows = filteredDevices.map((d) => [
      d.assetTag,
      `"${d.studentName}"`,
      d.studentId,
      d.studentGrade,
      d.deviceType,
      `"${d.brandModel}"`,
      d.serialNumber,
      d.status,
      d.condition,
      `"${d.storageLocation || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BYOG_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeviceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportStatusMsg(null);

    try {
      const rawRows = await parseExcelOrCsvFile(file);
      const parsedDevices = parseDevicesFromRows(rawRows);
      if (parsedDevices.length === 0) {
        setImportStatusMsg({
          type: 'error',
          text: `Tiada rekod peranti dijumpai dalam fail "${file.name}". Sila semak lajur fail.`,
        });
        return;
      }

      if (onImportDevices) {
        await onImportDevices(parsedDevices);
      }

      setImportStatusMsg({
        type: 'success',
        text: `Berjaya mengimport ${parsedDevices.length} peranti daripada fail "${file.name}"!`,
      });
    } catch (err: any) {
      console.error(err);
      setImportStatusMsg({
        type: 'error',
        text: `Gagal mengimport fail: ${err.message || 'Sila pastikan fail ialah format .xlsx atau .csv'}`,
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getStatusBadge = (status: DeviceStatus) => {
    switch (status) {
      case 'Checked-In':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Checked-In
          </span>
        );
      case 'Checked-Out':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
            <Clock className="w-3 h-3 text-amber-500" />
            Checked-Out
          </span>
        );
      case 'In Repair':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            In Repair
          </span>
        );
      case 'Missing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300 rounded-full">
            <XCircle className="w-3 h-3 text-slate-500" />
            Missing
          </span>
        );
    }
  };

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'Tablet':
      case 'iPad':
        return <Tablet className="w-4 h-4 text-indigo-600" />;
      case 'Laptop':
      case 'Chromebook':
        return <Laptop className="w-4 h-4 text-blue-600" />;
      default:
        return <Tablet className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Category Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Tablets & iPads</p>
            <p className="text-2xl font-bold text-slate-900">
              {devices.filter((d) => d.deviceType === 'Tablet' || d.deviceType === 'iPad').length}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Tablet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Laptops & MacBooks</p>
            <p className="text-2xl font-bold text-slate-900">
              {devices.filter((d) => d.deviceType === 'Laptop').length}
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Laptop className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Chromebooks</p>
            <p className="text-2xl font-bold text-slate-900">
              {devices.filter((d) => d.deviceType === 'Chromebook').length}
            </p>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
            <Laptop className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Checked-In Storage</p>
            <p className="text-2xl font-bold text-emerald-600">
              {devices.filter((d) => d.status === 'Checked-In').length}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, serial #, tag, model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center flex-wrap gap-2">
              {selectedDeviceIds.length > 0 && (
                <button
                  onClick={() => {
                    const selected = devices.filter((d) => selectedDeviceIds.includes(d.id));
                    onSelectForPrint(selected);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print QR Labels ({selectedDeviceIds.length})
                </button>
              )}

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls, .csv"
                onChange={handleDeviceFileUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                <Upload className={`w-4 h-4 ${isImporting ? 'animate-bounce' : ''}`} />
                {isImporting ? 'Importing...' : 'Import (.xlsx / .csv)'}
              </button>

              <button
                onClick={onAddDevice}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Register Device
              </button>
            </div>
          </div>

          {/* Import Status Alert Banner */}
          {importStatusMsg && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center justify-between gap-2 ${
                importStatusMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {importStatusMsg.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                )}
                <span className="font-medium">{importStatusMsg.text}</span>
              </div>
              <button
                onClick={() => setImportStatusMsg(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>
          )}

          {/* Filters Row */}
          <div className="flex items-center flex-wrap gap-3 pt-2 text-xs border-t border-slate-100">
            <div className="flex items-center gap-1 text-slate-500 font-medium">
              <Filter className="w-3.5 h-3.5" /> Filter by:
            </div>

            {/* Device Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Device Types</option>
              <option value="Tablet">Tablet</option>
              <option value="iPad">iPad</option>
              <option value="Laptop">Laptop</option>
              <option value="Chromebook">Chromebook</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Checked-In">Checked-In</option>
              <option value="Checked-Out">Checked-Out</option>
              <option value="In Repair">In Repair</option>
              <option value="Missing">Missing</option>
            </select>

            {/* Sort Dropdown */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-slate-400">Sort:</span>
              <button
                onClick={() => {
                  if (sortField === 'studentName') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else setSortField('studentName');
                }}
                className={`px-2 py-1 rounded text-xs border ${
                  sortField === 'studentName'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Student Name {sortField === 'studentName' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>

        {/* Device Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredDevices.length > 0 && selectedDeviceIds.length === filteredDevices.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="py-3 px-4">Asset & Device</th>
                <th className="py-3 px-4">Assigned Student</th>
                <th className="py-3 px-4">Serial / QR ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Storage Location</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No devices found matching criteria</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try clearing search filters or add a new device record.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => {
                  const isSelected = selectedDeviceIds.includes(device.id);
                  return (
                    <tr
                      key={device.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(device.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Device Model & Tag */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-600 flex-shrink-0">
                            {getDeviceIcon(device.deviceType)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-snug">{device.brandModel}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                {device.assetTag}
                              </span>
                              <span className="text-xs text-slate-400">{device.deviceType}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{device.studentName}</p>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{device.studentId}</span>
                          <span>•</span>
                          <span>{device.studentGrade}</span>
                        </div>
                      </td>

                      {/* Serial Number & QR */}
                      <td className="py-3 px-4 font-mono text-xs">
                        <p className="text-slate-800 font-semibold">{device.serialNumber}</p>
                        <p className="text-slate-400 text-[11px]">QR: {device.qrCodeId}</p>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">{getStatusBadge(device.status)}</td>

                      {/* Condition */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                            device.condition === 'New'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : device.condition === 'Good'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : device.condition === 'Fair'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {device.condition}
                        </span>
                      </td>

                      {/* Storage Location */}
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {device.storageLocation || 'Unassigned'}
                        {device.lastCheckIn && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Last: {device.lastCheckIn}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Check-In / Check-Out */}
                          <button
                            onClick={() => onQuickCheckInOut(device)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                              device.status === 'Checked-In'
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                            title={device.status === 'Checked-In' ? 'Check Out Device' : 'Check In Device'}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {device.status === 'Checked-In' ? 'Check Out' : 'Check In'}
                          </button>

                          {/* Show QR Label Modal */}
                          <button
                            onClick={() => onShowQRModal(device)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                            title="View / Print QR Code Tag"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onEditDevice(device)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                            title="Edit Device Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${device.brandModel} (${device.assetTag})?`)) {
                                onDeleteDevice(device.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete Device Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Showing <strong className="text-slate-800">{filteredDevices.length}</strong> of{' '}
            <strong className="text-slate-800">{devices.length}</strong> total registered devices
          </span>
          <span className="font-mono">BYOG Tracker v2.4 • Live Inventory</span>
        </div>
      </div>
    </div>
  );
};
