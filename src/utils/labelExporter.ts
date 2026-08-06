import jsPDF from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImageRun,
  HeadingLevel,
} from 'docx';
import QRCode from 'qrcode';
import { Device } from '../types';

/**
 * Converts data URL (base64) to Uint8Array for docx ImageRun
 */
function dataURLToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Export selected or all device asset tag labels to PDF format
 */
export async function exportLabelsToPDF(devices: Device[], filename: string = 'BYOG_Asset_Labels.pdf') {
  if (!devices || devices.length === 0) return;

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  // Page dimensions (A4 = 210mm x 297mm)
  const marginTop = 12;
  const marginLeft = 10;
  const labelWidth = 92;
  const labelHeight = 50;
  const gapX = 6;
  const gapY = 6;
  const cols = 2;
  const rows = 5; // 10 labels per page

  let col = 0;
  let row = 0;

  for (let i = 0; i < devices.length; i++) {
    const device = devices[i];

    if (i > 0 && col === 0 && row === 0) {
      doc.addPage();
    }

    const x = marginLeft + col * (labelWidth + gapX);
    const y = marginTop + row * (labelHeight + gapY);

    // Draw main label border box
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, labelWidth, labelHeight, 2.5, 2.5, 'FD');

    // Header bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(x, y, labelWidth, 8, 2.5, 2.5, 'F');
    // Cover bottom rounded corners of header bar
    doc.rect(x, y + 4, labelWidth, 4, 'F');

    // Header text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('BYOG SCHOOL ASSET', x + 3.5, y + 5.5);

    // Asset Tag Pill in Header
    doc.setFontSize(7);
    const tagText = device.assetTag || 'NO-TAG';
    const tagWidth = doc.getTextWidth(tagText) + 4;
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.roundedRect(x + labelWidth - tagWidth - 3, y + 1.5, tagWidth, 5, 1, 1, 'F');
    doc.text(tagText, x + labelWidth - tagWidth - 1, y + 5);

    // Generate QR code data URL
    const qrDataUrl = await QRCode.toDataURL(device.qrCodeId || device.assetTag, {
      width: 250,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    });

    // Add QR Code Image
    const qrSize = 32;
    const qrX = x + 3;
    const qrY = y + 10;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    // Device & Student Details next to QR Code
    const textX = x + qrSize + 5;
    let textY = y + 13;

    // Brand Model
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const modelText = doc.splitTextToSize(device.brandModel || 'Device', labelWidth - qrSize - 9);
    doc.text(modelText, textX, textY);
    textY += (modelText.length * 3.8) + 1;

    // Student Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(49, 46, 129); // indigo-900
    const nameText = doc.splitTextToSize(device.studentName || 'Unassigned', labelWidth - qrSize - 9);
    doc.text(nameText, textX, textY);
    textY += (nameText.length * 3.5);

    // Student ID & Grade
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`${device.studentId || ''} • ${device.studentGrade || ''}`, textX, textY);
    textY += 3.5;

    // Serial Number
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`S/N: ${device.serialNumber || 'N/A'}`, textX, textY);
    textY += 3.5;

    // QR Code ID
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(`QR: ${device.qrCodeId}`, textX, textY);

    // Label Footer Line
    doc.setDrawColor(241, 245, 249);
    doc.line(x, y + labelHeight - 5, x + labelWidth, y + labelHeight - 5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('SM SAINS MUZAFFAR SYAH - BYOG System', x + 3.5, y + labelHeight - 1.5);

    // Increment Grid Position
    col++;
    if (col >= cols) {
      col = 0;
      row++;
      if (row >= rows) {
        row = 0;
      }
    }
  }

  doc.save(filename);
}

/**
 * Export selected or all device asset tag labels to Microsoft Word (.docx) format
 */
export async function exportLabelsToDOCX(devices: Device[], filename: string = 'BYOG_Asset_Labels.docx') {
  if (!devices || devices.length === 0) return;

  const tableRows: TableRow[] = [];

  // Arrange devices 2 per row
  for (let i = 0; i < devices.length; i += 2) {
    const pair = devices.slice(i, i + 2);

    const cells: TableCell[] = await Promise.all(
      pair.map(async (device) => {
        const qrDataUrl = await QRCode.toDataURL(device.qrCodeId || device.assetTag, {
          width: 250,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
        });
        const imageBytes = dataURLToUint8Array(qrDataUrl);

        return new TableCell({
          width: { size: 48, type: WidthType.PERCENTAGE },
          margins: { top: 140, bottom: 140, left: 160, right: 160 },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 10, color: 'CBD5E1' },
            bottom: { style: BorderStyle.SINGLE, size: 10, color: 'CBD5E1' },
            left: { style: BorderStyle.SINGLE, size: 10, color: 'CBD5E1' },
            right: { style: BorderStyle.SINGLE, size: 10, color: 'CBD5E1' },
          },
          children: [
            // Header
            new Paragraph({
              children: [
                new TextRun({
                  text: 'BYOG SCHOOL ASSET  ',
                  bold: true,
                  size: 18,
                  color: '0F172A',
                }),
                new TextRun({
                  text: `[${device.assetTag}]`,
                  bold: true,
                  size: 18,
                  color: '4F46E5',
                }),
              ],
              spacing: { after: 80 },
            }),

            // QR Code image
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBytes,
                  transformation: {
                    width: 110,
                    height: 110,
                  },
                }),
              ],
              spacing: { before: 60, after: 80 },
            }),

            // Model
            new Paragraph({
              children: [
                new TextRun({
                  text: device.brandModel || 'Device',
                  bold: true,
                  size: 20,
                  color: '0F172A',
                }),
              ],
              spacing: { after: 40 },
            }),

            // Student Info
            new Paragraph({
              children: [
                new TextRun({
                  text: `Student: ${device.studentName}`,
                  bold: true,
                  size: 17,
                  color: '312E81',
                }),
                new TextRun({
                  text: ` (${device.studentId} • ${device.studentGrade})`,
                  size: 16,
                  color: '64748B',
                }),
              ],
              spacing: { after: 40 },
            }),

            // Serial & QR Code ID
            new Paragraph({
              children: [
                new TextRun({
                  text: `S/N: ${device.serialNumber} | QR: ${device.qrCodeId}`,
                  size: 14,
                  color: '475569',
                }),
              ],
              spacing: { after: 60 },
            }),

            // System Footer
            new Paragraph({
              children: [
                new TextRun({
                  text: 'SM SAINS MUZAFFAR SYAH - BYOG System',
                  italics: true,
                  size: 12,
                  color: '94A3B8',
                }),
              ],
            }),
          ],
        });
      })
    );

    // If odd number of devices, add blank cell
    if (cells.length === 1) {
      cells.push(
        new TableCell({
          width: { size: 48, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          children: [new Paragraph({ text: '' })],
        })
      );
    }

    tableRows.push(
      new TableRow({
        children: cells,
        cantSplit: true,
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: 'BYOG Device Asset Tag Sticker Labels',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
