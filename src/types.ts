/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  phone?: string;
  email?: string;
  lineId?: string;
}

export interface Worker {
  id: string;
  name: string;
  position?: string;
}

export interface PaymentMilestone {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  status: 'Unpaid' | 'Paid';
}

export interface ContractorInfo {
  teamName: string;
  foremanName: string;
  phone?: string;
  workers: Worker[];
  totalWage: number;
  installments: PaymentMilestone[];
}

export interface SOWSubTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  progress: number; // 0 to 100
  status: 'Not Started' | 'In Progress' | 'Completed';
}

export interface SOWItem {
  id: string;
  taskName: string;
  description: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number; // 0 to 100
  startDate: string;
  endDate: string;
  assignee: string;
  subTasks?: SOWSubTask[];
}

export interface OrderItem {
  id: string;
  itemName: string;
  sku: string;
  qty: number;
  unitPrice: number;
  supplier: string;
  status: 'Draft' | 'Ordered' | 'Delivered' | 'Cancelled';
}

export interface Diagram {
  id: string;
  title: string;
  type: 'Placement' | 'Connection' | 'Other';
  canvasData?: string; // JSON drawing operations
  imageUrl?: string; // Uploaded or sketch
}

export interface ReportLog {
  id: string;
  type: 'Daily' | 'Weekly';
  date: string;
  weekRange?: string; // "Week 1 (10 Jul - 16 Jul)" etc.
  title: string;
  details: string;
  issues?: string;
  solutions?: string;
  nextSteps?: string;
  photos: string[]; // Base64 strings of uploaded photos
  photoCaptions?: string[]; // Captions corresponding to each photo
  reporter: string;
}

export interface ProjectDocument {
  id: string;
  title: string;
  type: 'Contract' | 'Quotation' | 'Invoice' | 'Drawings' | 'Handover' | 'Other';
  fileName: string;
  fileSize?: string;
  fileData?: string; // Base64
  url?: string;
  uploadedAt: string;
}

export interface Project {
  id: string;
  name: string;
  status: string;
  installationSite: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  contractEndDate?: string;
  closeDate?: string;
  ownerName: string;
  partnerCompany: string;
  salesPerson: string;
  projectManager: string;
  poNumber?: string;
  contacts: Contact[];
  contractor: ContractorInfo;
  scopesOfWork: SOWItem[];
  orders: OrderItem[];
  diagrams: Diagram[];
  reports: ReportLog[];
  documents: ProjectDocument[];
  closureReport?: ClosureReport;
}

export interface ClosurePhoto {
  id: string;
  url: string;
  title: string;
  description: string;
}

export interface ClosureReport {
  steps: string;
  summary: string;
  showSchedule: boolean;
  photos: ClosurePhoto[];
  problemsAndSolutions?: string;
  remarks?: string;
}

export interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  industry: string;
  taxId?: string;
  notes?: string;
}

