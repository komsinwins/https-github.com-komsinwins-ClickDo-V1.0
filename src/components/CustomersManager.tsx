/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, Project } from '../types';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Database, 
  RefreshCw, 
  FileText, 
  X, 
  Check, 
  ChevronRight,
  Sparkles,
  Info,
  LayoutGrid,
  List,
  Layers
} from 'lucide-react';

interface CustomersManagerProps {
  customers: Customer[];
  projects: Project[];
  onAddCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export default function CustomersManager({
  customers,
  projects,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
}: CustomersManagerProps) {
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<Customer | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'industry'>('grid');

  // Form Fields State
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [industry, setIndustry] = useState('');
  const [taxId, setTaxId] = useState('');
  const [notes, setNotes] = useState('');

  // Open Form for Adding
  const handleOpenAddForm = () => {
    setEditingCustomer(null);
    setCompanyName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setIndustry('อื่นๆ');
    setTaxId('');
    setNotes('');
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEditForm = (cust: Customer) => {
    setEditingCustomer(cust);
    setCompanyName(cust.companyName);
    setContactPerson(cust.contactPerson);
    setPhone(cust.phone);
    setEmail(cust.email);
    setAddress(cust.address);
    setIndustry(cust.industry);
    setTaxId(cust.taxId || '');
    setNotes(cust.notes || '');
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      alert('กรุณากรอกชื่อบริษัทลูกค้า');
      return;
    }

    const customerData: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      industry: industry,
      taxId: taxId.trim(),
      notes: notes.trim(),
    };

    if (editingCustomer) {
      onEditCustomer(customerData);
    } else {
      onAddCustomer(customerData);
    }
    setIsFormOpen(false);
    
    // update detail card if open
    if (selectedCustomerDetail && selectedCustomerDetail.id === customerData.id) {
      setSelectedCustomerDetail(customerData);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`คุณแน่ใจว่าต้องการลบข้อมูลลูกค้า "${name}" หรือไม่? ข้อมูลนี้จะถูกลบออกจากฐานข้อมูล!`)) {
      onDeleteCustomer(id);
      if (selectedCustomerDetail?.id === id) {
        setSelectedCustomerDetail(null);
      }
    }
  };

  // Industries list for filtering
  const industries = ['All', ...Array.from(new Set(customers.map((c) => c.industry))).filter(Boolean)];

  // Filtered customers
  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch = 
      cust.companyName.toLowerCase().includes(search.toLowerCase()) ||
      cust.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      cust.email.toLowerCase().includes(search.toLowerCase()) ||
      cust.phone.includes(search) ||
      (cust.taxId && cust.taxId.includes(search));

    const matchesIndustry = industryFilter === 'All' || cust.industry === industryFilter;

    return matchesSearch && matchesIndustry;
  });

  // Calculate projects owned by customer
  const getCustomerProjects = (custName: string) => {
    return projects.filter((p) => p.ownerName === custName);
  };

  return (
    <div className="space-y-6" id="customers-manager-container">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-lime-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-white font-display tracking-tight leading-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-lime-400" />
              ฐานข้อมูลลูกค้า
            </h2>
            <p className="text-xs text-zinc-400">
              จัดการประวัติและรายละเอียดข้อมูลบริษัทลูกค้า ผู้ประสานงาน และสถานะการชำระเงิน
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddForm}
              className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black text-xs font-bold rounded-lg shadow-md hover:shadow-lime-500/10 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มบริษัทลูกค้าใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: List and Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Customers Table/List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Bar */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4 shadow">
            <div className="flex-1 w-full relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="ค้นหาชื่อบริษัท, ผู้ติดต่อ, โทรศัพท์, เลขผู้เสียภาษี..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-zinc-700 bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-lime-500 focus:border-transparent font-sans"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <span className="text-zinc-500 text-xs shrink-0 font-medium">ประเภทธุรกิจ:</span>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="w-full sm:w-auto bg-zinc-950 text-white border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-lime-500 font-sans"
              >
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind === 'All' ? 'ทั้งหมด' : ind}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-900/40 border border-zinc-800/80 px-4 py-2.5 rounded-xl gap-3">
            <span className="text-zinc-400 text-xs font-medium">
              แสดงผลลัพธ์: <strong className="text-lime-400 font-mono font-bold text-sm">{filteredCustomers.length}</strong> บริษัท
            </span>
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-lime-500 text-black' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>มุมมองการ์ด</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table' 
                    ? 'bg-lime-500 text-black' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>มุมมองตาราง</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('industry')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'industry' 
                    ? 'bg-lime-500 text-black' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>จัดกลุ่มอุตสาหกรรม</span>
              </button>
            </div>
          </div>

          {/* Customers Content based on View Mode */}
          {filteredCustomers.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-12 text-center">
              <p className="text-sm text-zinc-500 font-sans">ไม่พบข้อมูลลูกค้าตามเงื่อนไขค้นหา</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCustomers.map((cust) => {
                const customerProjects = getCustomerProjects(cust.companyName);
                const isSelected = selectedCustomerDetail?.id === cust.id;

                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerDetail(cust)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-full group ${
                      isSelected
                        ? 'bg-zinc-900 border-lime-500/50 shadow-lg shadow-lime-500/5'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <div>
                      {/* Company Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[9px] font-bold text-lime-400 bg-lime-400/10 border border-lime-500/20 px-2 py-0.5 rounded uppercase tracking-wide">
                            {cust.industry}
                          </span>
                          <h3 className="text-sm font-bold text-white font-display mt-1.5 group-hover:text-lime-400 transition-colors">
                            {cust.companyName}
                          </h3>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${isSelected ? 'translate-x-1 text-lime-400' : 'group-hover:translate-x-0.5'}`} />
                      </div>

                      {/* Contact Person */}
                      <div className="space-y-1 mt-3">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <User className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                          <span className="truncate">{cust.contactPerson}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <Phone className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                          <span>{cust.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Projects & Action Panel */}
                    <div className="border-t border-zinc-850/80 mt-4 pt-3 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        โครงการในการดูแล: <strong className="text-white">{customerProjects.length} โครงการ</strong>
                      </span>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEditForm(cust)}
                          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          title="แก้ไขข้อมูลลูกค้า"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cust.id, cust.companyName)}
                          className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          title="ลบลูกค้า"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-950 text-[10px] font-black text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                      <th className="p-3.5">ชื่อบริษัทลูกค้า</th>
                      <th className="p-3.5">ประเภทธุรกิจ</th>
                      <th className="p-3.5">ผู้ติดต่อ / โทรศัพท์</th>
                      <th className="p-3.5 text-center">โครงการ</th>
                      <th className="p-3.5 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {filteredCustomers.map((cust) => {
                      const customerProjects = getCustomerProjects(cust.companyName);
                      const isSelected = selectedCustomerDetail?.id === cust.id;
                      return (
                        <tr 
                          key={cust.id}
                          onClick={() => setSelectedCustomerDetail(cust)}
                          className={`hover:bg-zinc-850/40 cursor-pointer transition-colors text-xs ${isSelected ? 'bg-lime-500/5 text-white font-medium' : 'text-zinc-300'}`}
                        >
                          <td className="p-3.5">
                            <div className="font-bold text-white hover:text-lime-400 transition-colors">{cust.companyName}</div>
                            {cust.taxId && <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Tax ID: {cust.taxId}</div>}
                          </td>
                          <td className="p-3.5">
                            <span className="text-[10px] font-bold text-lime-400 bg-lime-400/10 border border-lime-500/20 px-2 py-0.5 rounded">
                              {cust.industry}
                            </span>
                          </td>
                          <td className="p-3.5 space-y-0.5">
                            <div className="flex items-center gap-1.5 text-zinc-300">
                              <User className="w-3 h-3 text-zinc-500" />
                              <span>{cust.contactPerson || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-zinc-500" />
                              <span>{cust.phone || '-'}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-center font-bold text-sm text-white font-mono">
                            {customerProjects.length}
                          </td>
                          <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditForm(cust)}
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                title="แก้ไขข้อมูลลูกค้า"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(cust.id, cust.companyName)}
                                className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                title="ลบลูกค้า"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(new Set(filteredCustomers.map(c => c.industry)))
                .filter(Boolean)
                .map((ind) => {
                  const industryCusts = filteredCustomers.filter(c => c.industry === ind);
                  return (
                    <div key={ind} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow">
                      {/* Industry Header Banner */}
                      <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-lime-400" />
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">{ind}</h4>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-850 px-2 py-0.5 rounded-full font-mono">
                          {industryCusts.length} บริษัท
                        </span>
                      </div>

                      {/* Customer list in this industry */}
                      <div className="divide-y divide-zinc-850">
                        {industryCusts.map((cust) => {
                          const customerProjects = getCustomerProjects(cust.companyName);
                          const isSelected = selectedCustomerDetail?.id === cust.id;
                          return (
                            <div
                              key={cust.id}
                              onClick={() => setSelectedCustomerDetail(cust)}
                              className={`p-3.5 cursor-pointer transition-all flex items-center justify-between gap-4 hover:bg-zinc-850/30 ${
                                isSelected ? 'bg-lime-500/5' : ''
                              }`}
                            >
                              <div className="space-y-1 min-w-0 flex-1">
                                <h5 className="text-xs font-bold text-white truncate hover:text-lime-400 transition-colors">
                                  {cust.companyName}
                                </h5>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-400">
                                  <span className="flex items-center gap-1.5 min-w-0">
                                    <User className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                                    <span className="truncate">{cust.contactPerson || '-'}</span>
                                  </span>
                                  <span className="flex items-center gap-1.5 font-mono">
                                    <Phone className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                                    <span>{cust.phone || '-'}</span>
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[10px] text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 font-mono">
                                  {customerProjects.length} โครงการ
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenEditForm(cust)}
                                    className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                    title="แก้ไขข้อมูลลูกค้า"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(cust.id, cust.companyName)}
                                    className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                    title="ลบลูกค้า"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Right 1 Column: Customer Details Side Panel */}
        <div className="space-y-4">
          {selectedCustomerDetail ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5 shadow-lg sticky top-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-lime-400" />
                  รายละเอียดบริษัทลูกค้า
                </h3>
                <button
                  onClick={() => setSelectedCustomerDetail(null)}
                  className="p-1 text-zinc-400 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Company Profile Details */}
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">ชื่อบริษัท</span>
                  <p className="text-sm font-black text-white mt-0.5 leading-tight">{selectedCustomerDetail.companyName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">ประเภทอุตสาหกรรม</span>
                    <p className="text-xs font-semibold text-lime-400 mt-0.5">{selectedCustomerDetail.industry}</p>
                  </div>
                  {selectedCustomerDetail.taxId && (
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">เลขประจำตัวผู้เสียภาษี</span>
                      <p className="text-xs font-mono text-zinc-300 mt-0.5">{selectedCustomerDetail.taxId}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-800 pt-3 space-y-2.5">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">ข้อมูลติดต่อส่วนบุคคล</span>
                  
                  <div className="flex items-start gap-2 text-xs">
                    <User className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-zinc-200">{selectedCustomerDetail.contactPerson}</p>
                      <p className="text-[10px] text-zinc-500">ผู้ประสานงานหลัก</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span>{selectedCustomerDetail.phone}</span>
                  </div>

                  {selectedCustomerDetail.email && (
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                      <a href={`mailto:${selectedCustomerDetail.email}`} className="hover:underline text-lime-400 truncate">
                        {selectedCustomerDetail.email}
                      </a>
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-800 pt-3">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">ที่อยู่จดทะเบียน</span>
                  <div className="flex gap-2 text-xs text-zinc-400 bg-zinc-950 p-2.5 rounded-lg border border-zinc-850 leading-relaxed">
                    <MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                    <span>{selectedCustomerDetail.address || 'ไม่ได้ระบุที่อยู่'}</span>
                  </div>
                </div>

                {selectedCustomerDetail.notes && (
                  <div className="border-t border-zinc-800 pt-3">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">บันทึกเพิ่มเติม</span>
                    <p className="text-xs text-zinc-400 bg-zinc-950/40 border border-zinc-850 p-2.5 rounded-lg italic">
                      "{selectedCustomerDetail.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Linked Projects Section */}
              <div className="border-t border-zinc-800 pt-4 space-y-2.5">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">
                  โครงการที่เกี่ยวโยง ({getCustomerProjects(selectedCustomerDetail.companyName).length})
                </span>

                {getCustomerProjects(selectedCustomerDetail.companyName).length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">ไม่มีโครงการติดตั้งที่กำลังรันในขณะนี้</p>
                ) : (
                  <div className="space-y-2">
                    {getCustomerProjects(selectedCustomerDetail.companyName).map((proj) => (
                      <div key={proj.id} className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] bg-lime-500/10 text-lime-400 px-1.5 py-0.5 rounded border border-lime-500/20 font-bold uppercase">
                            {proj.status === 'Active' ? 'กำลังดำเนินการ' : proj.status}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono">{proj.startDate}</span>
                        </div>
                        <p className="text-xs font-bold text-white truncate">{proj.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">📍 {proj.installationSite}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Section */}
              <div className="border-t border-zinc-800 pt-4 flex gap-2">
                <button
                  onClick={() => handleOpenEditForm(selectedCustomerDetail)}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>แก้ไขข้อมูล</span>
                </button>
                <button
                  onClick={() => handleDelete(selectedCustomerDetail.id, selectedCustomerDetail.companyName)}
                  className="py-2 px-3 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/20 text-rose-400 text-xs font-bold rounded-lg transition-all"
                  title="ลบจากฐานข้อมูล"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/40 border border-zinc-900 border-dashed rounded-xl p-8 text-center text-zinc-500 text-xs space-y-2">
              <Building2 className="w-8 h-8 text-zinc-700 mx-auto" />
              <p>เลือกบริษัทลูกค้าเพื่อดูข้อมูลประวัติโดยละเอียด โครงการเชื่อมโยง และจัดเก็บเอกสารสัญญาอย่างเป็นระบบ</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Form Modal Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-lime-400" />
                <h3 className="text-lg font-bold text-white font-display">
                  {editingCustomer ? 'แก้ไขข้อมูลบริษัทลูกค้า' : 'เพิ่มบริษัทลูกค้าใหม่'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
              {/* Company Name */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">ชื่อบริษัท (ไทย/อังกฤษ) *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น บริษัท อมตะ ยูทิลิตี้ส์ จำกัด (มหาชน)"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-zinc-950 text-white border border-zinc-750 focus:border-lime-500 rounded-lg p-2.5 text-xs focus:outline-none font-sans"
                />
              </div>

              {!editingCustomer && (
                <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-lg text-[11px] text-zinc-400 flex items-start gap-2">
                  <span className="text-lime-400 font-bold font-sans">💡 ทิป:</span>
                  <span>คุณสามารถแก้ไข เพื่อกรอกประเภทธุรกิจ ผู้ติดต่อ เบอร์โทรศัพท์ และที่อยู่ผู้ว่าจ้างเพิ่มเติมได้หลังจากบันทึกรายชื่อบริษัทแล้ว</span>
                </div>
              )}

              {editingCustomer && (
                <>
                  {/* Industry & Tax ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">ประเภทธุรกิจ / อุตสาหกรรม</label>
                      <select
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full bg-zinc-950 text-white border border-zinc-750 focus:border-lime-500 rounded-lg p-2.5 text-xs focus:outline-none"
                      >
                        <option value="พลังงานและสาธารณูปโภค">พลังงานและสาธารณูปโภค</option>
                        <option value="อาหารและเครื่องดื่ม">อาหารและเครื่องดื่ม</option>
                        <option value="ยานยนต์ / ชิ้นส่วนอะไหล่">ยานยนต์ / ชิ้นส่วนอะไหล่</option>
                        <option value="อสังหาริมทรัพย์และก่อสร้าง">อสังหาริมทรัพย์และก่อสร้าง</option>
                        <option value="ค้าปลีก / บริการ">ค้าปลีก / บริการ</option>
                        <option value="อุตสาหกรรมหนัก / ผลิตภัณฑ์โลหะ">อุตสาหกรรมหนัก / ผลิตภัณฑ์โลหะ</option>
                        <option value="อื่นๆ">อื่นๆ</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                      <input
                        type="text"
                        maxLength={13}
                        placeholder="เช่น 0107555000123"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        className="w-full bg-zinc-950 text-white border border-zinc-750 focus:border-lime-500 rounded-lg p-2.5 text-xs focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Contact Person Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">ผู้ประสานงานหลัก (ชื่อ-นามสกุล / ตำแหน่ง)</label>
                    <input
                      type="text"
                      placeholder="เช่น คุณกฤษณะ วรพจน์ (ผู้จัดการฝ่ายจัดซื้อ)"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full bg-zinc-950 text-white border border-zinc-750 focus:border-lime-500 rounded-lg p-2.5 text-xs focus:outline-none"
                    />
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">เบอร์โทรศัพท์ติดต่อ</label>
                      <input
                        type="text"
                        placeholder="เช่น 081-234-5678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-zinc-950 text-white border border-zinc-750 focus:border-lime-500 rounded-lg p-2.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">อีเมลติดต่อ</label>
                      <input
                        type="email"
                        placeholder="เช่น contact@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-zinc-950 text-white border border-zinc-750 focus:border-lime-500 rounded-lg p-2.5 text-xs focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">ที่อยู่ตามใบจดทะเบียนการค้า</label>
                    <textarea
                      rows={2}
                      placeholder="ระบุบ้านเลขที่ ถนน แขวง เขต จังหวัด รหัสไปรษณีย์..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-zinc-950 text-white border border-zinc-750 focus:border-lime-500 rounded-lg p-2.5 text-xs focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">หมายเหตุเพิ่มเติม</label>
                    <textarea
                      rows={2}
                      placeholder="เช่น ประวัติงานติดตั้งเดิม หรือสถานะพิเศษ..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-zinc-950 text-white border border-zinc-750 focus:border-lime-500 rounded-lg p-2.5 text-xs focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-bold rounded-lg border border-zinc-700 transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-lime-500 hover:bg-lime-400 text-black text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
                >
                  {editingCustomer ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลลูกค้า'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
