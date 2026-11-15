import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'readline';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from Backend/.env or root .env
const potentialEnvPaths = [
  path.resolve(__dirname, '..', '.env'),
  path.resolve(__dirname, '..', '..', '.env'),
  path.resolve(process.cwd(), '.env'),
];
for (const envPath of potentialEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

import User from '../models/User.js';
import { getAdminEmail1, getAdminEmail2 } from '../utils/memoryUserStore.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Error: MONGO_URI is required to seed administrators in MongoDB.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.\n');

  const defaultAdmin1 = getAdminEmail1();
  const defaultAdmin2 = getAdminEmail2();

  console.log('--- Inisio Administrator Account Setup ---');
  console.log(`Default Operations Admin: ${defaultAdmin1}`);
  console.log(`Default Executive Superadmin: ${defaultAdmin2}\n`);

  const emailInput = await ask(`Enter admin email to create/update [default: ${defaultAdmin1}]: `);
  const email = (emailInput.trim() || defaultAdmin1).toLowerCase();

  const roleInput = await ask(`Enter role ('admin' or 'superadmin') [default: ${email === defaultAdmin2 ? 'superadmin' : 'admin'}]: `);
  const role = roleInput.trim().toLowerCase() || (email === defaultAdmin2 ? 'superadmin' : 'admin');

  const nameInput = await ask('Enter full name [default: Inisio Admin]: ');
  const name = nameInput.trim() || (role === 'superadmin' ? 'Executive Super Admin' : 'Inisio Operations Admin');

  const password = await ask('Enter new secure password (min 8 chars): ');
  if (!password || password.length < 8) {
    console.error('Error: Password must be at least 8 characters long.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    existingUser.name = name;
    existingUser.password = hashedPassword;
    existingUser.role = role;
    existingUser.isVerified = true;
    await existingUser.save();
    console.log(`\nSuccessfully updated admin user: ${email} (${role})`);
  } else {
    await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      isVerified: true,
      company: 'Inisio Capital Advisory',
    });
    console.log(`\nSuccessfully created new admin user: ${email} (${role})`);
  }

  await mongoose.disconnect();
  rl.close();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Fatal error seeding admin:', err.message);
  rl.close();
  process.exit(1);
});
