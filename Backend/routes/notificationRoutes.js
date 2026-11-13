import express from 'express';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} from '../controllers/notificationController.js';
import { authenticateUser, authorizeRoles, restrictSuperAdminViewer } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', getNotifications);
router.post('/', authorizeRoles('admin', 'superadmin', 'ca', 'dpr', 'prosync'), createNotification);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/clear-all', restrictSuperAdminViewer, authorizeRoles('admin'), clearNotifications);

export default router;
