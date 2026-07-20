/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Project, Contact, ContractorInfo, SOWItem, OrderItem, Diagram, ReportLog, ProjectDocument, Customer } from './types';
import { INITIAL_PROJECTS, DEFAULT_POSITIONS, DEFAULT_SALESPEOPLE, DEFAULT_PROJECT_MANAGERS, DEFAULT_STATUSES, INITIAL_CUSTOMERS } from './initialData';
import { localDb } from './dbLocal';




// Subcomponents
import DashboardOverview from './components/DashboardOverview';
import ProjectDetailsForm from './components/ProjectDetailsForm';
import ScopeOfWorkManager from './components/ScopeOfWorkManager';
import DiagramCanvas from './components/DiagramCanvas';
import ContactsManager from './components/ContactsManager';
import ContractorManager from './components/ContractorManager';
import MaterialTracker from './components/MaterialTracker';
import ReportsManager from './components/ReportsManager';
import DocumentsManager from './components/DocumentsManager';
import SOWCalendar from './components/SOWCalendar';
import CustomersManager from './components/CustomersManager';


import {
  FolderKanban,
  Activity,
  Calendar,
  Layers,
  MapPin,
  ClipboardList,
  Compass,
  Users,
  HardHat,
  ShoppingBag,
  FileImage,
  FolderDot,
  FileText,
  Trash2,
  ChevronLeft,
  ArrowRight,
  Plus,
  TrendingUp,
  LayoutDashboard,
  Database,
  RefreshCw,
  Wifi,
  WifiOff,
  Settings2,
  Building2,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [positions, setPositions] = useState<string[]>(DEFAULT_POSITIONS);
  const [salesPeople, setSalesPeople] = useState<string[]>([]);
  const [projectManagers, setProjectManagers] = useState<string[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<string[]>([]);

  // View state: 'dashboard' | 'create_project' | 'edit_project' | 'project_workspace'
  const [view, setView] = useState<'dashboard' | 'create_project' | 'edit_project' | 'project_workspace'>('dashboard');

  // Subtab for project workspace
  const [workspaceTab, setWorkspaceTab] = useState<'details' | 'sow' | 'calendar' | 'diagrams' | 'contacts' | 'contractor' | 'orders' | 'reports' | 'documents'>('details');

  // Diagram drawer states
  const [activeCanvasDiagram, setActiveCanvasDiagram] = useState<Diagram | null>(null);
  const [canvasTitle, setCanvasTitle] = useState('');
  const [canvasType, setCanvasType] = useState<'Placement' | 'Connection' | 'Other'>('Placement');

  // Load state on mount
  useEffect(() => {
    const initData = async () => {
      // 1. Projects
      let loadedProjects = await localDb.get<Project[]>('clickdo_projects');
      if (!loadedProjects) {
        const storedProjects = localStorage.getItem('clickdo_projects');
        if (storedProjects) {
          try {
            loadedProjects = JSON.parse(storedProjects);
          } catch (e) {
            loadedProjects = INITIAL_PROJECTS;
          }
        } else {
          loadedProjects = INITIAL_PROJECTS;
        }
        await localDb.set('clickdo_projects', loadedProjects);
      }
      setProjects(loadedProjects);

      // 2. Positions
      let loadedPositions = await localDb.get<string[]>('clickdo_positions');
      if (!loadedPositions) {
        const storedPositions = localStorage.getItem('clickdo_positions');
        if (storedPositions) {
          try {
            loadedPositions = JSON.parse(storedPositions);
          } catch (e) {
            loadedPositions = DEFAULT_POSITIONS;
          }
        } else {
          loadedPositions = DEFAULT_POSITIONS;
        }
        await localDb.set('clickdo_positions', loadedPositions);
      }
      setPositions(loadedPositions);

      // 3. Salespeople
      let loadedSalesPeople = await localDb.get<string[]>('clickdo_salespeople');
      if (!loadedSalesPeople) {
        const storedSalesPeople = localStorage.getItem('clickdo_salespeople');
        if (storedSalesPeople) {
          try {
            loadedSalesPeople = JSON.parse(storedSalesPeople);
          } catch (e) {
            loadedSalesPeople = DEFAULT_SALESPEOPLE;
          }
        } else {
          loadedSalesPeople = DEFAULT_SALESPEOPLE;
        }
        await localDb.set('clickdo_salespeople', loadedSalesPeople);
      }
      setSalesPeople(loadedSalesPeople);

      // 4. Project Managers
      let loadedPMs = await localDb.get<string[]>('clickdo_pms');
      if (!loadedPMs) {
        const storedPMs = localStorage.getItem('clickdo_pms');
        if (storedPMs) {
          try {
            loadedPMs = JSON.parse(storedPMs);
          } catch (e) {
            loadedPMs = DEFAULT_PROJECT_MANAGERS;
          }
        } else {
          loadedPMs = DEFAULT_PROJECT_MANAGERS;
        }
        await localDb.set('clickdo_pms', loadedPMs);
      }
      setProjectManagers(loadedPMs);

      // 5. Project Statuses
      let loadedStatuses = await localDb.get<string[]>('clickdo_statuses');
      if (!loadedStatuses) {
        const storedStatuses = localStorage.getItem('clickdo_statuses');
        if (storedStatuses) {
          try {
            loadedStatuses = JSON.parse(storedStatuses);
          } catch (e) {
            loadedStatuses = DEFAULT_STATUSES;
          }
        } else {
          loadedStatuses = DEFAULT_STATUSES;
        }
        await localDb.set('clickdo_statuses', loadedStatuses);
      }
      setProjectStatuses(loadedStatuses);

      // 6. Customers
      let loadedCustomers = await localDb.get<Customer[]>('clickdo_customers');
      if (!loadedCustomers) {
        const storedCustomers = localStorage.getItem('clickdo_customers');
        if (storedCustomers) {
          try {
            loadedCustomers = JSON.parse(storedCustomers);
          } catch (e) {
            loadedCustomers = INITIAL_CUSTOMERS;
          }
        } else {
          loadedCustomers = INITIAL_CUSTOMERS;
        }
        await localDb.set('clickdo_customers', loadedCustomers);
      }
      setCustomers(loadedCustomers);
    };

    initData();
  }, []);

  // Save projects helper
  const saveProjects = async (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    await localDb.set('clickdo_projects', updatedProjects);
    // Keep selected project synced
    if (selectedProject) {
      const synced = updatedProjects.find((p) => p.id === selectedProject.id);
      if (synced) {
        setSelectedProject(synced);
      }
    }
  };

  // Save custom positions
  const handleUpdatePositions = async (updatedPositions: string[]) => {
    setPositions(updatedPositions);
    await localDb.set('clickdo_positions', updatedPositions);
  };

  const handleUpdateSalesPeople = async (updated: string[]) => {
    setSalesPeople(updated);
    await localDb.set('clickdo_salespeople', updated);
  };

  const handleUpdateProjectManagers = async (updated: string[]) => {
    setProjectManagers(updated);
    await localDb.set('clickdo_pms', updated);
  };

  const handleUpdateProjectStatuses = async (updated: string[]) => {
    setProjectStatuses(updated);
    await localDb.set('clickdo_statuses', updated);
  };

  // Create Project Callback
  const handleCreateProject = (projectData: Partial<Project>) => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: projectData.name || 'Unnamed Project',
      status: projectData.status || 'Active',
      installationSite: projectData.installationSite || '',
      startDate: projectData.startDate || '',
      endDate: projectData.endDate || '',
      durationDays: projectData.durationDays || 0,
      contractEndDate: projectData.contractEndDate || '',
      closeDate: projectData.closeDate || '',
      ownerName: projectData.ownerName || '',
      partnerCompany: projectData.partnerCompany || '',
      salesPerson: projectData.salesPerson || '',
      projectManager: projectData.projectManager || '',
      contacts: [],
      contractor: {
        teamName: '',
        foremanName: '',
        workers: [],
        totalWage: 0,
        installments: [],
      },
      scopesOfWork: [],
      orders: [],
      diagrams: [],
      reports: [],
      documents: [],
    };

    const updated = [...projects, newProj];
    saveProjects(updated);
    setSelectedProject(newProj);
    setView('project_workspace');
    setWorkspaceTab('details');
  };

  // Edit Project Callback
  const handleEditProject = (projectData: Partial<Project>) => {
    if (!selectedProject) return;

    const updated = projects.map((p) => {
      if (p.id === selectedProject.id) {
        return {
          ...p,
          ...projectData,
        };
      }
      return p;
    });

    saveProjects(updated);
    setView('project_workspace');
  };

  // Delete Project Callback
  const handleDeleteProject = (id: string) => {
    if (confirm('คำเตือน: คุณแน่ใจว่าต้องการลบโครงการนี้หรือไม่? ข้อมูลประวัติการติดตั้ง รายงาน และไดอะแกรมทั้งหมดจะสูญหายอย่างถาวร!')) {
      const updated = projects.filter((p) => p.id !== id);
      saveProjects(updated);
      setSelectedProject(null);
      setView('dashboard');
    }
  };

  // Close Project Closure Summary Callback
  const handleCloseProjectStatus = () => {
    if (!selectedProject) return;
    const updated = projects.map((p) => {
      if (p.id === selectedProject.id) {
        return {
          ...p,
          status: 'Closed' as const,
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Helper updates for workspace data
  const updateWorkspaceContacts = (contacts: Contact[]) => {
    if (!selectedProject) return;
    const updated = projects.map((p) => {
      if (p.id === selectedProject.id) {
        return { ...p, contacts };
      }
      return p;
    });
    saveProjects(updated);
  };

  const updateWorkspaceContractor = (contractor: ContractorInfo) => {
    if (!selectedProject) return;
    const updated = projects.map((p) => {
      if (p.id === selectedProject.id) {
        return { ...p, contractor };
      }
      return p;
    });
    saveProjects(updated);
  };

  const updateWorkspaceSOW = (scopesOfWork: SOWItem[]) => {
    if (!selectedProject) return;
    const updated = projects.map((p) => {
      if (p.id === selectedProject.id) {
        return { ...p, scopesOfWork };
      }
      return p;
    });
    saveProjects(updated);
  };

  const updateWorkspaceOrders = (orders: OrderItem[]) => {
    if (!selectedProject) return;
    const updated = projects.map((p) => {
      if (p.id === selectedProject.id) {
        return { ...p, orders };
      }
      return p;
    });
    saveProjects(updated);
  };

  const updateWorkspaceDiagrams = (diagrams: Diagram[]) => {
    if (!selectedProject) return;
    const updated = projects.map((p) => {
      if (p.id === selectedProject.id) {
        return { ...p, diagrams };
      }
      return p;
    });
    saveProjects(updated);
  };

  const updateWorkspaceReports = (reports: ReportLog[]) => {
    if (!selectedProject) return;
    const updated = projects.map((p) => {
      if (p.id === selectedProject.id) {
        return { ...p, reports };
      }
      return p;
    });
    saveProjects(updated);
  };

  const updateWorkspaceDocuments = (documents: ProjectDocument[]) => {
    if (!selectedProject) return;
    const updated = projects.map((p) => {
      if (p.id === selectedProject.id) {
        return { ...p, documents };
      }
      return p;
    });
    saveProjects(updated);
  };

  // Handle saving Drawn Diagram Canvas
  const handleSaveDrawnDiagram = (dataUrl: string) => {
    if (!selectedProject) return;

    const diagrams = selectedProject.diagrams || [];
    let updatedDiagrams: Diagram[] = [];

    if (activeCanvasDiagram) {
      // Edit existing
      updatedDiagrams = diagrams.map((d) => {
        if (d.id === activeCanvasDiagram.id) {
          return {
            ...d,
            imageUrl: dataUrl,
          };
        }
        return d;
      });
    } else {
      // Add new
      const newDiag: Diagram = {
        id: `diagram-${Date.now()}`,
        title: canvasTitle || 'Untitled Diagram Sketch',
        type: canvasType,
        imageUrl: dataUrl,
      };
      updatedDiagrams = [...diagrams, newDiag];
    }

    updateWorkspaceDiagrams(updatedDiagrams);
    setActiveCanvasDiagram(null);
    setCanvasTitle('');
  };

  // Standard static file image uploader for diagrams
  const handleDiagramImageUpload = (e: React.ChangeEvent<HTMLInputElement>, title: string, type: 'Placement' | 'Connection') => {
    const file = e.target.files?.[0];
    if (!file || !selectedProject) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const newDiag: Diagram = {
          id: `diagram-${Date.now()}`,
          title: title || file.name,
          type,
          imageUrl: reader.result,
        };
        const updated = [...(selectedProject.diagrams || []), newDiag];
        updateWorkspaceDiagrams(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick navigation helpers
  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setView('project_workspace');
    setWorkspaceTab('details');
  };

  const totalSOWItemsCount = selectedProject ? selectedProject.scopesOfWork.length : 0;
  const workspaceProgress = totalSOWItemsCount > 0 
    ? Math.round(selectedProject.scopesOfWork.reduce((acc, s) => acc + (s.progress || 0), 0) / totalSOWItemsCount) 
    : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row font-sans selection:bg-lime-500 selection:text-black">
      {/* Sidebar for Desktop (Professional Polish Design Pattern) */}
      <aside className="w-64 bg-black border-r border-zinc-900 flex flex-col hidden md:flex shrink-0 no-print">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1 cursor-pointer" onClick={() => { setView('dashboard'); setSelectedProject(null); }}>
            <div className="w-8 h-8 bg-lime-500 rounded-md flex items-center justify-center text-black font-extrabold text-xl font-display">C</div>
            <h1 className="text-2xl font-black tracking-tighter text-white font-display">ClickDo <span className="text-lime-500">V1.0</span></h1>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Click to Plan, Do to Win</p>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 py-4 overflow-y-auto">
          {/* Dashboard Menu Item */}
          <button
            id="btn-sidebar-dashboard"
            type="button"
            onClick={() => {
              setView('dashboard');
              setSelectedProject(null);
            }}
            className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${
              view === 'dashboard'
                ? 'bg-zinc-900 text-lime-400 font-bold border-l-4 border-lime-500 shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-lime-500" />
            <span className="text-sm font-semibold">Dashboard Overview</span>
          </button>

          {/* Active Project Navigation or Projects list */}
          {selectedProject ? (
            <div className="space-y-1.5 pt-5 border-t border-zinc-900">
              <div className="flex items-center justify-between px-3">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-black">Active Project</span>
                <span className="text-[9px] bg-lime-500/10 text-lime-400 px-1.5 py-0.5 rounded-full border border-lime-500/20 font-bold">
                  {workspaceProgress}%
                </span>
              </div>
              <p className="text-xs text-white font-bold px-3 truncate pb-2" title={selectedProject.name}>
                {selectedProject.name}
              </p>

              {[
                { key: 'details', label: 'รายละเอียดโครงการ', icon: ClipboardList },
                { key: 'sow', label: 'Scope of Work / แผนงาน', icon: Layers },
                { key: 'calendar', label: 'ปฏิทินแผนงาน / เดดไลน์', icon: Calendar },
                { key: 'diagrams', label: 'ภาพ Diagram / แบบติดตั้ง', icon: FileImage },
                { key: 'contacts', label: 'ผู้ติดต่อ', icon: Users },
                { key: 'contractor', label: 'ช่าง / ผู้รับเหมา', icon: HardHat },
                { key: 'orders', label: 'วัสดุ / อุปกรณ์', icon: ShoppingBag },
                { key: 'reports', label: 'รายงานรายวัน/สัปดาห์', icon: FileText },
                { key: 'documents', label: 'แฟ้มเอกสารหลัก', icon: FolderDot },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = view === 'project_workspace' && workspaceTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    id={`sidebar-tab-${tab.key}`}
                    type="button"
                    onClick={() => {
                      setView('project_workspace');
                      setWorkspaceTab(tab.key as any);
                      setActiveCanvasDiagram(null);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-all text-xs ${
                      isActive
                        ? 'bg-zinc-900 text-lime-400 font-bold border-l-4 border-lime-500'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/20'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2 pt-5 border-t border-zinc-900">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-black px-3 block">โครงการปัจจุบัน ({projects.length})</span>
              <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => handleSelectProject(proj)}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-400 hover:text-lime-400 hover:bg-zinc-900/30 rounded-md truncate block font-medium"
                    title={proj.name}
                  >
                    ○ {proj.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>



        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-900">
          <div className="text-[10px] text-zinc-500 text-center font-mono uppercase tracking-widest font-black">
            Click to Plan, Do to Win
          </div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Universal header navigation bar for Mobile/Tablet */}
        <header className="bg-zinc-950 border-b border-zinc-900 md:hidden sticky top-0 z-40 no-print">
          <div className="px-4 py-3 flex items-center justify-between gap-4">
            {/* Slogan & App Title */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { setView('dashboard'); setSelectedProject(null); }}>
              <div className="w-8 h-8 rounded-lg bg-lime-500 flex items-center justify-center shadow">
                <FolderKanban className="w-4.5 h-4.5 text-black" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-widest block leading-none">
                  ClickDo V1.0
                </span>
                <span className="text-sm font-black text-white font-display tracking-tight">
                  คลิกเพื่อแผนงาน ทำเพื่อชัยชนะ
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {view !== 'dashboard' && (
                <button
                  id="btn-nav-dashboard"
                  type="button"
                  onClick={() => { setView('dashboard'); setSelectedProject(null); }}
                  className="p-1.5 bg-zinc-900 text-xs font-bold rounded-lg border border-zinc-800 text-zinc-300 hover:text-white"
                  title="กลับแดชบอร์ด"
                >
                  <LayoutDashboard className="w-4 h-4 text-lime-400" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Wrapper */}
        <div className="flex-1 overflow-y-auto">
          {/* Main Container Content */}
          <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        {view === 'dashboard' && (
          <DashboardOverview
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={handleSelectProject}
            onCreateProject={() => setView('create_project')}
          />
        )}

        {view === 'create_project' && (
          <div className="max-w-2xl mx-auto">
            <ProjectDetailsForm
              project={null}
              onSave={handleCreateProject}
              onCancel={() => setView('dashboard')}
              salesPeople={salesPeople}
              onUpdateSalesPeople={handleUpdateSalesPeople}
              projectManagers={projectManagers}
              onUpdateProjectManagers={handleUpdateProjectManagers}
              projectStatuses={projectStatuses}
              onUpdateProjectStatuses={handleUpdateProjectStatuses}
            />
          </div>
        )}

        {view === 'edit_project' && (
          <div className="max-w-2xl mx-auto">
            <ProjectDetailsForm
              project={selectedProject}
              onSave={handleEditProject}
              onCancel={() => setView('project_workspace')}
              salesPeople={salesPeople}
              onUpdateSalesPeople={handleUpdateSalesPeople}
              projectManagers={projectManagers}
              onUpdateProjectManagers={handleUpdateProjectManagers}
              projectStatuses={projectStatuses}
              onUpdateProjectStatuses={handleUpdateProjectStatuses}
            />
          </div>
        )}

        {view === 'project_workspace' && selectedProject && (
          <div className="space-y-6">
            {/* Project Title and Header Overview */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-4 font-mono text-[9px] text-zinc-500 uppercase no-print">
                ID: {selectedProject.id}
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      selectedProject.status === 'Active'
                        ? 'bg-lime-500/10 text-lime-400 border border-lime-500/20'
                        : selectedProject.status === 'Closed'
                        ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                        : selectedProject.status === 'On Hold'
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}>
                      {selectedProject.status === 'Active'
                        ? 'กำลังติดตั้ง'
                        : selectedProject.status === 'Closed'
                        ? 'ปิดโครงการแล้ว'
                        : selectedProject.status === 'On Hold'
                        ? 'ระงับชั่วคราว'
                        : selectedProject.status}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      PM: {selectedProject.projectManager || '-'}
                    </span>
                  </div>

                  <h2 className="text-xl md:text-2xl font-black text-white font-display tracking-tight leading-tight">
                    {selectedProject.name}
                  </h2>

                  <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{selectedProject.installationSite}</span>
                  </p>

                  {/* Expiry Alert banner */}
                  {(() => {
                    const contractDateStr = selectedProject.contractEndDate || selectedProject.endDate;
                    if (!contractDateStr) return null;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const target = new Date(contractDateStr);
                    target.setHours(0, 0, 0, 0);
                    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (selectedProject.status === 'Active' && diffDays >= 0 && diffDays < 10) {
                      return (
                        <div className="mt-2.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-2 animate-pulse no-print">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>คำเตือน: สัญญากำลังจะสิ้นสุดในอีก <span className="font-extrabold underline text-white text-sm">{diffDays}</span> วัน! (สิ้นสุดสัญญา: {contractDateStr})</span>
                        </div>
                      );
                    } else if (selectedProject.status === 'Active' && diffDays < 0) {
                      return (
                        <div className="mt-2.5 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-2 no-print">
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>คำเตือน: สัญญาเลยกำหนดสิ้นสุดมาแล้ว <span className="font-extrabold underline text-white text-sm">{Math.abs(diffDays)}</span> วัน! (สิ้นสุดสัญญา: {contractDateStr})</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="flex flex-wrap gap-2.5 no-print">
                  <button
                    id="btn-edit-selected-project"
                    type="button"
                    onClick={() => setView('edit_project')}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-700 transition-all"
                  >
                    แก้ไขชื่อ/ข้อมูลโครงการ
                  </button>
                  <button
                    id="btn-delete-selected-project"
                    type="button"
                    onClick={() => handleDeleteProject(selectedProject.id)}
                    className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 text-xs font-semibold rounded-lg border border-rose-900/30 transition-all"
                  >
                    ลบโครงการ
                  </button>
                </div>
              </div>

              {/* Workspace statistics mini bento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-800/80">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">ระยะเวลาสัญญาโครงการ</span>
                  <span className="text-xs font-bold text-white font-mono block">
                    {selectedProject.startDate || '-'} ถึง {selectedProject.contractEndDate || selectedProject.endDate || '-'}
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    ({selectedProject.durationDays || 0} วัน)
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">ระยะเวลาดำเนินงานจริง</span>
                  <span className="text-xs font-bold text-white font-mono block">
                    {selectedProject.closeDate ? (
                      (() => {
                        const start = new Date(selectedProject.startDate);
                        const end = new Date(selectedProject.closeDate);
                        const diffTime = end.getTime() - start.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        return `${selectedProject.startDate} ถึง ${selectedProject.closeDate}`;
                      })()
                    ) : (
                      'กำลังดำเนินการ'
                    )}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {selectedProject.closeDate ? (
                      (() => {
                        const start = new Date(selectedProject.startDate);
                        const end = new Date(selectedProject.closeDate);
                        const diffTime = end.getTime() - start.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        return `(${diffDays > 0 ? diffDays : 0} วัน)`;
                      })()
                    ) : (
                      '(ยังไม่ระบุวันปิด)'
                    )}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">ความก้าวหน้าโครงการ</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-16 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-lime-400 h-full rounded-full" style={{ width: `${workspaceProgress}%` }} />
                    </div>
                    <span className="text-xs font-mono font-extrabold text-lime-400">{workspaceProgress}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">วันปิดโครงการ</span>
                  <span className="text-xs font-bold text-zinc-200 truncate block">
                    {selectedProject.closeDate ? (
                      <span className="text-emerald-400 font-mono">{selectedProject.closeDate}</span>
                    ) : (
                      <span className="text-zinc-500">ยังไม่ปิดโครงการ</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Subtab Workspace Menu bar */}
            <div className="flex flex-wrap gap-1 bg-zinc-950/80 p-1.5 rounded-xl border border-zinc-900 text-xs font-semibold no-print">
              {[
                { key: 'details', label: 'รายละเอียดโครงการ', icon: ClipboardList },
                { key: 'sow', label: 'Scope of Work / ไทม์ไลน์', icon: Layers },
                { key: 'calendar', label: 'ปฏิทินแผนงาน / เดดไลน์', icon: Calendar },
                { key: 'diagrams', label: 'ภาพ Diagram / แบบติดตั้ง', icon: FileImage },
                { key: 'contacts', label: 'ผู้ติดต่อ', icon: Users },
                { key: 'contractor', label: 'ช่าง / ผู้รับเหมา', icon: HardHat },
                { key: 'orders', label: 'วัสดุ / อุปกรณ์', icon: ShoppingBag },
                { key: 'reports', label: 'รายงานรายวัน/สัปดาห์', icon: FileText },
                { key: 'documents', label: 'แฟ้มเอกสารหลัก', icon: FolderDot },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = workspaceTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    id={`tab-workspace-${tab.key}`}
                    type="button"
                    onClick={() => {
                      setWorkspaceTab(tab.key as any);
                      setActiveCanvasDiagram(null);
                    }}
                    className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-gradient-to-r from-lime-500/20 to-yellow-500/20 text-lime-400 border border-lime-500/30'
                        : 'text-zinc-400 border border-transparent hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Workspace Tab Content Area */}
            <div className="min-h-[400px] bg-zinc-900/40 p-1 rounded-2xl border border-zinc-900">
              {workspaceTab === 'details' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left space-y-6">
                  <h3 className="text-lg font-bold text-white font-display border-b border-zinc-850 pb-2">
                    สรุปรายละเอียดฝ่ายเทคนิคและการติดตั้ง (Project Brief)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <span className="text-zinc-500 text-xs uppercase font-bold tracking-wider block">สถานที่ติดตั้งหลัก</span>
                        <p className="text-sm text-zinc-200 mt-1">{selectedProject.installationSite}</p>
                      </div>

                      <div>
                        <span className="text-zinc-500 text-xs uppercase font-bold tracking-wider block">ผู้ควบคุมและบริหารโครงการ (PM)</span>
                        <p className="text-sm text-zinc-200 mt-1">{selectedProject.projectManager}</p>
                      </div>

                      <div>
                        <span className="text-zinc-500 text-xs uppercase font-bold tracking-wider block">พนักงานขายผู้ดูแลสัญญา (Sales)</span>
                        <p className="text-sm text-zinc-200 mt-1">{selectedProject.salesPerson}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-zinc-500 text-xs uppercase font-bold tracking-wider block">ชื่อบริษัทลูกค้า</span>
                        <p className="text-sm text-zinc-200 mt-1">{selectedProject.ownerName}</p>
                      </div>

                      <div>
                        <span className="text-zinc-500 text-xs uppercase font-bold tracking-wider block">ชื่อลูกค้า (Owners)</span>
                        <p className="text-sm text-zinc-200 mt-1">{selectedProject.partnerCompany || 'ไม่มีระบุเจ้าของโครงการ'}</p>
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-3 text-xs font-mono">
                        <div>
                          <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">วันเริ่มต้นโครงการ (Start Date)</span>
                          <div className="text-zinc-200 font-bold text-xs mt-0.5">
                            {selectedProject.startDate || '-'}
                          </div>
                        </div>

                        <div>
                          <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">วันสิ้นสุดสัญญา (Contract End Date)</span>
                          <div className="text-amber-400 font-bold text-xs mt-0.5">
                            {selectedProject.contractEndDate || selectedProject.endDate || '-'} 
                            <span className="text-[10px] text-zinc-500 font-normal ml-1">
                              (รวม {selectedProject.durationDays || 0} วัน)
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">วันปิดโครงการ (Project Close Date)</span>
                          <div className="text-emerald-400 font-bold text-xs mt-0.5">
                            {selectedProject.closeDate || 'ยังไม่ระบุวันปิดโครงการ'}
                            {selectedProject.closeDate && (
                              <span className="text-[10px] text-zinc-500 font-normal ml-1">
                                (รวม {(() => {
                                  const start = new Date(selectedProject.startDate);
                                  const end = new Date(selectedProject.closeDate);
                                  const diffTime = end.getTime() - start.getTime();
                                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                  return diffDays > 0 ? diffDays : 0;
                                })()} วัน)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {workspaceTab === 'sow' && (
                <ScopeOfWorkManager
                  project={selectedProject}
                  onUpdateSOW={updateWorkspaceSOW}
                />
              )}

              {workspaceTab === 'calendar' && (
                <SOWCalendar project={selectedProject} />
              )}

              {workspaceTab === 'diagrams' && (
                <div className="space-y-6">
                  {/* Diagrams list and drawing trigger */}
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <FileImage className="w-5 h-5 text-lime-400" />
                      <div>
                        <h3 className="font-bold text-white text-base">แบบตำแหน่งอุปกรณ์ & Diagram การเชื่อมต่อ</h3>
                        <p className="text-xs text-zinc-400">แก้ไขหรือวาดแผนผังระบบสายไฟทางวิศวกรรม (Single Line / Placement) สดบนเว็บ</p>
                      </div>
                    </div>

                    {!activeCanvasDiagram && (
                      <div className="flex items-center gap-3">
                        {/* Static upload file layout */}
                        <div className="relative">
                          <label className="cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                            <span>อัปโหลดรูปภาพ Diagram</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleDiagramImageUpload(e, 'แบบไดอะแกรมที่อัปโหลดอ้างอิง', 'Placement')}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <button
                          id="btn-trigger-canvas-new"
                          type="button"
                          onClick={() => {
                            setActiveCanvasDiagram({ id: '', title: '', type: 'Placement' });
                            setCanvasTitle('ร่างแบบตำแหน่งอุปกรณ์ใหม่');
                          }}
                          className="px-4 py-1.5 bg-gradient-to-r from-lime-500 to-yellow-500 hover:from-lime-400 hover:to-yellow-400 text-black font-extrabold text-xs rounded-lg flex items-center gap-1 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>เปิดกระดานวาดแบบ</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Active drawing board wrapper */}
                  {activeCanvasDiagram && (
                    <div className="space-y-4">
                      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3">
                        <h4 className="font-bold text-white text-sm">ระบุข้อมูลสเก็ตช์ภาพใหม่</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="diag-title" className="block text-xs font-semibold text-zinc-400 mb-1">ชื่อรูปสเก็ตช์แบบร่าง</label>
                            <input
                              id="diag-title"
                              type="text"
                              required
                              placeholder="เช่น แบบจัดวาง Inverter ในห้อง MDB"
                              value={canvasTitle}
                              onChange={(e) => setCanvasTitle(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="diag-type" className="block text-xs font-semibold text-zinc-400 mb-1">หมวดหมู่แบบร่าง</label>
                            <select
                              id="diag-type"
                              value={canvasType}
                              onChange={(e) => setCanvasType(e.target.value as any)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white"
                            >
                              <option value="Placement">แบบตำแหน่งอุปกรณ์ (Placement Layout)</option>
                              <option value="Connection">Diagram การเชื่อมต่อ (Connection Diagram)</option>
                              <option value="Other">แบบแปลนอื่นๆ</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <DiagramCanvas
                        title={canvasTitle || 'Diagram_Draw'}
                        initialData={activeCanvasDiagram.imageUrl}
                        onSave={handleSaveDrawnDiagram}
                      />
                    </div>
                  )}

                  {/* Display existing diagrams gallery */}
                  {!activeCanvasDiagram && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(!selectedProject.diagrams || selectedProject.diagrams.length === 0) ? (
                        <div className="col-span-2 bg-zinc-900/40 border border-zinc-850 rounded-xl p-12 text-center text-zinc-500 italic text-xs">
                          ยังไม่มีไดอะแกรมตำแหน่งเชื่อมต่อหรือภาพอ้างอิงในโครงการนี้ คลิก "เปิดกระดานวาดแบบ" เพื่อขีดสเก็ตช์ไอเดียการต่อไฟสดได้ทันที
                        </div>
                      ) : (
                        selectedProject.diagrams.map((diag) => (
                          <div key={diag.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                              <div className="space-y-0.5 text-left">
                                <span className="text-[9px] font-bold text-lime-400 font-mono uppercase bg-zinc-950 px-2 py-0.5 rounded">
                                  {diag.type === 'Placement' ? 'แบบตำแหน่ง' : diag.type === 'Connection' ? 'Diagram สายไฟ' : 'แบบแปลน'}
                                </span>
                                <h4 className="font-bold text-white text-xs mt-1 truncate max-w-xs">{diag.title}</h4>
                              </div>

                              <div className="inline-flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveCanvasDiagram(diag);
                                    setCanvasTitle(diag.title);
                                    setCanvasType(diag.type);
                                  }}
                                  className="p-1.5 hover:bg-zinc-800 rounded text-lime-400 hover:text-lime-300 text-xs font-semibold"
                                  title="แก้ไขสเก็ตช์"
                                >
                                  แก้ไขแบบ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('ยืนยันลบรูปภาพไดอะแกรมนี้?')) {
                                      const updated = selectedProject.diagrams.filter(d => d.id !== diag.id);
                                      updateWorkspaceDiagrams(updated);
                                    }
                                  }}
                                  className="p-1.5 hover:bg-zinc-850 rounded text-rose-500"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {diag.imageUrl ? (
                              <div className="aspect-video bg-zinc-950 border border-zinc-850 rounded-lg overflow-hidden flex items-center justify-center relative group">
                                <img
                                  src={diag.imageUrl}
                                  alt={diag.title}
                                  className="max-w-full max-h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                                <a
                                  href={diag.imageUrl}
                                  download={`${diag.title.replace(/\s+/g, '_')}.png`}
                                  className="absolute bottom-2 right-2 p-1.5 bg-black/80 hover:bg-black text-lime-400 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ดาวน์โหลดรูป
                                </a>
                              </div>
                            ) : (
                              <div className="aspect-video bg-zinc-950 border border-zinc-850 rounded-lg flex items-center justify-center text-zinc-600 italic text-xs">
                                กระดานวาดรูปว่างเปล่า คลิกแก้ไขเพื่อบันทึกงานสเก็ตช์
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {workspaceTab === 'contacts' && (
                <ContactsManager
                  project={selectedProject}
                  positions={positions}
                  onUpdateContacts={updateWorkspaceContacts}
                  onUpdatePositions={handleUpdatePositions}
                />
              )}

              {workspaceTab === 'contractor' && (
                <ContractorManager
                  project={selectedProject}
                  onUpdateContractor={updateWorkspaceContractor}
                />
              )}

              {workspaceTab === 'orders' && (
                <MaterialTracker
                  project={selectedProject}
                  onUpdateOrders={updateWorkspaceOrders}
                  onCloseProject={handleCloseProjectStatus}
                />
              )}

              {workspaceTab === 'reports' && (
                <ReportsManager
                  project={selectedProject}
                  onUpdateReports={updateWorkspaceReports}
                />
              )}

              {workspaceTab === 'documents' && (
                <DocumentsManager
                  project={selectedProject}
                  onUpdateDocuments={updateWorkspaceDocuments}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer copyright */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-6 text-center text-zinc-500 text-xs font-mono tracking-wide mt-12 no-print">
        <p>© 2026 ClickDo V1.0 - "Click to Plan, Do to Win" • All rights reserved.</p>
        <p className="text-[10px] text-zinc-600 mt-1">
          ระบบจัดระเบียบบริหารโครงการสัญญาก่อสร้างติดตั้งมาตรฐานวิศวรรณโยธาและไฟฟ้า
        </p>
      </footer>


        </div>
      </div>
    </div>
  );
}
