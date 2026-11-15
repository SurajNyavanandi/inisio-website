import express from 'express';
import statController from '../controllers/statController.js';

const router = express.Router();

router.get('/', statController.getAllStats);
router.post('/', statController.createStat);

export default router;
