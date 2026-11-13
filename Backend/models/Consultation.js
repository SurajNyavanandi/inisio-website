import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide phone number'],
      trim: true,
    },
    companyName: {
      type: String,
      default: '',
      trim: true,
    },
    industry: {
      type: String,
      default: '',
      trim: true,
    },
    projectCostCr: {
      type: String,
      default: '',
    },
    preferredDate: {
      type: String,
      default: '',
    },
    preferredSlot: {
      type: String,
      default: 'Morning (10:00 AM - 1:00 PM)',
    },
    additionalNotes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    assignedAdvisor: {
      type: String,
      default: '',
    },
    feedback: {
      type: String,
      default: '',
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for query filters and lookups
consultationSchema.index({ email: 1 });
consultationSchema.index({ phone: 1 });
consultationSchema.index({ status: 1 });
consultationSchema.index({ createdAt: -1 });

const Consultation = mongoose.models.Consultation || mongoose.model('Consultation', consultationSchema);
export default Consultation;
