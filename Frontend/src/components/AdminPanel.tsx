import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Building2,
  FileText,
  PhoneCall,
  Globe,
  Plus,
  Trash2,
  X,
  LogOut,
  Upload,
  CheckCircle2
} from 'lucide-react';
import {
  AdminRole,
  validateAdminEmail
} from '../config/adminAccess';
import {
  getVisitorRecords,
  VisitorSessionRecord
} from '../utils/visitorStore';
import { UISelect } from './ui/Select';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export type CurrencyUnit = 'Cr' | 'Lakhs' | 'Millions';

export interface PromoterItem {
  id: string;
  name: string;
  experience: string;
  qualification: string;
  shareholdingPct: number;
  role: string;
}

export interface CostComponent {
  id: string;
  category: string;
  amountCr: number;
}

export interface ProjectEntity {
  id: string;
  name: string;
  industry: string;
  location: string;
  promoterCount: number;
  promoters: PromoterItem[];
  costComponents: CostComponent[];
  meansOfFinance: {
    equityCr: number;
    debtCr: number;
    subsidyCr: number;
  };
  checklistUploaded: boolean;
  checklistFileName?: string;
  documents: {
    companyKyc?: string;
    promoterKyc?: string;
    dpr?: string;
    financialModel?: string;
    otherDocs?: string;
  };
  isFunded: boolean;
}

export interface DprRequest {
  id: string;
  projectName: string;
  promoterName: string;
  email: string;
  phone: string;
  date: string;
  assignedConsultant?: string;
}

export interface ConsultationItem {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  projectCategory: string;
  date: string;
  assignedTo?: string;
}

