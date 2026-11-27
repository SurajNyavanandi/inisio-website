import mongoose from 'mongoose';

const introductionRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    promoterName: {
      type: String,
      default: 'Promoter',
      trim: true,
    },
    promoterPhone: {
      type: String,
      default: '',
      trim: true,
    },
    projectId: {
      type: String,
      default: '',
      trim: true,
    },
    projectName: {
      type: String,
      default: 'Greenfield Project',
      trim: true,
    },
    projectLocation: {
      type: String,
      default: '',
      trim: true,
    },
    projectCostCr: {
      type: String,
      default: '',
      trim: true,
    },
    consultantId: {
      type: String,
      default: '',
      trim: true,
    },
    consultantName: {
      type: String,
      required: true,
      trim: true,
    },
    consultantEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    consultantPhone: {
      type: String,
      default: '',
      trim: true,
    },
    consultantCity: {
      type: String,
      default: '',
      trim: true,
    },
    consultantState: {
      type: String,
      default: '',
      trim: true,
    },
    isProsync: {
      type: Boolean,
      default: false,
      index: true,
    },
    serviceCategory: {
      type: String,
      default: 'CMA & Financial Analysis',
      trim: true,
    },
    preferredDate: {
      type: String,
      default: '',
    },
    preferredSlot: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Submitted', 'Contacted', 'Discussion', 'Engagement / Closed', 'Unavailable / Cancelled'],
      default: 'Submitted',
      index: true,
    },
    callCenterStatus: {
      type: String,
      default: 'Assigned to Call Center',
    },
    whatsappSharedToConsultant: {
      type: Boolean,
      default: false,
    },
    countedAgainstQuota: {
      type: Boolean,
      default: true,
    },
    consentToShareProjectData: {
      type: Boolean,
      required: true,
      default: false,
    },
    consentAcceptedAt: {
      type: Date,
      default: Date.now,
    },
    membershipPlanIdAtRequest: {
      type: String,
      default: 'free_plan',
    },
    consultationId: {
      type: String,
      default: '',
    },
    leadId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

introductionRequestSchema.index({ createdAt: -1 });

const IntroductionRequest =
  mongoose.models.IntroductionRequest ||
  mongoose.model('IntroductionRequest', introductionRequestSchema);

export default IntroductionRequest;
