import express from 'express';
import testimonialController from '../controllers/testimonialController.js';

const router = express.Router();

router.get('/', testimonialController.getAllTestimonials);
router.post('/', testimonialController.createTestimonial);

export default router;
