import mongoose from 'mongoose';
import { ProjectGroup } from '../groups/model.js';
import { openGroupIds } from '../users/service.js';
import { User } from '../users/model.js';
import { Announcement, AnnouncementReceipt } from './model.js';

const DUBAI_TIME_ZONE = 'Asia/Dubai';
const MEMBER_STATUSES = ['active', 'pending', 'blocked', 'suspended'];

function dubaiDateParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DUBAI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = {};
  parts.forEach((part) => { values[part.type] = part.value; });
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function dailyKey(date) {
  const { year, month, day } = dubaiDateParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function weeklyKey(date) {
  const { year, month, day } = dubaiDateParts(date);
  const dayDate = new Date(Date.UTC(year, month - 1, day));
  const daysSinceMonday = (dayDate.getUTCDay() + 6) % 7;
  dayDate.setUTCDate(dayDate.getUTCDate() - daysSinceMonday);
  return `${dayDate.getUTCFullYear()}-${String(dayDate.getUTCMonth() + 1).padStart(2, '0')}-${String(dayDate.getUTCDate()).padStart(2, '0')}`;
}

function occurrenceKeyFor(row, now) {
  if (row.scheduleType === 'daily') return `daily:${dailyKey(now)}`;
  if (row.scheduleType === 'weekly') return `weekly:${weeklyKey(now)}`;
  return 'once';
}

function stateOf(row, now = new Date()) {
  if (row.status === 'draft') return 'draft';
  if (row.status === 'paused') return 'paused';
  if (row.startAt && new Date(row.startAt).getTime() > now.getTime()) return 'scheduled';
  if (row.endAt && new Date(row.endAt).getTime() < now.getTime()) return 'ended';
  return 'active';
}

function iso(value) {
  return value ? new Date(value).toISOString() : '';
}

function viewAnnouncement(row) {
  return {
    id: String(row._id),
    heading: row.heading,
    message: row.message,
    displayStyle: row.displayStyle || 'popup',
    audienceType: row.audienceType || 'all',
    audienceUserIds: (row.audienceUserIds || []).map(String),
    audienceGroupIds: (row.audienceGroupIds || []).map(String),
    audienceStatuses: (row.audienceStatuses || []).map(String),
    scheduleType: row.scheduleType || 'once',
    startAt: iso(row.startAt),
    endAt: iso(row.endAt),
    status: row.status || 'draft',
    state: stateOf(row),
    publishedAt: iso(row.publishedAt),
    pausedAt: iso(row.pausedAt),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function memberView(row, occurrenceKey) {
  return {
    id: String(row._id),
    heading: row.heading,
    message: row.message,
    displayStyle: row.displayStyle || 'popup',
    scheduleType: row.scheduleType || 'once',
    occurrenceKey,
    startAt: iso(row.startAt),
    endAt: iso(row.endAt),
    publishedAt: iso(row.publishedAt),
  };
}

function cleanText(value, max) {
  return String(value || '').trim().slice(0, max);
}

function parseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || '').trim()).filter(Boolean))];
}

