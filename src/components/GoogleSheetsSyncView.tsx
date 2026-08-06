import React, { useState, useRef } from 'react';
import {
  Sheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  ExternalLink,
  Sparkles,
  Database,
  ArrowRight,
  FileSpreadsheet,
  Link2,
  Edit2,
  Trash2,
  Plus,
  X,
  UserPlus,
  Save,
  Check,
  Upload,
  FileText
} from 'lucide-react';
import { Student } from '../types';
import { parseExcelOrCsvFile, parseStudentsFromRows } from '../utils/fileImporter';

interface GoogleSheetsSyncViewProps {
  students: Student[];
  onSyncStudents: (incomingStudents: Student[]) => Promise<void>;
  onUpdateStudent?: (student: Student) => Promise<void>;
  onDeleteStudent?: (studentId: string) => Promise<void>;
  onBulkDeleteStudents?: (studentIds: string[]) => Promise<void>;
  onAddStudent?: (student: Partial<Student>) => Promise<void>;
  isSheetsConnected: boolean;
  setIsSheetsConnected: (val: boolean) => void;
}

export const GoogleSheetsSyncView: React.FC<GoogleSheetsSyncViewProps> = ({
  students,
  onSyncStudents,
  onUpdateStudent,
  onDeleteStudent,
  onBulkDeleteStudents,
  onAddStudent,
  isSheetsConnected,
  setIsSheetsConnected,
}) => {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [sheetName, setSheetName] = useState('Sheet1');
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewStudents, setPreviewStudents] = useState<Student[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const studentFileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Modal States
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    bil: '',
    name: '',
    grade: '5 Beta',
    namaGuruPembimbing: '',
    noTel: '',
    tujuanKegunaan: '',
    tarikhTamat: '',
    catatan: '',
    studentId: '',
    email: '',
  });

  // Sample Public Google Sheet ID for 1-click test
  const SAMPLE_SHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'; // Public Google Sheet example or demo ID

  const handleStudentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setSyncStatusMsg(null);

    try {
      const rawRows = await parseExcelOrCsvFile(file);
      const parsedStudents = parseStudentsFromRows(rawRows);

      if (parsedStudents.length === 0) {
        setSyncStatusMsg({
          type: 'error',
          text: `Tiada rekod murid yang sah dijumpai dalam fail "${file.name}". Sila semak tajuk lajur (Nama, ID Murid, Kelas).`,
        });
        return;
      }

      setPreviewStudents(parsedStudents);
      setIsSheetsConnected(true);
      setSyncStatusMsg({
        type: 'success',
        text: `Berjaya membaca ${parsedStudents.length} rekod murid daripada fail "${file.name}"! Sila semak senarai di bawah dan klik "Komit Segerak / Commit Sync".`,
      });
    } catch (err: any) {
      console.error('File import error:', err);
      setSyncStatusMsg({
        type: 'error',
        text: `Gagal membaca fail "${file.name}": ${err.message || 'Sila pastikan format fail ialah .xlsx, .xls atau .csv'}`,
      });
    } finally {
      setIsLoading(false);
      if (studentFileInputRef.current) studentFileInputRef.current.value = '';
    }
  };

  const handleFetchSheet = async (overrideId?: string) => {
    setIsLoading(true);
    setSyncStatusMsg(null);

    const targetId = overrideId || spreadsheetUrl;

    if (!targetId.trim()) {
      setSyncStatusMsg({ type: 'error', text: 'Sila masukkan URL Google Sheet, ID Spreadsheet yang sah, atau muat naik fail .xlsx / .csv.' });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/sheets/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: targetId,
          sheetName,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch spreadsheet');
      }

      setPreviewStudents(data.students);
      setIsSheetsConnected(true);
      setSyncStatusMsg({
        type: 'success',
        text: `Successfully fetched ${data.totalRows} student records from Google Sheet! Review preview below before committing.`,
      });
    } catch (err: any) {
      console.error('Fetch error:', err);
      setSyncStatusMsg({
        type: 'error',
        text: `Tidak dapat menyambung ke Google Sheet: ${err.message || 'Sila pastikan pautan dibuka untuk awam (Anyone with link) atau gunakan butang "Muat Naik Fail (.xlsx / .csv)".'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitSync = async () => {
    if (!previewStudents || previewStudents.length === 0) return;
    setIsLoading(true);

    try {
      await onSyncStudents(previewStudents);
      setSyncStatusMsg({
        type: 'success',
        text: `Synced ${previewStudents.length} student records into BYOG Tracker roster!`,
      });
      setPreviewStudents(null);
    } catch (err: any) {
      setSyncStatusMsg({ type: 'error', text: 'Failed to sync students into roster.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({ ...student });
    setIsEditModalOpen(true);
  };

  // Save Edited Student
  const handleSaveEdit = async () => {
    if (!editingStudent || !formData.name?.trim()) return;
    const updated: Student = {
      ...editingStudent,
      bil: formData.bil || editingStudent.bil || '1',
      name: formData.name.trim(),
      grade: formData.grade?.trim() || 'Kelas 5',
      studentId: formData.studentId?.trim() || editingStudent.studentId,
      email: formData.email?.trim() || editingStudent.email,
      namaGuruPembimbing: formData.namaGuruPembimbing?.trim() || '',
      noTel: formData.noTel?.trim() || '',
      tujuanKegunaan: formData.tujuanKegunaan?.trim() || '',
      tarikhTamat: formData.tarikhTamat || '',
      catatan: formData.catatan?.trim() || '',
    };

    if (onUpdateStudent) {
      await onUpdateStudent(updated);
    }
    setIsEditModalOpen(false);
    setEditingStudent(null);
    setSyncStatusMsg({
      type: 'success',
      text: `Rekod murid "${updated.name}" berjaya dikemaskini / Student "${updated.name}" updated successfully!`,
    });
  };

  // Delete Student Confirmation
  const handleConfirmDelete = async (id: string) => {
    const target = students.find((s) => s.id === id);
    if (onDeleteStudent) {
      await onDeleteStudent(id);
    }
    setDeletingStudentId(null);
    setSyncStatusMsg({
      type: 'success',
      text: target ? `Rekod murid "${target.name}" telah dipadam.` : 'Rekod murid telah dipadam.',
    });
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      bil: `${students.length + 1}`,
      name: '',
      grade: '5 Beta',
      namaGuruPembimbing: '',
      noTel: '',
      tujuanKegunaan: '',
      tarikhTamat: '',
      catatan: '',
      studentId: `STU-2026-${String(students.length + 1).padStart(2, '0')}`,
      email: '',
    });
    setIsAddModalOpen(true);
  };

  // Save New Student
  const handleSaveAdd = async () => {
    if (!formData.name?.trim()) return;
    const newStu: Partial<Student> = {
      bil: formData.bil || `${students.length + 1}`,
      name: formData.name.trim(),
      grade: formData.grade?.trim() || 'Kelas 5',
      studentId: formData.studentId?.trim() || `STU-2026-${Date.now().toString().slice(-4)}`,
      email: formData.email?.trim() || `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@sekolah.edu.my`,
      namaGuruPembimbing: formData.namaGuruPembimbing?.trim() || '',
      noTel: formData.noTel?.trim() || '',
      tujuanKegunaan: formData.tujuanKegunaan?.trim() || '',
      tarikhTamat: formData.tarikhTamat || '',
      catatan: formData.catatan?.trim() || '',
    };

    if (onAddStudent) {
      await onAddStudent(newStu);
    }
    setIsAddModalOpen(false);
    setSyncStatusMsg({
      type: 'success',
      text: `Murid baharu "${newStu.name}" berjaya ditambah ke dalam senarai!`,
    });
  };

  // Bulk Selection Handlers
  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (filteredIds: string[]) => {
    const allSelected = filteredIds.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      // Unselect all filtered
      const filterSet = new Set(filteredIds);
      setSelectedStudentIds((prev) => prev.filter((id) => !filterSet.has(id)));
    } else {
      // Select all filtered
      const union = new Set([...selectedStudentIds, ...filteredIds]);
      setSelectedStudentIds(Array.from(union));
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;

    if (onBulkDeleteStudents) {
      await onBulkDeleteStudents(selectedStudentIds);
    } else if (onDeleteStudent) {
      for (const id of selectedStudentIds) {
        await onDeleteStudent(id);
      }
    }

    setSelectedStudentIds([]);
    setIsBulkDeleteModalOpen(false);
    setSyncStatusMsg({
      type: 'success',
      text: `Sebanyak ${count} rekod murid telah berjaya dipadam secara pukal.`,
    });
  };

  // Remove row from Preview Table
  const handleRemovePreviewRow = (index: number) => {
    if (!previewStudents) return;
    setPreviewStudents(previewStudents.filter((_, i) => i !== index));
  };

  const filteredRoster = students.filter(
    (st) =>
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.namaGuruPembimbing && st.namaGuruPembimbing.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (st.noTel && st.noTel.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (st.tujuanKegunaan && st.tujuanKegunaan.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (st.catatan && st.catatan.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (st.bil && st.bil.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white p-6 rounded-2xl border border-emerald-900 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Sheet className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Google Sheets Student Roster Sync</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Connect SM SAINS MUZAFFAR SYAH's central Google Sheet to automatically import student names, IDs, grades, and email contacts. Student list updates in Google Sheets will sync seamlessly into the BYOG Tracker.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
              isSheetsConnected
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSheetsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            ></span>
            {isSheetsConnected ? 'Google Sheets Live' : 'Not Connected'}
          </span>
        </div>
      </div>

      {/* Sync Configuration Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Link2 className="w-4 h-4 text-emerald-600" />
          Connect Google Sheet
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          <div className="md:col-span-8">
            <label className="block text-slate-600 font-semibold mb-1">
              Google Sheet URL or Spreadsheet ID
            </label>
            <input
              type="text"
              placeholder="e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMd..."
              value={spreadsheetUrl}
              onChange={(e) => setSpreadsheetUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-slate-600 font-semibold mb-1">Tab Name</label>
            <input
              type="text"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Sheet1"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSpreadsheetUrl(SAMPLE_SHEET_ID);
                handleFetchSheet(SAMPLE_SHEET_ID);
              }}
              className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Load Sample Google Sheet Data
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={studentFileInputRef}
              accept=".xlsx, .xls, .csv"
              onChange={handleStudentFileUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => studentFileInputRef.current?.click()}
              disabled={isLoading}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              Muat Naik Fail (.xlsx / .csv)
            </button>

            <button
              type="button"
              onClick={() => handleFetchSheet()}
              disabled={isLoading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Fetching Sheet...' : 'Fetch & Preview Sheet'}
            </button>
          </div>
        </div>

        {/* Status Alert */}
        {syncStatusMsg && (
          <div
            className={`p-3.5 rounded-lg text-xs flex items-center gap-2 ${
              syncStatusMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {syncStatusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{syncStatusMsg.text}</span>
          </div>
        )}
      </div>

      {/* Preview Table if sheet was fetched */}
      {previewStudents && previewStudents.length > 0 && (
        <div className="bg-white rounded-xl border border-emerald-300 shadow-md p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Preview Imported Rows ({previewStudents.length} Students)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review mapped student data before committing sync to local roster.
              </p>
            </div>

            <button
              onClick={handleCommitSync}
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Commit & Merge to Roster
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">BIL</th>
                  <th className="py-2.5 px-3">NAMA GURU PEMBIMBING</th>
                  <th className="py-2.5 px-3">NO TEL</th>
                  <th className="py-2.5 px-3">TUJUAN / KEGUNAAN</th>
                  <th className="py-2.5 px-3">NAMA MURID</th>
                  <th className="py-2.5 px-3">KELAS</th>
                  <th className="py-2.5 px-3">TARIKH TAMAT</th>
                  <th className="py-2.5 px-3">CATATAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewStudents.map((st, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">{st.bil || i + 1}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{st.namaGuruPembimbing || '-'}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{st.noTel || '-'}</td>
                    <td className="py-2 px-3 text-slate-700 font-medium">{st.tujuanKegunaan || '-'}</td>
                    <td className="py-2 px-3 font-semibold text-indigo-900">{st.name}</td>
                    <td className="py-2 px-3 text-slate-600 font-medium">{st.grade}</td>
                    <td className="py-2 px-3 text-slate-600 font-mono">{st.tarikhTamat || '-'}</td>
                    <td className="py-2 px-3 text-slate-500 italic">{st.catatan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Current Synced Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Active Student Roster ({students.length} Murid)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih petak (checkbox) untuk memadam murid secara pukal, atau klik butang sunting untuk mengubah nama.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari murid, guru, kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleOpenAdd}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-transform active:scale-95 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              + Tambah Murid
            </button>
          </div>
        </div>

        {/* Bulk Actions Banner */}
        {selectedStudentIds.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                {selectedStudentIds.length}
              </span>
              <span className="text-xs font-bold text-rose-900">
                {selectedStudentIds.length} rekod murid telah dipilih / selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedStudentIds([])}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-rose-100/50 rounded-lg font-medium transition-colors"
              >
                Batal Pilihan (Deselect)
              </button>

              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Padam Terpilih ({selectedStudentIds.length}) / Bulk Delete
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredRoster.length > 0 &&
                      filteredRoster.every((s) => selectedStudentIds.includes(s.id))
                    }
                    onChange={() => handleToggleSelectAll(filteredRoster.map((s) => s.id))}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title="Pilih Semua / Select All"
                  />
                </th>
                <th className="py-2.5 px-3">BIL</th>
                <th className="py-2.5 px-3">NAMA MURID (STUDENT NAME)</th>
                <th className="py-2.5 px-3">KELAS</th>
                <th className="py-2.5 px-3">NAMA GURU PEMBIMBING</th>
                <th className="py-2.5 px-3">NO TEL</th>
                <th className="py-2.5 px-3">TUJUAN / KEGUNAAN</th>
                <th className="py-2.5 px-3">TARIKH TAMAT</th>
                <th className="py-2.5 px-3">CATATAN</th>
                <th className="py-2.5 px-3 text-right">TINDAKAN / ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tiada rekod murid dijumpai. Klik '+ Tambah Murid' di atas untuk menambah baharu.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((s, idx) => {
                  const isSelected = selectedStudentIds.includes(s.id);
                  return (
                    <tr
                      key={s.id}
                      className={`transition-colors group ${
                        isSelected ? 'bg-rose-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectStudent(s.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{s.bil || idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-indigo-950">
                        <div>{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">{s.studentId}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">{s.grade}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{s.namaGuruPembimbing || '-'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{s.noTel || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-700">{s.tujuanKegunaan || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">{s.tarikhTamat || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">{s.catatan || '-'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            title="Sunting / Edit Maklumat Murid"
                            className="px-2 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-md transition-colors flex items-center gap-1 font-medium"
                          >
                            <Edit2 className="w-3 h-3 text-indigo-600" />
                            Sunting
                          </button>

                          <button
                            onClick={() => setDeletingStudentId(s.id)}
                            title="Padam / Delete Record"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* Delete Confirmation Modal */}
      {deletingStudentId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Padam Rekod Murid?</h3>
                <p className="text-xs text-slate-500">Delete Student Confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Adakah anda pasti untuk memadam murid{' '}
              <strong className="text-slate-900 font-bold">
                "{students.find((s) => s.id === deletingStudentId)?.name}"
              </strong>{' '}
              daripada senarai? Tindakan ini tidak boleh diundur.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingStudentId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold"
              >
                Batal (Cancel)
              </button>
              <button
                onClick={() => handleConfirmDelete(deletingStudentId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Ya, Padam (Delete)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {isEditModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Sunting Maklumat Murid</h3>
                  <p className="text-xs text-slate-500">Edit Student Details & Loan Information</p>
                </div>
              </div>

              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">BIL</label>
                  <input
                    type="text"
                    value={formData.bil || ''}
                    onChange={(e) => setFormData({ ...formData, bil: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Murid (Student Full Name) *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Muhammad Adam Bin Rosli"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas (Class)</label>
                  <input
                    type="text"
                    value={formData.grade || ''}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder="Contoh: 5 Beta"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student ID / Matrik</label>
                  <input
                    type="text"
                    value={formData.studentId || ''}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Guru Pembimbing</label>
                  <input
                    type="text"
                    value={formData.namaGuruPembimbing || ''}
                    onChange={(e) => setFormData({ ...formData, namaGuruPembimbing: e.target.value })}
                    placeholder="Contoh: Cikgu Ahmad Faiz"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No Tel Contact</label>
                  <input
                    type="text"
                    value={formData.noTel || ''}
                    onChange={(e) => setFormData({ ...formData, noTel: e.target.value })}
                    placeholder="012-3456789"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tujuan / Kegunaan</label>
                  <input
                    type="text"
                    value={formData.tujuanKegunaan || ''}
                    onChange={(e) => setFormData({ ...formData, tujuanKegunaan: e.target.value })}
                    placeholder="Program STEM & Coding"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarikh Tamat (End Date)</label>
                  <input
                    type="date"
                    value={formData.tarikhTamat || ''}
                    onChange={(e) => setFormData({ ...formData, tarikhTamat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan (Notes / Remarks)</label>
                <textarea
                  rows={2}
                  value={formData.catatan || ''}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  placeholder="Catatan tambahan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold"
              >
                Batal (Cancel)
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Perubahan (Save Changes)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Tambah Murid Baharu</h3>
                  <p className="text-xs text-slate-500">Add New Student to School Roster</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">BIL</label>
                  <input
                    type="text"
                    value={formData.bil || ''}
                    onChange={(e) => setFormData({ ...formData, bil: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Murid (Full Name) *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Muhammad Adam Bin Rosli"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas (Class)</label>
                  <input
                    type="text"
                    value={formData.grade || ''}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder="Contoh: 5 Beta"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student ID / Matrik</label>
                  <input
                    type="text"
                    value={formData.studentId || ''}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="STU-2026-10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Guru Pembimbing</label>
                  <input
                    type="text"
                    value={formData.namaGuruPembimbing || ''}
                    onChange={(e) => setFormData({ ...formData, namaGuruPembimbing: e.target.value })}
                    placeholder="Contoh: Cikgu Ahmad Faiz"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No Tel Contact</label>
                  <input
                    type="text"
                    value={formData.noTel || ''}
                    onChange={(e) => setFormData({ ...formData, noTel: e.target.value })}
                    placeholder="012-3456789"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tujuan / Kegunaan</label>
                  <input
                    type="text"
                    value={formData.tujuanKegunaan || ''}
                    onChange={(e) => setFormData({ ...formData, tujuanKegunaan: e.target.value })}
                    placeholder="Program STEM & Coding"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarikh Tamat (End Date)</label>
                  <input
                    type="date"
                    value={formData.tarikhTamat || ''}
                    onChange={(e) => setFormData({ ...formData, tarikhTamat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan (Notes)</label>
                <textarea
                  rows={2}
                  value={formData.catatan || ''}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  placeholder="Catatan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold"
              >
                Batal (Cancel)
              </button>
              <button
                type="button"
                onClick={handleSaveAdd}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Tambah Murid (Add Student)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal Confirmation */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Padam {selectedStudentIds.length} Rekod Murid?
                </h3>
                <p className="text-xs text-slate-500">Bulk Delete Confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Adakah anda pasti untuk memadam secara pukal{' '}
              <strong className="text-slate-900 font-bold">{selectedStudentIds.length} rekod murid</strong>{' '}
              yang telah dipilih daripada senarai sekolah? Tindakan ini adalah kekal.
            </p>

            <div className="max-h-32 overflow-y-auto bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1 text-xs">
              <div className="font-bold text-slate-500 text-[11px] mb-1">Senarai Murid Terpilih:</div>
              {students
                .filter((s) => selectedStudentIds.includes(s.id))
                .slice(0, 5)
                .map((s) => (
                  <div key={s.id} className="text-slate-700 font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>{s.name}</span>
                    <span className="text-slate-400 text-[10px]">({s.grade})</span>
                  </div>
                ))}
              {selectedStudentIds.length > 5 && (
                <div className="text-slate-400 italic text-[11px] pt-1">
                  ...dan {selectedStudentIds.length - 5} murid lagi.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold"
              >
                Batal (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Padam Pukal (Confirm Delete)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
