/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, Contact } from '../types';
import { Users, Plus, Trash2, Edit3, Briefcase, ChevronRight, Check, X, Settings2 } from 'lucide-react';

interface ContactsManagerProps {
  project: Project;
  positions: string[]; // Selectable positions list
  onUpdateContacts: (contacts: Contact[]) => void;
  onUpdatePositions: (positions: string[]) => void; // Support adding/deleting positions dynamically
}

export default function ContactsManager({
  project,
  positions,
  onUpdateContacts,
  onUpdatePositions,
}: ContactsManagerProps) {
  const [isManagingPositions, setIsManagingPositions] = useState(false);
  const [newPositionName, setNewPositionName] = useState('');

  // Form states for adding contact
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(positions[0] || '');

  // Add Contact
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !selectedPosition) return;

    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      position: selectedPosition,
    };

    onUpdateContacts([...project.contacts, newContact]);
    setFirstName('');
    setLastName('');
  };

  // Delete Contact
  const handleDeleteContact = (id: string) => {
    if (confirm('คุณต้องการลบรายชื่อผู้ติดต่อโครงการรายนี้ใช่หรือไม่?')) {
      const updated = project.contacts.filter((c) => c.id !== id);
      onUpdateContacts(updated);
    }
  };

  // Add custom Position to list
  const handleAddPosition = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPositionName.trim();
    if (!name) return;
    if (positions.includes(name)) {
      alert('ตำแหน่งนี้มีอยู่ในรายการแล้ว');
      return;
    }

    const updated = [...positions, name];
    onUpdatePositions(updated);
    setSelectedPosition(name); // Set current active position to the newly created one
    setNewPositionName('');
  };

  // Delete custom Position from list
  const handleDeletePosition = (posToDelete: string) => {
    if (positions.length <= 1) {
      alert('ต้องมีตำแหน่งหลงเหลือในระบบอย่างน้อย 1 ตำแหน่ง');
      return;
    }
    if (confirm(`คุณต้องการลบตัวเลือกตำแหน่ง "${posToDelete}" หรือไม่? (จะไม่มีผลลบข้อมูลชื่อผู้ติดต่อเดิมที่มีอยู่)`)) {
      const updated = positions.filter((pos) => pos !== posToDelete);
      onUpdatePositions(updated);
      if (selectedPosition === posToDelete) {
        setSelectedPosition(updated[0] || '');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Header card */}
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-lime-400" />
          <div>
            <h3 className="font-bold text-white text-base">ผู้ติดต่อในโครงการ (Project Contacts)</h3>
            <p className="text-xs text-zinc-400">ควบคุมและกำหนดรายชื่อผู้ติดต่อหลัก ผู้ตรวจรับงานฝั่งราชการ หรือวิศวกรควบคุม</p>
          </div>
        </div>

        <button
          id="btn-toggle-manage-positions"
          type="button"
          onClick={() => setIsManagingPositions(!isManagingPositions)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
            isManagingPositions
              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/35 hover:bg-yellow-500/20'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>{isManagingPositions ? 'ปิดจัดแจงตัวเลือกตำแหน่ง' : 'จัดการตัวเลือกตำแหน่งงาน'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Positions Manager Drawer/Form OR Add Contact form */}
        <div className="lg:col-span-1 space-y-6">
          {/* 1. Dynamic Positions Manager (Requirement 4: add/delete positions) */}
          {isManagingPositions && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h4 className="font-bold text-yellow-400 text-xs uppercase tracking-wider">จัดการตัวเลือกในดรอปดาวน์</h4>
                <button
                  id="btn-close-manage-pos"
                  type="button"
                  onClick={() => setIsManagingPositions(false)}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Add custom position */}
              <form onSubmit={handleAddPosition} className="flex gap-2">
                <input
                  id="input-new-position"
                  type="text"
                  required
                  placeholder="เช่น ผู้ควบคุมความปลอดภัยไฟฟ้า"
                  value={newPositionName}
                  onChange={(e) => setNewPositionName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500"
                />
                <button
                  id="btn-add-position"
                  type="submit"
                  className="px-3 bg-yellow-500 text-black font-extrabold text-xs rounded-lg hover:bg-yellow-400 shrink-0 transition-all"
                >
                  เพิ่ม
                </button>
              </form>

              {/* Positions list with deletion */}
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {positions.map((pos) => (
                  <div
                    key={pos}
                    className="flex items-center justify-between bg-zinc-950 border border-zinc-850 rounded-md px-2.5 py-1.5 text-xs font-medium"
                  >
                    <span className="text-zinc-300 truncate">{pos}</span>
                    <button
                      id={`btn-delete-position-${pos.replace(/\s+/g, '_')}`}
                      type="button"
                      onClick={() => handleDeletePosition(pos)}
                      className="text-zinc-600 hover:text-rose-400 p-0.5 transition-all shrink-0"
                      title="ลบตัวเลือกนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Add Contact Form */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h4 className="font-bold text-white text-sm border-b border-zinc-800 pb-2">ลงทะเบียนผู้ติดต่อใหม่</h4>

            <form onSubmit={handleAddContact} className="space-y-3.5">
              <div>
                <label htmlFor="ct-fname" className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                  ชื่อจริง *
                </label>
                <input
                  id="ct-fname"
                  type="text"
                  required
                  placeholder="เช่น มงคล"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-lime-500"
                />
              </div>

              <div>
                <label htmlFor="ct-lname" className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                  นามสกุล *
                </label>
                <input
                  id="ct-lname"
                  type="text"
                  required
                  placeholder="เช่น พัฒนศิลป์"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-lime-500"
                />
              </div>

              <div>
                <label htmlFor="ct-pos" className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                  ตำแหน่งในโครงการ *
                </label>
                <div className="flex gap-1.5">
                  <select
                    id="ct-pos"
                    required
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lime-500"
                  >
                    {positions.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                id="btn-add-contact-submit"
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-lime-500 to-yellow-500 hover:from-lime-400 hover:to-yellow-400 text-black font-extrabold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-lime-950/20"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มผู้ติดต่อ</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Table of Project Contacts */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h4 className="font-bold text-white text-sm border-b border-zinc-800 pb-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-lime-400" />
            <span>รายชื่อคณะผู้ติดต่อโครงการทั้งหมด ({project.contacts?.length || 0} คน)</span>
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300 border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase">
                  <th className="py-2.5 px-3">ลำดับ</th>
                  <th className="py-2.5 px-3">ชื่อ - นามสกุล</th>
                  <th className="py-2.5 px-3">ตำแหน่งในโครงการ</th>
                  <th className="py-2.5 px-3 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {(!project.contacts || project.contacts.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-zinc-600 italic">
                      ยังไม่ได้ระบุผู้ติดต่อใดๆ ในโครงการนี้
                    </td>
                  </tr>
                ) : (
                  project.contacts.map((c, idx) => (
                    <tr key={c.id} className="border-b border-zinc-850 hover:bg-zinc-950/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-zinc-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        {c.firstName} {c.lastName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2.5 py-0.5 bg-zinc-950 text-lime-400 border border-zinc-800 rounded-full font-semibold text-[10px]">
                          {c.position}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          id={`btn-delete-contact-${c.id}`}
                          type="button"
                          onClick={() => handleDeleteContact(c.id)}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-rose-400 transition-all"
                          title="ลบรายชื่อ"
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
  );
}