async function normalizeInput(body, existing = null) {
  const source = body && typeof body === 'object' ? body : {};
  const heading = cleanText(source.heading !== undefined ? source.heading : existing && existing.heading, 120);
  const message = cleanText(source.message !== undefined ? source.message : existing && existing.message, 4000);
  if (!heading) return { status: 400, message: 'Enter an announcement heading.' };
  if (!message) return { status: 400, message: 'Enter an announcement message.' };

  const displayStyle = ['popup', 'banner', 'both'].includes(source.displayStyle)
    ? source.displayStyle
    : (existing && existing.displayStyle) || 'popup';
  const audienceType = ['all', 'selected', 'groups', 'status'].includes(source.audienceType)
    ? source.audienceType
    : (existing && existing.audienceType) || 'all';
  const scheduleType = ['once', 'daily', 'weekly'].includes(source.scheduleType)
    ? source.scheduleType
    : (existing && existing.scheduleType) || 'once';

  const audienceUserIds = uniqueStrings(source.audienceUserIds !== undefined ? source.audienceUserIds : existing && existing.audienceUserIds);
  const audienceGroupIds = uniqueStrings(source.audienceGroupIds !== undefined ? source.audienceGroupIds : existing && existing.audienceGroupIds);
  const audienceStatuses = uniqueStrings(source.audienceStatuses !== undefined ? source.audienceStatuses : existing && existing.audienceStatuses);

  if (audienceType === 'selected') {
    if (!audienceUserIds.length) return { status: 400, message: 'Select at least one member.' };
    if (audienceUserIds.some((id) => !mongoose.isValidObjectId(id))) {
      return { status: 400, message: 'Choose a valid member.' };
    }
    const found = await User.countDocuments({ _id: { $in: audienceUserIds }, role: 'user' });
    if (found !== audienceUserIds.length) return { status: 400, message: 'Choose a valid member.' };
  }
  if (audienceType === 'groups') {
    if (!audienceGroupIds.length) return { status: 400, message: 'Select at least one group.' };
    if (audienceGroupIds.some((id) => !mongoose.isValidObjectId(id))) {
      return { status: 400, message: 'Choose a valid group.' };
    }
    const found = await ProjectGroup.countDocuments({ _id: { $in: audienceGroupIds } });
    if (found !== audienceGroupIds.length) return { status: 400, message: 'Choose a valid group.' };
  }
  if (audienceType === 'status') {
    if (!audienceStatuses.length) return { status: 400, message: 'Select at least one account status.' };
    if (audienceStatuses.some((status) => !MEMBER_STATUSES.includes(status))) {
      return { status: 400, message: 'Choose a valid account status.' };
    }
  }

  const rawStart = source.startAt !== undefined ? source.startAt : existing && existing.startAt;
  const rawEnd = source.endAt !== undefined ? source.endAt : existing && existing.endAt;
  const startAt = parseDate(rawStart) || new Date();
  const endAt = parseDate(rawEnd);
  if (source.startAt !== undefined && !parseDate(source.startAt)) {
    return { status: 400, message: 'Choose a valid start date and time.' };
  }
  if (rawEnd && !endAt) return { status: 400, message: 'Choose a valid end date and time.' };
  if (endAt && endAt.getTime() <= startAt.getTime()) {
    return { status: 400, message: 'The end date must be after the start date.' };
  }
  if (scheduleType !== 'once' && !endAt) {
    return { status: 400, message: 'Choose an end date for a daily or weekly announcement.' };
  }

  return {
    status: 200,
    data: {
      heading,
      message,
      displayStyle,
      audienceType,
      audienceUserIds: audienceType === 'selected' ? audienceUserIds : [],
      audienceGroupIds: audienceType === 'groups' ? audienceGroupIds : [],
      audienceStatuses: audienceType === 'status' ? audienceStatuses : [],
      scheduleType,
      startAt,
      endAt,
    },
  };
}

async function matchesAudience(row, user, openGroups) {
  if (row.audienceType === 'selected') {
    return (row.audienceUserIds || []).map(String).includes(String(user._id));
  }
  if (row.audienceType === 'groups') {
    const groupIds = await openGroups();
    return groupIds.some((id) => (row.audienceGroupIds || []).map(String).includes(String(id)));
  }
  if (row.audienceType === 'status') {
    return (row.audienceStatuses || []).map(String).includes(String(user.accountStatus));
  }
  return true;
}

async function findMember(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  const user = await User.findById(id);
  if (!user || user.role !== 'user') return null;
  return user;
}

export async function listAnnouncements() {
  const rows = await Announcement.find({}).sort({ createdAt: -1 });
  return { status: 200, data: { announcements: rows.map(viewAnnouncement) } };
}

