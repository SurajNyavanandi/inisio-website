import mongoose from 'mongoose';

const platformStatSchema = new mongoose.Schema(
  {
    statId: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Number,
      required: true,
    },
    prefix: {
      type: String,
      default: '',
    },
    suffix: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: 'TrendingUp',
    },
    order: {
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

const PlatformStat = mongoose.models.PlatformStat || mongoose.model('PlatformStat', platformStatSchema);
export default PlatformStat;
