import React, { useState, useEffect } from 'react';
import { X, Tablet, Laptop, Sparkles, Save, User } from 'lucide-react';
import { Device, DeviceType, DeviceStatus, DeviceCondition, Student } from '../types';

interface DeviceModalProps {
  deviceToEdit?: Device | null;
  students: Student[];
  onSave: (device: Partial<Device>) => void;
  onClose: () => void;
}

export const DeviceModal: React.FC<DeviceModalProps> = ({
  deviceToEdit,
  students,
  onSave,
  onClose,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentGrade, setStudentGrade] = useState('Grade 10');
  const [namaGuruPembimbing, setNamaGuruPembimbing] = useState('');
  const [noTel, setNoTel] = useState('');
  const [tujuanKegunaan, setTujuanKegunaan] = useState('');
  const [tarikhTamat, setTarikhTamat] = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType>('Tablet');
  const [brandModel, setBrandModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [qrCodeId, setQrCodeId] = useState('');
  const [status, setStatus] = useState<DeviceStatus>('Checked-In');
  const [condition, setCondition] = useState<DeviceCondition>('Good');
  const [storageLocation, setStorageLocation] = useState('IT Cart 1');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (deviceToEdit) {
      setStudentName(deviceToEdit.studentName);
      setStudentId(deviceToEdit.studentId);
      setStudentGrade(deviceToEdit.studentGrade);
      setNamaGuruPembimbing(deviceToEdit.namaGuruPembimbing || '');
      setNoTel(deviceToEdit.noTel || '');
      setTujuanKegunaan(deviceToEdit.tujuanKegunaan || '');
      setTarikhTamat(deviceToEdit.tarikhTamat || '');
      setDeviceType(deviceToEdit.deviceType);
      setBrandModel(deviceToEdit.brandModel);
      setSerialNumber(deviceToEdit.serialNumber);
      setAssetTag(deviceToEdit.assetTag);
      setQrCodeId(deviceToEdit.qrCodeId);
      setStatus(deviceToEdit.status);
      setCondition(deviceToEdit.condition);
      setStorageLocation(deviceToEdit.storageLocation || '');
      setNotes(deviceToEdit.notes || '');
    } else {
      // Auto-generate fresh asset tag & QR code for new device
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const tag = `BYOG-TAG-${randomNum}`;
      setAssetTag(tag);
      setQrCodeId(tag);
      setSerialNumber(`SN-${Math.random().toString(36).substr(2, 8).toUpperCase()}`);
    }
  }, [deviceToEdit]);

  // When a student is selected from dropdown, auto fill student fields
  const handleStudentSelect = (sId: string) => {
    setSelectedStudentId(sId);
    const found = students.find((s) => s.id === sId || s.studentId === sId);
    if (found) {
      setStudentName(found.name);
      setStudentId(found.studentId);
      setStudentGrade(found.grade);
      setNamaGuruPembimbing(found.namaGuruPembimbing || '');
      setNoTel(found.noTel || '');
      setTujuanKegunaan(found.tujuanKegunaan || '');
      setTarikhTamat(found.tarikhTamat || '');
      if (found.catatan && !notes) setNotes(found.catatan);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !brandModel || !serialNumber) {
      alert('Please fill in Student Name, Device Model, and Serial Number.');
      return;
    }

    onSave({
      id: deviceToEdit ? deviceToEdit.id : undefined,
      studentName,
      studentId,
      studentGrade,
      namaGuruPembimbing,
      noTel,
      tujuanKegunaan,
      tarikhTamat,
      deviceType,
      brandModel,
      serialNumber,
      assetTag: assetTag || `BYOG-${Date.now()}`,
      qrCodeId: qrCodeId || assetTag || `BYOG-${Date.now()}`,
      status,
      condition,
      storageLocation,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Tablet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {deviceToEdit ? 'Edit Device Record' : 'Register New Student Device'}
              </h3>
              <p className="text-xs text-slate-400">
                {deviceToEdit ? 'Update details for ' + deviceToEdit.assetTag : 'Enter student and device specifications'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Section 1: Assigned Student */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block border-b pb-1">
              1. Assigned Student Information
            </span>

            {/* Select from Google Sheets Synced Roster */}
            {students.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Quick Select from Synced Roster
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose student from Google Sheets roster --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.studentId} • {st.grade})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Student Full Name (Nama Murid) *</label>
                <input
                  type="text"
                  required
                  placeholder="Muhammad Adam"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Student ID *</label>
                <input
                  type="text"
                  required
                  placeholder="STU-1001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Class (Kelas)</label>
                <input
                  type="text"
                  placeholder="5 Beta"
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nama Guru Pembimbing</label>
                <input
                  type="text"
                  placeholder="Cikgu Ahmad Faiz"
                  value={namaGuruPembimbing}
                  onChange={(e) => setNamaGuruPembimbing(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">No Tel Contact</label>
                <input
                  type="text"
                  placeholder="012-3456789"
                  value={noTel}
                  onChange={(e) => setNoTel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Tarikh Tamat (End Date)</label>
                <input
                  type="date"
                  value={tarikhTamat}
                  onChange={(e) => setTarikhTamat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-slate-600 mb-1">Tujuan / Kegunaan</label>
              <input
                type="text"
                placeholder="Program STEM & Coding Robotik"
                value={tujuanKegunaan}
                onChange={(e) => setTujuanKegunaan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Section 2: Device Specifications */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block border-b pb-1">
              2. Device Specifications & Barcode
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Device Category *</label>
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value as DeviceType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="Tablet">Tablet (Android/Generic)</option>
                  <option value="iPad">Apple iPad</option>
                  <option value="Laptop">Laptop / MacBook</option>
                  <option value="Chromebook">Chromebook</option>
                  <option value="Other">Other Device</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Brand & Model *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apple iPad Air (5th Gen)"
                  value={brandModel}
                  onChange={(e) => setBrandModel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Serial Number (S/N) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SMPX992011A"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Asset Tag / QR Code ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="BYOG-TAB-0101"
                  value={assetTag}
                  onChange={(e) => {
                    setAssetTag(e.target.value);
                    setQrCodeId(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-900"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Status & Location */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block border-b pb-1">
              3. Inventory Status & Storage
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DeviceStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Checked-In">Checked-In (In Storage)</option>
                  <option value="Checked-Out">Checked-Out (With Student)</option>
                  <option value="In Repair">In Repair</option>
                  <option value="Missing">Missing</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as DeviceCondition)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Storage Location</label>
                <input
                  type="text"
                  placeholder="IT Storage Cart 1"
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-slate-600 mb-1">Notes / Accessories</label>
              <input
                type="text"
                placeholder="Protective casing, charger, stylus included..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" />
              {deviceToEdit ? 'Save Changes' : 'Register Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
