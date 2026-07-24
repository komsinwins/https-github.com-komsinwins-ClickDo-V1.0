/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Project, Worker, ContractorInfo } from '../types';
import { 
  Users, UserPlus, Trash2, Edit3, Download, Printer, Search, 
  ShieldCheck, HardHat, Phone, Plus, X, Check, Filter, Briefcase, FileText
} from 'lucide-react';

interface WorkersManagerProps {
  project: Project;
  onUpdateContractor: (contractorData: ContractorInfo) => void;
}

export default function WorkersManager({ project, onUpdateContractor }: WorkersManagerProps) {
  const contractor = project.contractor || {
    teamName: '',
    foremanName: '',
    workers: [],
    totalWage: 0,
    installments: [],
  };

  const workers = contractor.workers || [];

  // Default worker positions
  const [positions, setPositions] = useState<string[]>(() => {
    const saved = localStorage.getItem('worker_positions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      'โฟร์แมน (Foreman)',
      'วิศวกรสนาม (Site Engineer)',
      'หัวหน้าช่าง (Chief Technician)',
      'ช่างไฟฟ้า (Electrician)',
      'ช่างเทคนิค / สื่อสาร (Technician)',
      'ช่างเชื่อม / โครงสร้าง (Welder)',
      'เจ้าหน้าที่ความปลอดภัย (Safety Officer)',
      'ช่างติดตั้งทั่วไป (Installer)',
      'ผู้ช่วยช่าง (Helper)',
      'แรงงานทั่วไป (General Laborer)',
    ];
  });

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPositionFilter, setSelectedPositionFilter] = useState('ALL');

  // Form states for adding worker
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(positions[0] || 'ช่างเทคนิค (Technician)');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  // Position Management Modal / State
  const [showManagePositions, setShowManagePositions] = useState(false);
  const [newPositionText, setNewPositionText] = useState('');

  // Edit Worker Modal
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  // Export PDF loading
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Sync positions to localStorage
  React.useEffect(() => {
    localStorage.setItem('worker_positions', JSON.stringify(positions));
  }, [positions]);

  // Handle Add New Position Option
  const handleAddPositionOption = () => {
    const cleaned = newPositionText.trim();
    if (!cleaned) return;
    if (positions.includes(cleaned)) {
      alert('ตำแหน่งนี้มีอยู่ในรายการแล้ว');
      return;
    }
    const updated = [...positions, cleaned];
    setPositions(updated);
    setSelectedPosition(cleaned);
    setNewPositionText('');
  };

  // Handle Remove Position Option
  const handleRemovePositionOption = (posToRemove: string) => {
    if (positions.length <= 1) {
      alert('จำเป็นต้องมีอย่างน้อย 1 ตำแหน่งในระบบ');
      return;
    }
    if (confirm(`คุณต้องการลบตำแหน่ง "${posToRemove}" ออกจากตัวเลือกหรือไม่?`)) {
      const updated = positions.filter((p) => p !== posToRemove);
      setPositions(updated);
      if (selectedPosition === posToRemove) {
        setSelectedPosition(updated[0]);
      }
    }
  };

  // Handle Add Worker
  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      alert('กรุณากรอกชื่อและนามสกุลผู้ปฏิบัติงาน');
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const newWorker: Worker = {
      id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: fullName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      position: selectedPosition,
      phone: phone.trim() || undefined,
      note: note.trim() || undefined,
    };

    const updatedWorkers = [...workers, newWorker];
    onUpdateContractor({
      ...contractor,
      workers: updatedWorkers,
    });

    // Reset Form
    setFirstName('');
    setLastName('');
    setPhone('');
    setNote('');
  };

  // Handle Save Edit Worker
  const handleSaveEditWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;

    let fullName = editingWorker.name;
    if (editingWorker.firstName || editingWorker.lastName) {
      fullName = `${editingWorker.firstName || ''} ${editingWorker.lastName || ''}`.trim();
    }

    const updatedWorkerObj: Worker = {
      ...editingWorker,
      name: fullName || editingWorker.name,
    };

    const updatedWorkers = workers.map((w) => (w.id === editingWorker.id ? updatedWorkerObj : w));
    onUpdateContractor({
      ...contractor,
      workers: updatedWorkers,
    });

    setEditingWorker(null);
  };

  // Handle Delete Worker
  const handleDeleteWorker = (id: string, workerName: string) => {
    if (confirm(`คุณต้องการลบรายชื่อผู้ปฏิบัติงาน "${workerName}" ออกจากโครงการใช่หรือไม่?`)) {
      const updatedWorkers = workers.filter((w) => w.id !== id);
      onUpdateContractor({
        ...contractor,
        workers: updatedWorkers,
      });
    }
  };

  // Filtered Workers list
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchSearch =
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.position && w.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (w.phone && w.phone.includes(searchTerm)) ||
        (w.note && w.note.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchPos = selectedPositionFilter === 'ALL' || w.position === selectedPositionFilter;

      return matchSearch && matchPos;
    });
  }, [workers, searchTerm, selectedPositionFilter]);

  // Position breakdown stats
  const positionStats = useMemo(() => {
    const map: Record<string, number> = {};
    workers.forEach((w) => {
      const pos = w.position || 'ไม่ระบุตำแหน่ง';
      map[pos] = (map[pos] || 0) + 1;
    });
    return map;
  }, [workers]);

  // Print Window Report Function (Form เอกสารทางการที่สวยงาม)
  const handlePrintDocument = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('เบราว์เซอร์บล็อกการเปิดหน้าต่างพิมพ์ กรุณาอนุญาตป๊อปอัพ');
      return;
    }

    const todayStr = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const rowsHtml = workers.map((w, index) => {
      const displayName = w.firstName && w.lastName ? `${w.firstName} ${w.lastName}` : w.name;
      return `
        <tr style="border-bottom: 1px solid #e4e4e7;">
          <td style="padding: 8px 10px; text-align: center; font-family: monospace; font-size: 11px; font-weight: bold;">${index + 1}</td>
          <td style="padding: 8px 10px; font-weight: bold; color: #09090b;">${displayName}</td>
          <td style="padding: 8px 10px;">
            <span style="display: inline-block; padding: 2px 8px; background-color: #f4f4f5; border: 1px solid #d4d4d8; border-radius: 4px; font-size: 10px; font-weight: bold; color: #27272a;">
              ${w.position || 'ผู้ปฏิบัติงาน'}
            </span>
          </td>
          <td style="padding: 8px 10px; font-family: monospace; font-size: 11px;">${w.phone || '-'}</td>
          <td style="padding: 8px 10px; color: #52525b; font-size: 10px;">${w.note || contractor.teamName || '-'}</td>
        </tr>
      `;
    }).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ใบรายชื่อผู้ปฏิบัติงาน - ${project.name}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: 'Sarabun', 'TH Sarabun PSK', Arial, sans-serif; font-size: 11pt; color: #18181b; line-height: 1.4; padding: 10px; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; border-bottom: 2px solid #09090b; pb: 10px; }
            .doc-title { font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 4px; color: #09090b; }
            .doc-subtitle { font-size: 10pt; text-align: center; color: #52525b; margin-bottom: 15px; }
            
            .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 15px; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 6px; }
            .info-grid td { padding: 8px 12px; font-size: 10pt; vertical-align: top; }
            .label { font-weight: bold; color: #3f3f46; display: inline-block; min-width: 110px; }

            table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
            table.data-table th { background-color: #18181b; color: #ffffff; text-align: left; padding: 8px 10px; font-size: 10pt; font-weight: bold; }
            table.data-table td { font-size: 10pt; }

            .summary-box { display: flex; justify-content: space-between; background-color: #f4f4f5; border: 1px solid #e4e4e7; padding: 10px 15px; border-radius: 6px; font-size: 10pt; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div class="doc-title">ใบรายชื่อผู้ปฏิบัติงาน</div>
          <div class="doc-subtitle">Project Site Worker Roster</div>

          <table class="info-grid">
            <tr>
              <td style="width: 50%;">
                <span class="label">ชื่อโครงการ:</span> <strong>${project.name}</strong><br/>
                <span class="label">สถานที่ติดตั้ง:</span> ${project.installationSite || '-'}<br/>
                <span class="label">เจ้าของโครงการ:</span> ${project.ownerName || '-'}
              </td>
              <td style="width: 50%;">
                <span class="label">ทีมช่าง/ผู้รับเหมา:</span> <strong>${contractor.teamName || 'ทีมช่างประจำโครงการ'}</strong><br/>
                <span class="label">หัวหน้างาน/โฟร์แมน:</span> ${contractor.foremanName || '-'}<br/>
                <span class="label">วันที่ออกเอกสาร:</span> ${todayStr}
              </td>
            </tr>
          </table>

          <div class="summary-box">
            <div><strong>จำนวนผู้ปฏิบัติงานรวม:</strong> <span style="color: #0284c7; font-weight: bold; font-size: 12pt;">${workers.length}</span> คน</div>
            <div><strong>ผู้จัดการโครงการ (PM):</strong> ${project.projectManager || '-'}</div>
            <div><strong>พนักงานขายดูแลงาน:</strong> ${project.salesPerson || '-'}</div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">ลำดับ</th>
                <th>ชื่อ - นามสกุล ผู้ปฏิบัติงาน</th>
                <th style="width: 180px;">ตำแหน่งในโครงการ</th>
                <th style="width: 130px;">เบอร์โทรศัพท์</th>
                <th>สังกัด / หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="5" style="text-align:center; padding: 20px; color:#71717a; italic;">ยังไม่มีรายชื่อผู้ปฏิบัติงานในระบบ</td></tr>`}
            </tbody>
          </table>

          <div style="margin-top: 20px; padding: 12px 15px; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 6px; font-size: 9.5pt;">
            <div style="font-weight: bold; color: #18181b; margin-bottom: 6px;">📌 หมายเหตุ / ข้อปฏิบัติเพิ่มเติม:</div>
            <ul style="margin: 0; padding-left: 20px; color: #52525b; line-height: 1.6;">
              <li>เอกสารนี้ใช้สำหรับตรวจสอบและยืนยันรายชื่อบุคลากรผู้ปฏิบัติงานจริงในพื้นที่โครงการ</li>
              <li>ผู้ปฏิบัติงานทุกคนต้องสวมใส่อุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล (PPE) ตามมาตรฐานตลอดเวลาที่อยู่ในพื้นที่</li>
              <li>หากมีการเปลี่ยนแปลงหรือเพิ่ม/ลดรายชื่อผู้ปฏิบัติงาน กรุณาแจ้งผู้จัดการโครงการ (PM) หรือหัวหน้าคุมงาน (Foreman) เพื่อปรับปรุงข้อมูลทันที</li>
            </ul>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Export PDF via html2canvas & jsPDF
  const handleExportPDF = async () => {
    const element = document.getElementById('workers-report-card');
    if (!element) return;

    try {
      setIsExportingPDF(true);
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const originalOverflow = element.style.overflow;
      element.style.overflow = 'visible';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#09090b',
        logging: false,
      });

      element.style.overflow = originalOverflow;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const pxToMm = 0.264583;
      const imgWidthMm = canvas.width * pxToMm;
      const imgHeightMm = canvas.height * pxToMm;

      const ratio = Math.min(pdfWidth / imgWidthMm, pdfHeight / imgHeightMm);

      const renderWidth = imgWidthMm * ratio;
      const renderHeight = imgHeightMm * ratio;
      const xOffset = Math.max(0, (pdfWidth - renderWidth) / 2);
      const yOffset = Math.max(0, (pdfHeight - renderHeight) / 2);

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, renderWidth, renderHeight);
      pdf.save(`Worker_Roster_${project.name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      // Fallback to print
      handlePrintDocument();
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title Bar & Stats */}
      <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-lime-500/10 border border-lime-500/20 rounded-xl text-lime-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <span>รายชื่อผู้ปฏิบัติงานในโครงการ (Project Site Workers Roster)</span>
            </h2>
            <p className="text-xs text-zinc-400">
              บริหารจัดการรายชื่อช่าง วิศวกรสนาม คนงาน และตำแหน่งในโครงการ พร้อมพิมพ์เอกสารและออกรายงาน PDF
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-750 text-white border border-zinc-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="บันทึกเอกสารเป็นไฟล์ PDF"
          >
            <Download className="w-4 h-4 text-lime-400" />
            <span>{isExportingPDF ? 'กำลังสร้าง PDF...' : 'บันทึก PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintDocument}
            className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-lime-500/10"
            title="เปิดหน้าต่างพิมพ์ฟอร์มเอกสารทางการ"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ฟอร์มเอกสาร</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">ผู้ปฏิบัติงานทั้งหมด</div>
          <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-1">
            <span>{workers.length}</span>
            <span className="text-xs font-normal text-zinc-500">คน</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">ตำแหน่งงานที่ใช้งาน</div>
          <div className="text-2xl font-black text-lime-400 mt-1 flex items-baseline gap-1">
            <span>{Object.keys(positionStats).length}</span>
            <span className="text-xs font-normal text-zinc-500">สายงาน</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">ทีมผู้รับเหมาหลัก</div>
          <div className="text-sm font-bold text-zinc-200 mt-2 truncate" title={contractor.teamName}>
            {contractor.teamName || 'ยังไม่ระบุชื่อทีม'}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">หัวหน้าคุมงาน (Foreman)</div>
          <div className="text-sm font-bold text-zinc-200 mt-2 truncate" title={contractor.foremanName}>
            {contractor.foremanName || 'ยังไม่ระบุหัวหน้างาน'}
          </div>
        </div>
      </div>

      {/* Main Content Area: Add Form + List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="workers-report-card">
        {/* Left Column: Form to Add Worker & Position Management */}
        <div className="lg:col-span-4 space-y-4">
          {/* Add Worker Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-lime-400" />
                <h3 className="text-sm font-bold text-white">เพิ่มผู้ปฏิบัติงานใหม่</h3>
              </div>

              <button
                type="button"
                onClick={() => setShowManagePositions(!showManagePositions)}
                className="text-[11px] font-semibold text-lime-400 hover:text-lime-300 hover:underline flex items-center gap-1"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>ตัวเลือกตำแหน่ง</span>
              </button>
            </div>

            <form onSubmit={handleAddWorker} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="wk-firstname" className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                    ชื่อจริง *
                  </label>
                  <input
                    id="wk-firstname"
                    type="text"
                    required
                    placeholder="สมชาย"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-lime-500 font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="wk-lastname" className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                    นามสกุล *
                  </label>
                  <input
                    id="wk-lastname"
                    type="text"
                    required
                    placeholder="ใจดี"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-lime-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="wk-position" className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                  ตำแหน่งในโครงการ *
                </label>
                <select
                  id="wk-position"
                  required
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lime-500 font-medium"
                >
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="wk-phone" className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  id="wk-phone"
                  type="text"
                  placeholder="081-234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-lime-500 font-mono"
                />
              </div>

              <div>
                <label htmlFor="wk-note" className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                  หมายเหตุ / ทักษะพิเศษ
                </label>
                <input
                  id="wk-note"
                  type="text"
                  placeholder="เช่น มีใบเซอร์งานเชื่อม / มีบัตรจป."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-lime-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-lime-500 hover:bg-lime-400 text-black font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-lime-500/10 mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>บันทึกเพิ่มรายชื่อผู้ปฏิบัติงาน</span>
              </button>
            </form>
          </div>

          {/* Manage Positions Quick Box */}
          {showManagePositions && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-lime-400" />
                  <span>จัดการรายชื่อตำแหน่งในระบบ</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowManagePositions(false)}
                  className="p-1 text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="เพิ่มตำแหน่งใหม่..."
                  value={newPositionText}
                  onChange={(e) => setNewPositionText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPositionOption())}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-white text-xs placeholder-zinc-700 focus:outline-none focus:border-lime-500"
                />
                <button
                  type="button"
                  onClick={handleAddPositionOption}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-lime-400 font-bold text-xs rounded-lg transition-all"
                >
                  เพิ่ม
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pt-1 pr-1">
                {positions.map((pos) => (
                  <div
                    key={pos}
                    className="flex items-center justify-between bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-850 text-xs"
                  >
                    <span className="text-zinc-300 font-medium truncate">{pos}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePositionOption(pos)}
                      className="text-zinc-600 hover:text-rose-400 p-0.5 rounded transition-colors"
                      title="ลบตำแหน่งนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Filter Bar & Worker Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ นามสกุล ตำแหน่ง หรือเบอร์โทร..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-lime-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
                <select
                  value={selectedPositionFilter}
                  onChange={(e) => setSelectedPositionFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-300 text-xs focus:outline-none focus:border-lime-500 max-w-[180px] truncate"
                >
                  <option value="ALL">-- ทุกตำแหน่ง --</option>
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Workers Table */}
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-400 uppercase font-semibold text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">ลำดับ</th>
                    <th className="py-2.5 px-3">ชื่อ - นามสกุล ผู้ปฏิบัติงาน</th>
                    <th className="py-2.5 px-3">ตำแหน่งในโครงการ</th>
                    <th className="py-2.5 px-3">เบอร์โทรศัพท์</th>
                    <th className="py-2.5 px-3">หมายเหตุ</th>
                    <th className="py-2.5 px-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {filteredWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-zinc-500 italic">
                        {workers.length === 0
                          ? 'ยังไม่มีรายชื่อผู้ปฏิบัติงานในโครงการนี้ กรุณากรอกแบบฟอร์มด้านซ้ายมือเพื่อเพิ่มรายชื่อ'
                          : 'ไม่พบข้อมูลผู้ปฏิบัติงานตามเงื่อนไขค้นหา'}
                      </td>
                    </tr>
                  ) : (
                    filteredWorkers.map((w, index) => (
                      <tr key={w.id} className="hover:bg-zinc-850/50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-zinc-500 font-bold">
                          {index + 1}
                        </td>

                        <td className="py-2.5 px-3 font-bold text-white">
                          {w.firstName && w.lastName ? `${w.firstName} ${w.lastName}` : w.name}
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="px-2.5 py-0.5 bg-lime-500/10 text-lime-400 border border-lime-500/20 rounded-full text-[11px] font-semibold whitespace-nowrap">
                            {w.position || 'ไม่ระบุตำแหน่ง'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 font-mono text-zinc-300">
                          {w.phone ? (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-zinc-500" />
                              <span>{w.phone}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-zinc-400 truncate max-w-[150px]" title={w.note}>
                          {w.note || '-'}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingWorker({ ...w })}
                              className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-lime-400 transition-colors"
                              title="แก้ไขรายชื่อผู้ปฏิบัติงาน"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteWorker(w.id, w.name)}
                              className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors"
                              title="ลบรายชื่อผู้ปฏิบัติงาน"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Edit Worker */}
      {editingWorker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-lime-400" />
                <h3 className="text-base font-bold text-white">แก้ไขข้อมูลผู้ปฏิบัติงาน</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingWorker(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditWorker} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">ชื่อจริง *</label>
                  <input
                    type="text"
                    required
                    value={editingWorker.firstName || editingWorker.name.split(' ')[0] || ''}
                    onChange={(e) =>
                      setEditingWorker({
                        ...editingWorker,
                        firstName: e.target.value,
                        name: `${e.target.value} ${editingWorker.lastName || ''}`.trim(),
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">นามสกุล *</label>
                  <input
                    type="text"
                    required
                    value={editingWorker.lastName || editingWorker.name.split(' ').slice(1).join(' ') || ''}
                    onChange={(e) =>
                      setEditingWorker({
                        ...editingWorker,
                        lastName: e.target.value,
                        name: `${editingWorker.firstName || ''} ${e.target.value}`.trim(),
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lime-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">ตำแหน่งในโครงการ *</label>
                <select
                  required
                  value={editingWorker.position || ''}
                  onChange={(e) => setEditingWorker({ ...editingWorker, position: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lime-500"
                >
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                  {editingWorker.position && !positions.includes(editingWorker.position) && (
                    <option value={editingWorker.position}>{editingWorker.position}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="text"
                  value={editingWorker.phone || ''}
                  onChange={(e) => setEditingWorker({ ...editingWorker, phone: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lime-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">หมายเหตุ / ทักษะพิเศษ</label>
                <input
                  type="text"
                  value={editingWorker.note || ''}
                  onChange={(e) => setEditingWorker({ ...editingWorker, note: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lime-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingWorker(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-lg transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-lime-500 hover:bg-lime-400 text-black font-extrabold text-xs rounded-lg transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกการแก้ไข</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
