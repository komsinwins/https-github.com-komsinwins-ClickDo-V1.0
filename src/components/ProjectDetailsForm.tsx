/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { Save, Calendar, MapPin, User, Building2, Tag, ShieldCheck, Clock, X, Plus, Trash2, AlertTriangle, FileText } from 'lucide-react';

interface ProjectDetailsFormProps {
  project: Project | null; // Null means creating a new project
  onSave: (projectData: Partial<Project>) => void;
  onCancel: () => void;
  salesPeople?: string[];
  onUpdateSalesPeople?: (updated: string[]) => void;
  projectManagers?: string[];
  onUpdateProjectManagers?: (updated: string[]) => void;
  projectStatuses?: string[];
  onUpdateProjectStatuses?: (updated: string[]) => void;
}

export default function ProjectDetailsForm({
  project,
  onSave,
  onCancel,
  salesPeople = [],
  onUpdateSalesPeople = () => {},
  projectManagers = [],
  onUpdateProjectManagers = () => {},
  projectStatuses = [],
  onUpdateProjectStatuses = () => {},
}: ProjectDetailsFormProps) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<string>('Active');
  const [installationSite, setInstallationSite] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [partnerCompany, setPartnerCompany] = useState('');
  const [salesPerson, setSalesPerson] = useState('');
  const [projectManager, setProjectManager] = useState('');
  const [poNumber, setPoNumber] = useState('');

  // Inline name/status adding states
  const [isAddingSales, setIsAddingSales] = useState(false);
  const [newSalesName, setNewSalesName] = useState('');
  const [isAddingPM, setIsAddingPM] = useState(false);
  const [newPMName, setNewPMName] = useState('');
  const [isAddingStatus, setIsAddingStatus] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');

  // Calculate duration in days automatically based on start and end dates
  const [durationDays, setDurationDays] = useState(0);
  const [executionDays, setExecutionDays] = useState(0);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      const stat = project.status || 'Active';
      setStatus(stat);
      if (stat && projectStatuses && !projectStatuses.includes(stat)) {
        onUpdateProjectStatuses([...projectStatuses, stat]);
      }
      setInstallationSite(project.installationSite || '');
      setStartDate(project.startDate || '');
      setEndDate(project.endDate || '');
      setContractEndDate(project.contractEndDate || project.endDate || '');
      setCloseDate(project.closeDate || '');
      setOwnerName(project.ownerName || '');
      setPartnerCompany(project.partnerCompany || '');
      
      const sp = project.salesPerson || '';
      setSalesPerson(sp);
      if (sp && salesPeople && !salesPeople.includes(sp)) {
        onUpdateSalesPeople([...salesPeople, sp]);
      }

      const pm = project.projectManager || '';
      setProjectManager(pm);
      if (pm && projectManagers && !projectManagers.includes(pm)) {
        onUpdateProjectManagers([...projectManagers, pm]);
      }
      setPoNumber(project.poNumber || '');
    } else {
      // Clear for new project
      setName('');
      setStatus('Active');
      setInstallationSite('');
      const defaultStart = new Date().toISOString().split('T')[0];
      const defaultEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(defaultStart);
      setEndDate(defaultEnd);
      setContractEndDate(defaultEnd); // default contractEndDate to defaultEnd (2 weeks)
      setCloseDate(''); // closeDate empty by default until project is closed
      setOwnerName('');
      setPartnerCompany('');
      setSalesPerson('');
      setProjectManager('');
      setPoNumber('');
    }
  }, [project]);

  useEffect(() => {
    if (startDate && contractEndDate) {
      const start = new Date(startDate);
      const end = new Date(contractEndDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDurationDays(diffDays > 0 ? diffDays : 0);
    } else {
      setDurationDays(0);
    }
  }, [startDate, contractEndDate]);

  useEffect(() => {
    if (startDate && closeDate) {
      const start = new Date(startDate);
      const end = new Date(closeDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setExecutionDays(diffDays > 0 ? diffDays : 0);
    } else {
      setExecutionDays(0);
    }
  }, [startDate, closeDate]);

  const handleAddSales = (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = newSalesName.trim();
    if (!nameTrimmed) return;
    if (salesPeople.includes(nameTrimmed)) {
      alert('มีชื่อพนักงานขายนี้ในระบบแล้ว');
      return;
    }
    const updated = [...salesPeople, nameTrimmed];
    onUpdateSalesPeople(updated);
    setSalesPerson(nameTrimmed); // auto select the newly added person
    setNewSalesName('');
    setIsAddingSales(false);
  };

  const handleDeleteSales = () => {
    if (!salesPerson) {
      alert('กรุณาเลือกพนักงานขายที่ต้องการลบก่อน');
      return;
    }
    if (confirm(`คุณต้องการลบ "${salesPerson}" ออกจากตัวเลือกชื่อพนักงานขายหรือไม่?`)) {
      const updated = salesPeople.filter(p => p !== salesPerson);
      onUpdateSalesPeople(updated);
      setSalesPerson(''); // clear selection
    }
  };

  const handleAddPM = (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = newPMName.trim();
    if (!nameTrimmed) return;
    if (projectManagers.includes(nameTrimmed)) {
      alert('มีชื่อโปรเจ็คเมเนเจอร์นี้ในระบบแล้ว');
      return;
    }
    const updated = [...projectManagers, nameTrimmed];
    onUpdateProjectManagers(updated);
    setProjectManager(nameTrimmed); // auto select
    setNewPMName('');
    setIsAddingPM(false);
  };

  const handleDeletePM = () => {
    if (!projectManager) {
      alert('กรุณาเลือกโปรเจ็คเมเนเจอร์ที่ต้องการลบก่อน');
      return;
    }
    if (confirm(`คุณต้องการลบ "${projectManager}" ออกจากตัวเลือกชื่อโปรเจ็คเมเนเจอร์หรือไม่?`)) {
      const updated = projectManagers.filter(p => p !== projectManager);
      onUpdateProjectManagers(updated);
      setProjectManager(''); // clear selection
    }
  };

  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = newStatusName.trim();
    if (!nameTrimmed) return;
    if (projectStatuses.includes(nameTrimmed)) {
      alert('มีสถานะโครงการนี้ในระบบแล้ว');
      return;
    }
    const updated = [...projectStatuses, nameTrimmed];
    onUpdateProjectStatuses(updated);
    setStatus(nameTrimmed); // auto select
    setNewStatusName('');
    setIsAddingStatus(false);
  };

  const handleDeleteStatus = () => {
    if (!status) {
      alert('กรุณาเลือกสถานะโครงการที่ต้องการลบก่อน');
      return;
    }
    if (confirm(`คุณต้องการลบ "${status}" ออกจากตัวเลือกสถานะโครงการหรือไม่?`)) {
      const updated = projectStatuses.filter(s => s !== status);
      onUpdateProjectStatuses(updated);
      setStatus(updated[0] || ''); // select first or clear
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name,
      status,
      installationSite,
      startDate,
      endDate: contractEndDate || endDate, // keep endDate compatible
      contractEndDate,
      closeDate,
      durationDays,
      ownerName,
      partnerCompany,
      salesPerson,
      projectManager,
      poNumber,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-bold text-white font-display">
          {project ? 'แก้ไขข้อมูลรายละเอียดโครงการ' : 'สร้างโครงการติดตั้งใหม่'}
        </h2>
        <button
          id="btn-cancel-project-form"
          type="button"
          onClick={onCancel}
          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Name */}
        <div className="md:col-span-2">
          <label htmlFor="proj-name" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            ชื่อโครงการ *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Tag className="w-4 h-4" />
            </div>
            <input
              id="proj-name"
              type="text"
              required
              placeholder="เช่น ติดตั้งระบบไฟโซล่าเซลล์ อาคารคลังสินค้า"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-medium transition-all"
            />
          </div>
        </div>

        {/* PO Document Number */}
        <div className="md:col-span-2">
          <label htmlFor="proj-po-number" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            หมายเลขเอกสาร PO (Purchase Order Number)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <FileText className="w-4 h-4 text-emerald-500" />
            </div>
            <input
              id="proj-po-number"
              type="text"
              placeholder="ระบุหมายเลขใบสั่งซื้อ/สั่งจ้าง (เช่น PO-2026-0001)"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-medium transition-all"
            />
          </div>
        </div>

        {/* Project Status */}
        <div className="md:col-span-2">
          <label htmlFor="proj-status" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            สถานะโครงการ *
          </label>
          {isAddingStatus ? (
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="ระบุสถานะใหม่"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                className="flex-1 bg-zinc-950 border border-emerald-500/50 rounded-lg px-3 py-2 text-white placeholder-zinc-500 text-sm focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddStatus}
                className="px-4 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-all shrink-0"
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={() => setIsAddingStatus(false)}
                className="px-4 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-700 transition-all shrink-0"
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                id="proj-status"
                required
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500 transition-all"
              >
                <option value="">-- เลือกสถานะ --</option>
                {projectStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st === 'Active' ? 'กำลังติดตั้ง (Active)' : st === 'Closed' ? 'ปิดโครงการแล้ว (Closed)' : st === 'On Hold' ? 'ระงับชั่วคราว (On Hold)' : st}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsAddingStatus(true)}
                className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 rounded-lg transition-all shrink-0 flex items-center justify-center"
                title="เพิ่มสถานะใหม่"
              >
                <Plus className="w-4 h-4" />
              </button>
              {status && (
                <button
                  type="button"
                  onClick={handleDeleteStatus}
                  className="p-2.5 bg-zinc-800 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-zinc-700 hover:border-rose-900/50 rounded-lg transition-all shrink-0 flex items-center justify-center"
                  title="ลบสถานะนี้ออกจากระบบ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Installation Site */}
        <div className="md:col-span-2">
          <label htmlFor="proj-site" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            สถานที่ติดตั้ง *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              id="proj-site"
              type="text"
              required
              placeholder="ระบุที่ตั้งพิกัด หรือ ชื่อโรงงาน อาคาร ห้อง"
              value={installationSite}
              onChange={(e) => setInstallationSite(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="proj-start-date" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              วันเริ่มต้นโครงการ *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                id="proj-start-date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-all text-sm font-semibold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="proj-contract-end-date" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              วันสิ้นสุดสัญญา *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Calendar className="w-4 h-4 text-amber-500" />
              </div>
              <input
                id="proj-contract-end-date"
                type="date"
                required
                value={contractEndDate}
                onChange={(e) => setContractEndDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-all text-sm font-semibold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="proj-close-date" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              วันปิดโครงการ (ระบุเมื่อจบโครงการ)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Calendar className="w-4 h-4 text-emerald-500" />
              </div>
              <input
                id="proj-close-date"
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-all text-sm font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Warning Alert for Expiring Contract */}
        {(contractEndDate) && (() => {
          const today = new Date();
          today.setHours(0,0,0,0);
          const target = new Date(contractEndDate);
          target.setHours(0,0,0,0);
          const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays >= 0 && diffDays < 10) {
            return (
              <div className="md:col-span-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 text-amber-400 animate-pulse">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-300">แจ้งเตือนสัญญาใกล้สิ้นสุด!</h4>
                  <p className="text-xs font-medium mt-1">
                    ระยะเวลาสิ้นสุดสัญญาคงเหลือน้อยกว่า 10 วัน (เหลืออีกเพียง <span className="font-mono font-extrabold text-sm text-white underline">{diffDays}</span> วัน) กรุณาเร่งติดตามความก้าวหน้าการติดตั้ง
                  </p>
                </div>
              </div>
            );
          } else if (diffDays < 0) {
            return (
              <div className="md:col-span-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3 text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-rose-300">สัญญาสิ้นสุดลงแล้ว! (OVERDUE)</h4>
                  <p className="text-xs font-medium mt-1">
                    เลยกำหนดเวลาสิ้นสุดสัญญามาแล้ว <span className="font-mono font-extrabold text-sm text-white underline">{Math.abs(diffDays)}</span> วัน กรุณาจัดทำแผนและแจ้งขยายสัญญากับทางลูกค้าโดยเร็ว
                  </p>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Auto Duration displays */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-zinc-400">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-bold text-zinc-300 block">ระยะเวลาโครงการ</span>
                <span className="text-[10px] text-zinc-500">คำนวณจาก วันเริ่มต้น ถึง วันสิ้นสุดสัญญา</span>
              </div>
            </div>
            <span className="text-amber-400 font-extrabold text-sm">
              {durationDays} วัน
            </span>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-zinc-400">
              <Clock className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-zinc-300 block">ระยะเวลาดำเนินงานจริง</span>
                <span className="text-[10px] text-zinc-500">คำนวณจาก วันเริ่มต้น ถึง วันปิดโครงการ</span>
              </div>
            </div>
            {closeDate ? (
              <span className="text-emerald-400 font-extrabold text-sm">
                {executionDays} วัน
              </span>
            ) : (
              <span className="text-zinc-500 font-bold text-xs">
                อยู่ระหว่างดำเนินงาน
              </span>
            )}
          </div>
        </div>

        {/* Client Owner Name */}
        <div>
          <label htmlFor="proj-owner" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            ชื่อบริษัทลูกค้า *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <User className="w-4 h-4" />
            </div>
            <input
              id="proj-owner"
              type="text"
              required
              placeholder="ระบุชื่อบริษัทลูกค้าหลัก"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Partner Company */}
        <div>
          <label htmlFor="proj-partner" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            ชื่อลูกค้า (Owners) *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Building2 className="w-4 h-4" />
            </div>
            <input
              id="proj-partner"
              type="text"
              required
              placeholder="ระบุชื่อบุคคลที่เป็นเจ้าของหรือผู้ติดต่อหลัก"
              value={partnerCompany}
              onChange={(e) => setPartnerCompany(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Sales Representative */}
        <div>
          <label htmlFor="proj-sales" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            ชื่อพนักงานขาย (Sales) *
          </label>
          {isAddingSales ? (
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="ระบุชื่อพนักงานขายคนใหม่"
                value={newSalesName}
                onChange={(e) => setNewSalesName(e.target.value)}
                className="flex-1 bg-zinc-950 border border-emerald-500/50 rounded-lg px-3 py-2 text-white placeholder-zinc-500 text-sm focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddSales}
                className="px-3 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-all shrink-0"
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={() => setIsAddingSales(false)}
                className="px-3 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-700 transition-all shrink-0"
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <User className="w-4 h-4" />
                </div>
                <select
                  id="proj-sales"
                  required
                  value={salesPerson}
                  onChange={(e) => setSalesPerson(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all appearance-none"
                >
                  <option value="">-- เลือกพนักงานขาย --</option>
                  {salesPeople.map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingSales(true)}
                className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 rounded-lg transition-all shrink-0 flex items-center justify-center"
                title="เพิ่มพนักงานขายคนใหม่"
              >
                <Plus className="w-4 h-4" />
              </button>
              {salesPerson && (
                <button
                  type="button"
                  onClick={handleDeleteSales}
                  className="p-2.5 bg-zinc-800 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-zinc-700 hover:border-rose-900/50 rounded-lg transition-all shrink-0 flex items-center justify-center"
                  title="ลบพนักงานขายคนนี้ออกจากระบบ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Project Manager */}
        <div>
          <label htmlFor="proj-pm" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            ชื่อโปรเจ็คเมเนเจอร์ (PM) *
          </label>
          {isAddingPM ? (
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="ระบุชื่อ PM คนใหม่"
                value={newPMName}
                onChange={(e) => setNewPMName(e.target.value)}
                className="flex-1 bg-zinc-950 border border-emerald-500/50 rounded-lg px-3 py-2 text-white placeholder-zinc-500 text-sm focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddPM}
                className="px-3 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-all shrink-0"
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={() => setIsAddingPM(false)}
                className="px-3 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-700 transition-all shrink-0"
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <select
                  id="proj-pm"
                  required
                  value={projectManager}
                  onChange={(e) => setProjectManager(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all appearance-none"
                >
                  <option value="">-- เลือกโปรเจ็คเมเนเจอร์ --</option>
                  {projectManagers.map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingPM(true)}
                className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 rounded-lg transition-all shrink-0 flex items-center justify-center"
                title="เพิ่มโปรเจ็คเมเนเจอร์คนใหม่"
              >
                <Plus className="w-4 h-4" />
              </button>
              {projectManager && (
                <button
                  type="button"
                  onClick={handleDeletePM}
                  className="p-2.5 bg-zinc-800 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-zinc-700 hover:border-rose-900/50 rounded-lg transition-all shrink-0 flex items-center justify-center"
                  title="ลบโปรเจ็คเมเนเจอร์คนนี้ออกจากระบบ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
        <button
          id="btn-form-cancel"
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-zinc-800 text-zinc-400 hover:text-white bg-zinc-950/40 hover:bg-zinc-800 text-sm font-semibold rounded-lg transition-all"
        >
          ยกเลิก
        </button>
        <button
          id="btn-form-save"
          type="submit"
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-black font-extrabold text-sm rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-950/20 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>บันทึกโครงการ</span>
        </button>
      </div>
    </form>
  );
}
