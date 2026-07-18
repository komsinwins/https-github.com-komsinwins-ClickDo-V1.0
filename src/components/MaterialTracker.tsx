/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, OrderItem } from '../types';
import { ShoppingCart, Plus, Trash2, Edit3, CheckCircle, PackageOpen, Tag, Info, Check, RefreshCw, BarChart2 } from 'lucide-react';

interface MaterialTrackerProps {
  project: Project;
  onUpdateOrders: (orders: OrderItem[]) => void;
  onCloseProject?: () => void; // Callback to toggle project status to Closed
}

export default function MaterialTracker({ project, onUpdateOrders, onCloseProject }: MaterialTrackerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [itemName, setItemName] = useState('');
  const [sku, setSku] = useState('');
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [supplier, setSupplier] = useState('');
  const [status, setStatus] = useState<OrderItem['status']>('Draft');

  const resetForm = () => {
    setItemName('');
    setSku('');
    setQty(1);
    setUnitPrice(0);
    setSupplier('');
    setStatus('Draft');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAdding(true);
    setEditingId(null);
  };

  const handleOpenEdit = (item: OrderItem) => {
    setItemName(item.itemName);
    setSku(item.sku || '');
    setQty(item.qty);
    setUnitPrice(item.unitPrice);
    setSupplier(item.supplier || '');
    setStatus(item.status);
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('ยืนยันลบรายการสั่งซื้อวัสดุนี้?')) {
      const updated = project.orders.filter((item) => item.id !== id);
      onUpdateOrders(updated);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || qty <= 0) return;

    if (editingId) {
      const updated = project.orders.map((item) => {
        if (item.id === editingId) {
          return {
            ...item,
            itemName,
            sku,
            qty,
            unitPrice,
            supplier,
            status,
          };
        }
        return item;
      });
      onUpdateOrders(updated);
    } else {
      const newItem: OrderItem = {
        id: `ord-${Date.now()}`,
        itemName,
        sku,
        qty,
        unitPrice,
        supplier,
        status,
      };
      onUpdateOrders([...project.orders, newItem]);
    }

    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };

  // Calculations
  const ordersList = project.orders || [];
  const totalMaterialCost = ordersList.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const totalDeliveredCost = ordersList
    .filter((i) => i.status === 'Delivered')
    .reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  const totalItemsCount = ordersList.reduce((sum, item) => sum + item.qty, 0);
  const deliveredItemsCount = ordersList
    .filter((i) => i.status === 'Delivered')
    .reduce((sum, item) => sum + item.qty, 0);

  // Subcontractor wages cost
  const contractorWage = project.contractor?.totalWage || 0;
  const projectTotalExpense = totalMaterialCost + contractorWage;

  return (
    <div className="space-y-6">
      {/* Visual Header card */}
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-bold text-white text-base">รายการจัดซื้อและวัสดุอุปกรณ์</h3>
            <p className="text-xs text-zinc-400">สั่งรายการวัสดุ ครุภัณฑ์ คลุมราคาค่าของสรุปงบประมาณตอนสิ้นสุดโครงการ</p>
          </div>
        </div>

        <button
          id="btn-add-order-item"
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-black font-extrabold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มใบสั่งของ / อุปกรณ์</span>
        </button>
      </div>

      {/* Adding/Editing inline form */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h4 className="font-bold text-white text-sm">
              {editingId ? 'แก้ไขรายการสั่งของ' : 'เพิ่มสินค้าและวัสดุลงใบสั่งของโครงการ'}
            </h4>
            <button
              id="btn-close-order-form"
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-zinc-500 hover:text-white text-xs font-medium"
            >
              ปิด
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="ord-name" className="block text-xs font-semibold text-zinc-400 mb-1">
                ชื่อวัสดุ / อุปกรณ์หลัก *
              </label>
              <input
                id="ord-name"
                type="text"
                required
                placeholder="เช่น แผงโซลาร์เซลล์, ท่อ EMT, ตู้เหล็กควบคุมสวิทช์บอร์ด"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="ord-sku" className="block text-xs font-semibold text-zinc-400 mb-1">
                รุ่น / รหัสสินค้า (SKU/Model)
              </label>
              <input
                id="ord-sku"
                type="text"
                placeholder="เช่น SUN2000-100KTL"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="ord-qty" className="block text-xs font-semibold text-zinc-400 mb-1">
                จำนวน (Quantity) *
              </label>
              <input
                id="ord-qty"
                type="number"
                min="1"
                required
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label htmlFor="ord-price" className="block text-xs font-semibold text-zinc-400 mb-1">
                ราคาต่อหน่วย (บาท) *
              </label>
              <input
                id="ord-price"
                type="number"
                min="0"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lime-500 font-mono"
              />
            </div>

            <div>
              <label htmlFor="ord-supplier" className="block text-xs font-semibold text-zinc-400 mb-1">
                ร้านค้า / ซัพพลายเออร์ผู้จัดส่ง
              </label>
              <input
                id="ord-supplier"
                type="text"
                placeholder="ชื่อบริษัทหรือร้านวัสดุ"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-750 text-sm focus:outline-none focus:border-lime-500"
              />
            </div>

            <div>
              <label htmlFor="ord-status" className="block text-xs font-semibold text-zinc-400 mb-1">
                สถานะการสั่งของ
              </label>
              <select
                id="ord-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lime-500"
              >
                <option value="Draft">ร่างเอกสาร (Draft)</option>
                <option value="Ordered">ส่งใบสั่งซื้อไปแล้ว (Ordered)</option>
                <option value="Delivered">ได้รับสินค้าเรียบร้อย (Delivered)</option>
                <option value="Cancelled">ยกเลิกรายการ (Cancelled)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              id="btn-form-ord-cancel"
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold rounded-md transition-all"
            >
              ยกเลิก
            </button>
            <button
              id="btn-form-ord-save"
              type="submit"
              className="px-4 py-1.5 bg-lime-500 hover:bg-lime-400 text-black font-extrabold text-xs rounded-md transition-all flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>บันทึกสินค้า</span>
            </button>
          </div>
        </form>
      )}

      {/* Materials Table list */}
      <div className="overflow-x-auto bg-zinc-900/60 border border-zinc-800 rounded-xl">
        <table className="w-full text-left text-sm text-zinc-300 border-collapse">
          <thead>
            <tr className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 font-medium text-xs tracking-wider uppercase">
              <th className="py-3 px-4">ชื่อสินค้า/โมเดล/ผู้ผลิต</th>
              <th className="py-3 px-4">ผู้จัดส่ง</th>
              <th className="py-3 px-4 text-right">จำนวน</th>
              <th className="py-3 px-4 text-right">ราคาหน่วย (฿)</th>
              <th className="py-3 px-4 text-right">รวมเงิน (฿)</th>
              <th className="py-3 px-4">สถานะส่งของ</th>
              <th className="py-3 px-4 text-right no-print">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {ordersList.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-zinc-500 italic font-mono text-xs">
                  ยังไม่มีการทำรายการวัสดุและอุปกรณ์ที่สั่งในโครงการนี้
                </td>
              </tr>
            ) : (
              ordersList.map((item) => (
                <tr key={item.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-sm">{item.itemName}</div>
                    {item.sku && <div className="text-[10px] text-zinc-500 font-mono mt-0.5">M/N: {item.sku}</div>}
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-zinc-400">
                    {item.supplier || '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-zinc-300">{item.qty}</td>
                  <td className="py-3 px-4 text-right font-mono text-zinc-400">
                    {item.unitPrice.toLocaleString('th-TH')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-white">
                    {(item.qty * item.unitPrice).toLocaleString('th-TH')}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.status === 'Delivered'
                          ? 'bg-lime-500/15 text-lime-400 border-lime-500/25'
                          : item.status === 'Ordered'
                          ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25'
                          : item.status === 'Draft'
                          ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/25'
                      }`}
                    >
                      {item.status === 'Delivered'
                        ? 'รับของแล้ว'
                        : item.status === 'Ordered'
                        ? 'สั่งของแล้ว'
                        : item.status === 'Draft'
                        ? 'ร่างจัดซื้อ'
                        : 'ยกเลิก'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right no-print">
                    <div className="inline-flex gap-1">
                      <button
                        id={`btn-edit-order-${item.id}`}
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-lime-400 transition-colors"
                        title="แก้ไขสินค้า"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`btn-delete-order-${item.id}`}
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-rose-400 transition-colors"
                        title="ลบ"
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

      {/* Project Closure Report - Requirement 6 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-yellow-400" />
            <h4 className="font-bold text-white text-sm md:text-base font-display">สรุปวิเคราะห์งบประมาณและปิดโครงการ (Project Closure Report)</h4>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">สถานะปัจจุบัน: {project.status === 'Closed' ? 'ปิดโครงการแล้ว' : 'เปิดงานอยู่'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-850 space-y-2">
            <span className="text-zinc-500 font-semibold uppercase block">งบค่าของ (Bill of Materials)</span>
            <div className="font-mono text-lg font-black text-white">
              ฿{totalMaterialCost.toLocaleString('th-TH')}
            </div>
            <div className="text-zinc-500">
              รับอุปกรณ์แล้ว {deliveredItemsCount} จากทั้งหมด {totalItemsCount} ชิ้น ({totalItemsCount > 0 ? Math.round((deliveredItemsCount / totalItemsCount) * 100) : 0}%)
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-850 space-y-2">
            <span className="text-zinc-500 font-semibold uppercase block">งบค่าจ้างรับเหมาติดตั้ง</span>
            <div className="font-mono text-lg font-black text-white">
              ฿{contractorWage.toLocaleString('th-TH')}
            </div>
            <div className="text-zinc-500">
              จ่ายตามงวดชำระแล้ว: ฿{(project.contractor?.installments || []).filter(i => i.status === 'Paid').reduce((sum, curr) => sum + curr.amount, 0).toLocaleString('th-TH')}
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-850 space-y-2">
            <span className="text-zinc-500 font-semibold uppercase block">รวมงบลงทุนจริงสุทธิ (Total Spending)</span>
            <div className="font-mono text-xl font-extrabold text-lime-400">
              ฿{projectTotalExpense.toLocaleString('th-TH')}
            </div>
            <div className="text-zinc-500">
              ค่าสัญญางานเฉลี่ยรายวัน: ฿{project.durationDays > 0 ? Math.round(projectTotalExpense / project.durationDays).toLocaleString('th-TH') : 0} / วัน
            </div>
          </div>
        </div>

        {/* Closing Action panel */}
        <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-850 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-white block">สรุปเกณฑ์ตอนปิดโครงการ (Project Close-out Audit):</span>
            <p className="text-zinc-400">
              {project.status === 'Closed'
                ? 'โครงการนี้ได้รับการอนุมัติ ปิดระบบประเมินราคารวม และส่งมอบให้เจ้าของงาน (Owners) เรียบร้อยแล้ว'
                : 'ตรวจสอบพัสดุครบ สัญญาจ้างชำระครบ ถือว่าสามารถปิดโครงการประเมินต้นทุนสินค้าขั้นสุดท้ายได้'}
            </p>
          </div>

          {project.status !== 'Closed' && onCloseProject && (
            <button
              id="btn-trigger-close-project"
              type="button"
              onClick={() => {
                if (confirm('คุณต้องการทำการปิดโครงการ (Close Project) และส่งออกใบสรุปผลประเมินงบประมาณหรือไม่?')) {
                  onCloseProject();
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-extrabold rounded-lg shadow-lg shadow-yellow-950/20 transition-all uppercase font-mono tracking-wider"
            >
              คลิกปิดโครงการถาวร
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
