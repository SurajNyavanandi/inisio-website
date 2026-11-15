import express from 'express';
import {
  getAllUsers,
  getUserById,
  getUserByEmail,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} from '../controllers/userController.js';
import { authenticateUser, authorizeRoles, restrictSuperAdminViewer } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authenticate all user routes
router.use(authenticateUser);

// Viewing routes (Admin & Super Admin Viewer)
router.get('/', authorizeRoles('admin', 'superadmin'), getAllUsers);
router.get('/profile/:email', authorizeRoles('admin', 'superadmin'), getUserByEmail);
router.get('/:id', authorizeRoles('admin', 'superadmin'), getUserById);

// Modification routes (Admin only)
router.put('/:id/role', restrictSuperAdminViewer, authorizeRoles('admin'), updateUserRole);
router.put('/:id/status', restrictSuperAdminViewer, authorizeRoles('admin'), updateUserStatus);
router.delete('/:id', restrictSuperAdminViewer, authorizeRoles('admin'), deleteUser);

export default router;
