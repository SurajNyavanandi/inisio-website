import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
  {
    testimonialId: {
      type: String,
      unique: true,
      sparse: true,
    },
    recordType: {
      type: String,
      enum: ['case_study', 'testimonial'],
      default: 'case_study',
    },
    projectType: {
      type: String,
      default: '',
      trim: true,
    },
    fundingRequirement: {
      type: String,
      default: '',
      trim: true,
    },
    advisoryScope: {
      type: String,
      default: '',
      trim: true,
    },
    advisoryPartner: {
      type: String,
      default: 'Prosync Consulting (Featured Advisory Partner)',
      trim: true,
    },
    writtenPermission: {
      type: Boolean,
      default: false,
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
      default: 0,
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
