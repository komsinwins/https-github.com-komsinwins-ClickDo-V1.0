/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Project, SOWItem } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Flag, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Filter, 
  User, 
  Layers, 
  TrendingUp, 
  CheckSquare, 
  Play, 
  Info 
} from 'lucide-react';

interface SOWCalendarProps {
  project: Project;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

// Safe parsing of YYYY-MM-DD
const parseDateString = (dateStr: string) => {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1; // 0-indexed
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return { year: y, month: m, day: d };
};

// Check if a date string is exactly on a target YYYY-MM-DD
const isSameDay = (dateStr1: string, year: number, month: number, day: number) => {
  const p = parseDateString(dateStr1);
  if (!p) return false;
  return p.year === year && p.month === month && p.day === day;
};

// Check if a date is between (inclusive) start and end date strings
const isBetweenDays = (targetYear: number, targetMonth: number, targetDay: number, startStr: string, endStr: string) => {
  const start = parseDateString(startStr);
  const end = parseDateString(endStr);
  if (!start || !end) return false;

  const targetDate = new Date(targetYear, targetMonth, targetDay);
  const startDate = new Date(start.year, start.month, start.day);
  const endDate = new Date(end.year, end.month, end.day);

  return targetDate >= startDate && targetDate <= endDate;
};

export default function SOWCalendar({ project }: SOWCalendarProps) {
  // Current app date is Friday, July 10, 2026
  const appToday = new Date('2026-07-10');

  // Parse project start/end dates
  const projStart = parseDateString(project.startDate);
  
  // Set default calendar view to project's start date month (if valid), otherwise July 2026
  const [currentYear, setCurrentYear] = useState(() => {
    if (projStart) return projStart.year;
    return 2026;
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (projStart) return projStart.month;
    return 6; // July (0-indexed)
  });

  // Filters
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewType, setViewType] = useState<'all' | 'milestones_deadlines'>('all'); // all duration vs only starts/ends

  // Selection state for day details
  const [selectedDay, setSelectedDay] = useState<{ day: number; month: number; year: number }>(() => {
    // Default selected day is today if it's in the same month, otherwise first of month or start date
    if (projStart) {
      return { day: projStart.day, month: projStart.month, year: projStart.year };
    }
    return { day: 10, month: 6, year: 2026 };
  });

  // Get all unique assignees in SOW
  const uniqueAssignees = useMemo(() => {
    const set = new Set<string>();
    project.scopesOfWork.forEach(item => {
      if (item.assignee && item.assignee.trim()) {
        set.add(item.assignee.trim());
      }
    });
    return Array.from(set);
  }, [project.scopesOfWork]);

