import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { InventoryView } from './components/InventoryView';
import { QRScannerView } from './components/QRScannerView';
import { CheckInLogsView } from './components/CheckInLogsView';
import { GoogleSheetsSyncView } from './components/GoogleSheetsSyncView';
import { QRLabelPrinterModal } from './components/QRLabelPrinterModal';
import { DeviceModal } from './components/DeviceModal';
import { LoginView } from './components/LoginView';
import { Device, Student, CheckInLog, InventoryStats, DeviceType } from './types';
import {
  subscribeStudents,
  subscribeDevices,
  subscribeLogs,
  fsSaveDevice,
  fsDeleteDevice,
  fsSaveStudent,
  fsDeleteStudent,
  fsBulkDeleteStudents,
  fsSyncStudentsList,
  fsBulkImportDevices,
  fsAddLog,
} from './lib/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'scanner' | 'logs' | 'sheets' | 'printer'>('inventory');

  // Auth Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('mozac_byog_session'));
  });
  const [kodSekolah, setKodSekolah] = useState<string>('MEE2141');

  const handleLogout = () => {
    localStorage.removeItem('mozac_byog_session');
    setIsAuthenticated(false);
  };

  const handleLoginSuccess = (kod: string) => {
    setKodSekolah(kod);
    setIsAuthenticated(true);
  };

  // Application Data States
  const [devices, setDevices] = useState<Device[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<CheckInLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSheetsConnected, setIsSheetsConnected] = useState<boolean>(true);

  // Quick Action & Modal States
  const [selectedDeviceForQuickAction, setSelectedDeviceForQuickAction] = useState<Device | null>(null);
  const [deviceModalOpen, setDeviceModalOpen] = useState<boolean>(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [printerModalOpen, setPrinterModalOpen] = useState<boolean>(false);
  const [selectedForPrint, setSelectedForPrint] = useState<Device[]>([]);

  // Subscribe to real-time Firestore database updates
  useEffect(() => {
    setIsLoading(true);
    const unsubStudents = subscribeStudents((data) => {
      setStudents(data);
      setIsLoading(false);
    });

    const unsubDevices = subscribeDevices((data) => {
      setDevices(data);
      setIsLoading(false);
    });

    const unsubLogs = subscribeLogs((data) => {
      setLogs(data);
      setIsLoading(false);
    });

    return () => {
      unsubStudents();
      unsubDevices();
      unsubLogs();
    };
  }, []);

  const fetchData = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  // Compute stats dynamically
  const stats: InventoryStats = useMemo(() => {
    const byType: Record<DeviceType, number> = {
      Tablet: 0,
      iPad: 0,
      Laptop: 0,
      Chromebook: 0,
      Other: 0,
    };

    let checkedIn = 0;
    let checkedOut = 0;
    let inRepair = 0;
    let missing = 0;

    devices.forEach((d) => {
      byType[d.deviceType] = (byType[d.deviceType] || 0) + 1;
      if (d.status === 'Checked-In') checkedIn++;
      else if (d.status === 'Checked-Out') checkedOut++;
      else if (d.status === 'In Repair') inRepair++;
      else if (d.status === 'Missing') missing++;
    });

    return {
      totalDevices: devices.length,
      checkedIn,
      checkedOut,
      inRepair,
      missing,
      byType,
    };
  }, [devices]);

  // Handle Quick Check-In/Check-Out from Inventory
  const handleQuickCheckInOut = (device: Device) => {
    setSelectedDeviceForQuickAction(device);
    setActiveTab('scanner');
  };

  // Show single QR Code modal
  const handleShowSingleQR = (device: Device) => {
    setSelectedForPrint([device]);
    setPrinterModalOpen(true);
  };

  // Show bulk QR Printer modal
  const handleSelectForPrint = (selectedDevices: Device[]) => {
    setSelectedForPrint(selectedDevices);
    setPrinterModalOpen(true);
  };

  // Add or Edit Device in Firestore
  const handleSaveDevice = async (deviceData: Partial<Device>) => {
    try {
      const deviceId = deviceData.id || `dev-${Date.now()}`;
      const devToSave: Device = {
        id: deviceId,
        studentId: deviceData.studentId || 'STU-1000',
        studentName: deviceData.studentName || 'Student',
        studentGrade: deviceData.studentGrade || 'Grade 10',
        deviceType: deviceData.deviceType || 'Tablet',
        brandModel: deviceData.brandModel || 'New Device',
        serialNumber: deviceData.serialNumber || 'SN-001',
        assetTag: deviceData.assetTag || 'BYOG-001',
        qrCodeId: deviceData.qrCodeId || 'BYOG-001',
        status: deviceData.status || 'Checked-In',
        condition: deviceData.condition || 'New',
        registeredDate: deviceData.registeredDate || new Date().toISOString().split('T')[0],
        lastCheckIn: deviceData.lastCheckIn || new Date().toLocaleString(),
        storageLocation: deviceData.storageLocation || 'IT Storage',
        notes: deviceData.notes || '',
      };
      await fsSaveDevice(devToSave);
    } catch (e) {
      console.error('Error saving device to Firestore:', e);
    } finally {
      setDeviceModalOpen(false);
      setEditingDevice(null);
    }
  };

  // Delete device from Firestore
  const handleDeleteDevice = async (id: string) => {
    try {
      await fsDeleteDevice(id);
    } catch (e) {
      console.error('Error deleting device from Firestore:', e);
    }
  };

  // Handle Scan Check-In/Out event in Firestore
  const handleCheckInOutSubmit = async (payload: {
    qrCodeId: string;
    action: 'CHECK_IN' | 'CHECK_OUT';
    location: string;
    inspectorName: string;
    conditionOnReturn: any;
    notes: string;
  }) => {
    try {
      const found = devices.find(
        (d) =>
          d.qrCodeId.toLowerCase() === payload.qrCodeId.toLowerCase() ||
          d.assetTag.toLowerCase() === payload.qrCodeId.toLowerCase()
      );
      if (!found) {
        return { success: false, error: 'Device not found' };
      }

      const updatedDev: Device = {
        ...found,
        status: payload.action === 'CHECK_IN' ? 'Checked-In' : 'Checked-Out',
        lastCheckIn: new Date().toLocaleString(),
        condition: payload.conditionOnReturn || found.condition,
      };

      const newLog: CheckInLog = {
        id: `log-${Date.now()}`,
        deviceId: found.id,
        qrCodeId: found.qrCodeId,
        studentName: found.studentName,
        studentId: found.studentId,
        deviceType: found.deviceType,
        brandModel: found.brandModel,
        assetTag: found.assetTag,
        action: payload.action,
        location: payload.location,
        timestamp: new Date().toLocaleString(),
        conditionOnReturn: payload.conditionOnReturn,
        inspectorName: payload.inspectorName,
        notes: payload.notes,
      };

      await fsSaveDevice(updatedDev);
      await fsAddLog(newLog);

      return { success: true, device: updatedDev };
    } catch (err: any) {
      console.error('Error in check-in/out:', err);
      return { success: false, error: err.message || 'Check-in failed' };
    }
  };

  // Handle Google Sheets Roster Sync to Firestore
  const handleSyncStudents = async (incomingStudents: Student[]) => {
    try {
      await fsSyncStudentsList(incomingStudents);
    } catch (e) {
      console.error('Error syncing students to Firestore:', e);
    }
  };

  // Handle Update Student (Name, Class, etc.) in Firestore
  const handleUpdateStudent = async (updatedStudent: Student) => {
    try {
      await fsSaveStudent(updatedStudent);

      // Also update any devices registered to this student
      const updatedDevices = devices
        .filter((d) => d.studentId === updatedStudent.studentId || d.studentName === updatedStudent.name)
        .map((d) => ({
          ...d,
          studentName: updatedStudent.name,
          studentGrade: updatedStudent.grade,
          studentId: updatedStudent.studentId,
        }));

      for (const dev of updatedDevices) {
        await fsSaveDevice(dev);
      }
    } catch (err) {
      console.error('Error updating student in Firestore:', err);
    }
  };

  // Handle Delete Student from Firestore
  const handleDeleteStudent = async (studentId: string) => {
    try {
      await fsDeleteStudent(studentId);
    } catch (e) {
      console.error('Error deleting student from Firestore:', e);
    }
  };

  // Handle Bulk Delete Students from Firestore
  const handleBulkDeleteStudents = async (ids: string[]) => {
    try {
      await fsBulkDeleteStudents(ids);
    } catch (e) {
      console.error('Error bulk deleting students from Firestore:', e);
    }
  };

  // Handle Add Student manually to Firestore
  const handleAddStudent = async (newStudent: Partial<Student>) => {
    try {
      const id = newStudent.id || `stu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const stuToSave: Student = {
        id,
        studentId: newStudent.studentId || `STU-${1000 + students.length}`,
        name: newStudent.name || 'Murid Baru',
        grade: newStudent.grade || 'Kelas 5',
        email: newStudent.email || `student${Date.now()}@school.edu`,
        bil: newStudent.bil || `${students.length + 1}`,
        namaGuruPembimbing: newStudent.namaGuruPembimbing || '',
        noTel: newStudent.noTel || '',
        tujuanKegunaan: newStudent.tujuanKegunaan || '',
        tarikhTamat: newStudent.tarikhTamat || '',
        catatan: newStudent.catatan || '',
        syncedAt: new Date().toISOString(),
      };
      await fsSaveStudent(stuToSave);
    } catch (e) {
      console.error('Error adding student to Firestore:', e);
    }
  };

  // Handle Bulk Import Devices from file (.xlsx / .csv) to Firestore
  const handleImportDevices = async (importedDevices: Device[]) => {
    try {
      await fsBulkImportDevices(importedDevices);
    } catch (e) {
      console.error('Error importing devices to Firestore:', e);
    }
  };

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        isSheetsConnected={isSheetsConnected}
        onRefreshData={fetchData}
        isRefreshing={isRefreshing}
        kodSekolah={kodSekolah}
        onLogout={handleLogout}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="font-semibold text-slate-700">Loading BYOG Tracker Data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'inventory' && (
              <InventoryView
                devices={devices}
                students={students}
                onAddDevice={() => {
                  setEditingDevice(null);
                  setDeviceModalOpen(true);
                }}
                onEditDevice={(device) => {
                  setEditingDevice(device);
                  setDeviceModalOpen(true);
                }}
                onDeleteDevice={handleDeleteDevice}
                onQuickCheckInOut={handleQuickCheckInOut}
                onShowQRModal={handleShowSingleQR}
                onSelectForPrint={handleSelectForPrint}
                onImportDevices={handleImportDevices}
              />
            )}

            {activeTab === 'scanner' && (
              <QRScannerView
                devices={devices}
                onCheckInOut={handleCheckInOutSubmit}
                selectedDeviceForQuickAction={selectedDeviceForQuickAction}
                onClearQuickActionDevice={() => setSelectedDeviceForQuickAction(null)}
              />
            )}

            {activeTab === 'logs' && <CheckInLogsView logs={logs} />}

            {activeTab === 'sheets' && (
              <GoogleSheetsSyncView
                students={students}
                onSyncStudents={handleSyncStudents}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
                onBulkDeleteStudents={handleBulkDeleteStudents}
                onAddStudent={handleAddStudent}
                isSheetsConnected={isSheetsConnected}
                setIsSheetsConnected={setIsSheetsConnected}
              />
            )}

            {activeTab === 'printer' && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                <h2 className="text-lg font-bold text-slate-900 mb-2">QR Label Printing Station</h2>
                <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto">
                  Click below to generate and print QR barcode asset labels for all {devices.length} registered school devices.
                </p>
                <button
                  onClick={() => {
                    setSelectedForPrint(devices);
                    setPrinterModalOpen(true);
                  }}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
                >
                  Generate All {devices.length} QR Asset Stickers
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {deviceModalOpen && (
        <DeviceModal
          deviceToEdit={editingDevice}
          students={students}
          onSave={handleSaveDevice}
          onClose={() => {
            setDeviceModalOpen(false);
            setEditingDevice(null);
          }}
        />
      )}

      {printerModalOpen && (
        <QRLabelPrinterModal
          devices={selectedForPrint.length > 0 ? selectedForPrint : devices}
          onClose={() => {
            setPrinterModalOpen(false);
            setSelectedForPrint([]);
          }}
        />
      )}
    </div>
  );
}
