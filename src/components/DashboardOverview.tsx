/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Project } from '../types';
import { AlertTriangle, Calendar, MapPin, Plus, Briefcase, CheckCircle2, AlertCircle, FileText, TrendingUp, Sparkles, FolderOpen, LayoutGrid, List, TableProperties, Search, Filter, Database, Settings } from 'lucide-react';

interface DashboardOverviewProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onConfigureFirebase?: () => void;
  firebaseStatus?: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export default function DashboardOverview({
  projects,
  selectedProject,
  onSelectProject,
  onCreateProject,
  onConfigureFirebase,
  firebaseStatus,
}: DashboardOverviewProps) {
  // Current time is Friday, July 10, 2026.
  const currentDate = new Date('2026-07-10');

  const getStatusLabel = (status: string) => {
    if (status === 'Active') return 'กำลังติดตั้ง';
    if (status === 'Closed') return 'ปิดโครงการแล้ว';
    if (status === 'On Hold') return 'ระงับชั่วคราว';
    return status;
  };

  const getStatusStyles = (status: string) => {
    if (status === 'Active') return 'bg-lime-100 text-lime-700 border border-lime-300';
    if (status === 'Closed') return 'bg-slate-100 text-slate-500 border border-slate-300';
    if (status === 'On Hold') return 'bg-yellow-100 text-yellow-750 border border-yellow-300';
    return 'bg-sky-100 text-sky-750 border border-sky-300';
  };

  const [viewMode, setViewMode] = React.useState<'grid' | 'list' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('All');

  // Calculates days remaining between today (July 10, 2026) and the project end date
  const getRemainingDays = (endDateStr: string) => {
    const end = new Date(endDateStr);
    const diffTime = end.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Urgent alerts list: active projects with < 10 days left
  const urgentProjects = projects.filter((p) => {
    if (p.status !== 'Active') return false;
    const daysLeft = getRemainingDays(p.endDate);
    return daysLeft <= 10 && daysLeft >= 0;
  });

  const overdueProjects = projects.filter((p) => {
    if (p.status !== 'Active') return false;
    const daysLeft = getRemainingDays(p.endDate);
    return daysLeft < 0;
  });

  // Group by Client / Owner Name - Requirement 10
  const clientSummary = React.useMemo(() => {
    const counts: { [key: string]: { total: number; active: number; closed: number } } = {};
    projects.forEach((p) => {
      const client = p.ownerName?.trim() || 'ไม่ระบุชื่อลูกค้า';
      if (!counts[client]) {
        counts[client] = { total: 0, active: 0, closed: 0 };
      }
      counts[client].total += 1;
      if (p.status === 'Active') counts[client].active += 1;
      if (p.status === 'Closed') counts[client].closed += 1;
    });
    return Object.entries(counts).map(([name, stats]) => ({
      name,
      ...stats,
    })).sort((a, b) => b.total - a.total);
  }, [projects]);

  // Group by Project Manager - Requirement 10
  const pmSummary = React.useMemo(() => {
    const counts: { [key: string]: { total: number; active: number; closed: number; progressSum: number } } = {};
    projects.forEach((p) => {
      const pm = p.projectManager?.trim() || 'ไม่ระบุ PM';
      const completed = p.scopesOfWork?.filter((s) => s.status === 'Completed').length || 0;
      const totalSow = p.scopesOfWork?.length || 0;
      const progress = totalSow > 0 ? Math.round((completed / totalSow) * 100) : 0;

      if (!counts[pm]) {
        counts[pm] = { total: 0, active: 0, closed: 0, progressSum: 0 };
      }
      counts[pm].total += 1;
      counts[pm].progressSum += progress;
      if (p.status === 'Active') counts[pm].active += 1;
      if (p.status === 'Closed') counts[pm].closed += 1;
    });
    return Object.entries(counts).map(([name, stats]) => ({
      name,
      ...stats,
      avgProgress: stats.total > 0 ? Math.round(stats.progressSum / stats.total) : 0,
    })).sort((a, b) => b.total - a.total);
  }, [projects]);

  const availableStatuses = React.useMemo(() => {
    const statuses = new Set<string>();
    statuses.add('Active');
    statuses.add('On Hold');
    statuses.add('Closed');
    projects.forEach((p) => {
      if (p.status) {
        statuses.add(p.status);
      }
    });
    return Array.from(statuses);
  }, [projects]);

  // Filter projects based on searchQuery and statusFilter
  const filteredProjects = React.useMemo(() => {
    return projects.filter((p) => {
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchQuery =
        p.name.toLowerCase().includes(q) ||
        (p.installationSite || '').toLowerCase().includes(q) ||
        (p.projectManager || '').toLowerCase().includes(q) ||
        (p.ownerName || '').toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [projects, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Visual Hero Banner matching Green/Black/Yellow Theme */}
      <div id="dashboard-hero" className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-black shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/90 to-transparent z-10" />
        <img
          src="/src/assets/images/clickdo_hero_1783684597582.jpg"
          alt="ClickDo Installation Banner"
          referrerPolicy="no-referrer"
          className="absolute right-0 top-0 h-full w-2/3 object-cover opacity-60 mix-blend-screen select-none"
        />

        {/* Hero content */}
        <div className="relative z-20 p-8 md:p-12 flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 text-brand-yellow rounded-full text-xs font-semibold tracking-wider uppercase border border-yellow-500/30 mb-4 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ClickDo v1.0 • Professional Suite</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-display">
              ClickDo <span className="text-lime-400">V1.0</span>
            </h1>
            <p className="text-zinc-400 mt-2 font-medium text-lg italic tracking-wide">
              "Click to Plan, Do to Win" <span className="text-yellow-400 font-sans font-normal text-sm ml-2">(คลิกเพื่อแผนงาน ทำเพื่อชัยชนะ)</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <button
              id="btn-create-project-hero"
              type="button"
              onClick={onCreateProject}
              className="px-5 py-3 bg-gradient-to-r from-lime-500 to-yellow-500 hover:from-lime-400 hover:to-yellow-400 text-black font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-lime-950/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-5 h-5" />
              <span>สร้างโครงการใหม่</span>
            </button>
            <div className="px-4 py-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-lime-400" />
              <span>เวลาปัจจุบันระบบ: 10 ก.ค. 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Panel - Requirement 7 */}
      {(urgentProjects.length > 0 || overdueProjects.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wider text-yellow-400 uppercase flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span>แจ้งเตือนสำคัญ: สัญญากำลังใกล้หมดอายุ / ล่าช้า ({urgentProjects.length + overdueProjects.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Urgent Alerts - Less than 10 days left */}
            {urgentProjects.map((p) => {
              const daysLeft = getRemainingDays(p.endDate);
              return (
                <div
                  key={p.id}
                  id={`alert-card-urgent-${p.id}`}
                  onClick={() => onSelectProject(p)}
                  className="bg-amber-950/30 border border-amber-500/40 hover:border-amber-400 rounded-xl p-4 flex items-start gap-3.5 cursor-pointer transition-all hover:bg-amber-950/40 relative group overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-2 h-full bg-amber-500 animate-pulse" />
                  <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white group-hover:text-amber-300 transition-colors text-sm md:text-base">
                      {p.name}
                    </h4>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      {p.installationSite}
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-300 font-mono text-xs font-semibold rounded-md">
                        เหลือเวลาอีก {daysLeft} วัน
                      </span>
                      <span className="text-xs text-zinc-400">
                        สิ้นสุด: {new Date(p.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Overdue alerts */}
            {overdueProjects.map((p) => {
              const daysOverdue = Math.abs(getRemainingDays(p.endDate));
              return (
                <div
                  key={p.id}
                  id={`alert-card-overdue-${p.id}`}
                  onClick={() => onSelectProject(p)}
                  className="bg-red-950/30 border border-red-500/40 hover:border-red-400 rounded-xl p-4 flex items-start gap-3.5 cursor-pointer transition-all hover:bg-red-950/40 relative group overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-2 h-full bg-red-500 animate-pulse" />
                  <div className="p-2.5 bg-red-500/20 text-red-400 rounded-lg shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white group-hover:text-red-300 transition-colors text-sm md:text-base">
                      {p.name}
                    </h4>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      {p.installationSite}
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-300 font-mono text-xs font-semibold rounded-md">
                        เลยกำหนดสัญญามาแล้ว {daysOverdue} วัน
                      </span>
                      <span className="text-xs text-zinc-400">
                        สิ้นสุดเมื่อ: {new Date(p.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Counter Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-lime-500/10 text-lime-400 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black font-display text-white">
              {projects.length}
            </div>
            <div className="text-xs text-zinc-400">โครงการทั้งหมด</div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-lime-500/10 text-lime-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black font-display text-white">
              {projects.filter((p) => p.status === 'Active').length}
            </div>
            <div className="text-xs text-zinc-400">กำลังติดตั้ง (Active)</div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black font-display text-white">
              {projects.filter((p) => p.status === 'Closed').length}
            </div>
            <div className="text-xs text-zinc-400">ส่งมอบเรียบร้อย (Closed)</div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-zinc-700/20 text-zinc-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black font-display text-white">
              {projects.reduce((acc, curr) => acc + (curr.reports?.length || 0), 0)}
            </div>
            <div className="text-xs text-zinc-400">รายงานปฏิบัติงานทั้งหมด</div>
          </div>
        </div>
      </div>

      {/* Prominent Dashboard Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row items-center gap-4 shadow-lg">
        <div className="flex-1 w-full relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-lime-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="🔍 ค้นหาชื่อโครงการ หรือ สถานที่ติดตั้ง (เช่น ไซต์งาน, จังหวัด, อำเภอ) เพื่อค้นหาอย่างรวดเร็ว..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm font-semibold rounded-xl border border-zinc-700 bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all font-sans"
          />
        </div>
        <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold shrink-0">
          <Filter className="w-4 h-4 text-lime-400" />
          <span>พบ {filteredProjects.length} โครงการ</span>
        </div>
      </div>

      {/* Techlink V1.1 Database Connection banner - Approach 3 */}
      {onConfigureFirebase && (
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <Database className="w-5 h-5 text-lime-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-white font-display">ระบบเชื่อมต่อฐานข้อมูลภายนอก (Techlink V1.1)</h4>
                {firebaseStatus === 'connected' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    เชื่อมต่อแล้ว
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-zinc-950 text-zinc-500 border border-zinc-850 px-2 py-0.5 rounded-full font-bold">
                    Local Database (ออฟไลน์)
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                ซิงค์ข้อมูลจัดระเบียบบริหารโครงการ แผนงาน ไดอะแกรม และเอกสารร่วมกับฐานข้อมูลกลาง Techlink V1.1 บนคลาวด์โดยตรง
              </p>
            </div>
          </div>
          <button
            onClick={onConfigureFirebase}
            className="w-full md:w-auto px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-white border border-zinc-700 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
          >
            <Settings className="w-4 h-4 text-lime-400" />
            <span>ตั้งค่าเชื่อมต่อ Techlink V1.1</span>
          </button>
        </div>
      )}

      {/* Bento Grid: Project Summary by Customer & PM - Requirement 10 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer / Owner Summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-lime-500" />
                <span>สรุปจำนวนโครงการแยกตามผู้ว่าจ้าง / ลูกค้า (Client Summary)</span>
              </h3>
              <p className="text-[10px] text-zinc-500">รายงานการจัดสรรสัดส่วนปริมาณงานตามรายชื่อบริษัทผู้ว่าจ้าง</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-zinc-950 text-lime-400 px-2 py-0.5 border border-zinc-850 rounded">
              {clientSummary.length} รายชื่อ
            </span>
          </div>

          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {clientSummary.length === 0 ? (
              <p className="text-xs text-zinc-600 italic text-center py-6">ไม่มีข้อมูลลูกค้าระบุในระบบ</p>
            ) : (
              clientSummary.map((client) => {
                const maxTotal = Math.max(...clientSummary.map(c => c.total), 1);
                const percentBar = Math.round((client.total / maxTotal) * 100);
                return (
                  <div key={client.name} className="bg-zinc-950/40 border border-zinc-850/60 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-zinc-200 truncate">{client.name}</span>
                      <span className="text-xs font-mono font-black text-lime-400 shrink-0">
                        {client.total} โครงการ
                      </span>
                    </div>

                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-lime-500 h-full rounded-full" style={{ width: `${percentBar}%` }} />
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-medium">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                        กำลังติดตั้ง: <span className="text-white font-mono">{client.active}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        ส่งมอบแล้ว: <span className="text-white font-mono">{client.closed}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Project Manager Summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>สรุปปริมาณงานตามโปรเจ็คเมเนเจอร์ (PM Performance)</span>
              </h3>
              <p className="text-[10px] text-zinc-500">สถิติจำนวนงานและความรับผิดชอบของบุคลากรควบคุมโครงการ</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-zinc-950 text-yellow-400 px-2 py-0.5 border border-zinc-850 rounded">
              {pmSummary.length} ท่าน
            </span>
          </div>

          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {pmSummary.length === 0 ? (
              <p className="text-xs text-zinc-600 italic text-center py-6">ไม่มีข้อมูลผู้จัดการโครงการในระบบ</p>
            ) : (
              pmSummary.map((pm) => {
                const maxTotal = Math.max(...pmSummary.map(c => c.total), 1);
                const percentBar = Math.round((pm.total / maxTotal) * 100);
                return (
                  <div key={pm.name} className="bg-zinc-950/40 border border-zinc-850/60 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-zinc-200 truncate">PM: {pm.name}</span>
                      <span className="text-xs font-mono font-black text-yellow-400 shrink-0">
                        {pm.total} โครงการ
                      </span>
                    </div>

                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${percentBar}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                          งานรันอยู่: <span className="text-white font-mono">{pm.active}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                          ปิดงานแล้ว: <span className="text-white font-mono">{pm.closed}</span>
                        </span>
                      </div>
                      <span className="text-zinc-400">
                        เฉลี่ยความสำเร็จ: <span className="text-lime-400 font-bold font-mono">{pm.avgProgress}%</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Projects list */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-lime-400" />
            <span className="text-slate-900 font-extrabold text-lg">รายการโครงการทั้งหมด ({filteredProjects.length})</span>
          </h2>
          <button
            id="btn-create-project-list"
            type="button"
            onClick={onCreateProject}
            className="px-4 py-2 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transform hover:-translate-y-0.5 active:translate-y-0 transition-all border-0 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>สร้างโครงการใหม่</span>
          </button>
        </div>

        {/* View Selection & Search Control bar */}
        <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
          {/* Left panel: view selection & filters */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* View switcher buttons */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-lime-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="มุมมองแบบการ์ด"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>ตารางกริด</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-lime-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="มุมมองแบบรายการย่อ"
              >
                <List className="w-3.5 h-3.5" />
                <span>รายการย่อ</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-lime-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="มุมมองแบบตารางละเอียด"
              >
                <TableProperties className="w-3.5 h-3.5" />
                <span>ตารางละเอียด</span>
              </button>
            </div>

            {/* Divider */}
            <span className="hidden sm:inline-block w-[1px] h-6 bg-slate-200" />

            {/* Status filters */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { key: 'All', label: 'ทั้งหมด' },
                ...availableStatuses.map((st) => ({
                  key: st,
                  label: st === 'Active' ? 'กำลังติดตั้ง' : st === 'Closed' ? 'ปิดโครงการแล้ว' : st === 'On Hold' ? 'ระงับชั่วคราว' : st,
                })),
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStatusFilter(item.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    statusFilter === item.key
                      ? 'bg-lime-550/15 text-lime-700 border-lime-300 bg-lime-50'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right panel: Search field */}
          <div className="relative min-w-[280px]">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="ค้นหาโครงการ สถานที่ PM ลูกค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
          </div>
        </div>

        {/* Dynamic Project Listings Render */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400 text-sm font-medium">
            ไม่พบโครงการที่ค้นหาหรือตรงกับเงื่อนไขตัวกรอง
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View Layout (Original styled cards) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {filteredProjects.map((p) => {
              const completedSow = p.scopesOfWork.filter((s) => s.status === 'Completed').length;
              const totalSow = p.scopesOfWork.length;
              const progressPct = totalSow > 0 ? Math.round((completedSow / totalSow) * 100) : 0;
              const daysLeft = getRemainingDays(p.endDate);
              const isNearDeadline = p.status === 'Active' && daysLeft <= 10;

              return (
                <div
                  key={p.id}
                  id={`project-card-${p.id}`}
                  onClick={() => onSelectProject(p)}
                  className={`bg-white border rounded-xl p-5 cursor-pointer transition-all flex flex-col justify-between hover:border-lime-500 hover:shadow-md group ${
                    selectedProject?.id === p.id ? 'ring-2 ring-lime-500 border-transparent' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusStyles(p.status)}`}
                      >
                        {getStatusLabel(p.status)}
                      </span>
                      {isNearDeadline && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold animate-pulse border border-red-200">
                          ใกล้ครบสัญญา ({daysLeft} วัน)
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-lime-600 transition-colors line-clamp-2">
                      {p.name}
                    </h3>

                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{p.installationSite}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(p.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} -{' '}
                          {new Date(p.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-500 font-bold">ความคืบหน้าแผนงาน</span>
                      <span className="text-lime-600 font-mono font-black">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-lime-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="mt-2.5 flex justify-between text-[11px] text-slate-500">
                      <span>Scope สำเร็จ: <b className="text-slate-800">{completedSow}/{totalSow}</b> งาน</span>
                      <span>PM: <b className="text-slate-800">{p.projectManager || '-'}</b></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : viewMode === 'list' ? (
          /* List View Layout (Sleek, condensed row display) */
          <div className="space-y-3 animate-fade-in">
            {filteredProjects.map((p) => {
              const completedSow = p.scopesOfWork.filter((s) => s.status === 'Completed').length;
              const totalSow = p.scopesOfWork.length;
              const progressPct = totalSow > 0 ? Math.round((completedSow / totalSow) * 100) : 0;
              const daysLeft = getRemainingDays(p.endDate);
              const isNearDeadline = p.status === 'Active' && daysLeft <= 10;

              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p)}
                  className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:border-lime-500 hover:shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group ${
                    selectedProject?.id === p.id ? 'ring-2 ring-lime-500 border-transparent' : 'border-slate-200'
                  }`}
                >
                  {/* Left Column: Title & Site */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusStyles(p.status)}`}
                      >
                        {getStatusLabel(p.status)}
                      </span>
                      {isNearDeadline && (
                        <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.2 rounded-full font-bold">
                          ใกล้หมดสัญญา ({daysLeft} วัน)
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-slate-950 text-base group-hover:text-lime-600 transition-colors truncate">
                      {p.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {p.installationSite}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        สัญญา: {p.startDate} - {p.endDate}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Progress bar & PM info */}
                  <div className="md:w-72 shrink-0 flex flex-col justify-center space-y-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold">ความสำเร็จ: <b className="text-slate-800 font-mono">{progressPct}%</b></span>
                      <span className="text-slate-400">PM: <b className="text-slate-700">{p.projectManager || '-'}</b></span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-lime-500 to-emerald-500 h-full rounded-full"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>งานเสร็จ: {completedSow}/{totalSow} รายการ</span>
                      <span>ผู้ว่าจ้าง: {p.ownerName || '-'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View Layout (Detailed grid row database table) */
          <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm animate-fade-in">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="px-5 py-3">ชื่อโครงการ</th>
                  <th className="px-5 py-3">สถานที่ติดตั้ง</th>
                  <th className="px-5 py-3 text-center">สถานะ</th>
                  <th className="px-5 py-3">ผู้จัดการโครงการ (PM)</th>
                  <th className="px-5 py-3">ผู้ว่าจ้าง (Owner)</th>
                  <th className="px-5 py-3 text-center">ความคืบหน้า</th>
                  <th className="px-5 py-3 text-right">วันสิ้นสุดสัญญา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredProjects.map((p) => {
                  const completedSow = p.scopesOfWork.filter((s) => s.status === 'Completed').length;
                  const totalSow = p.scopesOfWork.length;
                  const progressPct = totalSow > 0 ? Math.round((completedSow / totalSow) * 100) : 0;
                  const daysLeft = getRemainingDays(p.endDate);

                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectProject(p)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                        selectedProject?.id === p.id ? 'bg-lime-50/50' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-slate-900 hover:text-lime-600 transition-colors">
                          {p.name}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 truncate max-w-[180px]">
                        {p.installationSite}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase inline-block ${getStatusStyles(p.status)}`}
                        >
                          {getStatusLabel(p.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {p.projectManager || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {p.ownerName || '-'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-lime-500 h-full rounded-full" style={{ width: `${progressPct}%` }} />
                          </div>
                          <span className="font-mono font-bold text-slate-900 w-8 text-right">{progressPct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-500">
                        <div className={p.status === 'Active' && daysLeft <= 10 ? 'text-red-600 font-extrabold' : ''}>
                          {p.endDate}
                          {p.status === 'Active' && daysLeft <= 10 && (
                            <span className="block text-[9px] text-red-500 font-bold">(อีก {daysLeft} วัน)</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
