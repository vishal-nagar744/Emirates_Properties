import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true },
    message: { type: String, required: true },
    displayStyle: {
      type: String,
      enum: ['popup', 'banner', 'both'],
      default: 'popup',
    },
    audienceType: {
      type: String,
      enum: ['all', 'selected', 'groups', 'status'],
      default: 'all',
    },
    audienceUserIds: { type: [String], default: [] },
    audienceGroupIds: { type: [String], default: [] },
    audienceStatuses: { type: [String], default: [] },
    scheduleType: {
      type: String,
      enum: ['once', 'daily', 'weekly'],
      default: 'once',
    },
    startAt: { type: Date, required: true },
    endAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused'],
      default: 'draft',
    },
    publishedAt: { type: Date, default: null },
    pausedAt: { type: Date, default: null },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

announcementSchema.index({ status: 1, startAt: 1, endAt: 1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);

const announcementReceiptSchema = new mongoose.Schema(
  {
    announcementId: { type: String, required: true },
    userId: { type: String, required: true },
    occurrenceKey: { type: String, required: true },
    seenAt: { type: Date, default: null },
    dismissedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

announcementReceiptSchema.index(
  { announcementId: 1, userId: 1, occurrenceKey: 1 },
  { unique: true }
);

export const AnnouncementReceipt = mongoose.model('AnnouncementReceipt', announcementReceiptSchema);
