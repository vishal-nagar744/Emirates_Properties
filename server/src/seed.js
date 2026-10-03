import { config } from './config.js';
import { hashPassword } from './lib/password.js';
import { Session } from './modules/auth/model.js';
import { ProjectGroup } from './modules/groups/model.js';
import { embedImageBytes } from './modules/images/service.js';
import { Order } from './modules/orders/model.js';
import { resetCompletedTrialBalances } from './modules/orders/service.js';
import { Project } from './modules/projects/model.js';
import { Settings } from './modules/settings/model.js';
import { User } from './modules/users/model.js';

export async function seed() {
  const moved = await embedImageBytes();
  if (moved) console.log(`Stored ${moved} uploaded image${moved === 1 ? '' : 's'} in the database.`);

  await User.collection.updateMany({ loginId: null }, { $unset: { loginId: '' } });
  const indexes = await User.collection.indexes();
  if (indexes.some((index) => index.name === 'loginId_1' && !index.partialFilterExpression)) {
    await User.collection.dropIndex('loginId_1');
  }
  await User.updateMany({ accountStatus: 'frozen' }, { accountStatus: 'blocked' });
  await User.syncIndexes();
  const sessionIndexes = await Session.collection.indexes();
  const ttl = sessionIndexes.find((index) => index.expireAfterSeconds != null);
  if (ttl) await Session.collection.dropIndex(ttl.name);
  await Session.syncIndexes();

  const adminExists = await User.exists({ role: 'admin' });
  if (!adminExists) {
    const password = config.admin.password;
    if (password.length < 8) {
      throw new Error('Set ADMIN_PASSWORD in server/.env to at least 8 characters before the first start.');
    }
    const mobile = config.admin.mobile;
    await User.create({
      fullName: config.admin.name,
      mobile,
      mobileDigits: mobile.replace(/\D/g, ''),
      loginId: config.admin.loginId,
      passwordHash: hashPassword(password),
      role: 'admin',
      referralCode: 'ADMIN01',
      referredBy: null,
      accountStatus: 'active',
      welcomeBonusReceived: false,
      walletBalance: 0,
      pendingCashOut: 0,
    });
  }

  await Order.updateMany({ status: 'active' }, { $set: { status: 'completed', remainingCommission: 0 } });
  const legacy = await Project.collection.find({
    $or: [{ groupId: { $exists: false } }, { groupId: '' }, { groupId: null }],
  }).toArray();
  if (legacy.length) {
    let group = await ProjectGroup.findOne({ name: 'Existing catalog' });
    if (!group) {
      group = await ProjectGroup.create({
        name: 'Existing catalog',
        description: 'Projects moved from the previous catalog.',
      });
    }
    for (const doc of legacy) {
      const price = Number(doc.price ?? doc.activationAmount ?? 0) || 0;
      const commissionAmount = Number(doc.commissionAmount ?? doc.totalCommission ?? 0) || 0;
      const commissionRatio = price > 0
        ? Math.round((commissionAmount / price) * 10000) / 100
        : (Number(doc.commissionRatio) || 0);
      await Project.collection.updateOne(
        { _id: doc._id },
        { $set: { groupId: String(group._id), price, commissionRatio, commissionAmount } }
      );
    }
  }

  await Settings.updateOne(
    { key: 'platform' },
    {
      $setOnInsert: {
        key: 'platform',
        platformName: 'Emirates Properties',
        welcomeBonusAmount: 100,
        trialBonusAmount: 0,
        minCashOutAmount: 500,
        supportTelegramUsername: 'EmiratesPropertiesSupport',
        demoCashInUSDTAddress: '',
      },
    },
    { upsert: true }
  );

  await Settings.updateOne(
    { key: 'platform', trialBonusAmount: { $exists: false } },
    { $set: { trialBonusAmount: 0 } }
  );

  const trialName = 'Junior (Trial)';
  const trial = await ProjectGroup.findOne({ isTrial: true }) || await ProjectGroup.findOne({ name: /^trial$/i });
  if (trial) {
    if (!trial.isTrial) trial.isTrial = true;
    if (/^trial$/i.test(trial.name)) trial.name = trialName;
    if (trial.isModified()) await trial.save();
  } else {
    await ProjectGroup.create({
      name: trialName,
      description: '',
      isTrial: true,
    });
  }

  const cleared = await resetCompletedTrialBalances();
  if (cleared) console.log(`Reset trial balance for ${cleared} member${cleared === 1 ? '' : 's'} who finished the trial group.`);
}
