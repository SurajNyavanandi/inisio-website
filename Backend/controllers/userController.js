import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Project from '../models/Project.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { isDBConnected } from '../config/db.js';
import {
  getMemoryUsers,
  findMemoryUserById,
  findMemoryUserByEmail,
  updateMemoryUser,
  deleteMemoryUser as removeMemoryUser,
} from '../utils/memoryUserStore.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const skip = (page - 1) * limit;

    if (isDBConnected()) {
      try {
        const users = await User.find({})
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();

        if (users && users.length > 0) {
          const userIds = users.map((u) => u._id);
          const userEmails = users.map((u) => u.email).filter(Boolean);

          // Batch aggregate counts to completely eliminate N+1 queries
          const [leadCountsById, leadCountsByEmail, projectCountsById, projectCountsByEmail] = await Promise.all([
            Lead.aggregate([
              { $match: { userId: { $in: userIds } } },
              { $group: { _id: '$userId', count: { $sum: 1 } } },
            ]),
            Lead.aggregate([
              { $match: { email: { $in: userEmails } } },
              { $group: { _id: '$email', count: { $sum: 1 } } },
            ]),
            Project.aggregate([
              { $match: { userId: { $in: userIds } } },
              { $group: { _id: '$userId', count: { $sum: 1 } } },
            ]),
            Project.aggregate([
              { $match: { email: { $in: userEmails } } },
              { $group: { _id: '$email', count: { $sum: 1 } } },
            ]),
          ]);

          const leadMap = new Map();
          leadCountsById.forEach((r) => leadMap.set(String(r._id), (leadMap.get(String(r._id)) || 0) + r.count));
          leadCountsByEmail.forEach((r) => leadMap.set(String(r._id).toLowerCase(), (leadMap.get(String(r._id).toLowerCase()) || 0) + r.count));

          const projectMap = new Map();
          projectCountsById.forEach((r) => projectMap.set(String(r._id), (projectMap.get(String(r._id)) || 0) + r.count));
          projectCountsByEmail.forEach((r) => projectMap.set(String(r._id).toLowerCase(), (projectMap.get(String(r._id).toLowerCase()) || 0) + r.count));

          const enrichedUsers = users.map((u) => {
            const uid = String(u._id);
            const uemail = (u.email || '').toLowerCase();
            const leadCount = Math.max(leadMap.get(uid) || 0, leadMap.get(uemail) || 0);
            const projectCount = Math.max(projectMap.get(uid) || 0, projectMap.get(uemail) || 0);
            return {
              ...u,
              projectsCount: Math.max(leadCount, projectCount),
            };
          });

          return sendSuccess(res, enrichedUsers, 'Users retrieved successfully');
        }
        return sendSuccess(res, [], 'Users retrieved successfully');
      } catch (err) {
        console.warn('DB error in getAllUsers:', err.message);
      }
    }

    const safeUsers = getMemoryUsers()
      .map(({ password, ...u }) => u)
      .slice(skip, skip + limit);
    return sendSuccess(res, safeUsers, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    if (isDBConnected()) {
      try {
        const user = await User.findById(req.params.id).select('-password').lean();
        if (user) {
          return sendSuccess(res, user, 'User found');
        }
      } catch (err) {}
    }
    const found = findMemoryUserById(req.params.id);
    if (!found) {
      return sendError(res, 'User not found', 404);
    }
    const { password, ...safeUser } = found;
    return sendSuccess(res, safeUser, 'User found');
  } catch (error) {
    next(error);
  }
};

export const getUserByEmail = async (req, res, next) => {
  try {
    const cleanEmail = decodeURIComponent(req.params.email || '').trim().toLowerCase();
    if (isDBConnected()) {
      try {
        const user = await User.findOne({ email: cleanEmail }).select('-password').lean();
        if (user) {
          return sendSuccess(res, user, 'User found');
        }
      } catch (err) {}
    }
    const found = findMemoryUserByEmail(cleanEmail);
    if (!found) {
      return sendError(res, 'User not found', 404);
    }
    const { password, ...safeUser } = found;
    return sendSuccess(res, safeUser, 'User found');
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) {
      return sendError(res, 'Role is required', 400);
    }

    if (isDBConnected()) {
      try {
        const user = await User.findByIdAndUpdate(
          req.params.id,
          { role },
          { new: true }
        ).select('-password').lean();
        if (user) {
          return sendSuccess(res, user, `User role updated to ${role}`);
        }
      } catch (err) {}
    }

    const updated = updateMemoryUser(req.params.id, { role });
    if (!updated) {
      return sendError(res, 'User not found', 404);
    }
    const { password, ...safeUser } = updated;
    return sendSuccess(res, safeUser, `User role updated to ${role}`);
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return sendError(res, 'Status is required', 400);
    }

    if (isDBConnected()) {
      try {
        const user = await User.findByIdAndUpdate(
          req.params.id,
          { status },
          { new: true }
        ).select('-password').lean();
        if (user) {
          return sendSuccess(res, user, `User status updated to ${status}`);
        }
      } catch (err) {}
    }

    const updated = updateMemoryUser(req.params.id, { status });
    return sendSuccess(res, { id: req.params.id, status }, `User status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (isDBConnected()) {
      try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (user) {
          return sendSuccess(res, null, 'User deleted successfully');
        }
      } catch (err) {}
    }
    removeMemoryUser(req.params.id);
    return sendSuccess(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  getAllUsers,
  getUserById,
  getUserByEmail,
  updateUserRole,
  updateUserStatus,
  deleteUser,
};
