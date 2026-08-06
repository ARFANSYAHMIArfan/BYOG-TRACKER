import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_DEVICES, INITIAL_LOGS, INITIAL_STUDENTS } from './src/data/mockData';
import type { Device, CheckInLog, Student } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Data Store (Initialized with mock data)
let devices: Device[] = [...INITIAL_DEVICES];
let logs: CheckInLog[] = [...INITIAL_LOGS];
let students: Student[] = [...INITIAL_STUDENTS];

// --- API ENDPOINTS ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'BYOG Tracker', timestamp: new Date().toISOString() });
});

// GET all devices
app.get('/api/devices', (req, res) => {
  res.json(devices);
});

// POST add new device
app.post('/api/devices', (req, res) => {
  const newDevice: Device = {
    ...req.body,
    id: `dev-${Date.now()}`,
    registeredDate: req.body.registeredDate || new Date().toISOString().split('T')[0],
  };
  devices.unshift(newDevice);
  res.status(201).json(newDevice);
});

// PUT update device
app.put('/api/devices/:id', (req, res) => {
  const { id } = req.params;
  const index = devices.findIndex((d) => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Device not found' });
  }
  devices[index] = { ...devices[index], ...req.body };
  res.json(devices[index]);
});

// DELETE device
app.delete('/api/devices/:id', (req, res) => {
  const { id } = req.params;
  devices = devices.filter((d) => d.id !== id);
  res.json({ success: true, id });
});

// POST bulk import devices
app.post('/api/devices/bulk-import', (req, res) => {
  const incomingDevices: Device[] = req.body.devices || [];
  if (!Array.isArray(incomingDevices) || incomingDevices.length === 0) {
    return res.status(400).json({ error: 'devices array is required' });
  }
  const mode = req.body.mode || 'merge'; // 'merge' or 'replace'
  if (mode === 'replace') {
    devices = incomingDevices;
  } else {
    // Append or update existing devices by assetTag or serialNumber
    incomingDevices.forEach((dev) => {
      const idx = devices.findIndex(
        (d) => (d.assetTag && d.assetTag === dev.assetTag) || (d.serialNumber && d.serialNumber === dev.serialNumber)
      );
      if (idx >= 0) {
        devices[idx] = { ...devices[idx], ...dev };
      } else {
        devices.unshift({
          ...dev,
          id: dev.id || `dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        });
      }
    });
  }
  res.json({ success: true, count: devices.length, devices });
});

// GET all students
app.get('/api/students', (req, res) => {
  res.json(students);
});

// POST create single student
app.post('/api/students', (req, res) => {
  const newStudent: Student = {
    ...req.body,
    id: req.body.id || `stu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    studentId: req.body.studentId || `STU-${1000 + students.length}`,
    name: req.body.name || 'Murid Baru',
    grade: req.body.grade || 'Kelas 5',
    email: req.body.email || `student${Date.now()}@school.edu`,
    syncedAt: new Date().toISOString(),
  };
  students.unshift(newStudent);
  res.status(201).json(newStudent);
});

// PUT update student by ID
app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const index = students.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const oldStudent = students[index];
  const updatedStudent: Student = {
    ...oldStudent,
    ...req.body,
    id, // preserve ID
  };
  students[index] = updatedStudent;

  // Sync device records if student name or student ID changed
  devices = devices.map((d) => {
    if (d.studentId === oldStudent.studentId || d.studentName === oldStudent.name) {
      return {
        ...d,
        studentName: updatedStudent.name,
        studentId: updatedStudent.studentId,
        studentGrade: updatedStudent.grade,
        namaGuruPembimbing: updatedStudent.namaGuruPembimbing || d.namaGuruPembimbing,
        noTel: updatedStudent.noTel || d.noTel,
        tujuanKegunaan: updatedStudent.tujuanKegunaan || d.tujuanKegunaan,
        tarikhTamat: updatedStudent.tarikhTamat || d.tarikhTamat,
      };
    }
    return d;
  });

  res.json({ student: updatedStudent, updatedDevicesCount: devices.length });
});

// DELETE student by ID
app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const found = students.find((s) => s.id === id);
  if (!found) {
    return res.status(404).json({ error: 'Student not found' });
  }
  students = students.filter((s) => s.id !== id);
  res.json({ success: true, id, name: found.name });
});

// POST bulk delete students by array of IDs
app.post('/api/students/bulk-delete', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' });
  }
  const initialCount = students.length;
  const deleteSet = new Set(ids);
  students = students.filter((s) => !deleteSet.has(s.id));
  const deletedCount = initialCount - students.length;
  res.json({ success: true, deletedCount, remainingCount: students.length });
});

