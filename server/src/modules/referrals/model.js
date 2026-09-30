import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema(
  {
    referrerUserId: { type: String, required: true, index: true },
    referredUserId: { type: String, required: true },
    referralCodeUsed: { type: String, required: true },
  },
  { timestamps: true }
);

export const Referral = mongoose.model('Referral', referralSchema);
