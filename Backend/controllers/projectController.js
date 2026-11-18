import projectService from '../services/projectService.js';
import { sendSuccess } from '../utils/responseHandler.js';

export const getProjects = async (req, res, next) => {
  try {
    const role = req.user ? req.user.role : 'user';
    const userId = req.user ? req.user._id : null;
    const userEmail = req.user ? req.user.email : null;
    const projects = await projectService.getProjects(req.query, role, userId, userEmail);
    return sendSuccess(res, projects, 'Projects retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user);
    return sendSuccess(res, project, 'Project details fetched');
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const role = req.user ? req.user.role : 'user';
    const project = await projectService.createProject(req.body, userId, role);
    return sendSuccess(res, project, 'Project created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body, req.user);
    return sendSuccess(res, project, 'Project updated successfully');
  } catch (error) {
    next(error);
  }
};

export const updateProjectAudit = async (req, res, next) => {
  try {
    const { status, cmaAuditStatus, bankabilityStatus, caReviewNotes, assignedCA, dscr, debtEquityRatio } = req.body;
    const effectiveStatus = status || cmaAuditStatus || bankabilityStatus;
    const project = await projectService.updateProjectAudit(
      req.params.id,
      effectiveStatus,
      caReviewNotes,
      assignedCA,
      { ...req.body, ...(dscr !== undefined ? { dscr: Number(dscr) } : {}), ...(debtEquityRatio !== undefined ? { debtEquityRatio } : {}) }
    );
    return sendSuccess(res, project, 'Project audit status updated');
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    await projectService.deleteProject(req.params.id);
    return sendSuccess(res, null, 'Project removed');
  } catch (error) {
    next(error);
  }
};

export default {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectAudit,
  deleteProject,
};
