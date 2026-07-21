/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, ContractorInfo, Worker, PaymentMilestone } from '../types';
import { Users, User, Plus, Trash2, CheckCircle, AlertCircle, Coins, CreditCard, DollarSign } from 'lucide-react';

interface ContractorManagerProps {
  project: Project;
  onUpdateContractor: (contractorData: ContractorInfo) => void;
}

export default function ContractorManager({ project, onUpdateContractor }: ContractorManagerProps) {
  const contractor = project.contractor || {
    teamName: '',
    foremanName: '',
    workers: [],
    totalWage: 0,
    installments: [],
  };

  const [teamName, setTeamName] = useState(contractor.teamName || '');
  const [foremanName, setForemanName] = useState(contractor.foremanName || '');
  const [phone, setPhone] = useState(contractor.phone || '');
  const [totalWage, setTotalWage] = useState(contractor.totalWage || 0);

  // Load and save custom worker positions
  const [workerPositions, setWorkerPositions] = useState<string[]>(() => {
    const saved = localStorage.getItem('worker_positions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      'โฟร์แมน (Foreman)',
      'ช่างเทคนิค (Technician)',
      'ช่างไฟฟ้า (Electrician)',
      'ช่างเชื่อม (Welder)',
      'คนงานทั่วไป (Laborer)',
      'ผู้ช่วยช่าง (Helper)',
      'เจ้าหน้าที่ความปลอดภัย (Safety)'
    ];
  });

  const [selectedWorkerPosition, setSelectedWorkerPosition] = useState(workerPositions[0] || '');
  const [newPositionText, setNewPositionText] = useState('');

  React.useEffect(() => {
    localStorage.setItem('worker_positions', JSON.stringify(workerPositions));
  }, [workerPositions]);

  // Sync selected position when list changes
  React.useEffect(() => {
    if (workerPositions.length > 0 && !workerPositions.includes(selectedWorkerPosition)) {
      setSelectedWorkerPosition(workerPositions[0]);
    }
  }, [workerPositions, selectedWorkerPosition]);

  // New item states
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newInstName, setNewInstName] = useState('');
  const [newInstPct, setNewInstPct] = useState<number>(10);

  // Sync state if project changes
  React.useEffect(() => {
    if (project.contractor) {
      setTeamName(project.contractor.teamName || '');
      setForemanName(project.contractor.foremanName || '');
      setPhone(project.contractor.phone || '');
      setTotalWage(project.contractor.totalWage || 0);
    }
  }, [project]);

  // Saves overall contractor metadata
  const handleSaveInfo = () => {
    onUpdateContractor({
      ...contractor,
      teamName,
      foremanName,
      phone,
      totalWage,
    });
  };

  // Add position option
  const handleAddPositionOption = () => {
    const cleaned = newPositionText.trim();
    if (!cleaned) return;
    if (workerPositions.includes(cleaned)) {
      alert('ตำแหน่งนี้มีอยู่ในรายการแล้ว');
      return;
    }
    const updated = [...workerPositions, cleaned];
    setWorkerPositions(updated);
    setSelectedWorkerPosition(cleaned);
    setNewPositionText('');
  };

  // Remove position option
  const handleRemovePositionOption = (posToRemove: string) => {
    if (confirm(`คุณต้องการลบตำแหน่ง "${posToRemove}" ออกจากตัวเลือกใช่หรือไม่?`)) {
      const updated = workerPositions.filter(p => p !== posToRemove);
      setWorkerPositions(updated);
    }
  };

  // Update worker position on the fly
  const handleUpdateWorkerPosition = (workerId: string, position: string) => {
    const updatedWorkers = (contractor.workers || []).map(w => {
      if (w.id === workerId) {
        return { ...w, position: position || undefined };
      }
      return w;
    });

    onUpdateContractor({
      ...contractor,
      workers: updatedWorkers,
    });
  };

  // Add Worker
  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName.trim()) return;

    const newWorker: Worker = {
      id: `worker-${Date.now()}`,
      name: newWorkerName.trim(),
      position: selectedWorkerPosition || undefined,
    };

    onUpdateContractor({
      ...contractor,
      workers: [...(contractor.workers || []), newWorker],
    });
    setNewWorkerName('');
  };

  // Remove Worker
  const handleRemoveWorker = (id: string) => {
    onUpdateContractor({
      ...contractor,
      workers: (contractor.workers || []).filter((w) => w.id !== id),
    });
  };

  // Add Payment Installment
  const handleAddInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstName.trim()) return;

    const amount = (totalWage * newInstPct) / 100;
    const newMilestone: PaymentMilestone = {
      id: `inst-${Date.now()}`,
      name: newInstName.trim(),
      amount,
      percentage: newInstPct,
      status: 'Unpaid',
    };

    onUpdateContractor({
      ...contractor,
      installments: [...(contractor.installments || []), newMilestone],
    });

    setNewInstName('');
  };

  // Toggle Installment Payment Status
  const handleToggleStatus = (id: string) => {
    const updated = (contractor.installments || []).map((inst) => {
      if (inst.id === id) {
        return {
          ...inst,
          status: (inst.status === 'Paid' ? 'Unpaid' : 'Paid') as 'Paid' | 'Unpaid',
        };
      }
      return inst;
    });

    onUpdateContractor({
      ...contractor,
      installments: updated,
    });
  };

  // Delete Installment
  const handleDeleteInstallment = (id: string) => {
    onUpdateContractor({
      ...contractor,
      installments: (contractor.installments || []).filter((inst) => inst.id !== id),
    });
  };

  // Summarize payment values
  const installmentsList = contractor.installments || [];
  const paidAmount = installmentsList
    .filter((i) => i.status === 'Paid')
    .reduce((sum, curr) => sum + curr.amount, 0);
  const unpaidAmount = installmentsList
    .filter((i) => i.status === 'Unpaid')
    .reduce((sum, curr) => sum + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Visual Header card */}
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-lime-400" />
          <div>
            <h3 className="font-bold text-white text-base">ข้อมูลช่างเทคนิคและผู้รับเหมา</h3>
            <p className="text-xs text-zinc-400">ควบคุมข้อมูลรายชื่อช่างผู้ติดตั้ง ค่าจ้างสัญญา และรายงานการเบิกจ่ายงวดงาน</p>
          </div>
        </div>
        <button
          id="btn-save-contractor-main"
          type="button"
          onClick={handleSaveInfo}
          className="px-4 py-1.5 bg-lime-500 hover:bg-lime-400 text-black font-extrabold text-xs rounded-lg transition-all"
        >
          บันทึกข้อมูลหลัก
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Contractor Core Details & Workers List */}
        <div className="lg:col-span-1 space-y-6">
          {/* Main info card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h4 className="font-bold text-white text-sm border-b border-zinc-800 pb-2">ข้อมูลผู้รับเหมาหลัก</h4>

            <div className="space-y-3">
              <div>
                <label htmlFor="ct-team" className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                  ชื่อบริษัท/ทีมผู้รับเหมา
                </label>
                <input
                  id="ct-team"
                  type="text"
                  placeholder="เช่น ทีมช่างชัย โซล่าเซลล์ ดีไซน์"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  onBlur={handleSaveInfo}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-lime-500 transition-all font-medium"
                />
              </div>

              <div>
                <label htmlFor="ct-foreman" className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                  ชื่อหัวหน้าทีม/Foreman *
                </label>
                <input
                  id="ct-foreman"
                  type="text"
                  placeholder="ชื่อ นามสกุลหัวหน้าทีม"
                  value={foremanName}
                  onChange={(e) => setForemanName(e.target.value)}
                  onBlur={handleSaveInfo}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-lime-500 transition-all font-medium"
                />
              </div>

              <div>
                <label htmlFor="ct-phone" className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                  เบอร์โทรติดต่อ
                </label>
                <input
                  id="ct-phone"
                  type="text"
                  placeholder="เช่น 081-234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={handleSaveInfo}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-lime-500 transition-all font-medium"
                />
              </div>

              <div>
                <label htmlFor="ct-wage" className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                  มูลค่าวงเงินจัดจ้างเหมา (บาท)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-500 font-mono text-xs">
                    ฿
                  </span>
                  <input
                    id="ct-wage"
                    type="number"
                    placeholder="เช่น 120000"
                    value={totalWage}
                    onChange={(e) => setTotalWage(Number(e.target.value))}
                    onBlur={handleSaveInfo}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2 text-white text-sm focus:outline-none focus:border-lime-500 transition-all font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Workers list */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h4 className="font-bold text-white text-sm border-b border-zinc-800 pb-2">
              รายชื่อผู้ปฏิบัติงาน ({contractor.workers?.length || 0})
            </h4>

            <form onSubmit={handleAddWorker} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="input-new-worker" className="block text-[11px] text-zinc-400 font-semibold mb-1 uppercase">
                    ชื่อ-นามสกุล ผู้ปฏิบัติงาน
                  </label>
                  <input
                    id="input-new-worker"
                    type="text"
                    placeholder="เช่น นายสมชาย ขยันงาน"
                    value={newWorkerName}
                    onChange={(e) => setNewWorkerName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-lime-500 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="select-worker-position" className="block text-[11px] text-zinc-400 font-semibold mb-1 uppercase">
                    ตำแหน่งในโครงการ
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      id="select-worker-position"
                      value={selectedWorkerPosition}
                      onChange={(e) => setSelectedWorkerPosition(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-lime-500 transition-all font-medium"
                    >
                      {workerPositions.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                    {selectedWorkerPosition && (
                      <button
                        id="btn-delete-pos-option"
                        type="button"
                        onClick={() => handleRemovePositionOption(selectedWorkerPosition)}
                        className="p-1.5 bg-zinc-950 border border-zinc-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded-lg transition-all"
                        title="ลบตัวเลือกตำแหน่งนี้ออกจากระบบ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Subform to add a new custom option */}
              <div className="bg-zinc-950/65 border border-zinc-850 rounded-xl p-3 flex flex-col sm:flex-row gap-2 items-end">
                <div className="flex-1">
                  <label htmlFor="input-new-pos" className="block text-[9.5px] text-zinc-400 font-bold mb-1 uppercase tracking-wider">
                    เพิ่มตัวเลือกตำแหน่งใหม่ในโครงการ
                  </label>
                  <input
                    id="input-new-pos"
                    type="text"
                    placeholder="ระบุชื่อตำแหน่งใหม่ เช่น ช่างซ่อมบำรุง"
                    value={newPositionText}
                    onChange={(e) => setNewPositionText(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-lime-500"
                  />
                </div>
                <button
                  id="btn-add-pos-option"
                  type="button"
                  onClick={handleAddPositionOption}
                  className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 hover:border-zinc-700 text-lime-400 hover:text-lime-350 font-bold text-xs rounded-lg transition-all whitespace-nowrap h-[30px] flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มตำแหน่ง</span>
                </button>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  id="btn-add-worker"
                  type="submit"
                  className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black font-extrabold text-xs rounded-lg flex items-center gap-1 transition-all shadow-md shadow-lime-500/10 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มรายชื่อผู้ปฏิบัติงาน</span>
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {(!contractor.workers || contractor.workers.length === 0) ? (
                <p className="text-center py-4 text-zinc-600 text-[11px] italic font-mono">
                  ยังไม่ได้ระบุรายชื่อผู้ปฏิบัติงาน
                </p>
              ) : (
                contractor.workers.map((w, index) => (
                  <div
                    key={w.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs font-medium"
                  >
                    <div className="flex items-center gap-2 text-zinc-300">
                      <span className="text-zinc-600 text-[10px] font-mono">#{index + 1}</span>
                      <span className="font-bold">{w.name}</span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-[10px] text-zinc-500">ตำแหน่ง:</span>
                      <select
                        value={w.position || ''}
                        onChange={(e) => handleUpdateWorkerPosition(w.id, e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-lime-500 font-medium"
                      >
                        <option value="">-- ไม่ระบุตำแหน่ง --</option>
                        {workerPositions.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>

                      <button
                        id={`btn-remove-worker-${w.id}`}
                        type="button"
                        onClick={() => handleRemoveWorker(w.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 border border-transparent hover:border-zinc-850 rounded transition-all"
                        title="ลบรายชื่อผู้ปฏิบัติงาน"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: Installment Division & Summary (Grows double on wide screen) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment stats counter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-lime-500/10 text-lime-400 rounded-lg shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">วงเงินรวมทั้งสัญญา</div>
                <div className="text-sm font-black font-mono text-white">
                  ฿{totalWage.toLocaleString('th-TH')}
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-lime-500/10 text-lime-400 rounded-lg shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">จ่ายแล้วสะสม</div>
                <div className="text-sm font-black font-mono text-lime-400">
                  ฿{paidAmount.toLocaleString('th-TH')}
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-yellow-500/10 text-yellow-400 rounded-lg shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">คงเหลือรอจ่าย</div>
                <div className="text-sm font-black font-mono text-yellow-400">
                  ฿{unpaidAmount.toLocaleString('th-TH')}
                </div>
              </div>
            </div>
          </div>

          {/* Milestone division chart table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-lime-400" />
                <span>แผนการแบ่งชำระงวดงาน ({installmentsList.length} งวด)</span>
              </h4>
              <span className="text-[10px] font-mono text-zinc-500">
                เปอร์เซ็นต์รวม: {installmentsList.reduce((sum, curr) => sum + curr.percentage, 0)}% / 100%
              </span>
            </div>

            {/* Add installment inline form */}
            <form onSubmit={handleAddInstallment} className="grid grid-cols-1 sm:grid-cols-6 gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-850">
              <div className="sm:col-span-3">
                <label htmlFor="inst-name" className="block text-[10px] font-semibold text-zinc-500 mb-1">
                  คำอธิบายงวดงานชำระเงิน
                </label>
                <input
                  id="inst-name"
                  type="text"
                  required
                  placeholder="เช่น งวดที่ 1 จ่ายล่วงหน้าเมื่อลงฐานราก"
                  value={newInstName}
                  onChange={(e) => setNewInstName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-lime-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="inst-pct" className="block text-[10px] font-semibold text-zinc-500 mb-1">
                  สัดส่วนความคืบหน้า (%)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="inst-pct"
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={newInstPct}
                    onChange={(e) => setNewInstPct(Number(e.target.value))}
                    className="w-full accent-lime-500 cursor-pointer h-1.5 rounded"
                  />
                  <span className="text-xs font-mono text-white font-bold w-10 text-right">{newInstPct}%</span>
                </div>
              </div>

              <div className="sm:col-span-1 flex items-end">
                <button
                  id="btn-add-installment"
                  type="submit"
                  className="w-full py-1 bg-lime-500 hover:bg-lime-400 text-black font-extrabold text-[11px] rounded transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มงวด</span>
                </button>
              </div>
            </form>

            {/* Installments milestones list table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                <thead>
                  <tr className="border-b border-zinc-850 text-zinc-500 font-semibold bg-zinc-950/20">
                    <th className="py-2.5 px-3">รายละเอียดการจ่ายงวด</th>
                    <th className="py-2.5 px-3">สัดส่วน</th>
                    <th className="py-2.5 px-3">คำนวณเงินสด (บาท)</th>
                    <th className="py-2.5 px-3">สถานะเบิกจ่าย</th>
                    <th className="py-2.5 px-3 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {installmentsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-zinc-600 italic">
                        ยังไม่ได้กำหนดงวดชำระค่าสัญญางานติดตั้ง
                      </td>
                    </tr>
                  ) : (
                    installmentsList.map((inst) => (
                      <tr key={inst.id} className="border-b border-zinc-850 hover:bg-zinc-900/40 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-white">{inst.name}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-lime-400">{inst.percentage}%</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-zinc-200">
                          ฿{inst.amount.toLocaleString('th-TH')}
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            id={`btn-toggle-installment-${inst.id}`}
                            type="button"
                            onClick={() => handleToggleStatus(inst.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all flex items-center gap-1 ${
                              inst.status === 'Paid'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35 hover:bg-emerald-500/25'
                                : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/35 hover:bg-yellow-500/25'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{inst.status === 'Paid' ? 'ชำระเงินแล้ว' : 'ค้างชำระ'}</span>
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            id={`btn-delete-installment-${inst.id}`}
                            type="button"
                            onClick={() => handleDeleteInstallment(inst.id)}
                            className="p-1 hover:bg-zinc-850 rounded text-zinc-500 hover:text-rose-400 transition-all"
                            title="ลบงวด"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
    </div>
  );
}
