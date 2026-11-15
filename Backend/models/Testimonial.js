import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
  {
    testimonialId: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    industry: {
      type: String,
      required: true,
    },
    quote: {
      type: String,
      required: true,
    },
    fundingAmount: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 5,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Testimonial = mongoose.models.Testimonial || mongoose.model('Testimonial', testimonialSchema);
export default Testimonial;
