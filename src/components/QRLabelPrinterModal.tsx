import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, Download, X, Smartphone, FileText, Loader2 } from 'lucide-react';
import { Device } from '../types';
import { exportLabelsToPDF, exportLabelsToDOCX } from '../utils/labelExporter';
import { SchoolLogo } from './SchoolLogo';

interface QRLabelPrinterModalProps {
  devices: Device[];
  onClose: () => void;
}

export const QRLabelPrinterModal: React.FC<QRLabelPrinterModalProps> = ({ devices, onClose }) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const handleExportPDF = async () => {
    setIsExportingPdf(true);
    try {
      await exportLabelsToPDF(devices, `BYOG_Labels_${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportDOCX = async () => {
    setIsExportingDocx(true);
    try {
      await exportLabelsToDOCX(devices, `BYOG_Labels_${Date.now()}.docx`);
    } catch (error) {
      console.error('Error exporting DOCX:', error);
    } finally {
      setIsExportingDocx(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <SchoolLogo className="w-10 h-10 bg-white p-0.5 rounded-lg shadow-sm" />
            <div>
              <h3 className="font-bold text-base">QR Asset Tag Label Generator</h3>
              <p className="text-xs text-slate-400">
                SM SAINS MUZAFFAR SYAH • {devices.length} device sticker label{devices.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={isExportingPdf || isExportingDocx}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Export PDF
            </button>

            <button
              onClick={handleExportDOCX}
              disabled={isExportingPdf || isExportingDocx}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {isExportingDocx ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Export DOCX
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
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
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 flex-shrink-0">
          <span>Formatted for standard 2" x 3" inventory barcode sticker paper or document export.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="text-rose-600 font-semibold hover:underline flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
            <span>•</span>
            <button
              onClick={handleExportDOCX}
              className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" /> DOCX
            </button>
            <span>•</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg ml-2"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Single QR Sticker Label Card Component
const QRLabelCard: React.FC<{ device: Device }> = ({ device }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSinglePdf, setIsSinglePdf] = useState(false);
  const [isSingleDocx, setIsSingleDocx] = useState(false);

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

  const handleDownloadSinglePDF = async () => {
    setIsSinglePdf(true);
    try {
      await exportLabelsToPDF([device], `Label_${device.assetTag}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSinglePdf(false);
    }
  };

  const handleDownloadSingleDOCX = async () => {
    setIsSingleDocx(true);
    try {
      await exportLabelsToDOCX([device], `Label_${device.assetTag}.docx`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSingleDocx(false);
    }
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
      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t pt-1.5 border-slate-100 print:hidden">
        <span className="font-semibold text-slate-500">SM SAINS MUZAFFAR SYAH</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSinglePDF}
            disabled={isSinglePdf}
            className="text-rose-600 hover:underline font-semibold flex items-center gap-0.5"
            title="Download PDF"
          >
            <FileText className="w-3 h-3" /> PDF
          </button>
          <button
            onClick={handleDownloadSingleDOCX}
            disabled={isSingleDocx}
            className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5"
            title="Download DOCX"
          >
            <FileText className="w-3 h-3" /> DOCX
          </button>
          <button
            onClick={handleDownloadPNG}
            className="text-indigo-600 hover:underline font-semibold flex items-center gap-0.5"
            title="Download PNG"
          >
            <Download className="w-3 h-3" /> PNG
          </button>
        </div>
      </div>
    </div>
  );
};

