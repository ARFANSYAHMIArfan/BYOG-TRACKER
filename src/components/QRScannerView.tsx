import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import {
  QrCode,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  UserCheck,
  ShieldCheck,
  Smartphone,
  Tablet,
  Laptop,
  Sparkles,
  Volume2,
  VolumeX,
  Camera,
  RefreshCw
} from 'lucide-react';
import { Device, DeviceCondition } from '../types';

interface QRScannerViewProps {
  devices: Device[];
  onCheckInOut: (data: {
    qrCodeId: string;
    action: 'CHECK_IN' | 'CHECK_OUT';
    location: string;
    inspectorName: string;
    conditionOnReturn: DeviceCondition;
    notes: string;
  }) => Promise<{ success: boolean; device?: Device; error?: string }>;
  selectedDeviceForQuickAction?: Device | null;
  onClearQuickActionDevice?: () => void;
}

export const QRScannerView: React.FC<QRScannerViewProps> = ({
  devices,
  onCheckInOut,
  selectedDeviceForQuickAction,
  onClearQuickActionDevice,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [matchedDevice, setMatchedDevice] = useState<Device | null>(null);
  const [scannedCode, setScannedCode] = useState<string>('');
  const [searchError, setSearchError] = useState<string>('');
  const [scannerActive, setScannerActive] = useState<boolean>(true);

  // Form states for Check-in / Out
  const [actionType, setActionType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [location, setLocation] = useState('Main IT Desk');
  const [inspectorName, setInspectorName] = useState('IT Admin Staff');
  const [condition, setCondition] = useState<DeviceCondition>('Good');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Success Feedback state
  const [lastSuccess, setLastSuccess] = useState<{
    device: Device;
    action: 'CHECK_IN' | 'CHECK_OUT';
    timestamp: string;
  } | null>(null);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Handle auto-population if user clicked "Check In / Out" from inventory table
  useEffect(() => {
    if (selectedDeviceForQuickAction) {
      setMatchedDevice(selectedDeviceForQuickAction);
      setScannedCode(selectedDeviceForQuickAction.qrCodeId);
      setActionType(selectedDeviceForQuickAction.status === 'Checked-In' ? 'CHECK_OUT' : 'CHECK_IN');
      setCondition(selectedDeviceForQuickAction.condition);
      setSearchError('');
    }
  }, [selectedDeviceForQuickAction]);

  // Initialize camera QR scanner
  useEffect(() => {
    if (!scannerActive) return;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
    };

    const scanner = new Html5QrcodeScanner('qr-reader', config, false);
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        handleCodeDetected(decodedText);
      },
      (error) => {
        // Ignore minor frame-level scan errors
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [scannerActive, devices]);

  const playSuccessBeep = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio context fallback
    }
  };

  const handleCodeDetected = (code: string) => {
    const trimmed = code.trim();
    setScannedCode(trimmed);
    setInputCode(trimmed);

    // Look up device
    const found = devices.find(
      (d) =>
        d.qrCodeId.toLowerCase() === trimmed.toLowerCase() ||
        d.assetTag.toLowerCase() === trimmed.toLowerCase() ||
        d.serialNumber.toLowerCase() === trimmed.toLowerCase()
    );

    if (found) {
      setMatchedDevice(found);
      setSearchError('');
      // Suggest opposite action
      setActionType(found.status === 'Checked-In' ? 'CHECK_OUT' : 'CHECK_IN');
      setCondition(found.condition);
      playSuccessBeep();
    } else {
      setMatchedDevice(null);
      setSearchError(`No registered device matches tag/QR "${trimmed}".`);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    handleCodeDetected(inputCode);
  };

  const handleConfirmSubmit = async () => {
    if (!scannedCode && !matchedDevice) return;

    setIsSubmitting(true);
    const codeToUse = matchedDevice ? matchedDevice.qrCodeId : scannedCode;

    const res = await onCheckInOut({
      qrCodeId: codeToUse,
      action: actionType,
      location,
      inspectorName,
      conditionOnReturn: condition,
      notes,
    });

    setIsSubmitting(false);

    if (res.success && res.device) {
      playSuccessBeep();
      setLastSuccess({
        device: res.device,
        action: actionType,
        timestamp: new Date().toLocaleTimeString(),
      });
      // Reset active form
      setMatchedDevice(null);
      setScannedCode('');
      setInputCode('');
      setNotes('');
      if (onClearQuickActionDevice) onClearQuickActionDevice();
    } else {
      setSearchError(res.error || 'Failed to submit check-in log.');
    }
  };

  // Sample Demo Codes for 1-click evaluation
  const demoCodes = [
    { code: 'BYOG-TAB-0101', label: 'Alexander (iPad)' },
    { code: 'BYOG-LAP-0102', label: 'Sophia (Dell XPS)' },
    { code: 'BYOG-CHR-0103', label: 'Marcus (Chromebook)' },
    { code: 'BYOG-LAP-0104', label: 'Emily (MacBook M2)' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold">QR Code Check-In / Check-Out Kiosk</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Scan device QR code or asset tag to record instant student check-ins and check-outs.
          </p>
        </div>

        {/* Audio Toggle & Camera Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            Audio Beep
          </button>

          <button
            onClick={() => setScannerActive(!scannerActive)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4" />
            {scannerActive ? 'Hide Camera' : 'Show Camera'}
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Scanner + Demo Buttons, Right = Device Card + Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scanner & Manual Code Input */}
        <div className="lg:col-span-5 space-y-4">
          {/* Camera Scanner Box */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-600" />
                Live Camera Scanner
              </span>
              <span className="text-[11px] text-slate-400">Position QR tag inside box</span>
            </div>

            {scannerActive ? (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
                <div id="qr-reader" className="w-full"></div>
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-400">
                <Camera className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">Camera is paused.</p>
                <button
                  onClick={() => setScannerActive(true)}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Turn On Camera
                </button>
              </div>
            )}
          </div>

          {/* Manual Entry Form */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-4 h-4 text-indigo-600" />
              Manual Tag / Code Lookup
            </span>

            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Type tag e.g. BYOG-TAB-0101..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
              >
                Find
              </button>
            </form>

            {/* Quick Demo Buttons for Instant Evaluation */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 mb-2 font-medium">Quick Demo Test Tags:</p>
              <div className="grid grid-cols-2 gap-1.5">
                {demoCodes.map((d) => (
                  <button
                    key={d.code}
                    onClick={() => handleCodeDetected(d.code)}
                    className="px-2 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded text-[11px] text-left transition-colors font-mono flex flex-col"
                  >
                    <span className="font-semibold text-indigo-900">{d.code}</span>
                    <span className="text-[10px] text-slate-500 truncate">{d.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scanned Device Info & Confirmation Form */}
        <div className="lg:col-span-7 space-y-4">
          {/* Recent Success Toast Banner */}
          {lastSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-emerald-900">
                <p className="font-bold">
                  Device Successfully {lastSuccess.action === 'CHECK_IN' ? 'Checked In' : 'Checked Out'}!
                </p>
                <p className="mt-0.5">
                  <span className="font-semibold">{lastSuccess.device.brandModel}</span> ({lastSuccess.device.assetTag}) — assigned to{' '}
                  <span className="font-semibold">{lastSuccess.device.studentName}</span>.
                </p>
                <p className="text-[10px] text-emerald-700 mt-1">Logged at {lastSuccess.timestamp}</p>
              </div>
              <button
                onClick={() => setLastSuccess(null)}
                className="text-emerald-500 hover:text-emerald-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Search Error Alert */}
          {searchError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Device Found Card & Action Form */}
          {matchedDevice ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
              {/* Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 rounded-lg">
                    {matchedDevice.deviceType === 'Laptop' ? (
                      <Laptop className="w-5 h-5 text-white" />
                    ) : (
                      <Tablet className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{matchedDevice.brandModel}</h3>
                    <p className="text-xs text-slate-400 font-mono">Tag: {matchedDevice.assetTag}</p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                    matchedDevice.status === 'Checked-In'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}
                >
                  Current: {matchedDevice.status}
                </span>
              </div>

              {/* Details Body */}
              <div className="p-5 space-y-5">
                {/* Student Assignment Info */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Assigned Student</span>
                    <span className="font-bold text-slate-900 text-sm">{matchedDevice.studentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Student ID & Grade</span>
                    <span className="font-mono text-slate-800 font-semibold">{matchedDevice.studentId}</span>{' '}
                    <span className="text-slate-500">({matchedDevice.studentGrade})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Serial Number</span>
                    <span className="font-mono text-slate-800">{matchedDevice.serialNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Last Storage / Location</span>
                    <span className="text-slate-800">{matchedDevice.storageLocation || 'Main Locker'}</span>
                  </div>
                </div>

                {/* Check-In / Out Action Selection */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Select Kiosk Action
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setActionType('CHECK_IN')}
                      className={`p-3 rounded-xl border text-left font-medium text-xs flex items-center justify-between transition-all ${
                        actionType === 'CHECK_IN'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="font-bold">RETURN / CHECK-IN</p>
                          <p className="text-[10px] text-slate-500">Device stored back in school</p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionType('CHECK_OUT')}
                      className={`p-3 rounded-xl border text-left font-medium text-xs flex items-center justify-between transition-all ${
                        actionType === 'CHECK_OUT'
                          ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="font-bold">ISSUE / CHECK-OUT</p>
                          <p className="text-[10px] text-slate-500">Student takes device out</p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Kiosk Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Kiosk / Check Station
                      </label>
                      <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Main IT Desk">Main IT Kiosk / Office</option>
                        <option value="Library Tech Desk">Library Tech Desk</option>
                        <option value="Main Gate Check-in">Main Gate Security Kiosk</option>
                        <option value="Science Lab Kiosk">Science Lab Station</option>
                        <option value="Media Center Vault">Media Center Vault</option>
                        <option value="Classroom 204">Classroom Station</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Inspector / Staff Name
                      </label>
                      <input
                        type="text"
                        value={inspectorName}
                        onChange={(e) => setInspectorName(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Staff Name"
                      />
                    </div>
                  </div>

                  {/* Return Condition */}
                  <div className="text-xs">
                    <label className="block text-slate-600 font-semibold mb-1">Current Condition</label>
                    <div className="flex gap-2">
                      {(['New', 'Good', 'Fair', 'Damaged'] as DeviceCondition[]).map((cond) => (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => setCondition(cond)}
                          className={`flex-1 py-1.5 px-2 rounded-lg border text-center text-xs font-semibold transition-colors ${
                            condition === cond
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {cond}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="text-xs">
                    <label className="block text-slate-600 font-semibold mb-1">Notes / Remarks</label>
                    <input
                      type="text"
                      placeholder="e.g. Returned with charging adapter and stylus..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleConfirmSubmit}
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                      actionType === 'CHECK_IN'
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                        : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                    }`}
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        CONFIRM {actionType === 'CHECK_IN' ? 'CHECK-IN' : 'CHECK-OUT'} NOW
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 shadow-sm">
              <QrCode className="w-12 h-12 text-indigo-400 mx-auto mb-3 opacity-60 animate-bounce" />
              <h3 className="font-bold text-slate-800 text-base">Awaiting QR Scan or Tag Input</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Scan a device tag using your camera or click one of the quick test tags on the left panel to trigger check-in/out.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
