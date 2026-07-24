/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProjectScheduleMS.tsx
 * High-fidelity Microsoft Project-style Schedule Planner & Interactive Gantt Chart.
 * Backed by the existing Project.scopesOfWork data structure.
 */

import React, { useState, useMemo } from 'react';
import { Project, SOWItem, SOWSubTask } from '../types';
import { 
  Plus, Trash2, Edit3, Calendar, CheckSquare, Download, Check, 
  ChevronDown, ChevronUp, Clock, User, Grid, Table, SplitSquareVertical,
  Activity, ArrowRight, Settings, ListPlus, FileSpreadsheet, ListTodo, Layers, Printer
} from 'lucide-react';

interface ProjectScheduleMSProps {
  project: Project;
  onUpdateSOW: (scopes: SOWItem[]) => void;
}

export default function ProjectScheduleMS({ project, onUpdateSOW }: ProjectScheduleMSProps) {
  // View states
  const [viewMode, setViewMode] = useState<'split' | 'table' | 'gantt'>('split');
  const [collapsedTasks, setCollapsedTasks] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState(false);

  // Form states for adding / editing tasks
  const [editingTask, setEditingTask] = useState<{
    parentId: string | null; // null if main task, otherwise parent SOWItem ID
    taskId: string | null;   // null if new, otherwise task ID to edit
    name: string;
    startDate: string;
    durationDays: number;
    progress: number;
    assignee: string;
    description?: string;
  } | null>(null);

  const toggleTaskCollapse = (id: string) => {
    setCollapsedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Date utilities
  const projStart = useMemo(() => {
    const d = new Date(project.startDate).getTime();
    return isNaN(d) ? Date.now() : d;
  }, [project.startDate]);

  const projEnd = useMemo(() => {
    const d = new Date(project.endDate).getTime();
    return isNaN(d) ? Date.now() + 14 * 24 * 60 * 60 * 1000 : d;
  }, [project.endDate]);

  const totalProjDays = useMemo(() => {
    const diff = Math.ceil((projEnd - projStart) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 15;
  }, [projStart, projEnd]);

  // Compute flattened tasks list for reports and print window
  const flattenedTasks = useMemo(() => {
    const list: Array<{
      wbsId: string;
      name: string;
      isSummary: boolean;
      startDate: string;
      endDate: string;
      durationDays: number;
      progress: number;
      predecessors?: string[];
      assignee?: string;
    }> = [];

    project.scopesOfWork.forEach((item, mainIdx) => {
      const wbsId = `${mainIdx + 1}`;
      const mainDuration = item.subTasks && item.subTasks.length > 0
        ? item.subTasks.reduce((acc, curr) => acc + (curr.durationDays || 1), 0)
        : 5;

      list.push({
        wbsId,
        name: item.taskName,
        isSummary: true,
        startDate: item.startDate || project.startDate || '-',
        endDate: item.endDate || project.endDate || '-',
        durationDays: mainDuration,
        progress: item.progress || 0,
        assignee: item.assignee || project.projectManager || '-',
      });

      if (item.subTasks) {
        item.subTasks.forEach((sub, subIdx) => {
          list.push({
            wbsId: `${wbsId}.${subIdx + 1}`,
            name: sub.name,
            isSummary: false,
            startDate: sub.startDate || item.startDate || '-',
            endDate: sub.endDate || item.endDate || '-',
            durationDays: sub.durationDays || 1,
            progress: sub.progress || 0,
            assignee: item.assignee || '-',
          });
        });
      }
    });

    return list;
  }, [project]);

  // Generate date header labels (weeks or days depending on project size)
  const timelineDates = useMemo(() => {
    const dates: Date[] = [];
    const interval = Math.max(1, Math.ceil(totalProjDays / 15)); // target ~15 intervals
    for (let i = 0; i < totalProjDays; i += interval) {
      const d = new Date(projStart + i * 24 * 60 * 60 * 1000);
      dates.push(d);
    }
    return dates;
  }, [projStart, totalProjDays]);

  const calculateGanttPosition = (startStr: string, endStr: string) => {
    if (!startStr || !endStr || isNaN(projStart)) {
      return { leftPct: 0, widthPct: 100 };
    }
    const tStart = new Date(startStr).getTime();
    const tEnd = new Date(endStr).getTime();

    const clampedStart = Math.max(projStart, tStart);
    const clampedEnd = Math.min(projEnd, tEnd);

    const startOffsetDays = Math.floor((clampedStart - projStart) / (1000 * 60 * 60 * 24));
    const durationDays = Math.ceil((clampedEnd - clampedStart) / (1000 * 60 * 60 * 24)) + 1;

    const leftPct = (startOffsetDays / totalProjDays) * 100;
    const widthPct = (durationDays / totalProjDays) * 100;

    return {
      leftPct: Math.max(0, Math.min(100, leftPct)),
      widthPct: Math.max(2, Math.min(100 - leftPct, widthPct)),
    };
  };

  // Add/Edit Task handlers
  const handleOpenAddMainTask = () => {
    setEditingTask({
      parentId: null,
      taskId: null,
      name: '',
      startDate: project.startDate || new Date().toISOString().split('T')[0],
      durationDays: 5,
      progress: 0,
      assignee: project.projectManager || '',
      description: ''
    });
  };

  const handleOpenAddSubTask = (parentSowId: string) => {
    const parent = project.scopesOfWork.find(p => p.id === parentSowId);
    setEditingTask({
      parentId: parentSowId,
      taskId: null,
      name: '',
      startDate: parent?.startDate || project.startDate || new Date().toISOString().split('T')[0],
      durationDays: 3,
      progress: 0,
      assignee: parent?.assignee || '',
      description: ''
    });
  };

  const handleOpenEdit = (parentSowId: string | null, id: string) => {
    if (parentSowId === null) {
      // Main task
      const task = project.scopesOfWork.find(t => t.id === id);
      if (!task) return;
      
      const start = new Date(task.startDate).getTime();
      const end = new Date(task.endDate).getTime();
      const dur = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

      setEditingTask({
        parentId: null,
        taskId: id,
        name: task.taskName,
        startDate: task.startDate,
        durationDays: dur,
        progress: task.progress,
        assignee: task.assignee,
        description: task.description
      });
    } else {
      // Subtask
      const parent = project.scopesOfWork.find(p => p.id === parentSowId);
      const sub = parent?.subTasks?.find(s => s.id === id);
      if (!sub) return;

      setEditingTask({
        parentId: parentSowId,
        taskId: id,
        name: sub.name,
        startDate: sub.startDate,
        durationDays: sub.durationDays || 1,
        progress: sub.progress,
        assignee: parent?.assignee || '',
        description: ''
      });
    }
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.name.trim()) return;

    const startD = new Date(editingTask.startDate);
    const endD = new Date(startD);
    endD.setDate(startD.getDate() + (editingTask.durationDays - 1));
    const endDateStr = endD.toISOString().split('T')[0];

    let updatedScopes = [...project.scopesOfWork];

    if (editingTask.parentId === null) {
      // Saving Main SOWItem
      if (editingTask.taskId) {
        // Edit existing
        updatedScopes = updatedScopes.map(item => {
          if (item.id === editingTask.taskId) {
            let finalStatus = item.status;
            if (editingTask.progress === 100) finalStatus = 'Completed';
            else if (editingTask.progress > 0) finalStatus = 'In Progress';
            else finalStatus = 'Not Started';

            return {
              ...item,
              taskName: editingTask.name,
              startDate: editingTask.startDate,
              endDate: endDateStr,
              progress: editingTask.progress,
              status: finalStatus as any,
              assignee: editingTask.assignee,
              description: editingTask.description || ''
            };
          }
          return item;
        });
      } else {
        // Add new main SOWItem
        const newItem: SOWItem = {
          id: `sow-${Date.now()}`,
          taskName: editingTask.name,
          description: editingTask.description || '',
          status: editingTask.progress === 100 ? 'Completed' : editingTask.progress > 0 ? 'In Progress' : 'Not Started',
          progress: editingTask.progress,
          startDate: editingTask.startDate,
          endDate: endDateStr,
          assignee: editingTask.assignee,
          subTasks: []
        };
        updatedScopes.push(newItem);
      }
    } else {
      // Saving subtask inside a parent SOWItem
      updatedScopes = updatedScopes.map(item => {
        if (item.id === editingTask.parentId) {
          let subs = item.subTasks ? [...item.subTasks] : [];
          
          if (editingTask.taskId) {
            // Edit existing subtask
            subs = subs.map(s => {
              if (s.id === editingTask.taskId) {
                let sStatus = s.status;
                if (editingTask.progress === 100) sStatus = 'Completed';
                else if (editingTask.progress > 0) sStatus = 'In Progress';
                else sStatus = 'Not Started';

                return {
                  ...s,
                  name: editingTask.name,
                  startDate: editingTask.startDate,
                  endDate: endDateStr,
                  durationDays: editingTask.durationDays,
                  progress: editingTask.progress,
                  status: sStatus as any
                };
              }
              return s;
            });
          } else {
            // Add new subtask
            const newSub: SOWSubTask = {
              id: `sub-${Date.now()}`,
              name: editingTask.name,
              startDate: editingTask.startDate,
              endDate: endDateStr,
              durationDays: editingTask.durationDays,
              progress: editingTask.progress,
              status: editingTask.progress === 100 ? 'Completed' : editingTask.progress > 0 ? 'In Progress' : 'Not Started'
            };
            subs.push(newSub);
          }

          // Recalculate parent progress average
          const avgProgress = subs.length > 0
            ? Math.round(subs.reduce((sum, s) => sum + s.progress, 0) / subs.length)
            : item.progress;

          let finalStatus = item.status;
          if (avgProgress === 100) finalStatus = 'Completed';
          else if (avgProgress > 0) finalStatus = 'In Progress';
          else finalStatus = 'Not Started';

          return {
            ...item,
            subTasks: subs,
            progress: avgProgress,
            status: finalStatus as any
          };
        }
        return item;
      });
    }

    onUpdateSOW(updatedScopes);
    setEditingTask(null);
  };

  const handleDeleteTask = (parentSowId: string | null, id: string) => {
    if (!confirm('คุณแน่ใจว่าต้องการลบรายการนี้หรือไม่?')) return;

    let updatedScopes = [...project.scopesOfWork];

    if (parentSowId === null) {
      // Delete main task
      updatedScopes = updatedScopes.filter(item => item.id !== id);
    } else {
      // Delete subtask
      updatedScopes = updatedScopes.map(item => {
        if (item.id === parentSowId) {
          const subs = item.subTasks ? item.subTasks.filter(s => s.id !== id) : [];
          const avgProgress = subs.length > 0
            ? Math.round(subs.reduce((sum, s) => sum + s.progress, 0) / subs.length)
            : 0;
          
          return {
            ...item,
            subTasks: subs,
            progress: avgProgress,
            status: avgProgress === 100 ? 'Completed' : avgProgress > 0 ? 'In Progress' : 'Not Started' as any
          };
        }
        return item;
      });
    }

    onUpdateSOW(updatedScopes);
  };

  const handleQuickUpdateProgress = (parentSowId: string | null, id: string, pct: number) => {
    let updatedScopes = [...project.scopesOfWork];

    if (parentSowId === null) {
      updatedScopes = updatedScopes.map(item => {
        if (item.id === id) {
          let statusStr: SOWItem['status'] = 'Not Started';
          if (pct === 100) statusStr = 'Completed';
          else if (pct > 0) statusStr = 'In Progress';

          return {
            ...item,
            progress: pct,
            status: statusStr
          };
        }
        return item;
      });
    } else {
      updatedScopes = updatedScopes.map(item => {
        if (item.id === parentSowId) {
          const subs = item.subTasks ? item.subTasks.map(s => {
            if (s.id === id) {
              return {
                ...s,
                progress: pct,
                status: (pct === 100 ? 'Completed' : pct > 0 ? 'In Progress' : 'Not Started') as any
              };
            }
            return s;
          }) : [];

          const avgProgress = subs.length > 0
            ? Math.round(subs.reduce((sum, s) => sum + s.progress, 0) / subs.length)
            : 0;

          return {
            ...item,
            subTasks: subs,
            progress: avgProgress,
            status: (avgProgress === 100 ? 'Completed' : avgProgress > 0 ? 'In Progress' : 'Not Started') as any
          };
        }
        return item;
      });
    }

    onUpdateSOW(updatedScopes);
  };

  const handleMoveTask = (index: number, direction: 'up' | 'down') => {
    const updatedScopes = [...project.scopesOfWork];
    if (direction === 'up' && index > 0) {
      const temp = updatedScopes[index];
      updatedScopes[index] = updatedScopes[index - 1];
      updatedScopes[index - 1] = temp;
    } else if (direction === 'down' && index < updatedScopes.length - 1) {
      const temp = updatedScopes[index];
      updatedScopes[index] = updatedScopes[index + 1];
      updatedScopes[index + 1] = temp;
    }
    onUpdateSOW(updatedScopes);
  };

  const handlePrintPDFWindow = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('เบราว์เซอร์บล็อกการเปิดหน้าต่างพิมพ์ กรุณาอนุญาตป๊อปอัพ');
      return;
    }

    const rowsHtml = flattenedTasks.map((t) => `
      <tr style="border-bottom: 1px solid #e4e4e7; ${t.isSummary ? 'background-color: #f4f4f5; font-weight: bold;' : ''}">
        <td style="padding: 6px 8px; font-family: monospace; font-size: 11px;">${t.wbsId}</td>
        <td style="padding: 6px 8px;">${t.isSummary ? '🔷 ' : '📌 '}${t.name}</td>
        <td style="padding: 6px 8px;">${t.startDate}</td>
        <td style="padding: 6px 8px;">${t.endDate}</td>
        <td style="padding: 6px 8px; text-align: center;">${t.durationDays} วัน</td>
        <td style="padding: 6px 8px; text-align: center;">${t.progress}%</td>
        <td style="padding: 6px 8px;">${t.predecessors?.join(', ') || '-'}</td>
        <td style="padding: 6px 8px;">${t.assignee || '-'}</td>
      </tr>
    `).join('');

    const ganttChartHtml = project.scopesOfWork.map((item, mainIdx) => {
      const mainPos = calculateGanttPosition(item.startDate, item.endDate);
      const startD = new Date(item.startDate);
      const endD = new Date(item.endDate);
      const itemDuration = isNaN(startD.getTime()) || isNaN(endD.getTime())
        ? 0
        : Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      const subsHtml = (item.subTasks || []).map((sub, subIdx) => {
        const subPos = calculateGanttPosition(sub.startDate, sub.endDate);
        const isDone = sub.progress === 100;
        return `
          <div style="margin-top: 6px; padding-left: 12px; display: flex; align-items: center; font-size: 10px;">
            <div style="width: 220px; shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #3f3f46; font-weight: 500;">
              └─ ${mainIdx + 1}.${subIdx + 1} ${sub.name}
            </div>
            <div style="flex: 1; height: 18px; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 4px; position: relative; margin-left: 12px;">
              <div style="position: absolute; left: ${subPos.leftPct}%; width: ${Math.max(subPos.widthPct, 2)}%; height: 100%; background: ${isDone ? 'linear-gradient(90deg, #10b981, #14b8a6)' : 'linear-gradient(90deg, #3b82f6, #06b6d4)'}; border-radius: 3px; display: flex; align-items: center; padding-left: 6px; color: #ffffff; font-size: 9px; font-weight: bold; overflow: hidden;">
                ${sub.progress}%
              </div>
              <span style="position: absolute; right: 8px; top: 2px; font-size: 8px; font-family: monospace; color: #71717a;">${sub.startDate} ~ ${sub.endDate}</span>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div style="margin-bottom: 14px; border-bottom: 1px solid #e4e4e7; padding-bottom: 10px;">
          <div style="display: flex; align-items: center; font-size: 11px; font-weight: bold; color: #09090b;">
            <div style="width: 220px; shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #65a30d;">
              🔷 ${mainIdx + 1}.0 ${item.taskName}
            </div>
            <div style="flex: 1; height: 22px; background-color: #f4f4f5; border: 1px solid #d4d4d8; border-radius: 4px; position: relative; margin-left: 12px;">
              <div style="position: absolute; left: ${mainPos.leftPct}%; width: ${Math.max(mainPos.widthPct, 2)}%; height: 100%; background-color: #a3e635; border-radius: 3px; display: flex; align-items: center; padding-left: 8px; color: #000000; font-size: 10px; font-weight: 800; border: 1px solid #84cc16;">
                ${item.progress}%
              </div>
              <span style="position: absolute; right: 8px; top: 3px; font-size: 9px; font-family: monospace; color: #3f3f46; font-weight: bold;">${item.startDate} ~ ${item.endDate} (${itemDuration} วัน)</span>
            </div>
          </div>
          ${subsHtml}
        </div>
      `;
    }).join('');

    const showTable = viewMode === 'table' || viewMode === 'split';
    const showGantt = viewMode === 'gantt' || viewMode === 'split';

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>แผนงานโครงการ MS Project - ${project.name}</title>
          <style>
            @page { size: landscape; margin: 10mm; }
            body { font-family: 'Sarabun', Arial, sans-serif; font-size: 11px; color: #18181b; padding: 15px; }
            h1 { font-size: 18px; margin-bottom: 4px; color: #09090b; }
            .meta { font-size: 11px; color: #52525b; margin-bottom: 16px; border-bottom: 2px solid #09090b; padding-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
            th { background-color: #27272a; color: #ffffff; text-align: left; padding: 8px; font-size: 11px; }
            td { font-size: 11px; }
            .section-title { font-size: 14px; font-weight: bold; margin-top: 16px; margin-bottom: 8px; color: #09090b; border-bottom: 1px solid #d4d4d8; padding-bottom: 4px; }
          </style>
        </head>
        <body>
          <h1>แผนงานโครงการ (Project Schedule - MS Project Style) ${viewMode === 'gantt' ? '[Gantt Chart View]' : ''}</h1>
          <div class="meta">
            <strong>โครงการ:</strong> ${project.name} &nbsp;|&nbsp;
            <strong>เจ้าของงาน:</strong> ${project.ownerName} &nbsp;|&nbsp;
            <strong>ระยะเวลา:</strong> ${project.startDate} ถึง ${project.endDate} (${project.durationDays} วัน)
          </div>

          ${showTable ? `
            <div class="section-title">📋 ตารางรายละเอียดแผนงาน (Task Sheet Table)</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 50px;">WBS</th>
                  <th>ชื่อหัวข้อแผนงาน / งานย่อย</th>
                  <th style="width: 80px;">วันเริ่ม</th>
                  <th style="width: 80px;">วันสิ้นสุด</th>
                  <th style="width: 65px; text-align: center;">ระยะเวลา</th>
                  <th style="width: 65px; text-align: center;">ความคืบหน้า</th>
                  <th style="width: 90px;">งานก่อนหน้า</th>
                  <th style="width: 100px;">ผู้รับผิดชอบ</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          ` : ''}

          ${showGantt ? `
            <div class="section-title">📊 แผนภูมิแกรนต์ (Gantt Chart Visualization)</div>
            <div style="background-color: #ffffff; padding: 12px; border: 1px solid #e4e4e7; border-radius: 8px;">
              ${ganttChartHtml}
            </div>
          ` : ''}

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

  const handleExportPDF = async () => {
    const element = document.getElementById('msproject-gantt-root');
    if (!element) return;

    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Unset overflow on root
      const originalRootOverflow = element.style.overflow;
      element.style.overflow = 'visible';

      // Temporarily expand scrollable containers for full capturing
      const scrollables = element.querySelectorAll('.overflow-x-auto, .overflow-y-auto');
      const originalOverflows: string[] = [];
      scrollables.forEach((s) => {
        const el = s as HTMLElement;
        originalOverflows.push(el.style.overflow);
        el.style.overflow = 'visible';
      });

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#09090b',
        logging: false,
        windowWidth: Math.max(element.scrollWidth + 100, 1200),
        scrollX: 0,
        scrollY: 0,
      });

      // Restore overflows
      element.style.overflow = originalRootOverflow;
      scrollables.forEach((s, idx) => {
        (s as HTMLElement).style.overflow = originalOverflows[idx];
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
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
      pdf.save(`MS_Project_Schedule_${project.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error exporting MS Project View:', error);
      // Fallback: Open print dialog / save as PDF
      handlePrintPDFWindow();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Header Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-lg flex items-center justify-center font-bold text-xl border border-blue-500/30">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">แผนงานโครงการ (Project Schedule - MS Project Style)</h3>
            <p className="text-xs text-zinc-400">ระบบจำลองการทำงานของ Microsoft Project แสดงตารางเชื่อมโยงแผนภูมิ Gantt แบบย่อยอย่างละเอียด</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 flex items-center">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                viewMode === 'split' ? 'bg-zinc-800 text-lime-400' : 'text-zinc-400 hover:text-white'
              }`}
              title="แสดงคู่กัน ตารางและ Gantt"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-zinc-800 text-lime-400' : 'text-zinc-400 hover:text-white'
              }`}
              title="แสดงเฉพาะตารางแบบชีต"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table Sheet</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                viewMode === 'gantt' ? 'bg-zinc-800 text-lime-400' : 'text-zinc-400 hover:text-white'
              }`}
              title="แสดงเฉพาะแผนภูมิ Gantt"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Gantt Only</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-white border border-zinc-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="บันทึกรูปกราฟและตารางแผนงานเป็นไฟล์ PDF"
            >
              <Download className="w-4 h-4 text-lime-400" />
              <span>{isExporting ? 'กำลังบันทึก PDF...' : 'บันทึกเป็น PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPDFWindow}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
              title="เปิดหน้าต่างพิมพ์รายงานแผนงานโครงการพร้อมพิมพ์/บันทึกเป็น PDF"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>พิมพ์รายงาน</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenAddMainTask}
            className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มหัวข้อแผนงาน</span>
          </button>
        </div>
      </div>

      {/* Main Microsoft Project Area */}
      <div 
        id="msproject-gantt-root" 
        className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow-2xl"
      >
        {/* Quick Legend Bar */}
        <div className="bg-zinc-800 px-4 py-2 border-b border-zinc-700 flex flex-wrap items-center justify-between text-xs text-zinc-300 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 bg-lime-400 border border-lime-300 block rounded" />
              <span>หัวข้อหลัก (Summary Task)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 bg-blue-400 block rounded" />
              <span>งานย่อย (Active Sub-task)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 bg-emerald-400 block rounded" />
              <span>สำเร็จแล้ว (Completed)</span>
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">
            โหมดแผนงานจำลอง Microsoft Project Pro (WBS Auto-scheduling)
          </span>
        </div>

        {/* Outer Split Container */}
        <div className="flex flex-col xl:flex-row overflow-x-auto min-h-[450px]">
          
          {/* LEFT SIDE: Task Grid Table */}
          {(viewMode === 'split' || viewMode === 'table') && (
            <div className={`border-b xl:border-b-0 xl:border-r border-zinc-900 overflow-x-auto shrink-0 ${
              viewMode === 'table' ? 'w-full' : 'w-full xl:w-[55%]'
            }`}>
              <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-800 font-extrabold uppercase tracking-wider border-b border-zinc-300 h-10 select-none">
                    <th className="px-3 text-center w-12 font-mono">ID</th>
                    <th className="px-1 text-center w-8">โหมด</th>
                    <th className="px-3 min-w-[200px]">ชื่อแผนงาน (Task Name)</th>
                    <th className="px-2 text-center w-16">ระยะเวลา</th>
                    <th className="px-3 w-24">เริ่ม (Start)</th>
                    <th className="px-3 w-24">เสร็จ (Finish)</th>
                    <th className="px-3 w-24 text-center">% ทำเสร็จ</th>
                    <th className="px-3 w-24">ผู้รับผิดชอบ</th>
                    <th className="px-3 text-right w-24 no-print">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {project.scopesOfWork.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-zinc-600 italic">
                        ยังไม่มีหัวข้อและรายละเอียดแผนงาน คลิกปุ่ม "เพิ่มหัวข้อแผนงาน" เพื่อเริ่มต้นป้อนข้อมูล
                      </td>
                    </tr>
                  ) : (
                    project.scopesOfWork.map((item, mainIdx) => {
                      const wbsMain = `${mainIdx + 1}.0`;
                      const isCollapsed = collapsedTasks[item.id];
                      const subs = item.subTasks || [];
                      const startD = new Date(item.startDate);
                      const endD = new Date(item.endDate);
                      const duration = isNaN(startD.getTime()) || isNaN(endD.getTime()) 
                        ? 0 
                        : Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1);

                      return (
                        <React.Fragment key={item.id}>
                          {/* Main Task SOWItem Row */}
                          <tr className="border-b border-zinc-900/60 hover:bg-zinc-900/30 transition-all font-semibold group h-9 bg-zinc-950/20">
                            {/* WBS */}
                            <td className="px-3 py-1.5 text-center font-mono text-zinc-500">{wbsMain}</td>
                            
                            {/* Mode Icon (Auto Scheduled) */}
                            <td className="px-1 py-1.5 text-center">
                              <span className="inline-flex text-blue-400" title="Auto Scheduled">⚙</span>
                            </td>
                            
                            {/* Task Name Indented */}
                            <td className="px-3 py-1.5">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleTaskCollapse(item.id)}
                                  className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                                >
                                  {subs.length > 0 ? (
                                    isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <span className="w-3.5 h-3.5 block" />
                                  )}
                                </button>
                                <span className="text-lime-400 truncate" title={item.taskName}>
                                  {item.taskName}
                                </span>
                              </div>
                            </td>

                            {/* Duration */}
                            <td className="px-2 py-1.5 text-center text-zinc-300 font-mono">
                              {duration} วัน
                            </td>

                            {/* Start Date */}
                            <td className="px-3 py-1.5 text-zinc-400 font-mono">{item.startDate}</td>

                            {/* Finish Date */}
                            <td className="px-3 py-1.5 text-zinc-400 font-mono">{item.endDate}</td>

                            {/* Progress Cell */}
                            <td className="px-3 py-1.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="w-full bg-zinc-900 h-2 rounded overflow-hidden max-w-[60px] border border-zinc-800">
                                  <div 
                                    className="bg-lime-500 h-full rounded transition-all duration-300" 
                                    style={{ width: `${item.progress}%` }} 
                                  />
                                </div>
                                <select
                                  value={item.progress}
                                  onChange={(e) => handleQuickUpdateProgress(null, item.id, parseInt(e.target.value))}
                                  className="bg-zinc-900 text-zinc-300 rounded text-[10px] border border-zinc-800 px-1 py-0.5"
                                >
                                  <option value={0}>0%</option>
                                  <option value={25}>25%</option>
                                  <option value={50}>50%</option>
                                  <option value={75}>75%</option>
                                  <option value={100}>100%</option>
                                </select>
                              </div>
                            </td>

                            {/* Assignee */}
                            <td className="px-3 py-1.5 text-zinc-300 truncate max-w-[100px]" title={item.assignee}>
                              {item.assignee || '-'}
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-1.5 text-right no-print">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleMoveTask(mainIdx, 'up')}
                                  disabled={mainIdx === 0}
                                  className={`p-1 rounded transition-all ${
                                    mainIdx === 0 
                                      ? 'text-zinc-700 cursor-not-allowed opacity-30' 
                                      : 'hover:bg-zinc-800 text-zinc-400 hover:text-lime-400'
                                  }`}
                                  title="เลื่อนหัวข้อขึ้น"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveTask(mainIdx, 'down')}
                                  disabled={mainIdx === project.scopesOfWork.length - 1}
                                  className={`p-1 rounded transition-all ${
                                    mainIdx === project.scopesOfWork.length - 1 
                                      ? 'text-zinc-700 cursor-not-allowed opacity-30' 
                                      : 'hover:bg-zinc-800 text-zinc-400 hover:text-lime-400'
                                  }`}
                                  title="เลื่อนหัวข้อลง"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddSubTask(item.id)}
                                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-blue-400 rounded transition-all"
                                  title="เพิ่มงานย่อยภายใต้หัวข้อนี้"
                                >
                                  <ListPlus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(null, item.id)}
                                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-yellow-400 rounded transition-all"
                                  title="แก้ไขหัวข้อ"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(null, item.id)}
                                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-rose-500 rounded transition-all"
                                  title="ลบ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Sub-tasks Rows nested */}
                          {!isCollapsed && subs.map((sub, subIdx) => {
                            const wbsSub = `${mainIdx + 1}.${subIdx + 1}`;
                            return (
                              <tr 
                                key={sub.id} 
                                className="border-b border-zinc-900/40 hover:bg-zinc-900/50 transition-all font-normal group h-8 bg-zinc-900/10"
                              >
                                {/* WBS */}
                                <td className="px-3 py-1 text-center font-mono text-zinc-600 pl-4">{wbsSub}</td>
                                
                                {/* Mode (Auto) */}
                                <td className="px-1 py-1 text-center text-[10px] text-zinc-600">→</td>
                                
                                {/* Subtask Name indented */}
                                <td className="px-3 py-1 pl-8">
                                  <span className="text-zinc-300 truncate block" title={sub.name}>
                                    {sub.name}
                                  </span>
                                </td>

                                {/* Duration */}
                                <td className="px-2 py-1 text-center text-zinc-400 font-mono">
                                  {sub.durationDays || 1} วัน
                                </td>

                                {/* Start Date */}
                                <td className="px-3 py-1 text-zinc-500 font-mono">{sub.startDate}</td>

                                {/* Finish Date */}
                                <td className="px-3 py-1 text-zinc-500 font-mono">{sub.endDate}</td>

                                {/* Progress Cell */}
                                <td className="px-3 py-1">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <div className="w-full bg-zinc-900 h-1.5 rounded overflow-hidden max-w-[60px] border border-zinc-850">
                                      <div 
                                        className="bg-blue-500 h-full rounded transition-all duration-300" 
                                        style={{ width: `${sub.progress}%` }} 
                                      />
                                    </div>
                                    <select
                                      value={sub.progress}
                                      onChange={(e) => handleQuickUpdateProgress(item.id, sub.id, parseInt(e.target.value))}
                                      className="bg-zinc-900 text-zinc-400 rounded text-[9px] border border-zinc-800 px-0.5 py-0.2"
                                    >
                                      <option value={0}>0%</option>
                                      <option value={25}>25%</option>
                                      <option value={50}>50%</option>
                                      <option value={75}>75%</option>
                                      <option value={100}>100%</option>
                                    </select>
                                  </div>
                                </td>

                                {/* Inherits assignee */}
                                <td className="px-3 py-1 text-zinc-500 truncate max-w-[100px]">
                                  {item.assignee || '-'}
                                </td>

                                {/* Actions */}
                                <td className="px-3 py-1 text-right no-print">
                                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(item.id, sub.id)}
                                      className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-yellow-400 rounded transition-all"
                                      title="แก้ไขขั้นตอนย่อย"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTask(item.id, sub.id)}
                                      className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-rose-500 rounded transition-all"
                                      title="ลบ"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* RIGHT SIDE: Gantt Chart Visualization */}
          {(viewMode === 'split' || viewMode === 'gantt') && (
            <div className={`p-4 flex-1 overflow-x-auto min-w-[320px] ${
              viewMode === 'gantt' ? 'w-full' : 'w-full xl:w-[45%]'
            }`}>
              {/* Gantt Header Weeks / Days */}
              <div className="relative pt-6 min-w-[450px]">
                
                {/* Baseline Project Timeline Header Indicators */}
                <div className="absolute top-0 inset-x-0 flex justify-between text-[10px] text-zinc-500 font-mono border-b border-zinc-800 pb-1.5">
                  <div className="text-left">
                    <span className="block text-zinc-400 font-bold">START DATE</span>
                    <span>{project.startDate}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-zinc-400 font-bold">DURATION</span>
                    <span>{totalProjDays} วัน</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-zinc-400 font-bold">CONTRACT END</span>
                    <span>{project.endDate}</span>
                  </div>
                </div>

                {/* Vertical helper grid lines & SOW Summary Bars */}
                <div className="space-y-4 pt-4">
                  {project.scopesOfWork.length === 0 ? (
                    <div className="text-center py-12 text-zinc-600 italic">
                      กรุณาป้อนข้อมูลเพื่อแสดงแผนภูมิ Gantt Chart
                    </div>
                  ) : (
                    project.scopesOfWork.map((item) => {
                      const isCollapsed = collapsedTasks[item.id];
                      const subs = item.subTasks || [];
                      const mainPos = calculateGanttPosition(item.startDate, item.endDate);

                      return (
                        <div key={`gantt-${item.id}`} className="space-y-2 border-b border-zinc-900/60 pb-3">
                          
                          {/* SOW Main Item Gantt Bar */}
                          <div className="grid grid-cols-5 gap-2 items-center h-8">
                            {/* Short Label */}
                            <div className="col-span-1 truncate text-[10px] text-zinc-400 font-semibold" title={item.taskName}>
                              {item.taskName}
                            </div>
                            
                            {/* Black Summary Bar Container with bracket styling */}
                            <div className="col-span-4 bg-zinc-950/60 h-6 border border-zinc-850 rounded-md relative flex items-center shadow-inner">
                              
                              {/* Background dash grid lines */}
                              <div className="absolute inset-0 flex justify-between pointer-events-none">
                                <div className="w-[1px] h-full border-l border-dashed border-zinc-800/40" style={{ left: '25%' }} />
                                <div className="w-[1px] h-full border-l border-dashed border-zinc-800/40" style={{ left: '50%' }} />
                                <div className="w-[1px] h-full border-l border-dashed border-zinc-800/40" style={{ left: '75%' }} />
                              </div>

                              {/* Microsoft Project Summary Bar (Bright lime-400 solid bar with triangle endpoints) */}
                              <div
                                className="absolute h-2.5 bg-lime-400 border border-lime-300 relative rounded-sm shadow-md shadow-lime-400/20"
                                style={{
                                  left: `${mainPos.leftPct}%`,
                                  width: `${mainPos.widthPct}%`
                                }}
                              >
                                {/* Left bracket triangle */}
                                <div className="absolute -left-1 -bottom-1 w-2 h-2 bg-lime-400 border-l border-b border-lime-300 rotate-45" />
                                {/* Right bracket triangle */}
                                <div className="absolute -right-1 -bottom-1 w-2 h-2 bg-lime-400 border-r border-b border-lime-300 -rotate-45" />

                                <span className="absolute -top-3.5 left-0 text-[8px] font-mono font-bold text-lime-400 whitespace-nowrap bg-zinc-950/80 px-1 rounded">
                                  {item.progress}%
                                </span>
                              </div>

                              {/* Summary Date Label to the right of the bar */}
                              <span 
                                className="absolute text-[8px] font-mono font-semibold text-lime-400 pointer-events-none whitespace-nowrap bg-zinc-950/80 px-1 py-0.5 rounded border border-zinc-850/50"
                                style={{
                                  left: `calc(${mainPos.leftPct}% + ${mainPos.widthPct}% + 10px)`
                                }}
                              >
                                {item.startDate} ~ {item.endDate}
                              </span>
                            </div>
                          </div>

                          {/* Sub-tasks nested Gantt Bars */}
                          {!isCollapsed && subs.map((sub) => {
                            const subPos = calculateGanttPosition(sub.startDate, sub.endDate);
                            const isDone = sub.status === 'Completed';

                            return (
                              <div key={`gantt-sub-${sub.id}`} className="grid grid-cols-5 gap-2 items-center h-6 pl-4 border-l-2 border-zinc-850">
                                {/* Short Label */}
                                <div className="col-span-1 truncate text-[9px] text-zinc-500" title={sub.name}>
                                  └─ {sub.name}
                                </div>

                                {/* Active Task Gantt Progress Bar */}
                                <div className="col-span-4 bg-zinc-900/60 h-5 border border-zinc-800 rounded-sm relative flex items-center">
                                  {/* Sub-task solid bar */}
                                  <div
                                    className={`absolute h-3.5 rounded-sm relative shadow-sm overflow-hidden flex items-center bg-zinc-800 border ${
                                      isDone ? 'border-emerald-400' : 'border-blue-400'
                                    }`}
                                    style={{
                                      left: `${subPos.leftPct}%`,
                                      width: `${subPos.widthPct}%`
                                    }}
                                  >
                                    {/* Sub-task Progress fill */}
                                    <div 
                                      className={`absolute left-0 top-0 bottom-0 ${
                                        isDone ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                                      }`}
                                      style={{ width: `${sub.progress}%` }}
                                    />
                                    
                                    <span className="absolute left-1 text-[8px] text-white font-bold font-mono z-10 truncate drop-shadow">
                                      {sub.progress}%
                                    </span>
                                  </div>

                                  {/* Subtask Date Label next to the bar */}
                                  <span 
                                    className="absolute text-[8px] font-mono text-zinc-300 pointer-events-none whitespace-nowrap bg-zinc-950/50 px-1 py-0.2 rounded"
                                    style={{
                                      left: `calc(${subPos.leftPct}% + ${subPos.widthPct}% + 8px)`
                                    }}
                                  >
                                    {sub.startDate} ~ {sub.endDate}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Adding / Editing Modal Dialog */}
      {editingTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-blue-400" />
                <span>
                  {editingTask.taskId 
                    ? `แก้ไข${editingTask.parentId ? 'แผนงานย่อย' : 'หัวข้อแผนงานหลัก'}` 
                    : `สร้าง${editingTask.parentId ? 'แผนงานย่อยใหม่' : 'หัวข้อแผนงานหลักใหม่'}`
                  }
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  {editingTask.parentId ? 'ชื่อแผนงานย่อย (Sub-Task Name)' : 'ชื่อหัวข้อหลัก (Summary Task Name)'}
                </label>
                <input
                  type="text"
                  required
                  value={editingTask.name}
                  onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                  placeholder={editingTask.parentId ? "เช่น เตรียมสายเคเบิล DC, ติดตั้งโครงยึดแผง" : "เช่น งานเดินระบบไฟฟ้า, งานเทคอนกรีตฐานราก"}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 transition-all text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">วันที่เริ่มทำงาน (Start Date)</label>
                  <input
                    type="date"
                    required
                    value={editingTask.startDate}
                    onChange={(e) => setEditingTask({ ...editingTask, startDate: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">ระยะเวลาดำเนินงาน (Duration in Days)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editingTask.durationDays}
                    onChange={(e) => setEditingTask({ ...editingTask, durationDays: parseInt(e.target.value) || 1 })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">ความคืบหน้างาน (% Progress)</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={editingTask.progress}
                    onChange={(e) => setEditingTask({ ...editingTask, progress: parseInt(e.target.value) })}
                    className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-lime-400 mt-2.5"
                  />
                  <span className="block text-center mt-1 text-lime-400 font-bold font-mono">{editingTask.progress}% Complete</span>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">ผู้รับผิดชอบงานหลัก</label>
                  <input
                    type="text"
                    value={editingTask.assignee}
                    onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })}
                    placeholder="เช่น ธีรเดช เลิศศิริกุล (PM)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {!editingTask.parentId && (
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">คำอธิบายขอบข่ายเพิ่มเติม (Optional)</label>
                  <textarea
                    rows={2}
                    value={editingTask.description}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                    placeholder="ป้อนข้อมูลเพิ่มเติมเพื่อประกอบแผนงานสรุป"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-semibold rounded-lg"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกข้อมูล</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
