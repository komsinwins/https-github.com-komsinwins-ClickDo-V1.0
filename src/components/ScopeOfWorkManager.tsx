/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, SOWItem, SOWSubTask } from '../types';
import { Plus, Trash2, Edit3, Calendar, CheckSquare, Download, Check, RefreshCw, Layers, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface ScopeOfWorkManagerProps {
  project: Project;
  onUpdateSOW: (scopes: SOWItem[]) => void;
}

export default function ScopeOfWorkManager({ project, onUpdateSOW }: ScopeOfWorkManagerProps) {
  // Sub-tabs switcher: 'timeline' (ขอบข่ายงาน) vs 'schedule' (แผนการดำเนินงาน/รายละเอียดย่อย)
  const [activeTab, setActiveTab] = useState<'timeline' | 'schedule'>('timeline');

  // Main SOW Form states
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingSchedule, setIsExportingSchedule] = useState(false);

  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Not Started' | 'In Progress' | 'Completed'>('Not Started');
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignee, setAssignee] = useState('');
  const [durationDaysInput, setDurationDaysInput] = useState<number>(1);

  // Sub-task form states
  const [activeSubForm, setActiveSubForm] = useState<{ sowId: string; subId: string | null } | null>(null);
  const [subName, setSubName] = useState('');
  const [subStart, setSubStart] = useState('');
  const [subEnd, setSubEnd] = useState('');
  const [subProgress, setSubProgress] = useState(0);
  const [subStatus, setSubStatus] = useState<'Not Started' | 'In Progress' | 'Completed'>('Not Started');

  // Accordion active state for Schedule cards
  const [expandedSOWId, setExpandedSOWId] = useState<string | null>(null);

  const editingItem = editingId ? project.scopesOfWork.find((item) => item.id === editingId) : null;
  const hasSubTasks = editingItem && editingItem.subTasks && editingItem.subTasks.length > 0;

  const resetForm = () => {
    setTaskName('');
    setDescription('');
    setStatus('Not Started');
    setProgress(0);
    setStartDate(project.startDate || '');
    setEndDate(project.endDate || '');
    setAssignee('');
    setDurationDaysInput(1);
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
    setDurationDaysInput(getSOWDurationDays(item));
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

    if (editingId) {
      const existingItem = project.scopesOfWork.find((item) => item.id === editingId);
      if (existingItem && existingItem.subTasks && existingItem.subTasks.length > 0) {
        const subs = existingItem.subTasks;
        finalProgress = Math.round(subs.reduce((sum, s) => sum + s.progress, 0) / subs.length);
        if (finalProgress === 100) {
          finalStatus = 'Completed';
        } else if (finalProgress > 0) {
          finalStatus = 'In Progress';
        } else {
          finalStatus = 'Not Started';
        }
      } else {
        if (progress === 100) {
          finalStatus = 'Completed';
        } else if (progress > 0 && status === 'Not Started') {
          finalStatus = 'In Progress';
        } else if (status === 'Completed') {
          finalProgress = 100;
        }
      }
    } else {
      if (progress === 100) {
        finalStatus = 'Completed';
      } else if (progress > 0 && status === 'Not Started') {
        finalStatus = 'In Progress';
      } else if (status === 'Completed') {
        finalProgress = 100;
      }
    }

    const finalStart = startDate || project.startDate || new Date().toISOString().split('T')[0];
    const startD = new Date(finalStart);
    const endD = new Date(startD);
    endD.setDate(startD.getDate() + (durationDaysInput - 1));
    const finalEnd = isNaN(endD.getTime()) ? finalStart : endD.toISOString().split('T')[0];

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
            startDate: finalStart,
            endDate: finalEnd,
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
        startDate: finalStart,
        endDate: finalEnd,
        assignee,
        subTasks: [],
      };
      onUpdateSOW([...project.scopesOfWork, newItem]);
    }

    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };

  // Sub-task handlers
  const handleOpenAddSub = (sowId: string) => {
    setSubName('');
    setSubStart(project.startDate || '');
    setSubEnd(project.endDate || '');
    setSubProgress(0);
    setSubStatus('Not Started');
    setActiveSubForm({ sowId, subId: null });
  };

  const handleOpenEditSub = (sowId: string, sub: SOWSubTask) => {
    setSubName(sub.name);
    setSubStart(sub.startDate);
    setSubEnd(sub.endDate);
    setSubProgress(sub.progress);
    setSubStatus(sub.status);
    setActiveSubForm({ sowId, subId: sub.id });
  };

  const handleSaveSubTask = (sowId: string) => {
    if (!subName.trim()) return;

    const updatedSOW = project.scopesOfWork.map((item) => {
      if (item.id === sowId) {
        const subs = item.subTasks || [];
        let newSubs = [...subs];

        const subDuration = Math.ceil((new Date(subEnd).getTime() - new Date(subStart).getTime()) / (1000 * 60 * 60 * 24)) + 1 || 1;

        let finalSubStatus = subStatus;
        let finalSubProgress = subProgress;
        if (subProgress === 100) {
          finalSubStatus = 'Completed';
        } else if (subProgress > 0 && subStatus === 'Not Started') {
          finalSubStatus = 'In Progress';
        } else if (subStatus === 'Completed') {
          finalSubProgress = 100;
        }

        if (activeSubForm?.subId) {
          // Edit mode
          newSubs = subs.map((s) => {
            if (s.id === activeSubForm.subId) {
              return {
                ...s,
                name: subName,
                startDate: subStart,
                endDate: subEnd,
                durationDays: subDuration,
                progress: finalSubProgress,
                status: finalSubStatus,
              };
            }
            return s;
          });
        } else {
          // Add mode
          const newSub: SOWSubTask = {
            id: `sub-${Date.now()}`,
            name: subName,
            startDate: subStart,
            endDate: subEnd,
            durationDays: subDuration,
            progress: finalSubProgress,
            status: finalSubStatus,
          };
          newSubs.push(newSub);
        }

        // Auto calculate progress of the main SOW item
        const avgProgress = newSubs.length > 0
          ? Math.round(newSubs.reduce((sum, s) => sum + s.progress, 0) / newSubs.length)
          : item.progress;

        let itemStatus = item.status;
        if (avgProgress === 100) {
          itemStatus = 'Completed';
        } else if (avgProgress > 0) {
          itemStatus = 'In Progress';
        } else {
          itemStatus = 'Not Started';
        }

        // Align parent SOW dates with the min/max dates of its sub-tasks for calendar consistency
        let parentStart = item.startDate;
        let parentEnd = item.endDate;
        if (newSubs.length > 0) {
          const sortedStart = [...newSubs].sort((a, b) => a.startDate.localeCompare(b.startDate));
          const sortedEnd = [...newSubs].sort((a, b) => b.endDate.localeCompare(a.endDate));
          parentStart = sortedStart[0].startDate;
          parentEnd = sortedEnd[0].endDate;
        }

        return {
          ...item,
          subTasks: newSubs,
          progress: avgProgress,
          status: itemStatus,
          startDate: parentStart,
          endDate: parentEnd,
        };
      }
      return item;
    });

    onUpdateSOW(updatedSOW);
    setActiveSubForm(null);
  };

  const handleDeleteSubTask = (sowId: string, subId: string) => {
    if (!confirm('คุณแน่ใจว่าต้องการลบรายละเอียดย่อยนี้?')) return;

    const updatedSOW = project.scopesOfWork.map((item) => {
      if (item.id === sowId) {
        const subs = item.subTasks || [];
        const newSubs = subs.filter((s) => s.id !== subId);

        const avgProgress = newSubs.length > 0
          ? Math.round(newSubs.reduce((sum, s) => sum + s.progress, 0) / newSubs.length)
          : 0;

        let itemStatus = item.status;
        if (newSubs.length === 0) {
          itemStatus = 'Not Started';
        } else if (avgProgress === 100) {
          itemStatus = 'Completed';
        } else if (avgProgress > 0) {
          itemStatus = 'In Progress';
        } else {
          itemStatus = 'Not Started';
        }

        let parentStart = item.startDate;
        let parentEnd = item.endDate;
        if (newSubs.length > 0) {
          const sortedStart = [...newSubs].sort((a, b) => a.startDate.localeCompare(b.startDate));
          const sortedEnd = [...newSubs].sort((a, b) => b.endDate.localeCompare(a.endDate));
          parentStart = sortedStart[0].startDate;
          parentEnd = sortedEnd[0].endDate;
        }

        return {
          ...item,
          subTasks: newSubs,
          progress: avgProgress,
          status: itemStatus,
          startDate: parentStart,
          endDate: parentEnd,
        };
      }
      return item;
    });

    onUpdateSOW(updatedSOW);
  };

  // Calculate SOW Item duration in days
  const getSOWDurationDays = (item: SOWItem) => {
    if (!item.startDate || !item.endDate) return 1;
    const tStart = new Date(item.startDate).getTime();
    const tEnd = new Date(item.endDate).getTime();
    if (isNaN(tStart) || isNaN(tEnd)) return 1;
    return Math.ceil((tEnd - tStart) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Export CSV helper
  const handleExportCSV = () => {
    const headers = ['Topic/Task Name', 'Description', 'Duration (Days)', 'Progress (%)', 'Status', 'Assignee'];
    const rows = project.scopesOfWork.map((item) => {
      const duration = getSOWDurationDays(item);
      return [
        `"${item.taskName.replace(/"/g, '""')}"`,
        `"${item.description.replace(/"/g, '""')}"`,
        `${duration} วัน`,
        `${item.progress}%`,
        item.status,
        `"${item.assignee.replace(/"/g, '""')}"`,
      ];
    });

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

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#18181b',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Gantt_Chart_${project.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error exporting Gantt:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกไฟล์ PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportScheduleToPDF = async () => {
    const element = document.getElementById('schedule-chart-container');
    if (!element) return;

    setIsExportingSchedule(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#18181b',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Schedule_Plan_Chart_${project.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error exporting Schedule Chart:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกไฟล์ PDF');
    } finally {
      setIsExportingSchedule(false);
    }
  };

  // Gantt positions calculation
  const projStart = new Date(project.startDate).getTime();
  const projEnd = new Date(project.endDate).getTime();
  const totalProjDays = Math.ceil((projEnd - projStart) / (1000 * 60 * 60 * 24)) + 1;

  const calculateGanttPosition = (taskStartStr: string, taskEndStr: string) => {
    if (!taskStartStr || !taskEndStr || isNaN(projStart) || isNaN(projEnd)) {
      return { leftPct: 0, widthPct: 100 };
    }
    const tStart = new Date(taskStartStr).getTime();
    const tEnd = new Date(taskEndStr).getTime();

    const clampedStart = Math.max(projStart, tStart);
    const clampedEnd = Math.min(projEnd, tEnd);

    const startOffsetDays = Math.floor((clampedStart - projStart) / (1000 * 60 * 60 * 24));
    const durationDays = Math.ceil((clampedEnd - clampedStart) / (1000 * 60 * 60 * 24)) + 1;

    const leftPct = (startOffsetDays / totalProjDays) * 100;
    const widthPct = (durationDays / totalProjDays) * 100;

    return {
      leftPct: Math.max(0, Math.min(100, leftPct)),
      widthPct: Math.max(5, Math.min(100 - leftPct, widthPct)),
    };
  };

  // Sub-task statistics computation
  const allSubTasks = project.scopesOfWork.flatMap(item => (item.subTasks || []).map(sub => ({ ...sub, parentTaskName: item.taskName, parentId: item.id })));
  const totalSubCount = allSubTasks.length;
  const completedSubCount = allSubTasks.filter(s => s.status === 'Completed').length;
  const inProgressSubCount = allSubTasks.filter(s => s.status === 'In Progress').length;
  const notStartedSubCount = allSubTasks.filter(s => s.status === 'Not Started').length;
  const averageSubProgress = totalSubCount > 0 
    ? Math.round(allSubTasks.reduce((sum, s) => sum + s.progress, 0) / totalSubCount)
    : 0;

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-900 no-print">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-lime-400" />
          <div>
            <h3 className="font-bold text-white text-base">การจัดการขอบข่ายและตารางงาน (SOW & Schedules)</h3>
            <p className="text-xs text-zinc-400">สลับเมนูเพื่อกำหนดหัวข้อหลัก (Timeline) และจัดการตารางงานย่อย (Schedule Plan)</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-lime-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-1.5 bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-black font-extrabold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มหัวข้อ Scope งานหลัก</span>
          </button>
        </div>
      </div>

      {/* Sub Menu Switcher Tabs */}
      <div className="flex border-b border-zinc-800 text-sm no-print">
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`px-5 py-3 font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'timeline'
              ? 'border-lime-500 text-lime-400 bg-lime-500/5'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Timeline (หัวข้อหลักและระยะเวลา)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`px-5 py-3 font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'schedule'
              ? 'border-yellow-500 text-yellow-400 bg-yellow-500/5'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>2. Schedule Plan (แผนงาน & รายละเอียดย่อย)</span>
        </button>
      </div>

      {/* SOW add/edit form (shown inline) */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4 animate-fade-in no-print">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h4 className="font-bold text-white text-sm">
              {editingId ? 'แก้ไขข้อมูลหัวข้อหลัก' : 'เพิ่มหัวข้อขอบข่ายงานติดตั้งใหม่'}
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
                หัวข้อหลัก / ขอบข่ายงาน *
              </label>
              <input
                id="sow-task"
                type="text"
                required
                placeholder="เช่น ติดตั้งแผงโซลาร์เซลล์, เชื่อมสายระบบ AC/DC"
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
                placeholder="ใส่ข้อมูลเชิงเทคนิคหรือรายละเอียดเพิ่มเติมที่เกี่ยวข้อง"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-lime-500 h-16 transition-all"
              />
            </div>

            <div>
              <label htmlFor="sow-duration" className="block text-xs font-semibold text-zinc-400 mb-1">
                ระยะเวลาทำงาน (วัน) *
              </label>
              <input
                id="sow-duration"
                type="number"
                min="1"
                required
                placeholder="ระบุจำนวนวัน เช่น 10"
                value={durationDaysInput}
                onChange={(e) => setDurationDaysInput(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-650 text-sm focus:outline-none focus:border-lime-500 transition-all font-mono"
              />
            </div>

            <div>
              <label htmlFor="sow-assign" className="block text-xs font-semibold text-zinc-400 mb-1">
                ผู้รับผิดชอบงานนี้
              </label>
              <input
                id="sow-assign"
                type="text"
                placeholder="ระบุชื่อวิศวกร หรือทีมช่าง"
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
                  disabled={!!hasSubTasks}
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className={`w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-lime-500 ${hasSubTasks ? 'opacity-40 cursor-not-allowed' : ''}`}
                />
                <span className="font-mono text-sm text-lime-400 font-bold w-10 text-right">{progress}%</span>
              </div>
              {hasSubTasks && (
                <span className="text-[10px] text-yellow-500/80 mt-1 block">
                  * คำนวณอัตโนมัติจากแผนงานใน Schedule plan
                </span>
              )}
            </div>

            <div>
              <label htmlFor="sow-status" className="block text-xs font-semibold text-zinc-400 mb-1">
                สถานะขั้นตอนงาน
              </label>
              <select
                id="sow-status"
                disabled={!!hasSubTasks}
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={`w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lime-500 transition-all ${hasSubTasks ? 'opacity-40 cursor-not-allowed' : ''}`}
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
              className="px-3.5 py-1.5 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold rounded-md transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              id="btn-form-sow-save"
              type="submit"
              className="px-4 py-1.5 bg-lime-500 hover:bg-lime-400 text-black font-extrabold text-xs rounded-md transition-all flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>บันทึกหัวข้อ</span>
            </button>
          </div>
        </form>
      )}

      {/* RENDER ACTIVE TAB */}

      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Timeline View: Lists main topics specifying duration in days without listing calendar dates */}
          <div className="overflow-x-auto bg-zinc-900/60 border border-zinc-800 rounded-xl">
            <table className="w-full text-left text-sm text-zinc-300 border-collapse">
              <thead>
                <tr className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 font-medium text-xs tracking-wider uppercase">
                  <th className="py-3 px-4">หัวข้อหลักใน Timeline</th>
                  <th className="py-3 px-4">ผู้รับผิดชอบหลัก</th>
                  <th className="py-3 px-4">ระยะเวลาที่ทำ</th>
                  <th className="py-3 px-4">ความคืบหน้างาน</th>
                  <th className="py-3 px-4">สถานะการทำงาน</th>
                  <th className="py-3 px-4 text-right no-print">จัดการหัวข้อ</th>
                </tr>
              </thead>
              <tbody>
                {project.scopesOfWork.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-zinc-500 italic font-mono text-xs">
                      ยังไม่มีการเพิ่มรายการหัวข้อหลักในโครงการนี้
                    </td>
                  </tr>
                ) : (
                  project.scopesOfWork.map((item) => {
                    const duration = getSOWDurationDays(item);
                    return (
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
                        <td className="py-3.5 px-4 text-xs font-mono text-lime-400 font-bold whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{duration} วัน</span>
                          </div>
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
                            {item.status === 'Completed' ? 'เสร็จสมบูรณ์' : item.status === 'In Progress' ? 'กำลังดำเนินงาน' : 'ยังไม่เริ่ม'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right no-print">
                          <div className="inline-flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-lime-400 transition-colors cursor-pointer"
                              title="แก้ไขข้อมูลหลัก"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="ลบข้อมูลหลัก"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* SOW Gantt Chart section */}
          <div id="gantt-chart-container" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-yellow-400" />
                <h4 className="font-bold text-white text-sm md:text-base font-display">Timeline Gantt Chart Visualizer</h4>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={exportGanttToPDF}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-white font-semibold rounded-lg border border-zinc-700 text-[11px] transition-all cursor-pointer disabled:opacity-50 no-print"
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
                กรุณาเพิ่มรายการขอบข่ายงานเพื่อประมวลผล Timeline
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative pt-6">
                  <div className="absolute top-0 inset-x-0 flex justify-between text-[10px] text-zinc-500 font-mono border-b border-zinc-800 pb-1.5">
                    <span>วันเริ่มต้นโครงการหลัก</span>
                    <span>กลางแผนงาน</span>
                    <span>วันสิ้นสุด/วันปิดโครงการ</span>
                  </div>

                  <div className="space-y-3 pt-3">
                    {project.scopesOfWork.map((item) => {
                      const { leftPct, widthPct } = calculateGanttPosition(item.startDate, item.endDate);
                      const duration = getSOWDurationDays(item);

                      return (
                        <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 pb-2.5 border-b border-zinc-800/40">
                          <div className="md:col-span-1 pr-2 truncate">
                            <div className="text-xs font-bold text-zinc-200 truncate" title={item.taskName}>
                              {item.taskName}
                            </div>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                              <span className="text-lime-400 font-semibold">{item.progress}%</span>
                              <span>•</span>
                              <span className="truncate">{duration} วัน</span>
                            </div>
                          </div>

                          <div className="md:col-span-3 bg-zinc-950 h-8 rounded-lg relative overflow-hidden border border-zinc-800/60 shadow-inner flex items-center">
                            <div className="absolute inset-0 flex justify-between pointer-events-none">
                              <div className="w-[1px] h-full bg-zinc-900/60 border-l border-dashed border-zinc-800" style={{ left: '25%' }} />
                              <div className="w-[1px] h-full bg-zinc-900/60 border-l border-dashed border-zinc-800" style={{ left: '50%' }} />
                              <div className="w-[1px] h-full bg-zinc-900/60 border-l border-dashed border-zinc-800" style={{ left: '75%' }} />
                            </div>

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
                              <div
                                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-lime-500/35 to-lime-600/35 z-0"
                                style={{ width: `${item.progress}%` }}
                              />

                              <span className="text-[9px] font-bold text-white font-mono z-10 truncate drop-shadow">
                                ระยะเวลางาน: {duration} วัน ({item.progress}%)
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
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-6 animate-fade-in">
          {/* Schedule Plan Chart Visualizer Section */}
          <div id="schedule-chart-container" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-yellow-400" />
                <h4 className="font-bold text-white text-sm md:text-base font-display">Schedule Plan Gantt Chart Visualizer</h4>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={exportScheduleToPDF}
                  disabled={isExportingSchedule}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-white font-semibold rounded-lg border border-zinc-700 text-[11px] transition-all cursor-pointer disabled:opacity-50 no-print"
                >
                  {isExportingSchedule ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-yellow-400" />
                      <span>กำลังบันทึก PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-yellow-400" />
                      <span>บันทึกเป็น PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Metrics Overview Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-2 border-b border-zinc-850/60">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/60 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold mb-1">ความคืบหน้าเฉลี่ย</span>
                  <span className="text-2xl font-black font-mono text-yellow-400">{averageSubProgress}%</span>
                </div>
                <div className="w-full bg-zinc-850 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-yellow-400 h-full rounded-full transition-all duration-500" style={{ width: `${averageSubProgress}%` }} />
                </div>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/60 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold mb-1">งานย่อยทั้งหมด</span>
                  <span className="text-2xl font-black font-mono text-white">{totalSubCount}</span>
                </div>
                <span className="text-xs text-zinc-500 font-mono mt-3">รวมทุกหัวข้อหลัก</span>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/60 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold mb-1 text-emerald-500">เสร็จสิ้น (Completed)</span>
                  <span className="text-2xl font-black font-mono text-emerald-400">{completedSubCount}</span>
                </div>
                <span className="text-xs text-emerald-500/60 font-mono mt-3">
                  {totalSubCount > 0 ? Math.round((completedSubCount / totalSubCount) * 100) : 0}% ของงานทั้งหมด
                </span>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/60 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold mb-1 text-amber-500">กำลังทำ (In Progress)</span>
                  <span className="text-2xl font-black font-mono text-amber-400">{inProgressSubCount}</span>
                </div>
                <span className="text-xs text-amber-500/60 font-mono mt-3">
                  {totalSubCount > 0 ? Math.round((inProgressSubCount / totalSubCount) * 100) : 0}% อยู่ระหว่างดำเนินการ
                </span>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/60 flex flex-col justify-between col-span-2 md:col-span-1">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold mb-1 text-zinc-400">ยังไม่เริ่ม (Not Started)</span>
                  <span className="text-2xl font-black font-mono text-zinc-400">{notStartedSubCount}</span>
                </div>
                <span className="text-xs text-zinc-500 font-mono mt-3">
                  {totalSubCount > 0 ? Math.round((notStartedSubCount / totalSubCount) * 100) : 0}% รอการเริ่มงาน
                </span>
              </div>
            </div>

            {/* Hierarchical Subtask Timeline Gantt Chart */}
            <div className="space-y-4">
              <div className="relative pt-6">
                <div className="absolute top-0 inset-x-0 flex justify-between text-[10px] text-zinc-500 font-mono border-b border-zinc-800 pb-1.5">
                  <span>วันเริ่มต้นโครงการหลัก</span>
                  <span>กลางแผนงาน</span>
                  <span>วันสิ้นสุด/วันปิดโครงการ</span>
                </div>

                <div className="space-y-4 pt-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {project.scopesOfWork.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 italic text-xs font-mono">
                      ยังไม่มีรายการขอบข่ายงานหลัก กรุณาเพิ่มที่ด้านขวาบน
                    </div>
                  ) : (
                    project.scopesOfWork.map((item) => {
                      const subs = item.subTasks || [];
                      const duration = getSOWDurationDays(item);
                      const { leftPct: mLeft, widthPct: mWidth } = calculateGanttPosition(item.startDate, item.endDate);

                      return (
                        <div key={item.id} className="space-y-2 border-b border-zinc-800/40 pb-3">
                          {/* SOW Main Task Header Row */}
                          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 pb-1.5 pt-1">
                            <div className="md:col-span-1 pr-2 truncate">
                              <div className="text-xs font-bold text-lime-400 truncate flex items-center gap-1.5" title={item.taskName}>
                                <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                                <span>{item.taskName}</span>
                              </div>
                              <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                <span className="text-zinc-400 font-semibold">{item.progress}%</span>
                                <span>•</span>
                                <span className="truncate">{duration} วัน</span>
                                <span className="text-[9px] px-1 bg-zinc-800 rounded text-zinc-400 font-mono">หัวข้อหลัก</span>
                              </div>
                            </div>

                            <div className="md:col-span-3 bg-zinc-950 h-8 rounded-lg relative overflow-hidden border border-zinc-800/60 shadow-inner flex items-center">
                              <div className="absolute inset-0 flex justify-between pointer-events-none">
                                <div className="w-[1px] h-full bg-zinc-900/60 border-l border-dashed border-zinc-800" style={{ left: '25%' }} />
                                <div className="w-[1px] h-full bg-zinc-900/60 border-l border-dashed border-zinc-800" style={{ left: '50%' }} />
                                <div className="w-[1px] h-full bg-zinc-900/60 border-l border-dashed border-zinc-800" style={{ left: '75%' }} />
                              </div>

                              <div
                                className="absolute h-5 rounded-md flex items-center px-2 transition-all duration-300 shadow shadow-black/50"
                                style={{
                                  left: `${mLeft}%`,
                                  width: `${mWidth}%`,
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
                                <div
                                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-lime-500/35 to-lime-600/35 z-0"
                                  style={{ width: `${item.progress}%` }}
                                />

                                <span className="text-[9px] font-bold text-white font-mono z-10 truncate drop-shadow">
                                  ระยะเวลางาน: {duration} วัน ({item.progress}%)
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* SOW Sub-tasks Rows */}
                          <div className="space-y-2 pl-4 border-l-2 border-zinc-800/60">
                            {subs.length === 0 ? (
                              <div className="text-[10px] text-zinc-600 italic py-0.5">
                               ไม่มีตารางงานย่อยระบุไว้ในหัวข้อนึ้ (เพิ่มงานย่อยได้ที่การ์ดข้อที่ 2 แผนงาน ด้านล่าง)
                              </div>
                            ) : (
                              subs.map((sub) => {
                                const { leftPct: sLeft, widthPct: sWidth } = calculateGanttPosition(sub.startDate, sub.endDate);
                                return (
                                  <div key={sub.id} className="grid grid-cols-1 md:grid-cols-4 items-center gap-2">
                                    <div className="md:col-span-1 pr-2 truncate">
                                      <div className="text-xs font-medium text-zinc-300 truncate flex items-center gap-1.5" title={sub.name}>
                                        <span className="w-1 h-1 rounded-full bg-yellow-400" />
                                        <span>{sub.name}</span>
                                      </div>
                                      <div className="text-[9px] text-zinc-500 font-mono flex items-center gap-1.5 mt-0.5">
                                        <span className={`font-bold ${
                                          sub.status === 'Completed' ? 'text-lime-400' : sub.status === 'In Progress' ? 'text-amber-400' : 'text-zinc-500'
                                        }`}>
                                          {sub.progress}%
                                        </span>
                                        <span>•</span>
                                        <span>{sub.startDate} ถึง {sub.endDate}</span>
                                        <span>•</span>
                                        <span className="text-zinc-400 font-semibold">{sub.durationDays || 1} วัน</span>
                                      </div>
                                    </div>

                                    {/* Sub-task Gantt bar container */}
                                    <div className="md:col-span-3 bg-zinc-950 h-8 rounded-lg relative overflow-hidden border border-zinc-800/60 shadow-inner flex items-center">
                                      {/* Grid Lines */}
                                      <div className="absolute inset-0 flex justify-between pointer-events-none">
                                        <div className="w-[1px] h-full bg-zinc-900/60 border-l border-dashed border-zinc-800" style={{ left: '25%' }} />
                                        <div className="w-[1px] h-full bg-zinc-900/60 border-l border-dashed border-zinc-800" style={{ left: '50%' }} />
                                        <div className="w-[1px] h-full bg-zinc-900/60 border-l border-dashed border-zinc-800" style={{ left: '75%' }} />
                                      </div>

                                      {/* Colored Gantt block representing Sub-task Duration & Progress */}
                                      <div
                                        className="absolute h-5 rounded-md flex items-center px-2 transition-all duration-300 shadow shadow-black/50"
                                        style={{
                                          left: `${sLeft}%`,
                                          width: `${sWidth}%`,
                                          backgroundColor:
                                            sub.status === 'Completed'
                                              ? 'rgba(132, 204, 22, 0.2)'
                                              : sub.status === 'In Progress'
                                              ? 'rgba(245, 158, 11, 0.2)'
                                              : 'rgba(113, 113, 122, 0.2)',
                                          border: `1px solid ${
                                            sub.status === 'Completed'
                                              ? '#84cc16'
                                              : sub.status === 'In Progress'
                                              ? '#F59E0B'
                                              : '#4B5563'
                                          }`,
                                        }}
                                      >
                                        <div
                                          className={`absolute top-0 bottom-0 left-0 bg-gradient-to-r ${
                                            sub.status === 'Completed'
                                              ? 'from-lime-500/35 to-lime-600/35'
                                              : 'from-amber-500/35 to-amber-600/35'
                                          } z-0`}
                                          style={{ width: `${sub.progress}%` }}
                                        />

                                        <span className="text-[9px] font-bold text-white font-mono z-10 truncate drop-shadow">
                                          {sub.name} ({sub.progress}%)
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Plan View: Reference SOW items and support managing sub-tasks/details under each main topic */}
          <div className="space-y-4">
            {project.scopesOfWork.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-850 p-8 rounded-xl text-center text-zinc-500 italic text-sm">
                ยังไม่มีหัวข้อหลักใน Timeline กรุณาสร้างหัวข้อหลักก่อนเพื่อใช้อ้างอิงจัดระเบียบแผน Schedule Plan
              </div>
            ) : (
              project.scopesOfWork.map((topic) => {
                const subTasks = topic.subTasks || [];
                const isExpanded = expandedSOWId === topic.id;

                return (
                  <div key={topic.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-md">
                    {/* Header bar of main topic */}
                    <div
                      onClick={() => setExpandedSOWId(isExpanded ? null : topic.id)}
                      className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950/60 border-b border-zinc-800/80 cursor-pointer hover:bg-zinc-950/90 transition-all select-none"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] px-2 py-0.5 font-bold uppercase rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            หัวข้อหลัก
                          </span>
                          <span className="text-zinc-500 text-xs font-mono">
                            ({subTasks.length} งานย่อย)
                          </span>
                        </div>
                        <h4 className="text-base font-black text-white truncate">{topic.taskName}</h4>
                      </div>

                      <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Parent SOW calculated stats */}
                        <div className="text-right space-y-0.5">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">ความก้าวหน้าคำนวณ</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-zinc-800 h-1 rounded-full overflow-hidden">
                              <div className="bg-lime-400 h-full" style={{ width: `${topic.progress}%` }} />
                            </div>
                            <span className="text-xs font-mono font-extrabold text-lime-400">{topic.progress}%</span>
                          </div>
                        </div>

                        {/* Add subtask button */}
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedSOWId(topic.id);
                            handleOpenAddSub(topic.id);
                          }}
                          className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs rounded-lg flex items-center gap-1 transition-all shadow cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>เพิ่มงานย่อย</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedSOWId(isExpanded ? null : topic.id)}
                          className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Sub-tasks lists area */}
                    {isExpanded && (
                      <div className="p-5 space-y-4 bg-zinc-900/20">
                        {/* Inline Form to add/edit subtask */}
                        {activeSubForm && activeSubForm.sowId === topic.id && (
                          <div className="p-4 bg-zinc-950 border border-yellow-500/20 rounded-xl space-y-4 animate-fade-in no-print">
                            <h5 className="font-bold text-yellow-400 text-xs uppercase tracking-wider">
                              {activeSubForm.subId ? 'แก้ไขรายละเอียดย่อย' : 'เพิ่มรายละเอียดย่อยใหม่'}
                            </h5>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="md:col-span-3">
                                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">ชื่องานย่อย / รายละเอียด *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="ระบุชื่องานย่อยที่จะปฏิบัติ"
                                  value={subName}
                                  onChange={(e) => setSubName(e.target.value)}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-yellow-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">วันเริ่มต้นงานย่อย</label>
                                <input
                                  type="date"
                                  required
                                  value={subStart}
                                  onChange={(e) => setSubStart(e.target.value)}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-yellow-500 font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">วันสิ้นสุดงานย่อย</label>
                                <input
                                  type="date"
                                  required
                                  value={subEnd}
                                  onChange={(e) => setSubEnd(e.target.value)}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-yellow-500 font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">สถานะงาน</label>
                                <select
                                  value={subStatus}
                                  onChange={(e) => setSubStatus(e.target.value as any)}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none"
                                >
                                  <option value="Not Started">ยังไม่เริ่ม</option>
                                  <option value="In Progress">กำลังทำ</option>
                                  <option value="Completed">เสร็จสมบูรณ์</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">ความคืบหน้า ({subProgress}%)</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="10"
                                    value={subProgress}
                                    onChange={(e) => setSubProgress(Number(e.target.value))}
                                    className="w-full accent-yellow-500 cursor-pointer"
                                  />
                                  <span className="text-xs font-mono text-yellow-400 font-bold">{subProgress}%</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end gap-1.5 pt-2 border-t border-zinc-800/80">
                              <button
                                type="button"
                                onClick={() => setActiveSubForm(null)}
                                className="px-3 py-1 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-[10px] font-semibold rounded cursor-pointer"
                              >
                                ยกเลิก
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveSubTask(topic.id)}
                                className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-[10px] rounded cursor-pointer"
                              >
                                บันทึกรายละเอียดย่อย
                              </button>
                            </div>
                          </div>
                        )}

                        {/* List of sub-tasks in a table or list style */}
                        <div className="overflow-x-auto border border-zinc-800/60 rounded-xl bg-zinc-950/45">
                          <table className="w-full text-left text-xs text-zinc-300">
                            <thead>
                              <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                                <th className="py-2.5 px-3">ชื่องานย่อย/รายละเอียดย่อย</th>
                                <th className="py-2.5 px-3">วันเริ่มต้น</th>
                                <th className="py-2.5 px-3">วันสิ้นสุด</th>
                                <th className="py-2.5 px-3">ระยะเวลาทำงาน</th>
                                <th className="py-2.5 px-3">ความคืบหน้าย่อย</th>
                                <th className="py-2.5 px-3">สถานะ</th>
                                <th className="py-2.5 px-3 text-right">การจัดการ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subTasks.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="text-center py-6 text-zinc-500 italic">
                                    ยังไม่มีแผนความคืบหน้างานย่อยในหัวข้อนึ้ คลิก 'เพิ่มงานย่อย' ด้านขวาเพื่อกำหนดรายการย่อยและช่วงเวลา
                                  </td>
                                </tr>
                              ) : (
                                subTasks.map((sub) => (
                                  <tr key={sub.id} className="border-b border-zinc-800/40 hover:bg-zinc-900/30">
                                    <td className="py-2.5 px-3 font-bold text-white">{sub.name}</td>
                                    <td className="py-2.5 px-3 text-zinc-400 font-mono">{sub.startDate}</td>
                                    <td className="py-2.5 px-3 text-zinc-400 font-mono">{sub.endDate}</td>
                                    <td className="py-2.5 px-3 font-semibold text-yellow-400">{sub.durationDays || 1} วัน</td>
                                    <td className="py-2.5 px-3">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-16 bg-zinc-800 h-1 rounded-full overflow-hidden">
                                          <div className="bg-yellow-400 h-full" style={{ width: `${sub.progress}%` }} />
                                        </div>
                                        <span className="font-mono text-[10px] text-yellow-400 font-bold">{sub.progress}%</span>
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span
                                        className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                          sub.status === 'Completed'
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                            : sub.status === 'In Progress'
                                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'
                                            : 'bg-zinc-800 text-zinc-400 border border-zinc-750'
                                        }`}
                                      >
                                        {sub.status === 'Completed' ? 'เสร็จแล้ว' : sub.status === 'In Progress' ? 'กำลังทำ' : 'ยังไม่เริ่ม'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      <div className="inline-flex gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditSub(topic.id, sub)}
                                          className="p-1 text-zinc-400 hover:text-yellow-400"
                                          title="แก้ไขงานย่อย"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteSubTask(topic.id, sub.id)}
                                          className="p-1 text-zinc-400 hover:text-rose-400"
                                          title="ลบงานย่อย"
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
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
