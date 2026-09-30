import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    mobileDigits: { type: String, required: true, unique: true },
    loginId: { type: String },
    passwordHash: { type: String, required: true },
    securityPasswordHash: { type: String, default: '' },
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
    pendingCashOut: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.index(
  { loginId: 1 },
  { unique: true, partialFilterExpression: { loginId: { $type: 'string' } } }
);

export const User = mongoose.model('User', userSchema);
