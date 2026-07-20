/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, ProjectDocument } from '../types';
import { Folder, Plus, Trash2, FileText, Download, Link, Eye, Check } from 'lucide-react';

interface DocumentsManagerProps {
  project: Project;
  onUpdateDocuments: (docs: ProjectDocument[]) => void;
}

export default function DocumentsManager({ project, onUpdateDocuments }: DocumentsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState<string>('All');

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ProjectDocument['type']>('Other');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileData, setFileData] = useState('');

  const resetForm = () => {
    setTitle('');
    setType('Other');
    setFileName('');
    setFileSize('');
    setFileUrl('');
    setFileData('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    // Format size
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setFileSize(`${sizeInMb} MB`);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFileData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newDoc: ProjectDocument = {
      id: `doc-${Date.now()}`,
      title: title.trim(),
      type,
      fileName: fileName.trim() || 'Link_Attachment',
      fileSize: fileSize || 'External Link',
      fileData: fileData || undefined,
      url: fileUrl.trim() || undefined,
      uploadedAt: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toTimeString().substring(0, 5),
    };

    onUpdateDocuments([...(project.documents || []), newDoc]);
    setIsAdding(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณต้องการลบเอกสารฉบับนี้ออกจากโครงการใช่หรือไม่?')) {
      const updated = (project.documents || []).filter((doc) => doc.id !== id);
      onUpdateDocuments(updated);
    }
  };

  const handleDownloadBackup = () => {
    try {
      const dataStr = JSON.stringify(project, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const cleanName = project.name ? project.name.trim().replace(/[^a-zA-Z0-9\u0e00-\u0e7f_]/g, '_') : 'project';
      const exportFileDefaultName = `clickdo-backup-${cleanName}-${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.href = url;
      linkElement.download = exportFileDefaultName;
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download project backup:', err);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์สำรองโครงการ');
    }
  };

  const docsList = project.documents || [];
  const filteredDocs = filterType === 'All' ? docsList : docsList.filter((doc) => doc.type === filterType);

  return (
    <div className="space-y-6">
      {/* Visual Header card */}
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-lime-400" />
          <div>
            <h3 className="font-bold text-white text-base">คลังเก็บเอกสารโครงการ (Project Vault)</h3>
            <p className="text-xs text-zinc-400">อัปโหลดสแกนสัญญา เอกสารจัดซื้อ ใบส่งของ หรือแผงวงจร Diagram สัญญาร่วมค้า</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            id="btn-download-project-backup"
            type="button"
            onClick={handleDownloadBackup}
            className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-lime-400 hover:text-lime-300 font-extrabold text-xs rounded-lg flex items-center justify-center gap-1.5 border border-zinc-850 transition-all shadow-sm"
            title="ดาวน์โหลดสำรองข้อมูลทั้งหมดของโครงการนี้เป็นไฟล์ JSON เพื่อกันข้อมูลสูญหาย"
          >
            <Download className="w-4 h-4" />
            <span>ดาวน์โหลด JSON สำรอง</span>
          </button>

          <button
            id="btn-add-document"
            type="button"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="flex-1 sm:flex-initial px-4 py-1.5 bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-black font-extrabold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มเอกสาร</span>
          </button>
        </div>
      </div>

      {/* Upload/Add Form */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h4 className="font-bold text-white text-sm">อัปโหลดหรือแนบลิงก์เอกสารใหม่</h4>
            <button
              id="btn-close-doc-form"
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-zinc-500 hover:text-white text-xs"
            >
              ปิดฟอร์ม
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label htmlFor="doc-title" className="block text-zinc-400 font-semibold mb-1">
                ชื่อเรียกเอกสาร / คำอธิบาย *
              </label>
              <input
                id="doc-title"
                type="text"
                required
                placeholder="เช่น ใบอนุญาตขนานไฟ กฟน. ตัวจริง, สัญญาแนบท้ายข้อ 4"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-white placeholder-zinc-700"
              />
            </div>

            <div>
              <label htmlFor="doc-type" className="block text-zinc-400 font-semibold mb-1">
                หมวดหมู่ประเภทเอกสาร *
              </label>
              <select
                id="doc-type"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-white"
              >
                <option value="Contract">สัญญาว่าจ้าง (Contract)</option>
                <option value="Quotation">ใบเสนอราคา (Quotation)</option>
                <option value="Invoice">ใบแจ้งหนี้ / ใบเสร็จ (Invoice)</option>
                <option value="Drawings">แบบทางวิศวกรรม / Drawings</option>
                <option value="Handover">ใบส่งมอบงานติดตั้ง (Handover)</option>
                <option value="Other">เอกสารทั่วไป (Other)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">วิธีเพิ่มไฟล์ *</label>
              <div className="flex gap-4 pt-1 items-center">
                <label className="cursor-pointer bg-zinc-950 hover:bg-zinc-850 px-3 py-1.5 rounded border border-zinc-850 text-lime-400 text-[10px] font-bold">
                  อัปโหลดไฟล์ในเครื่อง
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-zinc-600">หรือ</span>
                <input
                  id="doc-link"
                  type="url"
                  placeholder="ใส่ Link แหล่งข้อมูล (เช่น Google Drive)"
                  value={fileUrl}
                  onChange={(e) => {
                    setFileUrl(e.target.value);
                    if (e.target.value && !fileName) {
                      setFileName('Google_Drive_Cloud_Link');
                    }
                  }}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-[10px] text-white placeholder-zinc-700 w-44"
                />
              </div>
            </div>

            {fileName && (
              <div className="sm:col-span-2 bg-zinc-950 p-2.5 rounded border border-lime-500/30 flex items-center justify-between">
                <span className="text-lime-400 font-mono text-[10px] truncate">
                  เลือกไฟล์แล้ว: {fileName} ({fileSize || 'Link'})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFileName('');
                    setFileSize('');
                    setFileData('');
                    setFileUrl('');
                  }}
                  className="text-rose-400 hover:underline text-[10px]"
                >
                  ล้างไฟล์
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              id="btn-doc-form-cancel"
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 rounded transition-all text-xs"
            >
              ยกเลิก
            </button>
            <button
              id="btn-doc-form-save"
              type="submit"
              className="px-4 py-1 bg-lime-500 hover:bg-lime-400 text-black font-extrabold rounded transition-all text-xs flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>บันทึกแฟ้มเอกสาร</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter tab row */}
      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-zinc-800/60 text-xs">
        {[
          { key: 'All', label: 'เอกสารทั้งหมด' },
          { key: 'Contract', label: 'สัญญาจ้าง' },
          { key: 'Quotation', label: 'ใบเสนอราคา' },
          { key: 'Invoice', label: 'ใบเสร็จ/การชำระเงิน' },
          { key: 'Drawings', label: 'แบบ Drawings/Diagram' },
          { key: 'Handover', label: 'ใบส่งงาน' },
          { key: 'Other', label: 'ทั่วไป' },
        ].map((tab) => (
          <button
            key={tab.key}
            id={`btn-doc-filter-${tab.key}`}
            type="button"
            onClick={() => setFilterType(tab.key)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
              filterType === tab.key
                ? 'bg-lime-500/10 text-lime-400 border-lime-500/50'
                : 'bg-zinc-950/40 border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Documents Grid / List */}
      {filteredDocs.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-850 rounded-xl p-10 text-center text-zinc-500 italic text-xs">
          ยังไม่มีการอัปโหลดหรือแนบไฟล์ลิงก์ในหมวดหมู่ {filterType === 'All' ? 'เอกสารทั้งหมด' : filterType}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              id={`doc-card-${doc.id}`}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-3 hover:border-lime-500/30 transition-all group relative"
            >
              <div className="p-2.5 bg-zinc-950 border border-zinc-850 text-lime-400 rounded-lg shrink-0">
                {doc.url ? <Link className="w-5 h-5 text-sky-400" /> : <FileText className="w-5 h-5 text-lime-400" />}
              </div>

              <div className="space-y-1 text-left min-w-0 flex-1">
                <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                  {doc.type === 'Contract'
                    ? 'สัญญาว่าจ้าง'
                    : doc.type === 'Quotation'
                    ? 'ใบเสนอราคา'
                    : doc.type === 'Invoice'
                    ? 'ใบจ่ายเงิน'
                    : doc.type === 'Drawings'
                    ? 'แบบติดตั้ง'
                    : doc.type === 'Handover'
                    ? 'ใบเสร็จรับงาน'
                    : 'เอกสารอื่นๆ'}
                </span>

                <h4 className="font-bold text-white text-xs truncate group-hover:text-lime-400 transition-colors">
                  {doc.title}
                </h4>

                <p className="text-[10px] text-zinc-400 truncate font-mono">
                  {doc.fileName} ({doc.fileSize})
                </p>

                <div className="pt-2 flex items-center justify-between text-[9px] text-zinc-500">
                  <span>แนบเมื่อ: {doc.uploadedAt}</span>
                  <div className="flex items-center gap-1.5 no-print">
                    {doc.url ? (
                      <a
                        id={`btn-open-doc-link-${doc.id}`}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-zinc-800 rounded text-sky-400 hover:text-sky-300"
                        title="เปิดลิงก์"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                    ) : doc.fileData ? (
                      <a
                        id={`btn-download-doc-file-${doc.id}`}
                        href={doc.fileData}
                        download={doc.fileName}
                        className="p-1 hover:bg-zinc-800 rounded text-lime-400 hover:text-lime-300"
                        title="ดาวน์โหลดไฟล์"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    ) : null}

                    <button
                      id={`btn-delete-doc-${doc.id}`}
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-rose-400"
                      title="ลบเอกสาร"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
