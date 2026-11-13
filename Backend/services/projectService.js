import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import { isDBConnected } from '../config/db.js';

let memoryProjects = [];

export const getProjects = async (filter = {}, userRole = 'admin', userId = null) => {
  const limit = Math.min(Math.max(parseInt(filter.limit) || 50, 1), 100);
  if (isDBConnected()) {
    try {
      let query = {};
      
      if (filter.email && userId) {
        query.$or = [
          { userId: userId },
          { email: { $regex: new RegExp(`^${filter.email.trim()}$`, 'i') } }
        ];
      } else if (filter.email) {
        query.email = { $regex: new RegExp(`^${filter.email.trim()}$`, 'i') };
      } else if (userRole === 'user' && userId) {
        query.userId = userId;
      }

      const projects = await Project.find(query).sort({ updatedAt: -1 }).limit(limit).lean();
      return projects;
    } catch (err) {
      console.warn('MongoDB query failed in getProjects, using memory fallback:', err.message);
    }
  }

  // Memory fallback filtering
  let results = [...memoryProjects];
  if (filter.email) {
    const em = filter.email.toLowerCase();
    results = results.filter((p) => (p.email && p.email.toLowerCase() === em) || (userId && p.userId === userId));
  } else if (userRole === 'user' && userId) {
    results = results.filter((p) => p.userId === userId);
  }
  return results.slice(0, limit).sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
};

export const createProject = async (rawProjectData, userId = null) => {
  const projectData = { ...rawProjectData };
  delete projectData.status;
  delete projectData.assignedCA;
  delete projectData.assignedBank;
  delete projectData.caReviewNotes;
  delete projectData.dprAssignedTo;
  delete projectData.consultationAssignedTo;

  if (isDBConnected()) {
    try {
      const project = await Project.create({
        ...projectData,
        userId: userId || null,
      });

      try {
        await Notification.create({
          type: 'PROJECT_MODIFIED',
          title: 'New Greenfield Project Created',
          message: `${project.promoterName || 'Promoter'} (${project.email || 'N/A'}) created project '${project.projectName}' (₹${project.capexCr} Cr).`,
          userEmail: project.email,
          userName: project.promoterName,
          projectName: project.projectName,
          read: false,
          metadata: { capexCr: project.capexCr, loanCr: project.loanCr, status: project.status }
        });
      } catch (e) {}

      return project;
    } catch (err) {
      console.warn('MongoDB create failed in createProject, using memory fallback:', err.message);
    }
  }

  const created = {
    _id: `proj_${Date.now()}`,
    ...projectData,
    userId: userId || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryProjects.unshift(created);
  return created;
};

export const getProjectById = async (id, requester = null) => {
  let project = null;
  if (isDBConnected()) {
    try {
      project = await Project.findById(id).lean();
    } catch (err) {}
  }
  if (!project) {
    project = memoryProjects.find((p) => String(p._id) === String(id));
  }
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization check (prevent IDOR)
  if (requester) {
    const isAdmin = ['admin', 'superadmin'].includes(requester.role);
    const isOwner = String(project.userId || '') === String(requester._id || '') ||
      Boolean(project.email && requester.email && project.email.toLowerCase() === requester.email.toLowerCase());
    const isStaff = ['ca', 'dpr', 'prosync'].includes(requester.role);
    if (!isAdmin && !isOwner && !isStaff) {
      const error = new Error('Access denied: You are not authorized to view this project.');
      error.statusCode = 403;
      throw error;
    }
  }

  return project;
};

export const updateProjectAudit = async (id, status, caReviewNotes = '', assignedCA = '', updates = {}) => {
  if (isDBConnected()) {
    try {
      const project = await Project.findById(id);
      if (project) {
        if (status) project.status = status;
        if (caReviewNotes) project.caReviewNotes = caReviewNotes;
        if (assignedCA) project.assignedCA = assignedCA;
        
        if (updates) {
          if (updates.capexCr !== undefined) project.capexCr = updates.capexCr;
          if (updates.loanCr !== undefined) project.loanCr = updates.loanCr;
          if (updates.equityCr !== undefined) project.equityCr = updates.equityCr;
          if (updates.dscr !== undefined) project.dscr = updates.dscr;
          if (updates.projectName) project.projectName = updates.projectName;
          if (updates.industry) project.industry = updates.industry;
          if (updates.location) project.location = updates.location;
        }

        const saved = await project.save();
        return saved;
      }
    } catch (err) {}
  }

  const idx = memoryProjects.findIndex((p) => String(p._id) === String(id));
  if (idx === -1) throw new Error('Project not found');

  const p = memoryProjects[idx];
  if (status) p.status = status;
  if (caReviewNotes) p.caReviewNotes = caReviewNotes;
  if (assignedCA) p.assignedCA = assignedCA;
  if (updates) {
    Object.assign(p, updates);
  }
  p.updatedAt = new Date();
  memoryProjects[idx] = p;
  return p;
};

export const deleteProject = async (id) => {
  if (isDBConnected()) {
    try {
      const project = await Project.findByIdAndDelete(id);
      if (project) return project;
    } catch (err) {}
  }
  const idx = memoryProjects.findIndex((p) => String(p._id) === String(id));
  if (idx === -1) throw new Error('Project not found');
  const removed = memoryProjects.splice(idx, 1)[0];
  return removed;
};

export default {
  getProjects,
  createProject,
  getProjectById,
  updateProjectAudit,
  deleteProject,
};

