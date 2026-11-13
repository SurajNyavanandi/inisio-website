import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import { isDBConnected } from '../config/db.js';
import { escapeRegex } from '../middleware/validateMiddleware.js';

let memoryProjects = [];

export const getProjects = async (filter = {}, userRole = 'admin', userId = null) => {
<<<<<<< HEAD
  const limit = Math.min(Math.max(parseInt(filter.limit) || 50, 1), 100);
=======
  if (userRole === 'user' && !userId) {
    return [];
  }

  const limit = Math.min(100, Math.max(1, parseInt(filter.limit || '100', 10)));
  const page = Math.max(1, parseInt(filter.page || '1', 10));
  const skip = (page - 1) * limit;

>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92
  if (isDBConnected()) {
    try {
      let query = {};

      if (userRole === 'user') {
        query.userId = userId;
      } else if (filter.email) {
        query.email = { $regex: new RegExp(`^${escapeRegex(filter.email.trim())}$`, 'i') };
      }

<<<<<<< HEAD
      const projects = await Project.find(query).sort({ updatedAt: -1 }).limit(limit).lean();
=======
      const projects = await Project.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean();
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92
      return projects;
    } catch (err) {
      console.warn('MongoDB query failed in getProjects, using memory fallback:', err.message);
    }
  }

  // Memory fallback filtering
  let results = [...memoryProjects];
  if (userRole === 'user') {
    results = results.filter((p) => String(p.userId) === String(userId));
  } else if (filter.email) {
    const em = filter.email.toLowerCase();
    results = results.filter((p) => p.email && p.email.toLowerCase() === em);
  }
<<<<<<< HEAD
  return results.slice(0, limit).sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
=======
  return results
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
    .slice(skip, skip + limit);
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92
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
<<<<<<< HEAD
=======
  if (!requester) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92
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
<<<<<<< HEAD

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

=======
  const isPrivileged = ['admin', 'superadmin', 'ca', 'admin1', 'admin2', 'admin3'].includes(requester.role);
  const isOwner =
    String(project.userId) === String(requester._id) ||
    Boolean(project.email && requester.email && project.email.toLowerCase() === requester.email.toLowerCase());
  if (!isPrivileged && !isOwner) {
    const error = new Error('Access denied. You do not have permission to view this project.');
    error.statusCode = 403;
    throw error;
  }
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92
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

