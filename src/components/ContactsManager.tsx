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
  const [department, setDepartment] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(positions[0] || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [lineId, setLineId] = useState('');

  // Editing state
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Add Contact
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !selectedPosition) return;

    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      position: selectedPosition,
      department: department.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      lineId: lineId.trim() || undefined,
    };

    onUpdateContacts([...project.contacts, newContact]);
    setFirstName('');
    setLastName('');
    setDepartment('');
    setPhone('');
    setEmail('');
    setLineId('');
  };

  // Open Edit Modal
  const handleOpenEdit = (c: Contact) => {
    setEditingContact({ ...c });
  };

  // Save Edit Contact
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact || !editingContact.firstName.trim() || !editingContact.lastName.trim()) return;

    const updated = project.contacts.map((c) => (c.id === editingContact.id ? editingContact : c));
    onUpdateContacts(updated);
    setEditingContact(null);
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
                <label htmlFor="ct-dept" className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                  แผนก / ฝ่าย
                </label>
                <input
                  id="ct-dept"
                  type="text"
                  placeholder="เช่น ฝ่ายวิศวกรรม / แผนกจัดซื้อ"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
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

              <div>
                <label htmlFor="ct-phone" className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                  เบอร์โทรติดต่อ
                </label>
                <input
                  id="ct-phone"
                  type="text"
                  placeholder="เช่น 089-123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-lime-500"
                />
              </div>

              <div>
                <label htmlFor="ct-email" className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                  Email
                </label>
                <input
                  id="ct-email"
                  type="email"
                  placeholder="เช่น contact@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-lime-500"
                />
              </div>

              <div>
                <label htmlFor="ct-lineId" className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                  Line ID
                </label>
                <input
                  id="ct-lineId"
                  type="text"
                  placeholder="เช่น line_id_123"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-lime-500"
                />
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
            <span>รายชื่อผู้ติดต่อโครงการทั้งหมด ({project.contacts?.length || 0} คน)</span>
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300 border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase">
                  <th className="py-2.5 px-3">ลำดับ</th>
                  <th className="py-2.5 px-3">ชื่อ - นามสกุล</th>
                  <th className="py-2.5 px-3">แผนก / ฝ่าย</th>
                  <th className="py-2.5 px-3">ตำแหน่ง</th>
                  <th className="py-2.5 px-3">เบอร์โทรติดต่อ</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Line ID</th>
                  <th className="py-2.5 px-3 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {(!project.contacts || project.contacts.length === 0) ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-zinc-600 italic">
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
                      <td className="py-2.5 px-3 text-zinc-300">
                        {c.department ? (
                          <span className="px-2 py-0.5 bg-zinc-950 text-blue-400 border border-zinc-800 rounded text-[10px] font-semibold">
                            {c.department}
                          </span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2.5 py-0.5 bg-zinc-950 text-lime-400 border border-zinc-800 rounded-full font-semibold text-[10px] whitespace-nowrap">
                          {c.position}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-zinc-300">{c.phone || '-'}</td>
                      <td className="py-2.5 px-3 text-zinc-300 truncate max-w-[120px]" title={c.email}>{c.email || '-'}</td>
                      <td className="py-2.5 px-3 font-mono text-zinc-300">{c.lineId || '-'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`btn-edit-contact-${c.id}`}
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-lime-400 transition-all"
                            title="แก้ไขข้อมูลผู้ติดต่อ"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-delete-contact-${c.id}`}
                            type="button"
                            onClick={() => handleDeleteContact(c.id)}
                            className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-rose-400 transition-all"
                            title="ลบรายชื่อ"
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

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-lime-400" />
                <h3 className="text-base font-bold text-white">แก้ไขข้อมูลผู้ติดต่อโครงการ</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingContact(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">ชื่อจริง *</label>
                  <input
                    type="text"
                    required
                    value={editingContact.firstName}
                    onChange={(e) => setEditingContact({ ...editingContact, firstName: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lime-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">นามสกุล *</label>
                  <input
                    type="text"
                    required
                    value={editingContact.lastName}
                    onChange={(e) => setEditingContact({ ...editingContact, lastName: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lime-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">แผนก / ฝ่าย</label>
                <input
                  type="text"
                  placeholder="เช่น ฝ่ายวิศวกรรม / แผนกจัดซื้อ"
                  value={editingContact.department || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, department: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lime-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">ตำแหน่งในโครงการ *</label>
                <select
                  required
                  value={editingContact.position}
                  onChange={(e) => setEditingContact({ ...editingContact, position: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lime-500"
                >
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                  {!positions.includes(editingContact.position) && (
                    <option value={editingContact.position}>{editingContact.position}</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">เบอร์โทร</label>
                  <input
                    type="text"
                    value={editingContact.phone || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lime-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={editingContact.email || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lime-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">Line ID</label>
                  <input
                    type="text"
                    value={editingContact.lineId || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, lineId: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-lime-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
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
