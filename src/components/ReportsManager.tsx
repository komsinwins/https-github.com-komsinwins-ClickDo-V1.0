/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, ReportLog } from '../types';
import { FileText, Plus, Trash2, Calendar, Camera, Download, Printer, Check, Clock, User } from 'lucide-react';

interface ReportsManagerProps {
  project: Project;
  onUpdateReports: (reports: ReportLog[]) => void;
}

export default function ReportsManager({ project, onUpdateReports }: ReportsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportLog | null>(null);

  // Form states
  const [type, setType] = useState<'Daily' | 'Weekly'>('Daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weekRange, setWeekRange] = useState('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [reporter, setReporter] = useState(project.projectManager || '');

  // Mock standard photos for easy demonstration
  const MOCK_PHOTOS = [
    { name: 'การติดตั้งแผงหลังคา', url: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400&auto=format&fit=crop&q=60' },
    { name: 'สายตู้ควบคุมไฟ', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=60' },
    { name: 'ทดสอบกระแสไฟฟ้า', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=60' },
  ];

  const resetForm = () => {
    setType('Daily');
    setDate(new Date().toISOString().split('T')[0]);
    setWeekRange('');
    setTitle('');
    setDetails('');
    setPhotos([]);
    setReporter(project.projectManager || '');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAdding(true);
    setSelectedReport(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file as Blob);
    });
  };

  const handleAddMockPhoto = (url: string) => {
    setPhotos((prev) => [...prev, url]);
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !details.trim()) return;

    const newReport: ReportLog = {
      id: `rep-${Date.now()}`,
      type,
      date,
      weekRange: type === 'Weekly' ? weekRange : undefined,
      title: title.trim(),
      details: details.trim(),
      photos,
      reporter: reporter.trim(),
    };

    onUpdateReports([...project.reports, newReport]);
    setIsAdding(false);
    resetForm();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('คุณต้องการลบรายงานปฏิบัติงานติดตั้งฉบับนี้หรือไม่?')) {
      const updated = project.reports.filter((r) => r.id !== id);
      onUpdateReports(updated);
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
    }
  };

  // Printing/Exporting specific report
  const handlePrintReport = (report: ReportLog) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const photosHtml = report.photos && report.photos.length > 0
      ? `<div style="display:grid; grid-template-columns:repeat(2,1fr); gap:15px; margin-top:20px;">
          ${report.photos.map(p => `<img src="${p}" style="width:100%; border-radius:8px; border:1px solid #ddd; object-fit:cover; height:200px;" referrerPolicy="no-referrer" />`).join('')}
         </div>`
      : '<p style="color:#666; font-style:italic;">ไม่มีรูปภาพแนบในรายงานฉบับนี้</p>';

    printWindow.document.write(`
      <html>
        <head>
          <title>รายงานปฏิบัติงานติดตั้ง - ClickDo V1.0</title>
          <style>
            body { font-family: 'Sarabun', sans-serif; color: #111; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 2px solid #84cc16; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin: 0; color: #111; }
            .subtitle { color: #666; font-size: 14px; margin-top: 5px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; background: #f9f9f9; padding: 15px; border-radius: 8px; }
            .meta-item { font-size: 13px; }
            .meta-label { font-weight: bold; color: #555; }
            .details-box { background: #fff; border: 1px solid #eee; padding: 20px; border-radius: 8px; min-height: 150px; white-space: pre-line; }
            .footer { margin-top: 50px; text-align: right; font-size: 13px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">รายงานปฏิบัติงานติดตั้ง (${report.type === 'Daily' ? 'รายวัน' : 'รายสัปดาห์'})</h1>
            <div class="subtitle">ระบบจัดการแผนงาน ClickDo V1.0 • "Click to Plan, Do to Win"</div>
          </div>
          
          <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">ชื่อโครงการ:</span> ${project.name}</div>
            <div class="meta-item"><span class="meta-label">สถานที่ติดตั้ง:</span> ${project.installationSite}</div>
            <div class="meta-item"><span class="meta-label">วันที่จัดทำรายงาน:</span> ${report.date}</div>
            ${report.weekRange ? `<div class="meta-item"><span class="meta-label">ช่วงเวลาสัปดาห์:</span> ${report.weekRange}</div>` : ''}
            <div class="meta-item"><span class="meta-label">ผู้บันทึกรายงาน:</span> ${report.reporter || 'ไม่ระบุ'}</div>
            <div class="meta-item"><span class="meta-label">ผู้ควบคุม (PM):</span> ${project.projectManager}</div>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="margin-top:0; color:#111;">หัวข้อ: ${report.title}</h3>
            <div class="details-box">${report.details}</div>
          </div>

          <div>
            <h4 style="border-bottom: 1px solid #eee; padding-bottom: 5px; color:#555;">รูปถ่ายความคืบหน้าหน้างาน (Photo Attachments)</h4>
            ${photosHtml}
          </div>

          <div class="footer">
            <p>ลงชื่อ.............................................................. ผู้รายงาน</p>
            <p>(${report.reporter || '........................................................'})</p>
            <p>วันที่บันทึก: ${new Date().toLocaleDateString('th-TH')}</p>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Visual Header card */}
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-lime-400" />
          <div>
            <h3 className="font-bold text-white text-base">รายงานความคืบหน้าติดตั้งรายวัน & รายสัปดาห์</h3>
            <p className="text-xs text-zinc-400">บันทึกเหตุการณ์หน้างาน แนบรูปถ่ายอ้างอิงสภาพติดตั้งจริง สรุปเป็นไฟล์เอกสารได้</p>
          </div>
        </div>

        <button
          id="btn-add-report"
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-1.5 bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-black font-extrabold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow"
        >
          <Plus className="w-4 h-4" />
          <span>เขียนรายงานใหม่</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Sidebar list of reports logs */}
        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
          <h4 className="font-bold text-white text-sm border-b border-zinc-800 pb-2">สมุดบันทึกรายงานติดตั้ง ({project.reports?.length || 0})</h4>

          <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
            {(!project.reports || project.reports.length === 0) ? (
              <p className="text-center py-10 text-zinc-600 text-xs italic">
                ยังไม่มีการบันทึกรายงานปฏิบัติงานใดๆ ในระบบ
              </p>
            ) : (
              project.reports.map((rep) => (
                <div
                  key={rep.id}
                  id={`report-item-${rep.id}`}
                  onClick={() => {
                    setSelectedReport(rep);
                    setIsAdding(false);
                  }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedReport?.id === rep.id && !isAdding
                      ? 'bg-zinc-800/80 border-lime-500 shadow'
                      : 'bg-zinc-950/40 border-zinc-800 hover:bg-zinc-950/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${
                        rep.type === 'Daily'
                          ? 'bg-lime-500/10 text-lime-400 border border-lime-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}
                    >
                      {rep.type === 'Daily' ? 'รายวัน (Daily)' : 'รายสัปดาห์'}
                    </span>

                    <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {rep.date}
                    </span>
                  </div>

                  <h5 className="font-bold text-white text-xs truncate mb-1">
                    {rep.title}
                  </h5>

                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {rep.details}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {rep.reporter || 'ไม่ระบุชื่อ'}
                    </span>
                    <span className="text-lime-400 font-semibold font-mono">
                      {rep.photos?.length || 0} รูปภาพ
                    </span>
                    <button
                      id={`btn-delete-report-${rep.id}`}
                      type="button"
                      onClick={(e) => handleDelete(rep.id, e)}
                      className="text-zinc-600 hover:text-rose-400 transition-colors p-1"
                      title="ลบรายงาน"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Form OR expanded selected report view */}
        <div className="lg:col-span-2">
          {isAdding ? (
            /* Create/Add form */
            <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h4 className="font-bold text-white text-sm">จัดทำบันทึกปฏิบัติงานติดตั้งหน้างานฉบับใหม่</h4>
                <button
                  id="btn-cancel-add-rep"
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-zinc-500 hover:text-white text-xs"
                >
                  ยกเลิก
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rep-type" className="block text-xs font-semibold text-zinc-400 mb-1">
                    ประเภทรายงาน *
                  </label>
                  <select
                    id="rep-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lime-500"
                  >
                    <option value="Daily">รายงานประจำวัน (Daily Report)</option>
                    <option value="Weekly">รายงานประจำสัปดาห์ (Weekly Summary)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="rep-date" className="block text-xs font-semibold text-zinc-400 mb-1">
                    วันที่ปฏิบัติงาน *
                  </label>
                  <input
                    id="rep-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lime-500"
                  />
                </div>

                {type === 'Weekly' && (
                  <div className="sm:col-span-2">
                    <label htmlFor="rep-week-range" className="block text-xs font-semibold text-zinc-400 mb-1">
                      ระบุสัปดาห์ช่วงวันที่ *
                    </label>
                    <input
                      id="rep-week-range"
                      type="text"
                      required
                      placeholder="เช่น สัปดาห์ที่ 2 (8 ก.ค. - 14 ก.ค. 2026)"
                      value={weekRange}
                      onChange={(e) => setWeekRange(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-lime-500"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label htmlFor="rep-title" className="block text-xs font-semibold text-zinc-400 mb-1">
                    หัวข้อรายงาน / สรุปประเด็นงาน *
                  </label>
                  <input
                    id="rep-title"
                    type="text"
                    required
                    placeholder="เช่น ดำเนินงานติดโครงบนหลังคาและเตรียมยึดสายไฟอินเวอร์เตอร์"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="rep-reporter" className="block text-xs font-semibold text-zinc-400 mb-1">
                    ชื่อผู้ส่งรายงาน / ผู้รับผิดชอบหน้างาน *
                  </label>
                  <input
                    id="rep-reporter"
                    type="text"
                    required
                    value={reporter}
                    onChange={(e) => setReporter(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="rep-details" className="block text-xs font-semibold text-zinc-400 mb-1">
                    รายละเอียดการทำงานและเหตุการณ์สำคัญ *
                  </label>
                  <textarea
                    id="rep-details"
                    required
                    placeholder="รายละเอียดงาน ช่างที่เข้าร่วม วัสดุที่แกะกล่องอัพเดท อุปสรรคหน้างาน และมาตรการแก้ไข"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-lime-500 h-28"
                  />
                </div>

                {/* Photo Attachments - Requirement 9 */}
                <div className="sm:col-span-2 bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-lime-400" />
                      <span>แนบรูปภาพหน้างานจริง (Photo Gallery)</span>
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">ขนาดไฟล์แนะนำ &lt; 2MB</span>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Real file upload */}
                    <label className="cursor-pointer bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border border-zinc-800 text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all">
                      <Plus className="w-3.5 h-3.5 text-lime-400" />
                      <span>อัปโหลดรูปภาพ</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Quick selection mock photos for demo */}
                    <span className="text-[10px] text-zinc-600 font-mono">หรือจิ้มรูปตัวอย่าง:</span>
                    {MOCK_PHOTOS.map((p) => (
                      <button
                        key={p.url}
                        type="button"
                        onClick={() => handleAddMockPhoto(p.url)}
                        className="px-2 py-1 bg-zinc-900 hover:bg-zinc-850 text-lime-400 border border-zinc-850 text-[10px] rounded transition-all"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>

                  {/* Uploaded photos preview list */}
                  {photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      {photos.map((src, index) => (
                        <div key={index} className="relative group aspect-video bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                          <img src={src} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-1 right-1 p-1 bg-black/80 rounded text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="ลบรูป"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  id="btn-report-form-cancel"
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3.5 py-1.5 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold rounded-md transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  id="btn-report-form-save"
                  type="submit"
                  className="px-4 py-1.5 bg-lime-500 hover:bg-lime-400 text-black font-extrabold text-xs rounded-md transition-all flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>บันทึกรายงาน</span>
                </button>
              </div>
            </form>
          ) : selectedReport ? (
            /* View Report details */
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 text-left animate-fade-in print-card">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="space-y-1">
                  <span
                    className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                      selectedReport.type === 'Daily'
                        ? 'bg-lime-500/10 text-lime-400 border-lime-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}
                  >
                    {selectedReport.type === 'Daily' ? 'บันทึกรายวัน' : 'สรุปรายสัปดาห์'}
                  </span>
                  <h4 className="font-bold text-white text-base md:text-lg">
                    {selectedReport.title}
                  </h4>
                </div>

                <div className="flex gap-2 no-print">
                  <button
                    id="btn-print-active-report"
                    type="button"
                    onClick={() => handlePrintReport(selectedReport)}
                    className="px-3 py-1.5 border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-lime-400 hover:text-lime-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>พิมพ์รายงาน / PDF</span>
                  </button>
                </div>
              </div>

              {/* metadata list */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-950/60 p-3 rounded-lg border border-zinc-850 text-xs text-zinc-400">
                <div>
                  <span className="text-zinc-500 font-semibold block uppercase">วันที่ลงงาน</span>
                  <span className="text-zinc-200 font-medium">{selectedReport.date}</span>
                </div>
                {selectedReport.weekRange && (
                  <div>
                    <span className="text-zinc-500 font-semibold block uppercase">ช่วงแผนสัปดาห์</span>
                    <span className="text-zinc-200 font-medium">{selectedReport.weekRange}</span>
                  </div>
                )}
                <div>
                  <span className="text-zinc-500 font-semibold block uppercase">วิศวกรผู้ทำบันทึก</span>
                  <span className="text-zinc-200 font-medium">{selectedReport.reporter || 'ไม่ระบุชื่อ'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-semibold block uppercase">โครงการ</span>
                  <span className="text-zinc-200 font-medium truncate">{project.name}</span>
                </div>
              </div>

              {/* details block */}
              <div className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed bg-zinc-950/40 p-4 rounded-lg border border-zinc-850/80">
                {selectedReport.details}
              </div>

              {/* photos list */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-400 block border-b border-zinc-800 pb-1">
                  รูปถ่ายปฏิบัติงานจริง (Photo Attachments)
                </span>
                {(!selectedReport.photos || selectedReport.photos.length === 0) ? (
                  <p className="text-xs text-zinc-500 italic">ไม่มีการถ่ายภาพแนบสำหรับรายงานบันทึกฉบับนี้</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedReport.photos.map((photo, index) => (
                      <div
                        key={index}
                        className="group relative aspect-video bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => window.open(photo, '_blank')}
                      >
                        <img
                          src={photo}
                          alt={`Report Photo ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Standby idle state */
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500 space-y-3">
              <FileText className="w-12 h-12 text-zinc-600 mx-auto" />
              <div>
                <h4 className="font-bold text-zinc-400 text-sm">คลิกเปิดดูรายงานจากเมนูด้านซ้าย</h4>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1">
                  เลือกดูบันทึกประจำวันหรือรายสัปดาห์จากตารางประวัติ หรือกด "เขียนรายงานใหม่" เพื่อบันทึกพิกัดหน้างาน
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
