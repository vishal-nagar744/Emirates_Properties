import mongoose from 'mongoose';
import { hashPassword } from './lib/password.js';
import { Session } from './modules/auth/model.js';
import { Referral } from './modules/referrals/model.js';
import { Settings } from './modules/settings/model.js';
import { User } from './modules/users/model.js';
import { Transaction } from './modules/wallet/model.js';

async function dropIfExists(name) {
  const found = await mongoose.connection.db.listCollections({ name }).toArray();
  if (found.length) await mongoose.connection.db.dropCollection(name);
}

async function dropIndex(collection, name) {
  try {
    const indexes = await collection.indexes();
    if (indexes.some((index) => index.name === name)) await collection.dropIndex(name);
  } catch (err) {
    if (!err || err.code !== 26) throw err;
  }
}

export async function seed() {
  await dropIfExists('counters');
  await dropIfExists('admins');
  await dropIfExists('notifications');

  const names = new Set((await mongoose.connection.db.listCollections().toArray()).map((item) => item.name));
  const legacy = names.has('users')
    ? await User.collection.find({ id: { $exists: true } }).toArray()
    : [];
  if (legacy.length) {
    const ids = legacy.flatMap((user) => [user.id, String(user._id)].filter(Boolean));
    await Referral.collection.deleteMany({
      $or: [
        { id: { $exists: true } },
        { referrerUserId: { $in: ids } },
        { referredUserId: { $in: ids } },
      ],
    });
    await Transaction.collection.deleteMany({
      $or: [{ id: { $exists: true } }, { userId: { $in: ids } }],
    });
    await Session.collection.deleteMany({ subjectId: { $in: [...ids, 'admin'] } });
    await User.collection.deleteMany({ _id: { $in: legacy.map((user) => user._id) } });
  }

  await dropIndex(User.collection, 'id_1');
  await dropIndex(Referral.collection, 'id_1');
  await dropIndex(Transaction.collection, 'id_1');

  const adminExists = await User.exists({ role: 'admin' });
  if (!adminExists) {
    await User.create({
      fullName: 'Emirates Admin',
      mobile: '+971 4 000 0001',
      mobileDigits: '97140000001',
      loginId: 'admin',
      passwordHash: hashPassword('Emirates@2026'),
      role: 'admin',
      referralCode: 'ADMIN01',
      referredBy: null,
      accountStatus: 'active',
      welcomeBonusReceived: false,
      walletBalance: 0,
      pendingCashOut: 0,
    });
  }

  await Settings.updateOne(
    { key: 'platform' },
    {
      $setOnInsert: {
        key: 'platform',
        platformName: 'Emirates Properties',
        welcomeBonusAmount: 100,
        minCashOutAmount: 500,
        supportTelegramUsername: 'EmiratesPropertiesSupport',
        demoCashInUSDTAddress: '',
      },
    },
    { upsert: true }
  );
}
