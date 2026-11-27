import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import config from '../config/env.js';

const refreshTokenEntrySchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email address'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value) => validator.isEmail(String(value || '')),
        message: 'Please add a valid email address',
      },
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'ca', 'ca_admin', 'superadmin', 'dpr', 'prosync', 'admin'],
      default: 'user',
    },
    company: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    membershipPlanId: {
      type: String,
      enum: ['free_plan', 'promoter_boost', 'promoter_plus'],
      default: 'free_plan',
    },
    membershipTier: {
      type: String,
      default: 'Free Plan',
      trim: true,
    },
    membershipStatus: {
      type: String,
      enum: ['Free Plan', 'Active', 'Expiring Soon', 'Expired'],
      default: 'Free Plan',
    },
    membershipActivatedAt: {
      type: Date,
      default: null,
    },
    membershipExpiresAt: {
      type: Date,
      default: null,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    expiryNotifiedAt: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    passwordInitialized: {
      type: Boolean,
      default: true,
    },
    resetPasswordOtp: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    verificationOtp: {
      type: String,
      default: null,
    },
    verificationExpires: {
      type: Date,
      default: null,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    refreshTokens: {
      type: [refreshTokenEntrySchema],
      default: [],
      select: false,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    lastLogin: {
      date: { type: String, default: null },
      time: { type: String, default: null },
      city: { type: String, default: null },
      state: { type: String, default: null },
      country: { type: String, default: null },
      ipAddress: { type: String, default: null },
      device: { type: String, default: null },
      browser: { type: String, default: null },
      timestamp: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for instant queries and high performance in production
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });

// Hash password using bcryptjs (>= 12 rounds) before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const rounds = config.BCRYPT_ROUNDS || 12;
  const salt = await bcrypt.genSalt(rounds);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare user entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!enteredPassword || !this.password) return false;
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch {
    return false;
  }
};

const User = mongoose.model('User', userSchema);

export default User;