// POST sync student list from Google Sheets or form payload
app.post('/api/students/sync', (req, res) => {
  const incomingStudents: Student[] = req.body.students || [];
  if (!Array.isArray(incomingStudents) || incomingStudents.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty students payload' });
  }

  // Merge or replace student list
  const mode = req.body.mode || 'merge'; // 'merge' or 'replace'
  if (mode === 'replace') {
    students = incomingStudents;
  } else {
    // Upsert students by studentId
    incomingStudents.forEach((st) => {
      const existingIdx = students.findIndex((s) => s.studentId === st.studentId || s.email === st.email);
      if (existingIdx >= 0) {
        students[existingIdx] = { ...students[existingIdx], ...st, syncedAt: new Date().toISOString() };
      } else {
        students.push({ ...st, id: `stu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, syncedAt: new Date().toISOString() });
      }
    });
  }

  res.json({ success: true, count: students.length, students });
});

// GET check-in/out logs
app.get('/api/logs', (req, res) => {
  res.json(logs);
});

// POST Check-In or Check-Out event via QR Code or Manual scan
app.post('/api/check-in-out', (req, res) => {
  const { qrCodeId, action, location, inspectorName, conditionOnReturn, notes } = req.body;

  if (!qrCodeId || !action) {
    return res.status(400).json({ error: 'Missing qrCodeId or action (CHECK_IN / CHECK_OUT)' });
  }

  // Find device by qrCodeId or assetTag or serialNumber
  const device = devices.find(
    (d) =>
      d.qrCodeId.toLowerCase() === qrCodeId.trim().toLowerCase() ||
      d.assetTag.toLowerCase() === qrCodeId.trim().toLowerCase() ||
      d.serialNumber.toLowerCase() === qrCodeId.trim().toLowerCase()
  );

  if (!device) {
    return res.status(404).json({ error: `No device registered with tag/code "${qrCodeId}"` });
  }

  const nowStr = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(',', '');

  // Update device status
  device.status = action === 'CHECK_IN' ? 'Checked-In' : 'Checked-Out';
  device.lastCheckIn = nowStr;
  if (conditionOnReturn) {
    device.condition = conditionOnReturn;
  }

  // Create log entry
  const newLog: CheckInLog = {
    id: `log-${Date.now()}`,
    deviceId: device.id,
    qrCodeId: device.qrCodeId,
    studentName: device.studentName,
    studentId: device.studentId,
    deviceType: device.deviceType,
    brandModel: device.brandModel,
    assetTag: device.assetTag,
    action,
    location: location || 'General Kiosk',
    timestamp: nowStr,
    conditionOnReturn: conditionOnReturn || device.condition,
    inspectorName: inspectorName || 'System Admin',
    notes: notes || '',
  };

  logs.unshift(newLog);

  res.json({ success: true, device, log: newLog });
});

// POST Google Sheets Proxy - Fetch sheet by ID or URL
app.post('/api/sheets/fetch', async (req, res) => {
  const { spreadsheetId, sheetName, range } = req.body;

  if (!spreadsheetId) {
    return res.status(400).json({ error: 'Spreadsheet ID is required' });
  }

  try {
    // Extract actual ID if full URL was pasted
    let cleanId = spreadsheetId.trim();
    if (cleanId.includes('/d/')) {
      cleanId = cleanId.split('/d/')[1].split('/')[0];
    }

    // Attempt to fetch public CSV export first
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName || 'Sheet1')}`;
    const response = await fetch(gvizUrl);

    if (!response.ok) {
      return res.status(400).json({
        error: 'Unable to access Google Sheet. Please make sure the sheet link is shared as "Anyone with the link can view", or use the OAuth sync option.',
      });
    }

    const csvText = await response.text();
    const lines = csvText.split('\n').filter((l) => l.trim().length > 0);

    if (lines.length < 2) {
      return res.status(400).json({ error: 'Spreadsheet contains no data rows.' });
    }

    // Helper to parse CSV line
    const parseCSVLine = (text: string) => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.replace(/^"|"$/g, '').trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.replace(/^"|"$/g, '').trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
    const parsedRows = lines.slice(1).map((line) => {
      const cols = parseCSVLine(line);
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx] || '';
      });
      return rowObj;
    });

    // Map rows into Student objects
    const mappedStudents: Student[] = parsedRows.map((r, i) => {
      // Intelligently find header keys
      const findVal = (keys: string[]) => {
        for (const k of Object.keys(r)) {
          const lowerK = k.toLowerCase().trim();
          if (keys.some((key) => lowerK.includes(key))) {
            return r[k];
          }
        }
        return '';
      };

      const bil = findVal(['bil', 'bilangan', 'no.', 'num']) || `${i + 1}`;
      const name = findVal(['nama murid', 'nama pelajar', 'nama pelatih', 'student name', 'fullname', 'name', 'nama']) || r[headers[0]] || `Murid ${i + 1}`;
      const studentId = findVal(['student id', 'id murid', 'id', 'code']) || `STU-G-${1000 + i}`;
      const grade = findVal(['kelas', 'class', 'tingkatan', 'grade', 'year', 'form']) || 'Kelas 5';
      const email = findVal(['email', 'emel', 'mail']) || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@school.edu`;
      const classRoom = findVal(['room', 'bilik', 'homeroom', 'location']) || grade;

      const namaGuruPembimbing = findVal(['nama guru pebimbing', 'nama guru pembimbing', 'guru pembimbing', 'guru', 'advisor', 'teacher', 'supervisor']);
      const noTel = findVal(['no tel', 'no. tel', 'no hp', 'phone', 'tel', 'mobile', 'telefon', 'no. hp']);
      const tujuanKegunaan = findVal(['tujuan/kegunaan', 'tujuan', 'kegunaan', 'purpose', 'usage', 'reason']);
      const tarikhTamat = findVal(['tarikh tamat', 'tarikh pemulangan', 'tarikh akhir', 'end date', 'due date', 'expiry']);
      const catatan = findVal(['catatan', 'nota', 'notes', 'remarks', 'comment', 'keterangan']);

      return {
        id: `stu-gsheet-${Date.now()}-${i}`,
        studentId,
        name,
        grade,
        email,
        classRoom,
        bil,
        namaGuruPembimbing,
        noTel,
        tujuanKegunaan,
        tarikhTamat,
        catatan,
        syncedAt: new Date().toISOString(),
      };
    });

    return res.json({
      success: true,
      spreadsheetId: cleanId,
      totalRows: mappedStudents.length,
      headers,
      students: mappedStudents,
    });
  } catch (err: any) {
    console.error('Error fetching google sheet:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch spreadsheet data' });
  }
});

// Setup Vite Development Server or Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BYOG Tracker] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