  // Filter SOW items based on filters
  const filteredSOWItems = useMemo(() => {
    return project.scopesOfWork.filter(item => {
      const matchAssignee = assigneeFilter === 'All' || item.assignee === assigneeFilter;
      const matchStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchAssignee && matchStatus;
    });
  }, [project.scopesOfWork, assigneeFilter, statusFilter]);

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon, etc.
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  // Create calendar cells array
  const calendarCells = useMemo(() => {
    const cells = [];

    // Prev month padding cells
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      cells.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }

    // Current month cells
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month: currentMonth, year: currentYear, isCurrentMonth: true });
    }

    // Next month padding cells
    const remaining = 42 - cells.length; // standard 6 rows
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      cells.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }

    return cells;
  }, [currentYear, currentMonth, daysInMonth, firstDayIndex, prevMonthDays]);

  // Helper to change month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleSelectToday = () => {
    setCurrentMonth(appToday.getMonth());
    setCurrentYear(appToday.getFullYear());
    setSelectedDay({
      day: appToday.getDate(),
      month: appToday.getMonth(),
      year: appToday.getFullYear()
    });
  };

  // Safe checks for a specific cell
  const getEventsForCell = (cellYear: number, cellMonth: number, cellDay: number) => {
    const events: {
      type: 'project_start' | 'project_end' | 'sow_start' | 'sow_end' | 'sow_active';
      label: string;
      item?: SOWItem;
    }[] = [];

    // 1. Check project bounds
    if (isSameDay(project.startDate, cellYear, cellMonth, cellDay)) {
      events.push({ type: 'project_start', label: '🚩 เริ่มต้นโครงการ (Project Start)' });
    }
    if (isSameDay(project.endDate, cellYear, cellMonth, cellDay)) {
      events.push({ type: 'project_end', label: '🏁 สิ้นสุดโครงการ (Project Deadline)' });
    }

    // 2. Check SOW items
    filteredSOWItems.forEach(item => {
      const isStart = isSameDay(item.startDate, cellYear, cellMonth, cellDay);
      const isEnd = isSameDay(item.endDate, cellYear, cellMonth, cellDay);
      const isActive = isBetweenDays(cellYear, cellMonth, cellDay, item.startDate, item.endDate);

      if (isStart) {
        events.push({ type: 'sow_start', label: `🏁 เริ่มงาน: ${item.taskName}`, item });
      }
      if (isEnd) {
        events.push({ type: 'sow_end', label: `⚠️ สิ้นสุด/เดดไลน์: ${item.taskName}`, item });
      }
      
      // If we are looking at all periods, and it's not strictly starting or ending today but is active
      if (viewType === 'all' && isActive && !isStart && !isEnd) {
        events.push({ type: 'sow_active', label: `• ทำงาน: ${item.taskName}`, item });
      }
    });

    return events;
  };

  // Get active items for the selected day in detail list
  const selectedDayDetails = useMemo(() => {
    const dayTasks: {
      item: SOWItem;
      roles: ('start' | 'end' | 'active')[];
    }[] = [];

    project.scopesOfWork.forEach(item => {
      const isStart = isSameDay(item.startDate, selectedDay.year, selectedDay.month, selectedDay.day);
      const isEnd = isSameDay(item.endDate, selectedDay.year, selectedDay.month, selectedDay.day);
      const isActive = isBetweenDays(selectedDay.year, selectedDay.month, selectedDay.day, item.startDate, item.endDate);

      if (isActive) {
        const roles: ('start' | 'end' | 'active')[] = [];
        if (isStart) roles.push('start');
        if (isEnd) roles.push('end');
        if (!isStart && !isEnd) roles.push('active');

        dayTasks.push({ item, roles });
      }
    });

    return dayTasks;
  }, [project.scopesOfWork, selectedDay]);

  // Statistics for current month
  const monthStats = useMemo(() => {
    let starts = 0;
    let ends = 0;
    let activeInMonth = 0;

    project.scopesOfWork.forEach(item => {
      const start = parseDateString(item.startDate);
      const end = parseDateString(item.endDate);

      const hasStartThisMonth = start && start.year === currentYear && start.month === currentMonth;
      const hasEndThisMonth = end && end.year === currentYear && end.month === currentMonth;

      if (hasStartThisMonth) starts++;
      if (hasEndThisMonth) ends++;

      // Overlaps this month
      if (start && end) {
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);
        const itemStart = new Date(start.year, start.month, start.day);
        const itemEnd = new Date(end.year, end.month, end.day);

        const overlaps = itemStart <= monthEnd && itemEnd >= monthStart;
        if (overlaps) activeInMonth++;
      }
    });

    return { starts, ends, activeInMonth };
  }, [project.scopesOfWork, currentYear, currentMonth]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-lime-400">
            <CalendarIcon className="w-5 h-5" />
            <h3 className="text-lg font-bold text-white font-display">ปฏิทินแผนงานและเป้าหมายโครงการ</h3>
          </div>
          <p className="text-xs text-zinc-400">
            แสดงแผนงาน (SOW) วันเริ่มต้น (Milestones) และวันสิ้นสุด (Deadlines) ของงานทั้งหมดเทียบกับไทม์ไลน์โครงการ
          </p>
        </div>

        {/* Quick Date Range info */}
        <div className="flex items-center gap-4 bg-zinc-950 p-2.5 rounded-xl border border-zinc-850 text-xs text-zinc-400">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block font-black">วันเริ่มต้นโครงการ</span>
            <span className="text-white font-medium">{project.startDate || 'ไม่ได้ระบุ'}</span>
          </div>
          <div className="h-8 w-px bg-zinc-800"></div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block font-black">วันสิ้นสุดโครงการ</span>
            <span className="text-rose-400 font-medium">{project.endDate || 'ไม่ได้ระบุ'}</span>
          </div>
          <div className="h-8 w-px bg-zinc-800"></div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block font-black">ระยะเวลารวม</span>
            <span className="text-lime-400 font-bold">{project.durationDays} วัน</span>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-950/50 p-4 rounded-xl border border-zinc-850/80">
        <div>
          <label className="block text-[10px] uppercase font-black text-zinc-500 tracking-wider mb-1.5">
            ผู้รับผิดชอบงาน
          </label>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-lime-500"
          >
            <option value="All">ทั้งหมด (All Assignees)</option>
            {uniqueAssignees.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-black text-zinc-500 tracking-wider mb-1.5">
            สถานะงาน SOW
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-lime-500"
          >
            <option value="All">ทุกสถานะ</option>
            <option value="Not Started">ยังไม่เริ่มต้น (Not Started)</option>
            <option value="In Progress">กำลังดำเนินการ (In Progress)</option>
            <option value="Completed">เสร็จสมบูรณ์ (Completed)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-black text-zinc-500 tracking-wider mb-1.5">
            รูปแบบการแสดงผลบนปฏิทิน
          </label>
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewType('all')}
              className={`flex-1 text-center py-1 rounded-md text-[11px] font-medium transition-all ${
                viewType === 'all' 
                  ? 'bg-zinc-800 text-lime-400 font-bold' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              แสดงงานทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setViewType('milestones_deadlines')}
              className={`flex-1 text-center py-1 rounded-md text-[11px] font-medium transition-all ${
                viewType === 'milestones_deadlines' 
                  ? 'bg-zinc-800 text-rose-400 font-bold' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              เฉพาะเป้าหมาย/เดดไลน์
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Monthly Calendar View (8 Columns) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Month & Year Navigation bar */}
          <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-850">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {THAI_MONTHS[currentMonth]} {currentYear + 543} (ค.ศ. {currentYear})
              </span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                {monthStats.activeInMonth} งานในเดือนนี้
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 transition-all"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 transition-all"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Grid labels */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((day, idx) => (
              <div 
                key={day} 
                className={`text-[11px] font-black uppercase py-1.5 ${
                  idx === 0 ? 'text-red-400' : idx === 6 ? 'text-sky-400' : 'text-zinc-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid cells */}
          <div className="grid grid-cols-7 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-850">
            {calendarCells.map((cell, idx) => {
              const { day, month, year, isCurrentMonth } = cell;
              const isSelected = selectedDay.day === day && selectedDay.month === month && selectedDay.year === year;
              const isTodayCell = appToday.getDate() === day && appToday.getMonth() === month && appToday.getFullYear() === year;
              const dayEvents = getEventsForCell(year, month, day);

              // Check if project range boundaries
              const isProjStartCell = isSameDay(project.startDate, year, month, day);
              const isProjEndCell = isSameDay(project.endDate, year, month, day);

              return (
                <div
                  key={`${year}-${month}-${day}-${idx}`}
                  onClick={() => setSelectedDay({ day, month, year })}
                  className={`min-h-[90px] p-1.5 flex flex-col justify-between rounded-lg cursor-pointer transition-all border ${
                    isSelected 
                      ? 'bg-zinc-900 border-lime-500/80 shadow-[0_0_12px_rgba(132,204,22,0.1)]' 
                      : isTodayCell
                      ? 'bg-zinc-900/90 border-zinc-700 ring-1 ring-lime-500/30'
                      : isCurrentMonth
                      ? 'bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-850/60'
                      : 'bg-zinc-950/20 hover:bg-zinc-900/30 border-transparent text-zinc-600'
                  }`}
                >
                  {/* Top: Day Number and Project Indicators */}
                  <div className="flex items-center justify-between">
                    <span 
                      className={`text-xs font-bold font-mono h-5 w-5 flex items-center justify-center rounded-full ${
                        isTodayCell 
                          ? 'bg-lime-500 text-black' 
                          : isSelected
                          ? 'bg-zinc-850 text-lime-400 border border-lime-500/20'
                          : isCurrentMonth 
                          ? 'text-zinc-200' 
                          : 'text-zinc-500'
                      }`}
                    >
                      {day}
                    </span>

                    {/* Project Boundary Flags */}
                    <div className="flex gap-0.5">
                      {isProjStartCell && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" title="วันเริ่มต้นโครงการ (Project Start)" />
                      )}
                      {isProjEndCell && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" title="วันสิ้นสุดโครงการ (Project Deadline)" />
                      )}
                    </div>
                  </div>

                  {/* Middle/Bottom: Event Badges (Scrollable list or stacked) */}
                  <div className="mt-1 flex-1 overflow-hidden space-y-1">
                    {dayEvents.slice(0, 3).map((ev, eIdx) => {
                      let bgClass = 'bg-zinc-800 text-zinc-300 border-zinc-700';
                      let iconColor = 'text-zinc-400';

                      if (ev.type === 'project_start') {
                        bgClass = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50';
                      } else if (ev.type === 'project_end') {
                        bgClass = 'bg-rose-950/60 text-rose-300 border-rose-800/50 font-black';
                      } else if (ev.type === 'sow_start') {
                        bgClass = 'bg-lime-950/30 text-lime-400 border-lime-800/30 text-[9px]';
                      } else if (ev.type === 'sow_end') {
                        bgClass = 'bg-rose-950/30 text-rose-400 border-rose-800/30 text-[9px] font-semibold';
                      } else if (ev.type === 'sow_active') {
                        bgClass = 'bg-zinc-900/60 text-zinc-400 border-zinc-850 text-[9px]';
                      }

                      return (
                        <div
                          key={eIdx}
                          className={`px-1 py-0.5 rounded text-[8px] border truncate leading-tight ${bgClass}`}
                          title={ev.label}
                        >
                          {ev.label}
                        </div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <div className="text-[8px] text-zinc-500 text-right font-bold pr-1">
                        +{dayEvents.length - 3} รายการอื่น ๆ
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend instructions */}
          <div className="flex flex-wrap items-center gap-4 text-[10px] text-zinc-500 font-medium px-1">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> 
              <span>เริ่มต้นโครงการ (Project Start)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> 
              <span>สิ้นสุดโครงการ (Project Deadline)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 px-1 bg-lime-950/80 border border-lime-800/50 inline-block rounded" /> 
              <span>เริ่มแผนงานย่อย (SOW Start)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 px-1 bg-rose-950/80 border border-rose-800/50 inline-block rounded" /> 
              <span>เป้าหมายเดดไลน์ (SOW Deadline)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 px-1 bg-zinc-900 border border-zinc-800 inline-block rounded" /> 
              <span>อยู่ระหว่างทำงานย่อย (SOW In-Progress)</span>
            </span>
          </div>

        </div>

        {/* Day Details Sidebar Panel (4 Columns) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Calendar Stats Summary */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-3">
            <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-lime-400" />
              <span>ภาพรวมประจำเดือน {THAI_MONTHS[currentMonth]}</span>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-850 text-left">
                <span className="text-[9px] text-zinc-500 uppercase block font-bold">เริ่มแผนงานย่อย (Starts)</span>
                <span className="text-base font-bold text-lime-400 font-mono">{monthStats.starts}</span>
              </div>
              <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-850 text-left">
                <span className="text-[9px] text-zinc-500 uppercase block font-bold font-semibold">เป้าหมายเดดไลน์ (Ends)</span>
                <span className="text-base font-bold text-rose-400 font-mono">{monthStats.ends}</span>
              </div>
            </div>
            
            <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-850 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-zinc-500 uppercase block font-bold">แผนงานที่มีการดําเนินการ</span>
                <span className="text-xs font-bold text-white">รวม {monthStats.activeInMonth} งานย่อย</span>
              </div>
              <span className="text-xs bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-zinc-400 font-mono">
                {project.scopesOfWork.length} ทั้งหมด
              </span>
            </div>
          </div>

          {/* Specific Day Details card */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-4 flex flex-col min-h-[300px]">
            <div className="border-b border-zinc-850 pb-2 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-black">รายละเอียดเป้าหมายวันที่เลือก</span>
                <h4 className="text-sm font-bold text-white">
                  {selectedDay.day} {THAI_MONTHS[selectedDay.month]} {selectedDay.year + 543}
                </h4>
              </div>
              {selectedDay.day === appToday.getDate() && selectedDay.month === appToday.getMonth() && selectedDay.year === appToday.getFullYear() && (
                <span className="text-[9px] bg-lime-500 text-black px-1.5 py-0.5 rounded-full font-extrabold uppercase">
                  วันนี้
                </span>
              )}
            </div>

            {/* Event notifications for Selected Day */}
            <div className="space-y-2">
              {isSameDay(project.startDate, selectedDay.year, selectedDay.month, selectedDay.day) && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-lg flex gap-2 text-left">
                  <Flag className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block">🚩 วันเริ่มต้นโครงการอย่างเป็นทางการ</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">
                      เริ่มสัญญาก่อสร้างติดตั้งมาตรฐานวิศวรรณโยธาและไฟฟ้า สำหรับโครงการนี้
                    </span>
                  </div>
                </div>
              )}

              {isSameDay(project.endDate, selectedDay.year, selectedDay.month, selectedDay.day) && (
                <div className="p-3 bg-rose-950/40 border border-rose-900/50 rounded-lg flex gap-2 text-left">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-rose-400 block">🏆 วันครบกำหนดสัญญาและรับมอบโครงการ</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">
                      เดดไลน์หลัก สิ้นสุดระยะเวลาดำเนินการทั้งหมดที่กำหนดไว้ในสัญญาจัดซื้อจัดจ้าง
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* List of active SOW Tasks on this day */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] pr-1">
              {selectedDayDetails.length === 0 ? (
                <div className="py-12 text-center text-zinc-600 space-y-2">
                  <CalendarIcon className="w-8 h-8 mx-auto text-zinc-700 stroke-[1.5]" />
                  <p className="text-xs">ไม่มีแผนงานหรือเป้าหมายที่ตรงกับวันที่เลือก</p>
                </div>
              ) : (
                selectedDayDetails.map(({ item, roles }, idx) => {
                  const isSowStart = roles.includes('start');
                  const isSowEnd = roles.includes('end');

                  let statusBg = 'bg-zinc-900/60 text-zinc-400 border-zinc-800';
                  let statusText = 'ยังไม่เริ่ม';
                  if (item.status === 'Completed') {
                    statusBg = 'bg-lime-950/40 text-lime-400 border-lime-900/40';
                    statusText = 'เสร็จสมบูรณ์';
                  } else if (item.status === 'In Progress') {
                    statusBg = 'bg-yellow-950/40 text-yellow-400 border-yellow-900/40';
                    statusText = 'อยู่ระหว่างทำ';
                  }

                  return (
                    <div 
                      key={item.id} 
                      className={`p-3 bg-zinc-900 hover:bg-zinc-850 border rounded-lg text-left space-y-2 transition-all ${
                        isSowEnd 
                          ? 'border-rose-900/50 shadow-[inset_0_0_8px_rgba(239,68,68,0.05)]' 
                          : isSowStart 
                          ? 'border-lime-900/50 shadow-[inset_0_0_8px_rgba(132,204,22,0.05)]' 
                          : 'border-zinc-850'
                      }`}
                    >
                      {/* Task role flags (Start date / Deadline / Duration) */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isSowStart && (
                          <span className="text-[9px] bg-lime-500/10 text-lime-400 border border-lime-500/20 px-1.5 py-0.5 rounded font-black uppercase">
                            🏁 วันเริ่มต้นงาน (SOW Start)
                          </span>
                        )}
                        {isSowEnd && (
                          <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-black uppercase">
                            ⚠️ วันเดดไลน์ (SOW Deadline)
                          </span>
                        )}
                        {!isSowStart && !isSowEnd && (
                          <span className="text-[9px] bg-zinc-800 text-zinc-400 border border-zinc-750 px-1.5 py-0.5 rounded font-medium uppercase">
                            กำลังดําเนินงานตามแผน
                          </span>
                        )}
                      </div>

                      {/* Task Name */}
                      <h5 className="text-xs font-bold text-white leading-tight">
                        {item.taskName}
                      </h5>

                      {/* Description */}
                      {item.description && (
                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* Date Range & Assignee info */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500 pt-1 border-t border-zinc-850/60">
                        <div>
                          <span className="text-zinc-600 block">ช่วงระยะเวลางาน</span>
                          <span className="text-zinc-300 font-mono">
                            {item.startDate} ถึง {item.endDate}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-600 block">ผู้ควบคุม/รับผิดชอบ</span>
                          <span className="text-zinc-300 flex items-center gap-1">
                            <User className="w-3 h-3 text-lime-500" />
                            <span className="truncate">{item.assignee || 'ไม่มีผู้รับผิดชอบ'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Progress and status badge */}
                      <div className="flex items-center justify-between gap-4 pt-1">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-zinc-500">ความคืบหน้า</span>
                            <span className="text-lime-400 font-mono font-bold">{item.progress}%</span>
                          </div>
                          <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-lime-500 to-emerald-500 transition-all"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 ${statusBg}`}>
                          {statusText}
                        </span>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
