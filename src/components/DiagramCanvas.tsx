/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Pencil, Square, ArrowUpRight, Eraser, Trash2, Save, Download, RefreshCw } from 'lucide-react';

interface DiagramCanvasProps {
  initialData?: string; // base64 image URL or empty
  onSave: (dataUrl: string) => void;
  title: string;
}

export default function DiagramCanvas({ initialData, onSave, title }: DiagramCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tool, setTool] = useState<'pencil' | 'line' | 'rect' | 'eraser'>('pencil');
  const [color, setColor] = useState<string>('#10B981'); // Brand green default
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white or dark gray background
    ctx.fillStyle = '#ffffff'; // White background matching light theme
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines for engineering layout feel
    ctx.strokeStyle = '#e2e8f0'; // Light slate grid lines
    ctx.lineWidth = 1;
    const gridSize = 25;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Load initial data if present
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialData;
    }
  }, [initialData]);

  // Drawing mouse handlers
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Account for potential canvas scaling
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPos(pos);

    // Save current image state for shapes (undo-like behavior during drag)
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPos = getMousePos(e);

    if (tool === 'pencil' || tool === 'eraser') {
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.stroke();
    } else if (snapshot) {
      // For shapes, restore previous state first to avoid drawing trails
      ctx.putImageData(snapshot, 0, 0);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      if (tool === 'line') {
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
      } else if (tool === 'rect') {
        const width = currentPos.x - startPos.x;
        const height = currentPos.y - startPos.y;
        ctx.strokeRect(startPos.x, startPos.y, width, height);
      }
    }
  };

  const stopDraw = () => {
    setIsDrawing(false);
    setSnapshot(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Re-draw engineering grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    const gridSize = 25;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${title.replace(/\s+/g, '_')}_diagram.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div ref={containerRef} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-4">
      {/* Tool panel */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            id="btn-tool-pencil"
            type="button"
            onClick={() => setTool('pencil')}
            className={`p-2 rounded-md border transition-all ${
              tool === 'pencil'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'text-zinc-400 border-transparent hover:bg-zinc-800'
            }`}
            title="Pencil / Draw"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            id="btn-tool-line"
            type="button"
            onClick={() => setTool('line')}
            className={`p-2 rounded-md border transition-all ${
              tool === 'line'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'text-zinc-400 border-transparent hover:bg-zinc-800'
            }`}
            title="Draw Line"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <button
            id="btn-tool-rect"
            type="button"
            onClick={() => setTool('rect')}
            className={`p-2 rounded-md border transition-all ${
              tool === 'rect'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'text-zinc-400 border-transparent hover:bg-zinc-800'
            }`}
            title="Draw Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            id="btn-tool-eraser"
            type="button"
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-md border transition-all ${
              tool === 'eraser'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'text-zinc-400 border-transparent hover:bg-zinc-800'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Colors & Width */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400 font-medium">สี:</span>
            {[
              { hex: '#10B981', label: 'เขียวแบรนด์' },
              { hex: '#EAB308', label: 'เหลืองไฟ' },
              { hex: '#EF4444', label: 'แดงเตือน' },
              { hex: '#3B82F6', label: 'น้ำเงิน' },
              { hex: '#1E293B', label: 'เทาดำ' },
            ].map((colorItem) => (
              <button
                key={colorItem.hex}
                id={`btn-color-${colorItem.hex.replace('#', '')}`}
                type="button"
                onClick={() => {
                  setColor(colorItem.hex);
                  if (tool === 'eraser') setTool('pencil');
                }}
                className={`w-5 h-5 rounded-full border transition-all ${
                  color === colorItem.hex && tool !== 'eraser'
                    ? 'ring-2 ring-offset-1 ring-lime-500 scale-110 border-transparent'
                    : 'border-zinc-300 hover:scale-105'
                }`}
                style={{ backgroundColor: colorItem.hex }}
                title={colorItem.label}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">ขนาดเส้น:</span>
            <input
              id="input-line-width"
              type="range"
              min="1"
              max="15"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-16 accent-lime-500 cursor-pointer h-1 rounded"
            />
            <span className="text-xs text-zinc-400 w-4">{lineWidth}px</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-clear-canvas"
            type="button"
            onClick={clearCanvas}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-md transition-all"
            title="ล้างทั้งหมด"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ล้างบอร์ด</span>
          </button>
          <button
            id="btn-download-canvas"
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-md transition-all"
            title="บันทึกรูปภายนอก"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด</span>
          </button>
          <button
            id="btn-save-canvas"
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-md shadow-lg shadow-emerald-900/20 transition-all"
            title="บันทึกเข้าสู่โครงการ"
          >
            <Save className="w-3.5 h-3.5" />
            <span>บันทึกลงโครงการ</span>
          </button>
        </div>
      </div>

      {/* Canvas container with helper banner */}
      <div className="relative overflow-auto border border-zinc-800 rounded-lg bg-zinc-950 flex justify-center">
        <canvas
          id="drawing-canvas-board"
          ref={canvasRef}
          width={800}
          height={450}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          className="cursor-crosshair max-w-full block"
          style={{ width: '800px', height: '450px' }}
        />
        <div className="absolute bottom-2 left-2 bg-zinc-900/95 border border-zinc-800 text-[10px] text-zinc-400 px-2 py-1 rounded font-mono select-none">
          {tool === 'pencil' && 'โหมด: ดินสอ / วาดรูปอิสระ'}
          {tool === 'line' && 'โหมด: เส้นตรง (คลิกลาก)'}
          {tool === 'rect' && 'โหมด: สี่เหลี่ยม (คลิกลาก)'}
          {tool === 'eraser' && 'โหมด: ยางลบ'}
          {' | ความละเอียด 800x450px'}
        </div>
      </div>
    </div>
  );
}
