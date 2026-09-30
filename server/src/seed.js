import { config } from './config.js';
import { hashPassword } from './lib/password.js';
import { Settings } from './modules/settings/model.js';
import { User } from './modules/users/model.js';

export async function seed() {
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
