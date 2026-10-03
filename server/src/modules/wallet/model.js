import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    direction: { type: String, enum: ['credit', 'debit'], required: true },
    wallet: { type: String, enum: ['main', 'trial', 'hold'], default: 'main' },
    description: { type: String, required: true },
    status: { type: String, required: true },
    referenceId: { type: String, default: null },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model('Transaction', transactionSchema);

const accountSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    kind: { type: String, enum: ['crypto', 'bank'], required: true },
    network: { type: String, default: '' },
    address: { type: String, default: '' },
    holder: { type: String, default: '' },
    bankName: { type: String, default: '' },
    iban: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
  },
  { timestamps: true }
);

export const WithdrawalAccount = mongoose.model('WithdrawalAccount', accountSchema);

export function viewAccount(row) {
  return {
    id: String(row._id),
    kind: row.kind,
    network: row.network || '',
    address: row.address || '',
    holder: row.holder || '',
    bankName: row.bankName || '',
    iban: row.iban || '',
    accountNumber: row.accountNumber || '',
  };
}
