/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProjectClosureReport.tsx
 * Component for compiling, viewing, and printing the pre-closing project summary report.
 * Page 1: Details, customer metadata, PO, optional schedule plan, SOW, working steps, operation summary.
 * Page 2+: Photo appendix divided into topics with individual description inputs.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Project, Customer, ClosureReport, ClosurePhoto } from '../types';
import { 
  FileCheck, Printer, Camera, Plus, Trash2, Check, Download, 
  MapPin, Calendar, FileText, Image, Clipboard, Info, RefreshCw, AlertCircle
} from 'lucide-react';

interface ProjectClosureReportProps {
  project: Project;
  customers: Customer[];
  onUpdateClosureReport: (report: ClosureReport) => void;
}

export default function ProjectClosureReport({ 
  project, 
  customers, 
  onUpdateClosureReport 
}: ProjectClosureReportProps) {
  
  // Find associated customer
  const associatedCustomer = customers.find(c => c.companyName === project.ownerName);

  // Load existing report or fallback to default
  const [steps, setSteps] = useState(project.closureReport?.steps || '');
  const [summary, setSummary] = useState(project.closureReport?.summary || '');
  const [showSchedule, setShowSchedule] = useState(project.closureReport?.showSchedule ?? true);
  const [photos, setPhotos] = useState<ClosurePhoto[]>(project.closureReport?.photos || []);
  const [problemsAndSolutions, setProblemsAndSolutions] = useState(project.closureReport?.problemsAndSolutions || '');
  const [remarks, setRemarks] = useState(project.closureReport?.remarks || '');

  // Sync state if project changes
  useEffect(() => {
    if (project.closureReport) {
      setSteps(project.closureReport.steps);
      setSummary(project.closureReport.summary);
      setShowSchedule(project.closureReport.showSchedule);
      setPhotos(project.closureReport.photos);
      setProblemsAndSolutions(project.closureReport.problemsAndSolutions || '');
      setRemarks(project.closureReport.remarks || '');
    } else {
      // Default initial templates
      setSteps(
        `1. เข้าสำรวจหน้างานและกำหนดจุดติดตั้งอุปกรณ์หลัก\n2. ติดตั้งโครงสร้างยึดแผงเซลล์แสงอาทิตย์ (Mounting Structure) บนหลังคาอาคาร\n3. ติดตั้งแผงเซลล์แสงอาทิตย์ Solar Module ทั้งหมดและเดินสายเคเบิล DC\n4. ติดตั้งระบบตู้สวิตช์บอร์ด MDB, Inverter และชุดอุปกรณ์ป้องกันกระแสเกิน\n5. ดำเนินการทดสอบระบบ (Commissioning) และตรวจสอบค่าความต้านทานดินตามเกณฑ์มาตรฐานวิศวกรรม`
      );
      setSummary(
        `โครงการได้รับการดำเนินงานติดตั้งและตรวจสอบเป็นไปตามมาตรฐานวิศวกรรมทุกประการ การทำงานลุล่วงสำเร็จครบถ้วนตามกรอบระยะเวลาสัญญา ผลการทดสอบประสิทธิภาพการจ่ายไฟอยู่ในระดับเกณฑ์ดีเยี่ยม (Performance Ratio > 82%) พร้อมส่งมอบโครงการแก่ผู้ว่าจ้างเพื่อปิดโครงการสมบูรณ์`
      );
      setProblemsAndSolutions(
        `ไม่มีอุปสรรคสำคัญระหว่างการดำเนินงาน การส่งมอบพื้นที่ติดตั้งและการประสานงานกับผู้ควบคุมงานของฝั่งผู้ว่าจ้างเป็นไปอย่างราบรื่น ได้รับความร่วมมือที่ดีมากและดำเนินงานเสร็จสิ้นตามเกณฑ์ความปลอดภัย`
      );
      setRemarks(
        `ผ่านการทดสอบมาตรฐานความปลอดภัยวิศวกรรม พร้อมรับประกันผลงานการติดตั้งและโครงสร้างเป็นเวลา 2 ปี`
      );
      setShowSchedule(true);
      setPhotos([]);
    }
  }, [project.id, project.closureReport]);

  // Saving function
  const handleSaveReport = () => {
    const report: ClosureReport = {
      steps,
      summary,
      showSchedule,
      photos,
      problemsAndSolutions,
      remarks
    };
    onUpdateClosureReport(report);
  };

  // Photo uploads
  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const newPhoto: ClosurePhoto = {
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            url: reader.result,
            title: `ภาพงานส่วนที่ ${photos.length + 1}: ${file.name.split('.')[0]}`,
            description: 'รายละเอียดการดำเนินงานหรือผลการติดตั้งที่ปรากฏในรูปภาพ'
          };
          setPhotos(prev => {
            const updated = [...prev, newPhoto];
            // Auto save
            const rep: ClosureReport = { steps, summary, showSchedule, photos: updated, problemsAndSolutions, remarks };
            onUpdateClosureReport(rep);
            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeletePhoto = (id: string) => {
    const updated = photos.filter(p => p.id !== id);
    setPhotos(updated);
    // Auto save
    const rep: ClosureReport = { steps, summary, showSchedule, photos: updated, problemsAndSolutions, remarks };
    onUpdateClosureReport(rep);
  };

  const handleUpdatePhotoDetails = (id: string, field: 'title' | 'description', value: string) => {
    const updated = photos.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setPhotos(updated);
    // Auto save
    const rep: ClosureReport = { steps, summary, showSchedule, photos: updated, problemsAndSolutions, remarks };
    onUpdateClosureReport(rep);
  };

  // Camera integration for mobile tablet field walk
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setCameraStream(stream);
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setCameraError('ไม่สามารถเปิดใช้งานกล้องได้ กรุณาตรวจสอบสิทธิ์ของเบราว์เซอร์');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const newPhoto: ClosurePhoto = {
            id: `photo-${Date.now()}`,
            url: dataUrl,
            title: `ภาพถ่ายจากกล้องภาคสนาม ${photos.length + 1}`,
            description: 'อธิบายตำแหน่งหรือขั้นตอนงานหลักที่ถ่ายจริง'
          };
          setPhotos(prev => {
            const updated = [...prev, newPhoto];
            const rep: ClosureReport = { steps, summary, showSchedule, photos: updated };
            onUpdateClosureReport(rep);
            return updated;
          });
          stopCamera();
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  // Print function
  const handlePrint = () => {
    handleSaveReport();
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Auto layout hook
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  return (
    <div className="space-y-6">
      
      {/* Tab Control Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600/20 text-emerald-400 rounded-lg flex items-center justify-center font-bold text-xl border border-emerald-500/30">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">รายงานสรุปโครงการ (Project Closure Report)</h3>
            <p className="text-xs text-zinc-400">สร้างเอกสารสรุปผลโครงการทางการเพื่อเตรียมนำเสนอแก่ผู้ว่าจ้างและแนบรูปขั้นตอนอย่างมืออาชีพ</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveReport}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>บันทึกร่างข้อมูล</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์รายงานสรุป (PDF)</span>
          </button>
        </div>
      </div>

      {/* EDITING FORM SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        
        {/* Form Inputs */}
        <div className="bg-zinc-900 border border-zinc-850 p-6 rounded-2xl space-y-5 text-xs">
          <h4 className="font-bold text-white text-sm border-b border-zinc-800 pb-2 flex items-center gap-2">
            <Clipboard className="w-4 h-4 text-emerald-400" />
            <span>รายละเอียดเนื้อหารายงาน</span>
          </h4>

          <div className="space-y-4">
            {/* Show schedule configuration */}
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-850 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block mb-0.5">แสดงแผนงานโครงการ</span>
                <p className="text-[10px] text-zinc-500">เลือกเพื่อนำตาราง SOW และ Timeline ของโครงการมาประกอบไว้ในรายงาน</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showSchedule}
                  onChange={(e) => {
                    setShowSchedule(e.target.checked);
                    const rep: ClosureReport = { steps, summary, showSchedule: e.target.checked, photos, problemsAndSolutions, remarks };
                    onUpdateClosureReport(rep);
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white" />
              </label>
            </div>

            {/* Steps text */}
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">ขั้นตอนการทำงาน (Working Steps)</label>
              <textarea
                rows={4}
                value={steps}
                onChange={(e) => {
                  setSteps(e.target.value);
                  const rep: ClosureReport = { steps: e.target.value, summary, showSchedule, photos, problemsAndSolutions, remarks };
                  onUpdateClosureReport(rep);
                }}
                placeholder="ระบุขั้นตอนการทำงานหลักเรียงลำดับ เช่น 1. เข้าพื้นที่ 2. ติดตั้งอุปกรณ์..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-all font-mono leading-relaxed"
              />
            </div>

            {/* Operational Summary */}
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">สรุปการดำเนินงาน (Operational Summary)</label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  const rep: ClosureReport = { steps, summary: e.target.value, showSchedule, photos, problemsAndSolutions, remarks };
                  onUpdateClosureReport(rep);
                }}
                placeholder="สรุปผลการวัดประสิทธิภาพ หรือสรุปผลงานส่งมอบภาพรวมทั้งหมด..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-all font-mono leading-relaxed"
              />
            </div>

            {/* Problems & Solutions */}
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">ปัญหา อุปสรรค และแนวทางแก้ไข (Problems & Solutions)</label>
              <textarea
                rows={3}
                value={problemsAndSolutions}
                onChange={(e) => {
                  setProblemsAndSolutions(e.target.value);
                  const rep: ClosureReport = { steps, summary, showSchedule, photos, problemsAndSolutions: e.target.value, remarks };
                  onUpdateClosureReport(rep);
                }}
                placeholder="ระบุอุปสรรคและแนวทางแก้ไข (ถ้ามี)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-all font-mono leading-relaxed"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">หมายเหตุ (Remarks)</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                  const rep: ClosureReport = { steps, summary, showSchedule, photos, problemsAndSolutions, remarks: e.target.value };
                  onUpdateClosureReport(rep);
                }}
                placeholder="ระบุหมายเหตุหรือข้อความชี้แจงเพิ่มเติม (ถ้ามี)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-all font-mono leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Photo Appendix & Attachments */}
        <div className="bg-zinc-900 border border-zinc-850 p-6 rounded-2xl space-y-5 text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Image className="w-4 h-4 text-emerald-400" />
                <span>ภาคผนวกแนบรูปภาพขั้นตอนการทำงาน</span>
              </h4>
              <span className="bg-zinc-800 text-zinc-300 font-bold px-2 py-0.5 rounded font-mono">
                {photos.length} รูป
              </span>
            </div>

            {/* Attachments Actions */}
            <div className="flex gap-2.5 mt-4">
              <label className="flex-1 cursor-pointer bg-zinc-950 hover:bg-zinc-900 border border-dashed border-zinc-800 hover:border-emerald-500 transition-all text-zinc-400 font-bold p-3 rounded-xl flex items-center justify-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>อัปโหลดรูปภาพงานหลัก</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleAddPhoto}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={startCamera}
                className="px-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500 rounded-xl text-zinc-400 hover:text-white transition-all flex items-center gap-1.5 font-bold"
              >
                <Camera className="w-4 h-4 text-yellow-400" />
                <span>ใช้กล้องสนาม</span>
              </button>
            </div>

            {/* Camera View inside Form */}
            {isCameraOpen && (
              <div className="mt-4 bg-black border border-zinc-850 p-4 rounded-xl relative space-y-3">
                <h5 className="font-bold text-yellow-400 flex items-center gap-1">
                  <span>●</span> กล้องภาคสนามพร้อมบันทึก
                </h5>
                <video ref={videoRef} autoPlay playsInline className="w-full aspect-video rounded-lg object-cover bg-zinc-900" />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-1.5 border border-zinc-800 text-zinc-400 font-semibold rounded-lg"
                  >
                    ปิดกล้อง
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold rounded-lg flex items-center gap-1"
                  >
                    <Camera className="w-4 h-4" />
                    <span>บันทึกรูป</span>
                  </button>
                </div>
              </div>
            )}

            {/* Photos Captions Editing List */}
            <div className="space-y-4 mt-5 max-h-[350px] overflow-y-auto pr-1">
              {photos.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 italic bg-zinc-950/40 border border-zinc-850/60 rounded-xl">
                  ยังไม่มีรูปภาพแนบประกอบรายงานสรุปขั้นตอน ให้คลิกอัปโหลดหรือเปิดกล้องเพื่อเพิ่มภาพในภาคผนวกหน้า 2
                </div>
              ) : (
                photos.map((p, index) => (
                  <div key={p.id} className="bg-zinc-950 border border-zinc-850 rounded-xl p-3 flex gap-3.5 relative group">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center">
                      <img src={p.url} alt="Attached Work" className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="block text-[10px] text-zinc-500 font-semibold mb-0.5">หัวข้อรูปที่ {index + 1}</label>
                        <input
                          type="text"
                          value={p.title}
                          onChange={(e) => handleUpdatePhotoDetails(p.id, 'title', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-850 rounded px-2 py-1 text-white text-[11px]"
                          placeholder="เช่น ติดตั้งแผง Solar Module บนหลังคา"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 font-semibold mb-0.5">อธิบายรายละเอียดย่อยประกอบรูปภาพ</label>
                        <input
                          type="text"
                          value={p.description}
                          onChange={(e) => handleUpdatePhotoDetails(p.id, 'description', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-850 rounded px-2 py-1 text-zinc-300 text-[11px]"
                          placeholder="เช่น ตรวจสอบความตึงแรงบิดรอยต่อโบลต์สแตนเลส"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(p.id)}
                      className="absolute top-2 right-2 p-1.5 bg-zinc-900 hover:bg-rose-950 text-zinc-500 hover:text-rose-400 rounded-lg"
                      title="ลบรูปภาพประกอบ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl p-3 flex gap-2 items-start mt-4">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <b>ระบบจัดพิมพ์มาตรฐานหน้าเอกสารคู่ขนาน:</b> รายงานจะถูกแบ่งสัดส่วนโดยแบ่งรายละเอียดลูกค้า ขอบข่ายโครงการ และสรุปหลักทั้งหมดให้อยู่ในหน้าแรก (Page 1) เสมอ และส่วนรูปภาพแนบอธิบายประกอบทั้งหมดจะถูกแบ่งขึ้นหน้าถัดไปโดยอัตโนมัติอย่างชัดเจน (Page 2+) เมื่อทำการพิมพ์หรือบันทึก PDF
            </p>
          </div>
        </div>

      </div>

      {/* DUAL PAGES PRINT PREVIEW LAYOUT */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl no-print text-center text-xs text-zinc-400">
        🔎 ด้านล่างนี้คือพรีวิวรูปแบบหน้ากระดาษพิมพ์จริง (Print Preview) ซึ่งจะตรงตามเอกสารส่งมอบปิดงาน 100%
      </div>

      <div className="msproject-report-preview shadow-2xl rounded-2xl overflow-hidden max-w-[850px] mx-auto bg-white text-zinc-950 p-10 space-y-12">
        
        {/* ==================== PAGE 1: DETAILS & SUMMARIES ==================== */}
        <div className="closure-page-1 bg-white flex flex-col justify-between min-h-[900px] border-b-2 border-dashed border-zinc-200 pb-12">
          <div className="space-y-6">
            
            {/* Header Report */}
            <div className="flex justify-between items-center border-b-2 border-zinc-900 pb-4">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">รายงานสรุปโครงการ</h2>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                  ชื่อโครงการ: {project.name}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest block mb-0.5">สถานะโครงการ</span>
                <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-0.5 rounded font-black inline-flex items-center gap-1 shadow-sm">
                  <span className="w-1 h-1 bg-white rounded-full" />
                  CLOSED COMPLETE
                </span>
              </div>
            </div>

            {/* Grid 2-cols Customer and Project Info */}
            <div className="grid grid-cols-2 gap-8 text-xs border-b border-zinc-200 pb-5">
              <div className="space-y-2">
                <h5 className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] border-b border-zinc-100 pb-1">รายละเอียดลูกค้า (Customer Information)</h5>
                <p className="font-extrabold text-zinc-950 text-sm">ชื่อลูกค้า (Owner): {project.ownerName}</p>
                <div className="space-y-1 text-zinc-600">
                  <p><b>สถานที่ติดตั้ง:</b> {project.installationSite}</p>
                  {associatedCustomer ? (
                    <>
                      <p><b>ผู้ติดต่อหลัก:</b> {associatedCustomer.contactPerson}</p>
                      <p><b>เบอร์โทร:</b> {associatedCustomer.phone} | <b>อีเมล:</b> {associatedCustomer.email}</p>
                      {associatedCustomer.taxId && <p><b>หมายเลขผู้เสียภาษี (Tax ID):</b> <span className="font-mono">{associatedCustomer.taxId}</span></p>}
                    </>
                  ) : (
                    <p className="text-zinc-500 italic">ผู้ว่าจ้างที่ระบุในสัญญางานก่อสร้าง</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] border-b border-zinc-100 pb-1">ข้อมูลโครงการและเอกสารอ้างอิง</h5>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-zinc-600">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-bold">หมายเลขใบสั่งซื้อ (PO Number)</span>
                    <span className="font-mono font-bold text-zinc-900 text-sm">{project.poNumber || 'ยังไม่ระบุ'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-bold">ระยะเวลาทำงาน</span>
                    <span className="font-bold text-zinc-900 font-mono">{project.startDate} ถึง {project.endDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-bold">ระยะเวลาสัญญารวม</span>
                    <span className="font-bold text-zinc-900">{project.durationDays || 0} วัน</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-bold">ผู้จัดการโครงการ (PM)</span>
                    <span className="font-bold text-zinc-900">{project.projectManager}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-zinc-400 block font-bold">วันที่ส่งมอบปิดงานจริง</span>
                    <span className="font-bold text-emerald-700 font-mono">{project.closeDate || new Date().toISOString().split('T')[0]}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scope of Work Table / Schedule if turned on */}
            {showSchedule && (
              <div className="space-y-2.5">
                <h5 className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] border-b border-zinc-100 pb-1">ขอบข่ายงานและแผนงานโครงการที่กำหนดสำเร็จ (Scope of Work & Schedule)</h5>
                <table className="w-full text-left text-[11px] border-collapse text-zinc-700">
                  <thead>
                    <tr className="border-b border-zinc-300 font-bold bg-zinc-50 h-7 text-zinc-900">
                      <th className="py-1 px-3 w-16 text-center">WBS</th>
                      <th className="py-1 px-3">ขั้นตอนปฏิบัติงานหลัก (Working Steps)</th>
                      <th className="py-1 px-3 text-center w-28">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.scopesOfWork.map((s, idx) => (
                      <React.Fragment key={`pr-sow-${s.id}`}>
                        <tr className="border-b border-zinc-200 h-8 font-bold text-zinc-900 bg-zinc-50/50">
                          <td className="py-1.5 px-3 text-center font-mono">{idx + 1}.0</td>
                          <td className="py-1.5 px-3 text-zinc-800">{s.taskName}</td>
                          <td className="py-1.5 px-3 text-center">
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              เสร็จเรียบร้อย
                            </span>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Steps & Summary */}
            <div className="space-y-4 text-xs pt-2">
              {/* Operational Summary, Problems & Solutions, and Remarks Stack */}
              <div className="space-y-3.5">
                
                {/* Operational Summary */}
                <div className="border-l-4 border-emerald-600 bg-emerald-50/10 border-y border-r border-zinc-200/80 rounded-r-xl p-3.5 shadow-sm">
                  <h5 className="font-extrabold text-emerald-950 flex items-center gap-2 border-b border-emerald-100 pb-1.5 text-[11px] tracking-wide">
                    <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>สรุปผลการดำเนินงานรวม</span>
                  </h5>
                  <p className="whitespace-pre-line text-zinc-700 font-medium leading-relaxed text-[10.5px] mt-2 antialiased">
                    {summary || 'ยังไม่ระบุ'}
                  </p>
                </div>

                {/* Problems & Solutions */}
                <div className="border-l-4 border-amber-500 bg-amber-50/10 border-y border-r border-zinc-200/80 rounded-r-xl p-3.5 shadow-sm">
                  <h5 className="font-extrabold text-amber-950 flex items-center gap-2 border-b border-amber-150 pb-1.5 text-[11px] tracking-wide">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>ปัญหา อุปสรรค และแนวทางแก้ไข</span>
                  </h5>
                  {(!problemsAndSolutions || problemsAndSolutions.trim() === 'ไม่มี' || problemsAndSolutions.trim() === 'ไม่มีอุปสรรคสำคัญระหว่างการดำเนินงาน การส่งมอบพื้นที่ติดตั้งและการประสานงานกับผู้ควบคุมงานของฝั่งผู้ว่าจ้างเป็นไปอย่างราบรื่น ได้รับความร่วมมือที่ดีมากและดำเนินงานเสร็จสิ้นตามเกณฑ์ความปลอดภัย') ? (
                    <div className="mt-2 flex items-start gap-1.5 text-[10.5px] text-zinc-500">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      <p className="leading-relaxed font-medium">
                        {problemsAndSolutions || 'ไม่มีรายงานอุปสรรคหรือปัญหาในการปฏิบัติงาน'}
                      </p>
                    </div>
                  ) : (
                    <p className="whitespace-pre-line text-zinc-700 font-medium leading-relaxed text-[10.5px] mt-2 antialiased">
                      {problemsAndSolutions}
                    </p>
                  )}
                </div>

                {/* Remarks */}
                <div className="border-l-4 border-blue-600 bg-blue-50/10 border-y border-r border-zinc-200/80 rounded-r-xl p-3.5 shadow-sm">
                  <h5 className="font-extrabold text-blue-950 flex items-center gap-2 border-b border-blue-100 pb-1.5 text-[11px] tracking-wide">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>หมายเหตุ (Remarks)</span>
                  </h5>
                  <p className="whitespace-pre-line text-zinc-700 font-medium leading-relaxed text-[10.5px] mt-2 antialiased">
                    {remarks || 'ไม่มีข้อกำหนดเพิ่มเติม'}
                  </p>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* ==================== PAGE 2+: PHOTO APPENDIX ==================== */}
        {/* We use class `break-before-page` to explicitly instruct printers to push this container on Page 2 */}
        <div className="closure-page-2 break-before-page bg-white pt-6 min-h-[900px] flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Header Report Page 2 */}
            <div className="flex justify-between items-center border-b-2 border-emerald-600 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-zinc-900">ภาคผนวกภาพถ่ายการทำงานประกอบรายงานสรุปโครงการ</h3>
                <p className="text-[10px] text-zinc-500 font-mono">ชื่อโครงการ: {project.name}</p>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">ภาคผนวกรูปภาพ</span>
            </div>

            {/* Photos Appendix List - Renders beautifully in rows and grids */}
            <div className="grid grid-cols-2 gap-6">
              {photos.length === 0 ? (
                <div className="col-span-2 text-center py-20 text-zinc-400 italic border border-dashed border-zinc-300 rounded-xl">
                  ยังไม่ได้ทำการแนบภาพขั้นตอนการปฏิบัติงานภาคสนาม (กรุณาอัปโหลดรูปในการจัดเตรียมฟอร์มรายงานด้านบน)
                </div>
              ) : (
                photos.map((p, idx) => (
                  <div key={`print-photo-${p.id}`} className="border border-zinc-300 rounded-xl overflow-hidden bg-white p-3 space-y-2 shadow-sm break-inside-avoid">
                    <div className="aspect-video bg-zinc-50 flex items-center justify-center border border-zinc-200 overflow-hidden rounded-lg">
                      <img src={p.url} alt={p.title} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                    </div>
                    <div className="text-xs space-y-1">
                      <h6 className="font-extrabold text-zinc-900 text-[11px] truncate flex items-center gap-1.5">
                        <span className="w-4 h-4 bg-emerald-100 text-emerald-800 text-[9px] rounded-full flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span>{p.title}</span>
                      </h6>
                      <p className="text-[10px] text-zinc-600 leading-normal font-sans bg-zinc-50 p-2 rounded border border-zinc-100 italic">
                        {p.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* Footer of Page 2 */}
          <div className="pt-8 border-t border-zinc-200 text-center text-xs text-zinc-400 font-mono">
            <p>หน้า 2/2 • รายละเอียดการแนบรูปภาพอ้างอิงความก้าวหน้าโครงการก่อสร้างและติดตั้ง</p>
            <p className="text-[9px] text-zinc-300 mt-1">เอกสารอ้างอิงทางกฎหมายและมาตรฐานวิศวกรรมClickDo</p>
          </div>
        </div>

      </div>

      {/* Embedded print style sheet to control margins and force page breaks */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          aside, nav, header, footer {
            display: none !important;
          }
          .msproject-report-preview {
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .closure-page-1 {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 100vh !important;
          }
          .break-before-page {
            page-break-before: always !important;
            break-before: page !important;
            margin-top: 50px !important;
          }
          .break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
