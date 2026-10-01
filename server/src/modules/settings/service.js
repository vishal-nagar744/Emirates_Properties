import { Settings } from './model.js';

function viewSettings(row) {
  return {
    platformName: row.platformName,
    welcomeBonusAmount: row.welcomeBonusAmount,
    trialBonusAmount: Number(row.trialBonusAmount) || 0,
    minCashOutAmount: row.minCashOutAmount,
    supportTelegramUsername: row.supportTelegramUsername,
    demoCashInUSDTAddress: row.demoCashInUSDTAddress || '',
  };
}

export async function getSettings() {
  const row = await Settings.findOne({ key: 'platform' });
  if (!row) {
    return {
      status: 200,
      data: {
        settings: {
          platformName: 'Emirates Properties',
          welcomeBonusAmount: 100,
          trialBonusAmount: 0,
          minCashOutAmount: 500,
          supportTelegramUsername: 'EmiratesPropertiesSupport',
          demoCashInUSDTAddress: '',
        },
      },
    };
  }
  return { status: 200, data: { settings: viewSettings(row) } };
}

export async function updateSettings(body) {
  const platformName = String(body.platformName || '').trim();
  const welcomeBonusAmount = Number(body.welcomeBonusAmount);
  const trialBonusAmount = Number(body.trialBonusAmount);
  const minCashOutAmount = Number(body.minCashOutAmount);
  const supportTelegramUsername = String(body.supportTelegramUsername || '').trim().replace(/^@/, '');
  const demoCashInUSDTAddress = String(body.demoCashInUSDTAddress || '').trim();
  if (!platformName) return { status: 400, message: 'Enter a platform name.' };
  if (!Number.isFinite(welcomeBonusAmount) || welcomeBonusAmount < 0) {
    return { status: 400, message: 'Welcome bonus must be 0 or more.' };
  }
  if (!Number.isFinite(trialBonusAmount) || trialBonusAmount < 0) {
    return { status: 400, message: 'Trial bonus must be 0 or more.' };
  }
  if (!Number.isFinite(minCashOutAmount) || minCashOutAmount < 1) {
    return { status: 400, message: 'Minimum cash out must be at least 1.' };
  }
  if (!supportTelegramUsername) return { status: 400, message: 'Enter a Telegram username.' };
  const row = await Settings.findOneAndUpdate(
    { key: 'platform' },
    {
      key: 'platform',
      platformName,
      welcomeBonusAmount,
      trialBonusAmount,
      minCashOutAmount,
      supportTelegramUsername,
      demoCashInUSDTAddress,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return { status: 200, data: { settings: viewSettings(row) } };
}
