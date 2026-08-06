export type DeviceType = 'Tablet' | 'Laptop' | 'iPad' | 'Chromebook' | 'Other';

export type DeviceStatus = 'Checked-In' | 'Checked-Out' | 'In Repair' | 'Missing';

export type DeviceCondition = 'New' | 'Good' | 'Fair' | 'Damaged';

export interface Student {
  id: string;
  studentId: string; // e.g. "STU-2026-104" or "BIL-01"
  name: string; // NAMA MURID
  grade: string; // KELAS
  email: string;
  classRoom?: string;
  assignedDeviceId?: string;
  syncedAt?: string;

  // Malaysian Google Sheet Specific Headers
  bil?: string; // BIL
  namaGuruPembimbing?: string; // NAMA GURU PEMBIMBING
  noTel?: string; // NO TEL
  tujuanKegunaan?: string; // TUJUAN/KEGUNAAN
  tarikhTamat?: string; // TARIKH TAMAT
  catatan?: string; // CATATAN
}

export interface Device {
  id: string;
  studentId: string;
  studentName: string; // NAMA MURID
  studentGrade: string; // KELAS
  deviceType: DeviceType;
  brandModel: string; // e.g., "Apple iPad Air 10.9-inch"
  serialNumber: string; // e.g., "DMPX882910A"
  assetTag: string; // e.g., "BYOG-TAG-8821"
  qrCodeId: string; // Unique QR code string
  status: DeviceStatus;
  condition: DeviceCondition;
  registeredDate: string;
  lastCheckIn?: string;
  notes?: string; // CATATAN
  storageLocation?: string; // e.g., "Locker A-12", "IT Cart 3"

  // Malaysian Google Sheet loan metadata
  bil?: string; // BIL
  namaGuruPembimbing?: string; // NAMA GURU PEMBIMBING
  noTel?: string; // NO TEL
  tujuanKegunaan?: string; // TUJUAN/KEGUNAAN
  tarikhTamat?: string; // TARIKH TAMAT
}

export interface CheckInLog {
  id: string;
  deviceId: string;
  qrCodeId: string;
  studentName: string;
  studentId: string;
  deviceType: DeviceType;
  brandModel: string;
  assetTag: string;
  action: 'CHECK_IN' | 'CHECK_OUT';
  location: string; // e.g. "Main Library Gate", "IT Lab 1", "Classroom 3B"
  timestamp: string;
  conditionOnReturn?: DeviceCondition;
  inspectorName?: string;
  notes?: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  range: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export interface InventoryStats {
  totalDevices: number;
  checkedIn: number;
  checkedOut: number;
  inRepair: number;
  missing: number;
  byType: Record<DeviceType, number>;
}
