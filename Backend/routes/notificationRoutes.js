import express from 'express';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} from '../controllers/notificationController.js';
<<<<<<< HEAD
import { authenticateUser, authorizeRoles, restrictSuperAdminViewer } from '../middleware/authMiddleware.js';
=======
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92

const router = express.Router();

router.use(authenticateUser);

router.get('/', getNotifications);
<<<<<<< HEAD
router.post('/', authorizeRoles('admin', 'superadmin', 'ca', 'dpr', 'prosync'), createNotification);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/clear-all', restrictSuperAdminViewer, authorizeRoles('admin'), clearNotifications);
=======
router.post('/', createNotification);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/clear-all', authorizeRoles('admin', 'superadmin', 'admin1', 'admin2', 'admin3'), clearNotifications);
>>>>>>> eff249abd87115d2970592cca5ca8dd14ee08b92

export default router;
