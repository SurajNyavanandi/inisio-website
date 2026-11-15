import { isDBConnected } from '../config/db.js';
import Industry from '../models/Industry.js';
import Service from '../models/Service.js';
import PlatformStat from '../models/PlatformStat.js';
import Testimonial from '../models/Testimonial.js';
import BlogPost from '../models/BlogPost.js';
import FAQ from '../models/FAQ.js';
import {
  DEFAULT_INDUSTRIES,
  DEFAULT_SERVICES,
  DEFAULT_PLATFORM_STATS,
  DEFAULT_TESTIMONIALS,
  DEFAULT_BLOGS,
  DEFAULT_FAQS,
} from './defaultData.js';

export const seedDatabase = async () => {
  if (!isDBConnected()) {
    return;
  }

  try {
    // 1. Seed Industries
    const industryCount = await Industry.countDocuments();
    if (industryCount === 0) {
      await Industry.insertMany(DEFAULT_INDUSTRIES);
      console.log(`🌱 Seeded ${DEFAULT_INDUSTRIES.length} default industries into MongoDB.`);
    }

    // 2. Seed Services
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      await Service.insertMany(DEFAULT_SERVICES);
      console.log(`🌱 Seeded ${DEFAULT_SERVICES.length} default services into MongoDB.`);
    }

    // 3. Seed Platform Stats
    const statCount = await PlatformStat.countDocuments();
    if (statCount === 0) {
      await PlatformStat.insertMany(DEFAULT_PLATFORM_STATS);
      console.log(`🌱 Seeded ${DEFAULT_PLATFORM_STATS.length} platform stats into MongoDB.`);
    }

    // 4. Seed Testimonials
    const testimonialCount = await Testimonial.countDocuments();
    if (testimonialCount === 0) {
      await Testimonial.insertMany(DEFAULT_TESTIMONIALS);
      console.log(`🌱 Seeded ${DEFAULT_TESTIMONIALS.length} testimonials into MongoDB.`);
    }

    // 5. Seed Blogs
    const blogCount = await BlogPost.countDocuments();
    if (blogCount === 0) {
      await BlogPost.insertMany(DEFAULT_BLOGS);
      console.log(`🌱 Seeded ${DEFAULT_BLOGS.length} blog posts into MongoDB.`);
    }

    // 6. Seed FAQs
    const faqCount = await FAQ.countDocuments();
    if (faqCount === 0) {
      await FAQ.insertMany(DEFAULT_FAQS);
      console.log(`🌱 Seeded ${DEFAULT_FAQS.length} FAQs into MongoDB.`);
    }
  } catch (err) {
    console.warn('Database auto-seed skipped or encountered error:', err.message);
  }
};

export default seedDatabase;
