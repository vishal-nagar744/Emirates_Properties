import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    platformName: { type: String, required: true },
    welcomeBonusAmount: { type: Number, required: true },
    trialBonusAmount: { type: Number, default: 0 },
    minCashOutAmount: { type: Number, required: true },
    supportTelegramUsername: { type: String, required: true },
    supportWhatsappNumber: { type: String, default: '' },
    demoCashInUSDTAddress: { type: String, default: '' },
    bankPayoutEnabled: { type: Boolean, default: true },
    cryptoPayoutEnabled: { type: Boolean, default: false },
    about: { type: mongoose.Schema.Types.Mixed, default: null },
    terms: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export const Settings = mongoose.model('Settings', settingsSchema);
