import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
  },
  { timestamps: true }
);

imageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export const StoredImage = mongoose.model('StoredImage', imageSchema);
