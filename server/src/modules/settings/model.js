import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    platformName: { type: String, required: true },
    welcomeBonusAmount: { type: Number, required: true },
    trialBonusAmount: { type: Number, default: 0 },
    minCashOutAmount: { type: Number, required: true },
    supportTelegramUsername: { type: String, required: true },
    demoCashInUSDTAddress: { type: String, required: true },
  },
  { timestamps: true }
);

export const Settings = mongoose.model('Settings', settingsSchema);
