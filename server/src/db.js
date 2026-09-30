import mongoose from 'mongoose';
import { config } from './config.js';

export async function connectDb() {
  mongoose.set('strictQuery', true);
  mongoose.set('autoIndex', false);
  await mongoose.connect(config.mongoUri);
}
