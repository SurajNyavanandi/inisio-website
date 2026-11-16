import mongoose from 'mongoose';

const caProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'CA Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'CA Email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email address',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    firmName: {
      type: String,
      default: '',
      trim: true,
    },
    membershipNumber: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
    },
    cardImageUrl: {
      type: String,
      default: '',
    },
    ocrRawText: {
      type: String,
      default: '',
    },
    sourceTag: {
      type: String,
      default: 'WOFA-2026',
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'invited', 'claimed', 'activated'],
      default: 'pending',
      index: true,
    },
    claimToken: {
      type: String,
      default: null,
      index: true,
    },
    claimExpiresAt: {
      type: Date,
      default: null,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

caProfileSchema.index({ email: 1 });
caProfileSchema.index({ phone: 1 });
caProfileSchema.index({ sourceTag: 1, status: 1 });

const CaProfile = mongoose.models.CaProfile || mongoose.model('CaProfile', caProfileSchema);
export default CaProfile;
