import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    mobileDigits: { type: String, required: true, unique: true },
    loginId: { type: String, unique: true, sparse: true },
    passwordHash: { type: String, required: true },
    withdrawalPasswordHash: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
    referralCode: { type: String, required: true, unique: true },
    referredBy: { type: String, default: null },
    accountStatus: {
      type: String,
      enum: ['active', 'frozen', 'suspended'],
      default: 'active',
    },
    welcomeBonusReceived: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0 },
    pendingCashOut: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
