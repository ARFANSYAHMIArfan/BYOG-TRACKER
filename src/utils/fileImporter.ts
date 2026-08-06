import * as XLSX from 'xlsx';
import { Student, Device, DeviceType, DeviceStatus } from '../types';

/**
 * Parses any .xlsx, .xls, or .csv file into JSON row objects
 */
export async function parseExcelOrCsvFile(file: File): Promise<Record<string, any>[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Failure reading file: sheet not found.');
  }
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
  return rows;
}

/**
 * Maps raw spreadsheet rows into Student objects
 */
export function parseStudentsFromRows(rows: Record<string, any>[]): Student[] {
  return rows
    .map((row, index) => {
      const getVal = (keys: string[]) => {
        for (const k of Object.keys(row)) {
          const cleanK = k.trim().toLowerCase();
          for (const target of keys) {
            if (cleanK === target.toLowerCase() || cleanK.includes(target.toLowerCase())) {
              const val = row[k];
              return val !== undefined && val !== null ? String(val).trim() : '';
            }
          }
        }
        return '';
      };

      const name =
        getVal(['nama murid', 'student name', 'nama', 'name', 'full name', 'nama pelajar']) ||
        `Murid ${index + 1}`;

      const grade =
        getVal(['kelas', 'grade', 'class', 'tingkatan', 'darjah']) || 'Kelas 5';

      const studentId =
        getVal(['student id', 'id murid', 'matrik', 'id', 'no matrik', 'no kp']) ||
        `STU-${202600 + index + 1}`;

      const email =
        getVal(['email', 'e-mel', 'emel', 'surat elektronik']) ||
        `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@sekolah.edu.my`;

      const bil =
        getVal(['bil', 'no', '#', 'bilangan']) || `${index + 1}`;

      const namaGuruPembimbing = getVal([
        'nama guru pembimbing',
        'guru pembimbing',
        'guru',
        'advisor',
        'teacher',
        'pembimbing',
      ]);

      const noTel = getVal([
        'no tel',
        'no telefon',
        'phone',
        'contact',
        'tel',
        'no hp',
      ]);

      const tujuanKegunaan = getVal([
        'tujuan/kegunaan',
        'tujuan kegunaan',
        'tujuan',
        'kegunaan',
        'purpose',
        'usage',
      ]);

      const tarikhTamat = getVal([
        'tarikh tamat',
        'tarikh',
        'end date',
        'due date',
        'date',
      ]);

      const catatan = getVal(['catatan', 'notes', 'remarks', 'slogan', 'keterangan']);

      return {
        id: `stu-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        studentId,
        name,
        grade,
        email,
        bil,
        namaGuruPembimbing,
        noTel,
        tujuanKegunaan,
        tarikhTamat,
        catatan,
        syncedAt: new Date().toISOString(),
      };
    })
    .filter((st) => st.name && st.name !== 'Murid ');
}

/**
 * Maps raw spreadsheet rows into Device objects
 */
export function parseDevicesFromRows(rows: Record<string, any>[]): Device[] {
  return rows
    .map((row, index) => {
      const getVal = (keys: string[]) => {
        for (const k of Object.keys(row)) {
          const cleanK = k.trim().toLowerCase();
          for (const target of keys) {
            if (cleanK === target.toLowerCase() || cleanK.includes(target.toLowerCase())) {
              const val = row[k];
              return val !== undefined && val !== null ? String(val).trim() : '';
            }
          }
        }
        return '';
      };

      const assetTag =
        getVal(['asset tag', 'tag aset', 'asset', 'tag', 'no aset']) ||
        `BYOG-DEV-${1000 + index + 1}`;

      const studentName =
        getVal(['student name', 'nama murid', 'student', 'nama', 'name', 'pelajar']) ||
        'Tiada Nama';

      const studentId =
        getVal(['student id', 'id murid', 'matrik', 'id']) || 'STU-0000';

      const studentGrade =
        getVal(['grade', 'kelas', 'class', 'tingkatan']) || 'Kelas 5';

      const rawType =
        getVal(['device type', 'jenis peranti', 'type', 'peranti', 'device']) ||
        'Tablet';

      let deviceType: DeviceType = 'Tablet';
      if (/ipad/i.test(rawType)) deviceType = 'iPad';
      else if (/laptop/i.test(rawType)) deviceType = 'Laptop';
      else if (/chromebook/i.test(rawType)) deviceType = 'Chromebook';
      else if (/tablet/i.test(rawType)) deviceType = 'Tablet';
      else if (rawType) deviceType = 'Other';

      const brandModel =
        getVal(['brand model', 'model', 'jenama', 'brand']) || 'Model Peranti';

      const serialNumber =
        getVal(['serial number', 'nombor siri', 'serial', 's/n', 'no siri']) ||
        `SN-${Date.now().toString().slice(-6)}-${index + 1}`;

      const qrCodeId =
        getVal(['qr code id', 'qr code', 'qr id', 'qr', 'code']) || assetTag;

      const rawStatus = getVal(['status', 'status peranti']) || 'Checked-In';
      let status: DeviceStatus = 'Checked-In';
      if (/out/i.test(rawStatus) || /pinjam/i.test(rawStatus)) status = 'Checked-Out';
      else if (/repair/i.test(rawStatus) || /rosak/i.test(rawStatus) || /baiki/i.test(rawStatus)) status = 'In Repair';
      else if (/missing/i.test(rawStatus) || /hilang/i.test(rawStatus)) status = 'Missing';

      const condition =
        (getVal(['condition', 'keadaan', 'kondisi']) as any) || 'Good';

      const storageLocation =
        getVal(['storage location', 'location', 'lokasi', 'tempat', 'rak']) ||
        'Kabinet IT';

      const notes = getVal(['notes', 'catatan', 'remarks', 'keterangan']) || '';

      return {
        id: `dev-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        assetTag,
        studentName,
        studentId,
        studentGrade,
        deviceType,
        brandModel,
        serialNumber,
        qrCodeId,
        status,
        condition: condition || 'Good',
        storageLocation,
        notes,
        registeredDate: new Date().toISOString().split('T')[0],
        lastCheckIn: new Date().toLocaleString('en-US', { hour12: false }),
      };
    })
    .filter((d) => d.brandModel || d.assetTag);
}
