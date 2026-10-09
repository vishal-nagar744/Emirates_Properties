import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    mobileDigits: { type: String, required: true, unique: true },
    loginId: { type: String },
    passwordHash: { type: String, required: true },
    withdrawalPasswordHash: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
    referralCode: { type: String, required: true, unique: true },
    referredBy: { type: String, default: null },
    accountStatus: {
      type: String,
      enum: ['active', 'pending', 'blocked', 'suspended'],
      default: 'pending',
    },
    welcomeBonusReceived: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0 },
    trialBalance: { type: Number, default: 0 },
    holdBalance: { type: Number, default: 0 },
    holdGroupId: { type: String, default: '' },
    pendingCashOut: { type: Number, default: 0 },
    lockedGroupIds: { type: [String], default: [] },
    groupAccessSet: { type: Boolean, default: false },
    unlockedGroupIds: { type: [String], default: [] },
    setAccessSet: { type: Boolean, default: false },
    unlockedSetKeys: { type: [String], default: [] },
    unlockNotices: { type: [mongoose.Schema.Types.Mixed], default: [] },
    progressDate: { type: String, default: '' },
  },
  { timestamps: true }
);

userSchema.index(
  { loginId: 1 },
  { unique: true, partialFilterExpression: { loginId: { $type: 'string' } } }
);

export const User = mongoose.model('User', userSchema);