export async function createAnnouncement(body, session) {
  const input = await normalizeInput(body);
  if (input.message) return input;
  const row = await Announcement.create({
    ...input.data,
    status: 'draft',
    createdBy: String((session && session.subjectId) || ''),
  });
  return { status: 201, data: { announcement: viewAnnouncement(row) } };
}

export async function updateAnnouncement(id, body) {
  if (!mongoose.isValidObjectId(id)) return { status: 404, message: 'Announcement not found.' };
  const row = await Announcement.findById(id);
  if (!row) return { status: 404, message: 'Announcement not found.' };
  const input = await normalizeInput(body, row);
  if (input.message) return input;
  Object.assign(row, input.data);
  await row.save();
  return { status: 200, data: { announcement: viewAnnouncement(row) } };
}

export async function deleteAnnouncement(id) {
  if (!mongoose.isValidObjectId(id)) return { status: 404, message: 'Announcement not found.' };
  const row = await Announcement.findById(id);
  if (!row) return { status: 404, message: 'Announcement not found.' };
  const announcementId = String(row._id);
  await Promise.all([
    Announcement.deleteOne({ _id: row._id }),
    AnnouncementReceipt.deleteMany({ announcementId }),
  ]);
  return { status: 200, data: { ok: true, id: announcementId } };
}

export async function setAnnouncementStatus(id, nextStatus) {
  if (!['active', 'paused'].includes(nextStatus)) {
    return { status: 400, message: 'Choose publish or pause.' };
  }
  if (!mongoose.isValidObjectId(id)) return { status: 404, message: 'Announcement not found.' };
  const row = await Announcement.findById(id);
  if (!row) return { status: 404, message: 'Announcement not found.' };
  const now = new Date();
  if (nextStatus === 'active' && row.endAt && new Date(row.endAt).getTime() < now.getTime()) {
    return { status: 400, message: 'The end date has passed. Update the schedule before publishing.' };
  }
  row.status = nextStatus;
  if (nextStatus === 'active') {
    row.publishedAt = row.publishedAt || now;
    row.pausedAt = null;
  } else {
    row.pausedAt = now;
  }
  await row.save();
  return { status: 200, data: { announcement: viewAnnouncement(row) } };
}

export async function duplicateAnnouncement(id) {
  if (!mongoose.isValidObjectId(id)) return { status: 404, message: 'Announcement not found.' };
  const row = await Announcement.findById(id);
  if (!row) return { status: 404, message: 'Announcement not found.' };
  const heading = cleanText(`${row.heading} (copy)`, 120);
  const copy = await Announcement.create({
    heading,
    message: row.message,
    displayStyle: row.displayStyle,
    audienceType: row.audienceType,
    audienceUserIds: row.audienceUserIds,
    audienceGroupIds: row.audienceGroupIds,
    audienceStatuses: row.audienceStatuses,
    scheduleType: row.scheduleType,
    startAt: row.startAt,
    endAt: row.endAt,
    status: 'draft',
    createdBy: row.createdBy,
  });
  return { status: 201, data: { announcement: viewAnnouncement(copy) } };
}

export async function activeAnnouncementsForUser(session) {
  if (!session || session.role !== 'user') return { status: 401, message: 'Sign in required.' };
  const user = await findMember(session.subjectId);
  if (!user) return { status: 401, message: 'Sign in required.' };
  const now = new Date();
  const rows = await Announcement.find({
    status: 'active',
    startAt: { $lte: now },
    $or: [{ endAt: null }, { endAt: { $gte: now } }],
  }).sort({ publishedAt: -1, createdAt: -1 });

  let openGroupsPromise = null;
  const openGroups = () => {
    if (!openGroupsPromise) openGroupsPromise = openGroupIds(user);
    return openGroupsPromise;
  };

  const visible = [];
  const receipts = [];
  for (const row of rows) {
    if (!(await matchesAudience(row, user, openGroups))) continue;
    const occurrenceKey = occurrenceKeyFor(row, now);
    visible.push({ row, occurrenceKey });
    receipts.push({ announcementId: String(row._id), occurrenceKey });
  }

  if (!visible.length) return { status: 200, data: { announcements: [] } };

  const dismissed = await AnnouncementReceipt.find({
    userId: String(user._id),
    dismissedAt: { $ne: null },
    $or: receipts,
  }).select('announcementId occurrenceKey');
  const dismissedKeys = new Set(dismissed.map((row) => `${row.announcementId}:${row.occurrenceKey}`));

  return {
    status: 200,
    data: {
      announcements: visible
        .filter((item) => !dismissedKeys.has(`${String(item.row._id)}:${item.occurrenceKey}`))
        .map((item) => memberView(item.row, item.occurrenceKey)),
    },
  };
}

