import express from 'express';
import faqController from '../controllers/faqController.js';

const router = express.Router();

router.get('/', faqController.getAllFAQs);
router.post('/', faqController.createFAQ);

export default router;
