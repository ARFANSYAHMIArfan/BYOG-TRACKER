import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Printer, Download, X, QrCode, Smartphone } from 'lucide-react';
import { Device } from '../types';

interface QRLabelPrinterModalProps {
  devices: Device[];
  onClose: () => void;
}

export const QRLabelPrinterModal: React.FC<QRLabelPrinterModalProps> = ({ devices, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">QR Asset Tag Label Generator</h3>
              <p className="text-xs text-slate-400">
                Ready to print {devices.length} device sticker label{devices.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Labels
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-2">
            {devices.map((device) => (
              <QRLabelCard key={device.id} device={device} />
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <span>Formatted for standard 2" x 3" inventory barcode sticker paper.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

// Single QR Sticker Label Card Component
const QRLabelCard: React.FC<{ device: Device }> = ({ device }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        device.qrCodeId,
        {
          width: 130,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error(error);
        }
      );
    }
  }, [device]);

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `QR_${device.assetTag}_${device.studentName.replace(/\s+/g, '_')}.png`;
    link.href = url;
    link.click();
  };

  return (
    <div className="bg-white p-4 rounded-xl border-2 border-slate-300 shadow-sm flex flex-col justify-between relative group hover:border-indigo-500 transition-colors print:border-black print:shadow-none print:break-inside-avoid">
      {/* Label Header */}
      <div className="flex items-center justify-between border-b pb-2 border-slate-200">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-indigo-600 print:text-black" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-900 font-mono">
            BYOG SCHOOL ASSET
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded print:bg-black">
          {device.assetTag}
        </span>
      </div>

      {/* Main Label Body */}
      <div className="flex items-center gap-3 my-3">
        {/* QR Code Canvas */}
        <div className="border border-slate-200 rounded-lg p-1 bg-white shadow-inner flex-shrink-0">
          <canvas ref={canvasRef} className="w-28 h-28" />
        </div>

        {/* Text Info */}
        <div className="space-y-1 text-xs flex-1 min-w-0">
          <p className="font-bold text-slate-900 truncate leading-snug">{device.brandModel}</p>
          <div className="text-[11px] text-slate-600">
            <p className="font-semibold text-indigo-900">{device.studentName}</p>
            <p className="text-slate-500">{device.studentId} • {device.studentGrade}</p>
          </div>
          <p className="font-mono text-[10px] text-slate-400 truncate">S/N: {device.serialNumber}</p>
          <p className="text-[10px] font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded inline-block">
            {device.qrCodeId}
          </p>
        </div>
      </div>

      {/* Label Footer */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t pt-1.5 border-slate-100">
        <span>Oakridge Academy BYOG System</span>
        <button
          onClick={handleDownloadPNG}
          className="text-indigo-600 hover:underline font-semibold flex items-center gap-1 print:hidden"
        >
          <Download className="w-3 h-3" /> PNG
        </button>
      </div>
    </div>
  );
};