async function memberAnnouncement(userId, id) {
  const user = await findMember(userId);
  if (!user) return { status: 401, message: 'Sign in required.' };
  if (!mongoose.isValidObjectId(id)) return { status: 404, message: 'Announcement not found.' };
  const row = await Announcement.findById(id);
  if (!row || row.status !== 'active') return { status: 404, message: 'Announcement not found.' };
  const now = new Date();
  if (row.startAt && new Date(row.startAt).getTime() > now.getTime()) {
    return { status: 404, message: 'Announcement not found.' };
  }
  if (row.endAt && new Date(row.endAt).getTime() < now.getTime()) {
    return { status: 404, message: 'Announcement not found.' };
  }
  const openGroups = () => openGroupIds(user);
  if (!(await matchesAudience(row, user, openGroups))) {
    return { status: 404, message: 'Announcement not found.' };
  }
  return { status: 200, data: { user, row } };
}

async function receiptKeyFor(userId, id, occurrenceKey) {
  const found = await memberAnnouncement(userId, id);
  if (found.message) return found;
  const row = found.data.row;
  const provided = String(occurrenceKey || '').trim();
  let key = occurrenceKeyFor(row, new Date());
  if (row.scheduleType === 'once' && provided === 'once') key = 'once';
  if (row.scheduleType === 'daily' && /^daily:\d{4}-\d{2}-\d{2}$/.test(provided)) key = provided;
  if (row.scheduleType === 'weekly' && /^weekly:\d{4}-\d{2}-\d{2}$/.test(provided)) key = provided;
  return {
    status: 200,
    data: {
      user: found.data.user,
      row,
      occurrenceKey: key,
    },
  };
}

export async function markAnnouncementSeen(userId, id, occurrenceKey) {
  const key = await receiptKeyFor(userId, id, occurrenceKey);
  if (key.message) return key;
  const now = new Date();
  try {
    await AnnouncementReceipt.updateOne(
      {
        announcementId: String(key.data.row._id),
        userId: String(key.data.user._id),
        occurrenceKey: key.data.occurrenceKey,
      },
      {
        $setOnInsert: { seenAt: now },
        $set: { userId: String(key.data.user._id), announcementId: String(key.data.row._id), occurrenceKey: key.data.occurrenceKey },
      },
      { upsert: true }
    );
  } catch (err) {
    if (!err || err.code !== 11000) throw err;
  }
  return { status: 200, data: { ok: true } };
}

export async function dismissAnnouncement(userId, id, occurrenceKey) {
  const key = await receiptKeyFor(userId, id, occurrenceKey);
  if (key.message) return key;
  const now = new Date();
  try {
    await AnnouncementReceipt.updateOne(
      {
        announcementId: String(key.data.row._id),
        userId: String(key.data.user._id),
        occurrenceKey: key.data.occurrenceKey,
      },
      {
        $setOnInsert: { seenAt: now },
        $set: { dismissedAt: now, userId: String(key.data.user._id), announcementId: String(key.data.row._id), occurrenceKey: key.data.occurrenceKey },
      },
      { upsert: true }
    );
  } catch (err) {
    if (!err || err.code !== 11000) throw err;
  }
  return { status: 200, data: { ok: true } };
}
