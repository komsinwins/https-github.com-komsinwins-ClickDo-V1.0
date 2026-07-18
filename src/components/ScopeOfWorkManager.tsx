/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, SOWItem } from '../types';
import { Plus, Trash2, Edit3, Calendar, CheckSquare, Download, Check, RefreshCw, Layers, Clock } from 'lucide-react';

interface ScopeOfWorkManagerProps {
  project: Project;
  onUpdateSOW: (scopes: SOWItem[]) => void;
}

export default function ScopeOfWorkManager({ project, onUpdateSOW }: ScopeOfWorkManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Form states
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Not Started' | 'In Progress' | 'Completed'>('Not Started');
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignee, setAssignee] = useState('');

  const resetForm = () => {
    setTaskName('');
    setDescription('');
    setStatus('Not Started');
    setProgress(0);
    setStartDate(project.startDate || '');
    setEndDate(project.endDate || '');
    setAssignee('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAdding(true);
    setEditingId(null);
  };

  const handleOpenEdit = (item: SOWItem) => {
    setTaskName(item.taskName);
    setDescription(item.description);
    setStatus(item.status);
    setProgress(item.progress);
    setStartDate(item.startDate);
    setEndDate(item.endDate);
    setAssignee(item.assignee);
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณแน่ใจว่าต้องการลบงานหมวดนี้หรือไม่?')) {
      const updated = project.scopesOfWork.filter((item) => item.id !== id);
      onUpdateSOW(updated);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    let finalStatus = status;
    let finalProgress = progress;
    if (progress === 100) {
      finalStatus = 'Completed';
    } else if (progress > 0 && status === 'Not Started') {
      finalStatus = 'In Progress';
    } else if (status === 'Completed') {
      finalProgress = 100;
    }

    if (editingId) {
      // Edit mode
      const updated = project.scopesOfWork.map((item) => {
        if (item.id === editingId) {
          return {
            ...item,
            taskName,
            description,
            status: finalStatus,
            progress: finalProgress,
            startDate,
            endDate,
            assignee,
          };
        }
        return item;
      });
      onUpdateSOW(updated);
    } else {
      // Add mode
      const newItem: SOWItem = {
        id: `sow-${Date.now()}`,
        taskName,
        description,
        status: finalStatus,
        progress: finalProgress,
        startDate,
        endDate,
        assignee,
      };
      onUpdateSOW([...project.scopesOfWork, newItem]);
    }

    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };

  // Export CSV helper
  const handleExportCSV = () => {
    const headers = ['Task Name', 'Description', 'Status', 'Progress (%)', 'Start Date', 'End Date', 'Assignee'];
    const rows = project.scopesOfWork.map((item) => [
      `"${item.taskName.replace(/"/g, '""')}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      item.status,
      `${item.progress}%`,
      item.startDate,
      item.endDate,
      `"${item.assignee.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Scope_of_Work_${project.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportGanttToPDF = async () => {
    const element = document.getElementById('gantt-chart-container');
    if (!element) return;

    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Hide export button or other small visual anomalies temporarily if needed
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution crisp text
        useCORS: true,
        backgroundColor: '#18181b', // matches bg-zinc-900 (zinc-900 is #18181b)
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Calculate landscape format PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Gantt_Chart_${project.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error exporting Gantt chart to PDF:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกไฟล์ PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper calculation for Gantt chart
  const projStart = new Date(project.startDate).getTime();
  const projEnd = new Date(project.endDate).getTime();
  const totalProjDays = Math.ceil((projEnd - projStart) / (1000 * 60 * 60 * 24)) + 1;

  const calculateGanttPosition = (taskStartStr: string, taskEndStr: string) => {
    if (!taskStartStr || !taskEndStr || isNaN(projStart) || isNaN(projEnd)) {
      return { leftPct: 0, widthPct: 100 };
    }
    const tStart = new Date(taskStartStr).getTime();
    const tEnd = new Date(taskEndStr).getTime();

    // Clamp values within project duration
    const clampedStart = Math.max(projStart, tStart);
    const clampedEnd = Math.min(projEnd, tEnd);

    const startOffsetDays = Math.floor((clampedStart - projStart) / (1000 * 60 * 60 * 24));
    const durationDays = Math.ceil((clampedEnd - clampedStart) / (1000 * 60 * 60 * 24)) + 1;

    const leftPct = (startOffsetDays / totalProjDays) * 100;
    const widthPct = (durationDays / totalProjDays) * 100;

    return {
      leftPct: Math.max(0, Math.min(100, leftPct)),
      widthPct: Math.max(5, Math.min(100 - leftPct, widthPct)), // Minimum 5% to make visible
    };
  };

  return (
    <div className="space-y-6">
      {/* Header operations */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-lime-400" />
          <div>
            <h3 className="font-bold text-white text-base">การจัดการ Scope Of Work & แผนความคืบหน้า</h3>
            <p className="text-xs text-zinc-400">กำหนดหมวดหมู่งาน, ตารางเวลาติดตั้ง, สรุปผลความก้าวหน้าโครงการ</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-sow-csv"
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-lime-400" />
            <span>Export CSV</span>
          </button>
          <button
            id="btn-print-sow"
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
          >
            <span>พิมพ์แผนงาน</span>
          </button>
          <button
            id="btn-add-sow"
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-1.5 bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-black font-extrabold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่ม Scope งาน</span>
          </button>
        </div>
      </div>

      {/* SOW add/edit form (shown inline) */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h4 className="font-bold text-white text-sm">
              {editingId ? 'แก้ไขข้อมูลงานติดตั้ง' : 'เพิ่มงานและขอบเขตการติดตั้งใหม่'}
            </h4>
            <button
              id="btn-close-sow-form"
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-zinc-500 hover:text-white text-xs font-medium"
            >
              ปิดฟอร์ม
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="sow-task" className="block text-xs font-semibold text-zinc-400 mb-1">
                ชื่องาน/ขอบข่ายงาน *
              </label>
              <input
                id="sow-task"
                type="text"
                required
                placeholder="เช่น เดินท่อร้อยสายไฟฟ้าหลัก, ติดตั้ง Inverter Huawei"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-lime-500 transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="sow-desc" className="block text-xs font-semibold text-zinc-400 mb-1">
                รายละเอียดงานโดยสังเขป
              </label>
              <textarea
                id="sow-desc"
                placeholder="ใส่ข้อมูลเชิงเทคนิคหรือรายละเอียดเพิ่มเติมที่ช่างต้องทราบ"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-lime-500 h-16 transition-all"
              />
            </div>

            <div>
              <label htmlFor="sow-start" className="block text-xs font-semibold text-zinc-400 mb-1">
                วันเริ่มทำงานขอบข่ายนี้ *
              </label>
              <input
                id="sow-start"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lime-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="sow-end" className="block text-xs font-semibold text-zinc-400 mb-1">
                วันเสร็จสิ้นงานขอบข่ายนี้ *
              </label>
              <input
                id="sow-end"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lime-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="sow-assign" className="block text-xs font-semibold text-zinc-400 mb-1">
                ผู้รับผิดชอบงานนี้
              </label>
              <input
                id="sow-assign"
                type="text"
                placeholder="ระบุชื่อวิศวกร หรือทีมช่างผู้รับเหมา"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-lime-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="sow-pct" className="block text-xs font-semibold text-zinc-400 mb-1">
                ความคืบหน้างาน ({progress}%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="sow-pct"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-lime-500"
                />
                <span className="font-mono text-sm text-lime-400 font-bold w-10 text-right">{progress}%</span>
              </div>
            </div>

            <div>
              <label htmlFor="sow-status" className="block text-xs font-semibold text-zinc-400 mb-1">
                สถานะขั้นตอนงาน
              </label>
              <select
                id="sow-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lime-500 transition-all"
              >
                <option value="Not Started">ยังไม่เริ่มต้น (Not Started)</option>
                <option value="In Progress">กำลังดำเนินงาน (In Progress)</option>
                <option value="Completed">เสร็จสมบูรณ์ (Completed)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              id="btn-form-sow-cancel"
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold rounded-md transition-all"
            >
              ยกเลิก
            </button>
            <button
              id="btn-form-sow-save"
              type="submit"
              className="px-4 py-1.5 bg-lime-500 hover:bg-lime-400 text-black font-extrabold text-xs rounded-md transition-all flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>บันทึกหมวดงาน</span>
            </button>
          </div>
        </form>
      )}

      {/* SOW Table list */}
      <div className="overflow-x-auto bg-zinc-900/60 border border-zinc-800 rounded-xl">
        <table className="w-full text-left text-sm text-zinc-300 border-collapse">
          <thead>
            <tr className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 font-medium text-xs tracking-wider uppercase">
              <th className="py-3 px-4">ชื่องานและรายละเอียด</th>
              <th className="py-3 px-4">ผู้รับผิดชอบ</th>
              <th className="py-3 px-4">ความคืบหน้า</th>
              <th className="py-3 px-4">ช่วงเวลา</th>
              <th className="py-3 px-4">สถานะ</th>
              <th className="py-3 px-4 text-right no-print">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {project.scopesOfWork.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-zinc-500 italic font-mono text-xs">
                  ยังไม่มีการเพิ่มรายการขอบข่ายงาน (Scope Of Work) ในโครงการนี้
                </td>
              </tr>
            ) : (
              project.scopesOfWork.map((item) => (
                <tr key={item.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm">{item.taskName}</div>
                    <div className="text-xs text-zinc-500 mt-1 max-w-sm line-clamp-2">
                      {item.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-zinc-300">
                    {item.assignee || '-'}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-lime-400 h-full rounded-full"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-xs text-lime-400">{item.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-zinc-400 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>
                        {item.startDate} ถึง {item.endDate}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Completed'
                          ? 'bg-lime-500/15 text-lime-400 border border-lime-500/20'
                          : item.status === 'In Progress'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {item.status === 'Completed' ? 'เสร็จสมบูรณ์' : item.status === 'In Progress' ? 'กำลังติดตั้ง' : 'ยังไม่เริ่ม'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right no-print">
                    <div className="inline-flex gap-1">
                      <button
                        id={`btn-edit-sow-${item.id}`}
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-lime-400 transition-colors"
                        title="แก้ไขงาน"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`btn-delete-sow-${item.id}`}
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-rose-400 transition-colors"
                        title="ลบงาน"
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

      {/* Gantt / Schedule Timeline Visualizer - Requirement 8 */}
      <div id="gantt-chart-container" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-yellow-400" />
            <h4 className="font-bold text-white text-sm md:text-base font-display">Timeline & Schedule Plan (Gantt Chart)</h4>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-500">
              ระยะเวลาสัญญาหลัก: {project.startDate} ถึง {project.endDate} ({totalProjDays} วัน)
            </span>
            <button
              onClick={exportGanttToPDF}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-white font-semibold rounded-lg border border-zinc-700 text-[11px] transition-all cursor-pointer disabled:opacity-50 no-print"
              title="บันทึกแผนงาน Gantt Chart เป็นไฟล์ PDF"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-lime-400" />
                  <span>กำลังบันทึก PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-lime-400" />
                  <span>บันทึกเป็น PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {project.scopesOfWork.length === 0 ? (
          <div className="text-center py-6 text-zinc-500 italic text-xs">
            กรุณาเพิ่มรายการขอบข่ายงานเพื่อประมวลผล Timeline Gantt Chart
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header timeline indicators (Weeks or divided sections) */}
            <div className="relative pt-6">
              <div className="absolute top-0 inset-x-0 flex justify-between text-[10px] text-zinc-500 font-mono border-b border-zinc-800 pb-1.5">
                <span>เริ่ม: {project.startDate}</span>
                <span>กลางโครงการ</span>
                <span>สิ้นสุด: {project.endDate}</span>
              </div>

              {/* Tasks mapping visually */}
              <div className="space-y-3 pt-3">
                {project.scopesOfWork.map((item) => {
                  const { leftPct, widthPct } = calculateGanttPosition(item.startDate, item.endDate);

                  return (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 pb-2.5 border-b border-zinc-800/40">
                      {/* Left column: Name and progress percentage */}
                      <div className="md:col-span-1 pr-2 truncate">
                        <div className="text-xs font-bold text-zinc-200 truncate" title={item.taskName}>
                          {item.taskName}
                        </div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <span className="text-lime-400 font-semibold">{item.progress}%</span>
                          <span>•</span>
                          <span className="truncate">{item.assignee || 'ไม่มีระบุผู้รับผิดชอบ'}</span>
                        </div>
                      </div>

                      {/* Right column: The visualization bar */}
                      <div className="md:col-span-3 bg-zinc-950 h-8 rounded-lg relative overflow-hidden border border-zinc-800/60 shadow-inner flex items-center">
                        {/* Background subtle grids */}
                        <div className="absolute inset-0 flex justify-between pointer-events-none">
                          <div className="w-[1px] h-full bg-zinc-900/60 border-l border-dashed border-zinc-800" style={{ left: '25%' }} />
                          <div className="w-[1px] h-full bg-zinc-900/60 border-l border-dashed border-zinc-800" style={{ left: '50%' }} />
                          <div className="w-[1px] h-full bg-zinc-900/60 border-l border-dashed border-zinc-800" style={{ left: '75%' }} />
                        </div>

                        {/* Visual progress bar bar */}
                        <div
                          className="absolute h-5 rounded-md flex items-center px-2 transition-all duration-300 shadow shadow-black/50"
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            backgroundColor:
                              item.status === 'Completed'
                                ? 'rgba(132, 204, 22, 0.2)'
                                : item.status === 'In Progress'
                                ? 'rgba(245, 158, 11, 0.2)'
                                : 'rgba(113, 113, 122, 0.2)',
                            border: `1px solid ${
                              item.status === 'Completed'
                                ? '#84cc16'
                                : item.status === 'In Progress'
                                ? '#F59E0B'
                                : '#4B5563'
                            }`,
                          }}
                        >
                          {/* SOW item inner mini progress indicator */}
                          <div
                            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-lime-500/35 to-lime-600/35 z-0"
                            style={{ width: `${item.progress}%` }}
                          />

                          <span className="text-[9px] font-bold text-white font-mono z-10 truncate drop-shadow">
                            {item.startDate.substring(5)} → {item.endDate.substring(5)} ({item.progress}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