const STORAGE_KEY_ADMIN_SESSION = 'inisio_active_admin_session';
const STORAGE_KEY_PROJECTS = 'inisio_phase1_projects';
const STORAGE_KEY_DPR = 'inisio_phase1_dpr_requests';
const STORAGE_KEY_CONSULTATIONS = 'inisio_phase1_consultations';

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  // Session State (email-based, no passwords)
  const [activeRole, setActiveRole] = useState<AdminRole | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ADMIN_SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'admin' || parsed.role === 'superadmin') {
          return parsed.role;
        }
      }
    } catch {}
    return null;
  });

  // Minimal Email Access Form (no helper text, no placeholder instructions, no labels, no passwords)
  const [emailInput, setEmailInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Navigation: Overview, Projects, DPR Requests, Consultations, Visitors
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'dpr' | 'consultations' | 'visitors'>('overview');

  // New Project Modal State (Super Admin CRUD)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjIndustry, setNewProjIndustry] = useState('');
  const [newProjLocation, setNewProjLocation] = useState('');

  // Currency Display Unit
  const [currencyUnit, setCurrencyUnit] = useState<CurrencyUnit>('Cr');

  // Selected Project for details view
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // 1. Projects State (starts empty, no dummy projects)
  const [projects, setProjects] = useState<ProjectEntity[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (saved) {
        const parsed: ProjectEntity[] = JSON.parse(saved);
        // Exclude legacy dummy demo projects
        return parsed.filter(p => p.id !== 'proj_1' && p.id !== 'proj_2' && !p.name?.includes('Apex Green Hydrogen'));
      }
    } catch {}
    return [];
  });

  // 2. DPR Requests State (starts empty, no dummy requests)
  const [dprRequests, setDprRequests] = useState<DprRequest[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DPR);
      if (saved) {
        const parsed: DprRequest[] = JSON.parse(saved);
        return parsed.filter(d => d.id !== 'dpr_1' && d.id !== 'dpr_2' && !d.projectName?.includes('Apex Green Hydrogen'));
      }
    } catch {}
    return [];
  });

  // 3. Consultations State (starts empty, no dummy consultations)
  const [consultations, setConsultations] = useState<ConsultationItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONSULTATIONS);
      if (saved) {
        const parsed: ConsultationItem[] = JSON.parse(saved);
        return parsed.filter(c => c.id !== 'cons_1' && c.id !== 'cons_2');
      }
    } catch {}
    return [];
  });

  // 4. Visitors State
  const [visitors, setVisitors] = useState<VisitorSessionRecord[]>([]);

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
      } catch {}
    }
  }, [projects]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_DPR, JSON.stringify(dprRequests));
      } catch {}
    }
  }, [dprRequests]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_CONSULTATIONS, JSON.stringify(consultations));
      } catch {}
    }
  }, [consultations]);

  // Load visitors
  const loadVisitors = () => {
    setVisitors(getVisitorRecords());
  };

  useEffect(() => {
    if (isOpen) {
      loadVisitors();
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  // Minimal Email Access Handler (Matches ADMIN_EMAIL or SUPER_ADMIN_EMAIL, otherwise denies)
  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const res = validateAdminEmail(emailInput);
    if (!res.allowed || !res.role) {
      setAuthError('Access Denied');
      return;
    }

    if (res.role === 'ca_admin') {
      try {
        localStorage.setItem(
          'inisio_ca_admin_session',
          JSON.stringify({ email: emailInput.trim().toLowerCase(), token: 'ca_admin_active_session' })
        );
      } catch {}
      onClose();
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/ca-admin');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      return;
    }

    setActiveRole(res.role);
    try {
      localStorage.setItem(
        STORAGE_KEY_ADMIN_SESSION,
        JSON.stringify({ email: emailInput.trim().toLowerCase(), role: res.role })
      );
    } catch {}
    setEmailInput('');
  };

  // Super Admin CRUD: Project Creation
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRole !== 'superadmin' || !newProjName.trim()) return;

    const newProj: ProjectEntity = {
      id: `proj_${Date.now()}`,
      name: newProjName.trim(),
      industry: newProjIndustry.trim() || 'General Infrastructure',
      location: newProjLocation.trim() || 'India',
      promoterCount: 1,
      promoters: [
        {
          id: `prom_${Date.now()}`,
          name: 'Lead Promoter',
          experience: '10 Years',
          qualification: 'Executive Signatory',
          shareholdingPct: 100,
          role: 'Promoter'
        }
      ],
      costComponents: [
        { id: `cost_${Date.now()}`, category: 'Infrastructure & Site Development', amountCr: 10.0 }
      ],
      meansOfFinance: {
        equityCr: 3.0,
        debtCr: 7.0,
        subsidyCr: 0
      },
      checklistUploaded: false,
      documents: {},
      isFunded: false
    };

    setProjects((prev) => [newProj, ...prev]);
    setSelectedProjectId(newProj.id);
    setNewProjName('');
    setNewProjIndustry('');
    setNewProjLocation('');
    setShowNewProjectModal(false);
  };

  // Super Admin CRUD: Project Deletion
  const handleDeleteProject = (projId: string) => {
    if (activeRole !== 'superadmin') return;
    if (projects.length <= 1) return;
    const remaining = projects.filter((p) => p.id !== projId);
    setProjects(remaining);
    setSelectedProjectId(remaining[0].id);
  };

  const handleSignOut = () => {
    setActiveRole(null);
    try {
      localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
    } catch {}
  };

  // Currently viewed project
  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Unit conversion helper
  const formatCurrency = (amountCr: number): string => {
    if (currencyUnit === 'Cr') {
      return `₹ ${amountCr.toFixed(2)} Cr`;
    }
    if (currencyUnit === 'Lakhs') {
      const lakhs = amountCr * 100;
      return `₹ ${lakhs.toLocaleString('en-IN', { maximumFractionDigits: 2 })} L`;
    }
    if (currencyUnit === 'Millions') {
      const millions = amountCr * 10;
      return `₹ ${millions.toFixed(2)} M`;
    }
    return `₹ ${amountCr.toFixed(2)} Cr`;
  };

  const totalCostCr = useMemo(() => {
    if (!currentProject) return 0;
    return currentProject.costComponents.reduce((acc, c) => acc + (c.amountCr || 0), 0);
  }, [currentProject]);

  const totalMeansOfFinanceCr = useMemo(() => {
    if (!currentProject) return 0;
    return (
      (currentProject.meansOfFinance.equityCr || 0) +
      (currentProject.meansOfFinance.debtCr || 0) +
      (currentProject.meansOfFinance.subsidyCr || 0)
    );
  }, [currentProject]);

  // Feature 2: Promoters CRUD (Super Admin adds multiple promoters)
  const [newPromoterName, setNewPromoterName] = useState('');
  const [newPromoterExp, setNewPromoterExp] = useState('');
  const [newPromoterQual, setNewPromoterQual] = useState('');
  const [newPromoterShare, setNewPromoterShare] = useState('20');
  const [newPromoterRole, setNewPromoterRole] = useState('Co-Promoter');
  const [showAddPromoterForm, setShowAddPromoterForm] = useState(false);

  const handleAddPromoter = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRole !== 'superadmin' || !currentProject) return;
    if (!newPromoterName) return;

    const newProm: PromoterItem = {
      id: `prom_${Date.now()}`,
      name: newPromoterName,
      experience: newPromoterExp || '5 Years',
      qualification: newPromoterQual || 'Graduate',
      shareholdingPct: Number(newPromoterShare) || 10,
      role: newPromoterRole || 'Partner'
    };

    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === currentProject.id) {
          const updatedList = [...proj.promoters, newProm];
          return {
            ...proj,
            promoters: updatedList,
            promoterCount: updatedList.length
          };
        }
        return proj;
      })
    );

    setNewPromoterName('');
    setNewPromoterExp('');
    setNewPromoterQual('');
    setShowAddPromoterForm(false);
  };

  const handleDeletePromoter = (promoterId: string) => {
    if (activeRole !== 'superadmin' || !currentProject) return;
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === currentProject.id) {
          const updatedList = proj.promoters.filter((p) => p.id !== promoterId);
          return {
            ...proj,
            promoters: updatedList,
            promoterCount: updatedList.length
          };
        }
        return proj;
      })
    );
  };

  // Feature 3: Project Cost and Means of finance CRUD
  const [newCostCat, setNewCostCat] = useState('');
  const [newCostAmount, setNewCostAmount] = useState('5.0');
  const [showAddCostForm, setShowAddCostForm] = useState(false);

  const handleAddCostComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRole !== 'superadmin' || !currentProject) return;
    if (!newCostCat) return;

    const newComp: CostComponent = {
      id: `cost_${Date.now()}`,
      category: newCostCat,
      amountCr: Number(newCostAmount) || 1.0
    };

    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === currentProject.id) {
          return {
            ...proj,
            costComponents: [...proj.costComponents, newComp]
          };
        }
        return proj;
      })
    );

    setNewCostCat('');
    setNewCostAmount('5.0');
    setShowAddCostForm(false);
  };

  const handleDeleteCostComponent = (costId: string) => {
    if (activeRole !== 'superadmin' || !currentProject) return;
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === currentProject.id) {
          return {
            ...proj,
            costComponents: proj.costComponents.filter((c) => c.id !== costId)
          };
        }
        return proj;
      })
    );
  };

  const handleUpdateFinance = (field: 'equityCr' | 'debtCr' | 'subsidyCr', val: number) => {
    if (activeRole !== 'superadmin' || !currentProject) return;
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === currentProject.id) {
          return {
            ...proj,
            meansOfFinance: {
              ...proj.meansOfFinance,
              [field]: val
            }
          };
        }
        return proj;
      })
    );
  };

  // Feature 4: Checklist Upload (No download allowed)
  const handleUploadChecklist = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeRole !== 'superadmin' || !currentProject) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === currentProject.id) {
          return {
            ...proj,
            checklistUploaded: true,
            checklistFileName: file.name
          };
        }
        return proj;
      })
    );
  };

  // Feature 5: Documents (Optional Uploads)
  const handleUploadDocument = (
    key: 'companyKyc' | 'promoterKyc' | 'dpr' | 'financialModel' | 'otherDocs',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (activeRole !== 'superadmin' || !currentProject) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === currentProject.id) {
          return {
            ...proj,
            documents: {
              ...proj.documents,
              [key]: file.name
            }
          };
        }
        return proj;
      })
    );
  };

  const handleRemoveDocument = (
    key: 'companyKyc' | 'promoterKyc' | 'dpr' | 'financialModel' | 'otherDocs'
  ) => {
    if (activeRole !== 'superadmin' || !currentProject) return;
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === currentProject.id) {
          const updatedDocs = { ...proj.documents };
          delete updatedDocs[key];
          return {
            ...proj,
            documents: updatedDocs
          };
        }
        return proj;
      })
    );
  };

  // Feature 6: Probability Meter (Starts at 25%, rises to 100% when marked as funded)
  const currentProbability = currentProject?.isFunded ? 100 : 25;

  const handleToggleFunded = () => {
    if (activeRole !== 'superadmin' || !currentProject) return;
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === currentProject.id) {
          return {
            ...proj,
            isFunded: !proj.isFunded
          };
        }
        return proj;
      })
    );
  };

  // Feature 7: DPR Requests (Super Admin assigns to DPR Consultant 1, 2, 3...)
  const handleAssignDprConsultant = (dprId: string, consultant: string) => {
    if (activeRole !== 'superadmin') return;
    setDprRequests((prev) =>
      prev.map((req) => (req.id === dprId ? { ...req, assignedConsultant: consultant } : req))
    );
  };

  // Feature 8: Consultations (Super Admin assigns to Prosync)
  const handleAssignConsultationToProsync = (consId: string) => {
    if (activeRole !== 'superadmin') return;
    setConsultations((prev) =>
      prev.map((c) => (c.id === consId ? { ...c, assignedTo: 'Prosync' } : c))
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-50 flex flex-col font-inter overflow-hidden animate-in fade-in duration-150">
      <div className="relative w-full h-full bg-white flex flex-col overflow-hidden">
        
        {/* State 1: Minimal Email-Only Access Gate (No helper text, no placeholder instructions, no extra labels, no passwords) */}
        {!activeRole ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-100/70">
            <div className="w-full max-w-sm bg-white rounded-2xl p-6 border border-slate-200 shadow-xl space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAccessSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 placeholder:text-slate-400"
                  autoFocus
                />

                {authError && (
                  <div className="text-rose-600 text-xs font-semibold text-center">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Enter
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* State 2: Modern Dashboard Layout (Left Sidebar + Right Content Panel) */
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800">
              <div className="p-5 space-y-5">
                {/* Brand Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      I
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-white font-manrope">Inisio</div>
                      <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Admin Panel</div>
                    </div>
                  </div>
                </div>

                {/* Role Indicator */}
                <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                      activeRole === 'superadmin'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                        : 'bg-slate-700 text-slate-300 border border-slate-600'
                    }`}
                  >
                    {activeRole === 'superadmin' ? 'Super Admin' : 'Admin'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Phase 1</span>
                </div>

                {/* Left Sidebar Navigation */}
                <nav className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'overview'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span>Overview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('projects')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'projects'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>Projects</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('dpr')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'dpr'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>DPR Requests</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('consultations')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'consultations'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <PhoneCall className="w-4 h-4 shrink-0" />
                    <span>Consultations</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('visitors')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'visitors'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Globe className="w-4 h-4 shrink-0" />
                    <span>Visitors</span>
                  </button>
                </nav>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-slate-800/80 space-y-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Close (Esc)</span>
                </button>
              </div>
            </aside>

            {/* Right Content Panel */}
            <main className="flex-1 flex flex-col bg-slate-50/60 overflow-hidden">
              {/* Header Bar */}
              <header className="h-14 px-6 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <h1 className="text-sm font-extrabold text-slate-900 font-manrope capitalize">
                    {activeTab === 'overview' && 'Dashboard Overview'}
                    {activeTab === 'projects' && 'Projects & Entity Management'}
                    {activeTab === 'dpr' && 'DPR Requests'}
                    {activeTab === 'consultations' && 'Consultations'}
                    {activeTab === 'visitors' && 'Visitor Tracking'}
                  </h1>

                  {activeRole === 'admin' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      View-Only
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </header>

              {/* View Switcher */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. Dashboard Overview */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Projects Metric */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Projects
                        </span>
                        <p className="text-2xl font-black text-slate-900 font-manrope">
                          {projects.length}
                        </p>
                      </div>

                      {/* Promoters Metric */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Promoters
                        </span>
                        <p className="text-2xl font-black text-slate-900 font-manrope">
                          {projects.reduce((acc, p) => acc + (p.promoters.length || 0), 0)}
                        </p>
                      </div>

                      {/* Consultations Metric */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Consultations
                        </span>
                        <p className="text-2xl font-black text-blue-600 font-manrope">
                          {consultations.length}
                        </p>
                      </div>

                      {/* DPR Requests Metric */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          DPR Requests
                        </span>
                        <p className="text-2xl font-black text-emerald-600 font-manrope">
                          {dprRequests.length}
                        </p>
                      </div>
                    </div>

                    {/* Quick Overview Table */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Active Project Pipelines
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                            <tr>
                              <th className="py-2.5 px-5">Project</th>
                              <th className="py-2.5 px-5">Promoters</th>
                              <th className="py-2.5 px-5">Capex</th>
                              <th className="py-2.5 px-5">Probability</th>
                              <th className="py-2.5 px-5 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {projects.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-xs text-slate-500 font-medium">
                                  No projects yet
                                </td>
                              </tr>
                            ) : (
                              projects.map((proj) => {
                              const capex = proj.costComponents.reduce((acc, c) => acc + (c.amountCr || 0), 0);
                              return (
                                <tr key={proj.id} className="hover:bg-slate-50/50">
                                  <td className="py-3 px-5 font-semibold text-slate-900">
                                    {proj.name}
                                    <div className="text-[11px] text-slate-400">{proj.industry}</div>
                                  </td>
                                  <td className="py-3 px-5 text-slate-700">
                                    {proj.promoters.length} {proj.promoters.length === 1 ? 'Promoter' : 'Promoters'}
                                  </td>
                                  <td className="py-3 px-5 font-bold text-slate-900">
                                    ₹ {capex.toFixed(1)} Cr
                                  </td>
                                  <td className="py-3 px-5 font-bold text-blue-600">
                                    {proj.isFunded ? '100%' : '25%'}
                                  </td>
                                  <td className="py-3 px-5 text-right">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        proj.isFunded
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                                      }`}
                                    >
                                      {proj.isFunded ? 'Funded' : 'In Appraisal'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            }))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Projects (Promoters, Cost & Means of Finance, Checklist, Documents, Probability) */}
                {activeTab === 'projects' && (
                  <div className="space-y-6">
                    {/* Project Selector, Super Admin CRUD Buttons, & Unit Switcher */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <div className="flex flex-wrap items-center gap-3 min-w-65">
                        <UISelect
                          value={selectedProjectId}
                          onValueChange={setSelectedProjectId}
                          options={projects.map((p) => ({ value: p.id, label: p.name }))}
                          triggerClassName="h-9 px-3 py-1.5 text-xs font-bold bg-slate-50 border-slate-200"
                        />
                        <span className="text-xs text-slate-500 font-medium shrink-0">{currentProject?.location}</span>

                        {activeRole === 'superadmin' && projects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(selectedProjectId)}
                            title="Delete this project"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {activeRole === 'superadmin' && (
                          <button
                            type="button"
                            onClick={() => setShowNewProjectModal(true)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>New Project</span>
                          </button>
                        )}
                      </div>

                      {/* Display Unit Switcher (INR Crores, INR Lakhs, INR Millions) */}
                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setCurrencyUnit('Cr')}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            currencyUnit === 'Cr'
                              ? 'bg-white text-blue-600 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          INR Crores
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrencyUnit('Lakhs')}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            currencyUnit === 'Lakhs'
                              ? 'bg-white text-blue-600 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          INR Lakhs
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrencyUnit('Millions')}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            currencyUnit === 'Millions'
                              ? 'bg-white text-blue-600 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          INR Millions
                        </button>
                      </div>
                    </div>

                    {projects.length === 0 || !currentProject ? (
                      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
                        <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-sm font-bold text-slate-800">No projects yet</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {activeRole === 'superadmin' ? 'Click "New Project" above to create a project entity.' : 'No projects have been registered yet.'}
                        </p>
                      </div>
                    ) : (
                      <>
                    {/* Probability Meter (Starts at 25%, rises to 100% when marked as funded) */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Probability of Success
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-blue-600">
                            {currentProbability}%
                          </span>

                          {/* Super Admin funded marker */}
                          {activeRole === 'superadmin' ? (
                            <button
                              type="button"
                              onClick={handleToggleFunded}
                              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                currentProject?.isFunded
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                            >
                              {currentProject?.isFunded ? 'Funded (100%)' : 'Mark as Funded'}
                            </button>
                          ) : (
                            <span
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                                currentProject?.isFunded
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {currentProject?.isFunded ? 'Funded' : 'In Appraisal'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            currentProbability === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${currentProbability}%` }}
                        />
                      </div>
                    </div>

                    {/* Promoters (Add multiple promoters, view or manage) */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Promoters ({currentProject?.promoters.length || 0})
                          </h3>
                        </div>

                        {activeRole === 'superadmin' && (
                          <button
                            type="button"
                            onClick={() => setShowAddPromoterForm(!showAddPromoterForm)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Promoter</span>
                          </button>
                        )}
                      </div>

                      {showAddPromoterForm && activeRole === 'superadmin' && (
                        <form onSubmit={handleAddPromoter} className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                          <input
                            type="text"
                            placeholder="Name"
                            required
                            value={newPromoterName}
                            onChange={(e) => setNewPromoterName(e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                          />
                          <input
                            type="text"
                            placeholder="Experience"
                            value={newPromoterExp}
                            onChange={(e) => setNewPromoterExp(e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                          />
                          <input
                            type="text"
                            placeholder="Qualification"
                            value={newPromoterQual}
                            onChange={(e) => setNewPromoterQual(e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                          />
                          <input
                            type="number"
                            placeholder="Share %"
                            value={newPromoterShare}
                            onChange={(e) => setNewPromoterShare(e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Role"
                              value={newPromoterRole}
                              onChange={(e) => setNewPromoterRole(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                            />
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                            <tr>
                              <th className="py-2.5 px-4">Name</th>
                              <th className="py-2.5 px-4">Experience</th>
                              <th className="py-2.5 px-4">Qualification</th>
                              <th className="py-2.5 px-4">Role</th>
                              <th className="py-2.5 px-4">Share %</th>
                              {activeRole === 'superadmin' && <th className="py-2.5 px-4 text-right">Actions</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {currentProject?.promoters.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-4 font-semibold text-slate-900">{p.name}</td>
                                <td className="py-2.5 px-4 text-slate-600">{p.experience}</td>
                                <td className="py-2.5 px-4 text-slate-600">{p.qualification}</td>
                                <td className="py-2.5 px-4 text-slate-700 font-medium">{p.role}</td>
                                <td className="py-2.5 px-4 font-bold text-blue-600">{p.shareholdingPct}%</td>
                                {activeRole === 'superadmin' && (
                                  <td className="py-2.5 px-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePromoter(p.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Project Cost and Means of Finance (with unit display) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Project Cost Components */}
                      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Project Cost ({formatCurrency(totalCostCr)})
                          </h3>
                          {activeRole === 'superadmin' && (
                            <button
                              type="button"
                              onClick={() => setShowAddCostForm(!showAddCostForm)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Component</span>
                            </button>
                          )}
                        </div>

                        {showAddCostForm && activeRole === 'superadmin' && (
                          <form onSubmit={handleAddCostComponent} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-2 text-xs">
                            <input
                              type="text"
                              placeholder="Component Name"
                              required
                              value={newCostCat}
                              onChange={(e) => setNewCostCat(e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                            />
                            <input
                              type="number"
                              step="0.1"
                              placeholder="Amount (₹ Cr)"
                              required
                              value={newCostAmount}
                              onChange={(e) => setNewCostAmount(e.target.value)}
                              className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                            />
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg cursor-pointer"
                            >
                              Add
                            </button>
                          </form>
                        )}

                        <div className="space-y-2">
                          {currentProject?.costComponents.map((comp) => (
                            <div
                              key={comp.id}
                              className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs"
                            >
                              <span className="font-medium text-slate-800">{comp.category}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-900">{formatCurrency(comp.amountCr)}</span>
                                {activeRole === 'superadmin' && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCostComponent(comp.id)}
                                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Means of Finance */}
                      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Means of Finance ({formatCurrency(totalMeansOfFinanceCr)})
                          </h3>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                            <span className="font-medium text-slate-700">Promoter Equity</span>
                            {activeRole === 'superadmin' ? (
                              <input
                                type="number"
                                step="0.1"
                                value={currentProject?.meansOfFinance.equityCr}
                                onChange={(e) => handleUpdateFinance('equityCr', parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-bold"
                              />
                            ) : (
                              <span className="font-bold text-slate-900">
                                {formatCurrency(currentProject?.meansOfFinance.equityCr || 0)}
                              </span>
                            )}
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                            <span className="font-medium text-slate-700">Term Debt / Bank Loan</span>
                            {activeRole === 'superadmin' ? (
                              <input
                                type="number"
                                step="0.1"
                                value={currentProject?.meansOfFinance.debtCr}
                                onChange={(e) => handleUpdateFinance('debtCr', parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-bold text-blue-600"
                              />
                            ) : (
                              <span className="font-bold text-blue-600">
                                {formatCurrency(currentProject?.meansOfFinance.debtCr || 0)}
                              </span>
                            )}
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                            <span className="font-medium text-slate-700">Subsidies / Grants</span>
                            {activeRole === 'superadmin' ? (
                              <input
                                type="number"
                                step="0.1"
                                value={currentProject?.meansOfFinance.subsidyCr}
                                onChange={(e) => handleUpdateFinance('subsidyCr', parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-bold text-emerald-600"
                              />
                            ) : (
                              <span className="font-bold text-emerald-600">
                                {formatCurrency(currentProject?.meansOfFinance.subsidyCr || 0)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Checklist (Upload generic checklist, NO download allowed, disclaimer) */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Checklist
                        </h3>
                        {activeRole === 'superadmin' && (
                          <label className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Checklist</span>
                            <input
                              type="file"
                              onChange={handleUploadChecklist}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              currentProject?.checklistUploaded ? 'text-emerald-500' : 'text-slate-300'
                            }`}
                          />
                          <span className="font-medium text-slate-800">
                            {currentProject?.checklistUploaded
                              ? currentProject.checklistFileName || 'Generic Checklist Document'
                              : 'No checklist uploaded'}
                          </span>
                        </div>
                        {currentProject?.checklistUploaded && (
                          <span className="text-[10px] text-slate-400 font-medium">Uploaded</span>
                        )}
                      </div>

                      {/* Required Disclaimer */}
                      <p className="text-[11px] text-slate-500 italic bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-xl">
                        This checklist is indicative, not exhaustive, and may differ from bank to bank.
                      </p>
                    </div>

                    {/* Documents (Optional Uploads) */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Documents (Optional Uploads)
                        </h3>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        {(
                          [
                            { key: 'companyKyc', label: 'Company KYC' },
                            { key: 'promoterKyc', label: 'Promoter KYC' },
                            { key: 'dpr', label: 'DPR' },
                            { key: 'financialModel', label: 'Financial model' },
                            { key: 'otherDocs', label: 'Other documents' }
                          ] as const
                        ).map((doc) => {
                          const uploadedFile = currentProject?.documents[doc.key];
                          return (
                            <div
                              key={doc.key}
                              className="p-3 bg-slate-50 rounded-xl flex items-center justify-between"
                            >
                              <div>
                                <span className="font-medium text-slate-800">{doc.label}</span>
                                {uploadedFile && (
                                  <div className="text-[10px] text-slate-400">{uploadedFile}</div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {uploadedFile ? (
                                  <>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Uploaded
                                    </span>
                                    {activeRole === 'superadmin' && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDocument(doc.key)}
                                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  activeRole === 'superadmin' && (
                                    <label className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                                      <Upload className="w-3 h-3" />
                                      <span>Upload</span>
                                      <input
                                        type="file"
                                        onChange={(e) => handleUploadDocument(doc.key, e)}
                                        className="hidden"
                                      />
                                    </label>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    </>
                    )}
                  </div>
                )}

                {/* 3. DPR Requests (Super Admin can assign to DPR Consultant 1, 2, 3...) */}
                {activeTab === 'dpr' && (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        DPR Requests ({dprRequests.length})
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                          <tr>
                            <th className="py-2.5 px-5">Project / Promoter</th>
                            <th className="py-2.5 px-5">Contact</th>
                            <th className="py-2.5 px-5">Date</th>
                            <th className="py-2.5 px-5">Assigned Consultant</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dprRequests.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-xs text-slate-500 font-medium">
                                No DPR requests yet
                              </td>
                            </tr>
                          ) : (
                            dprRequests.map((req) => (
                            <tr key={req.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-5 font-semibold text-slate-900">
                                {req.projectName}
                                <div className="text-[11px] text-slate-400 font-normal">{req.promoterName}</div>
                              </td>
                              <td className="py-3 px-5 text-slate-600">
                                <div>{req.email}</div>
                                <div className="text-[11px] text-slate-400">{req.phone}</div>
                              </td>
                              <td className="py-3 px-5 text-slate-500">{req.date}</td>
                              <td className="py-3 px-5">
                                {activeRole === 'superadmin' ? (
                                  <UISelect
                                    value={req.assignedConsultant || ''}
                                    onValueChange={(val) => handleAssignDprConsultant(req.id, val)}
                                    placeholder="Unassigned"
                                    options={[
                                      { value: '', label: 'Unassigned' },
                                      { value: 'DPR Consultant 1', label: 'DPR Consultant 1' },
                                      { value: 'DPR Consultant 2', label: 'DPR Consultant 2' },
                                      { value: 'DPR Consultant 3', label: 'DPR Consultant 3' },
                                      { value: 'DPR Consultant 4', label: 'DPR Consultant 4' }
                                    ]}
                                    triggerClassName="h-8 px-2.5 py-1 text-xs bg-slate-50 border-slate-200"
                                  />
                                ) : (
                                  <span className="font-semibold text-slate-800">
                                    {req.assignedConsultant || 'Unassigned'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          )))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. Consultations (Super Admin can assign to Prosync) */}
                {activeTab === 'consultations' && (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Consultations ({consultations.length})
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                          <tr>
                            <th className="py-2.5 px-5">Client Name</th>
                            <th className="py-2.5 px-5">Contact</th>
                            <th className="py-2.5 px-5">Category / Ticket</th>
                            <th className="py-2.5 px-5">Date</th>
                            <th className="py-2.5 px-5 text-right">Assignment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {consultations.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-xs text-slate-500 font-medium">
                                No consultations yet
                              </td>
                            </tr>
                          ) : (
                            consultations.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-5 font-semibold text-slate-900">{c.clientName}</td>
                              <td className="py-3 px-5 text-slate-600">
                                <div>{c.email}</div>
                                <div className="text-[11px] text-slate-400">{c.phone}</div>
                              </td>
                              <td className="py-3 px-5 font-medium text-slate-800">{c.projectCategory}</td>
                              <td className="py-3 px-5 text-slate-500">{c.date}</td>
                              <td className="py-3 px-5 text-right">
                                {c.assignedTo === 'Prosync' ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    Assigned to Prosync
                                  </span>
                                ) : activeRole === 'superadmin' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleAssignConsultationToProsync(c.id)}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                                  >
                                    Assign to Prosync
                                  </button>
                                ) : (
                                  <span className="text-slate-400 font-medium text-[11px]">Unassigned</span>
                                )}
                              </td>
                            </tr>
                          )))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. Visitors (Read-Only for both roles) */}
                {activeTab === 'visitors' && (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-4">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Visitor Sessions ({visitors.length})
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        Read-Only
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                          <tr>
                            <th className="py-2.5 px-4">Session ID</th>
                            <th className="py-2.5 px-4">Page Visited</th>
                            <th className="py-2.5 px-4">Timestamp</th>
                            <th className="py-2.5 px-4">Device / OS</th>
                            <th className="py-2.5 px-4">Browser</th>
                            <th className="py-2.5 px-4">Location</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {visitors.map((v) => (
                            <tr key={v.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">{v.sessionId}</td>
                              <td className="py-2.5 px-4 font-medium text-slate-900">{v.path}</td>
                              <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                                {new Date(v.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </td>
                              <td className="py-2.5 px-4 text-slate-700">{v.device}</td>
                              <td className="py-2.5 px-4 text-slate-700">{v.browser}</td>
                              <td className="py-2.5 px-4 text-slate-700">{v.location || 'Local / Inferred'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            </main>
          </div>
        )}

        {/* Modal: Super Admin New Project Creation */}
        {showNewProjectModal && activeRole === 'superadmin' && (
          <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 font-manrope">Create New Project</h3>
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreateProject} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    placeholder="e.g. Solar Park Alpha"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Industry</label>
                  <input
                    type="text"
                    value={newProjIndustry}
                    onChange={(e) => setNewProjIndustry(e.target.value)}
                    placeholder="e.g. Renewable Energy"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    value={newProjLocation}
                    onChange={(e) => setNewProjLocation(e.target.value)}
                    placeholder="e.g. Gujarat, India"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewProjectModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 cursor-pointer"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
