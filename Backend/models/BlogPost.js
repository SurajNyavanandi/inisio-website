import mongoose from 'mongoose';

const blogPostSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    readTime: {
      type: String,
      default: '5 min read',
    },
    excerpt: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    author: {
      type: String,
      default: 'Inisio Research & Advisory Desk',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', blogPostSchema);
export default BlogPost;
