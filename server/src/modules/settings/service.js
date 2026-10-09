import { Settings } from './model.js';
import { defaultAbout, defaultTerms } from './contentDefaults.js';

function cleanLines(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanParagraphs(value) {
  return String(value || '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function normalizeAbout(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const points = Array.isArray(source.points)
    ? source.points.map((line) => String(line || '').trim()).filter(Boolean)
    : defaultAbout.points;
  const depositPoints = Array.isArray(source.depositPoints)
    ? source.depositPoints.map((line) => String(line || '').trim()).filter(Boolean)
    : defaultAbout.depositPoints;
  return {
    tagline: String(source.tagline || defaultAbout.tagline).trim() || defaultAbout.tagline,
    lead: String(source.lead || defaultAbout.lead).trim() || defaultAbout.lead,
    points: points.length ? points : defaultAbout.points,
    close: String(source.close || defaultAbout.close).trim() || defaultAbout.close,
    depositPoints: depositPoints.length ? depositPoints : defaultAbout.depositPoints,
  };
}

function normalizeTerms(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const sections = Array.isArray(source.sections)
    ? source.sections.map((section, index) => {
      const title = String((section && section.title) || `Section ${index + 1}`).trim();
      const paragraphs = Array.isArray(section && section.paragraphs)
        ? section.paragraphs.map((line) => String(line || '').trim()).filter(Boolean)
        : cleanParagraphs(section && section.body);
      return { title, paragraphs: paragraphs.length ? paragraphs : [''] };
    }).filter((section) => section.title)
    : defaultTerms.sections;
  return {
    effectiveDate: String(source.effectiveDate || defaultTerms.effectiveDate).trim() || defaultTerms.effectiveDate,
    company: String(source.company || defaultTerms.company).trim() || defaultTerms.company,
    website: String(source.website || defaultTerms.website).trim() || defaultTerms.website,
    jurisdiction: String(source.jurisdiction || defaultTerms.jurisdiction).trim() || defaultTerms.jurisdiction,
    sections: sections.length ? sections : defaultTerms.sections,
  };
}

function viewSettings(row) {
  return {
    platformName: row.platformName,
    welcomeBonusAmount: row.welcomeBonusAmount,
    trialBonusAmount: Number(row.trialBonusAmount) || 0,
    minCashOutAmount: row.minCashOutAmount,
    supportTelegramUsername: row.supportTelegramUsername,
    supportWhatsappNumber: row.supportWhatsappNumber || '',
    demoCashInUSDTAddress: row.demoCashInUSDTAddress || '',
    bankPayoutEnabled: row.bankPayoutEnabled !== false,
    cryptoPayoutEnabled: row.cryptoPayoutEnabled === true,
    about: normalizeAbout(row.about),
    terms: normalizeTerms(row.terms),
  };
}

function defaults() {
  return {
    platformName: 'Emirates Properties',
    welcomeBonusAmount: 100,
    trialBonusAmount: 0,
    minCashOutAmount: 500,
    supportTelegramUsername: 'EmiratesPropertiesSupport',
    supportWhatsappNumber: '',
    demoCashInUSDTAddress: '',
    bankPayoutEnabled: true,
    cryptoPayoutEnabled: false,
    about: defaultAbout,
    terms: defaultTerms,
  };
}

export async function getSettings() {
  const row = await Settings.findOne({ key: 'platform' });
  if (!row) {
    return { status: 200, data: { settings: defaults() } };
  }
  return { status: 200, data: { settings: viewSettings(row) } };
}

function readAbout(body) {
  if (!body || body.about === undefined) return null;
  if (typeof body.about === 'object' && body.about) return normalizeAbout(body.about);
  return normalizeAbout({
    tagline: body.aboutTagline,
    lead: body.aboutLead,
    close: body.aboutClose,
    points: cleanParagraphs(body.aboutPointsText),
    depositPoints: cleanLines(body.depositPointsText),
  });
}

function readTerms(body) {
  if (!body || body.terms === undefined) return null;
  if (typeof body.terms === 'object' && body.terms) return normalizeTerms(body.terms);
  const titles = Array.isArray(body.termTitles) ? body.termTitles : [];
  const bodies = Array.isArray(body.termBodies) ? body.termBodies : [];
  const count = Math.max(titles.length, bodies.length);
  const sections = [];
  for (let i = 0; i < count; i += 1) {
    sections.push({
      title: String(titles[i] || `Section ${i + 1}`).trim(),
      paragraphs: cleanParagraphs(bodies[i]),
    });
  }
  return normalizeTerms({
    effectiveDate: body.termsEffectiveDate,
    company: body.termsCompany,
    website: body.termsWebsite,
    jurisdiction: body.termsJurisdiction,
    sections,
  });
}

export async function updateSettings(body) {
  const platformName = String(body.platformName || '').trim();
  const welcomeBonusAmount = Number(body.welcomeBonusAmount);
  const trialBonusAmount = Number(body.trialBonusAmount);
  const minCashOutAmount = Number(body.minCashOutAmount);
  const supportTelegramUsername = String(body.supportTelegramUsername || '').trim().replace(/^@/, '');
  const supportWhatsappNumber = String(body.supportWhatsappNumber || '').replace(/\D/g, '');
  const demoCashInUSDTAddress = String(body.demoCashInUSDTAddress || '').trim();
  const bankPayoutEnabled = body.bankPayoutEnabled !== false && body.bankPayoutEnabled !== 'false';
  const cryptoPayoutEnabled = body.cryptoPayoutEnabled === true || body.cryptoPayoutEnabled === 'true';
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

  const current = await Settings.findOne({ key: 'platform' });
  const about = readAbout(body) || normalizeAbout(current && current.about);
  const terms = readTerms(body) || normalizeTerms(current && current.terms);

  const row = await Settings.findOneAndUpdate(
    { key: 'platform' },
    {
      key: 'platform',
      platformName,
      welcomeBonusAmount,
      trialBonusAmount,
      minCashOutAmount,
      supportTelegramUsername,
      supportWhatsappNumber,
      demoCashInUSDTAddress,
      bankPayoutEnabled,
      cryptoPayoutEnabled,
      about,
      terms,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return { status: 200, data: { settings: viewSettings(row) } };
}
