import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    role: { type: String, enum: ['user', 'admin'], required: true },
    subjectId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    ip: { type: String, default: '' },
    location: { type: String, default: '' },
    device: { type: String, default: '' },
    browser: { type: String, default: '' },
    os: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    method: { type: String, default: '' },
    loginAt: { type: Date, default: null },
    lastActiveAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Session = mongoose.model('Session', sessionSchema);
