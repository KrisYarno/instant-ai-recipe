#!/usr/bin/env node

const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🔍 Verifying Google OAuth Configuration\n');

// Check Client ID
const clientId = process.env.GOOGLE_CLIENT_ID;
if (!clientId) {
  console.error('❌ GOOGLE_CLIENT_ID is not set');
} else if (!clientId.endsWith('.apps.googleusercontent.com')) {
  console.error('❌ GOOGLE_CLIENT_ID format is incorrect');
  console.log('   Should end with: .apps.googleusercontent.com');
  console.log('   Current value:', clientId);
} else {
  console.log('✅ GOOGLE_CLIENT_ID format looks correct');
  console.log('   Client ID:', clientId);
}

// Check Client Secret
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!clientSecret) {
  console.error('❌ GOOGLE_CLIENT_SECRET is not set');
} else {
  console.log('✅ GOOGLE_CLIENT_SECRET is set');
  console.log('   Secret length:', clientSecret.length, 'characters');
  console.log('   First 4 chars:', clientSecret.substring(0, 4) + '...');
}

// Check NextAuth configuration
const nextAuthUrl = process.env.NEXTAUTH_URL;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

console.log('\n🔐 NextAuth Configuration:');
if (!nextAuthUrl) {
  console.error('❌ NEXTAUTH_URL is not set');
} else {
  console.log('✅ NEXTAUTH_URL:', nextAuthUrl);
}

if (!nextAuthSecret) {
  console.error('❌ NEXTAUTH_SECRET is not set');
  console.log('   Generate one with: openssl rand -base64 32');
} else {
  console.log('✅ NEXTAUTH_SECRET is set');
}

// Check Database
const databaseUrl = process.env.DATABASE_URL;
console.log('\n🗄️  Database Configuration:');
if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not set');
} else {
  console.log('✅ DATABASE_URL is set');
  // Parse and hide password
  try {
    const url = new URL(databaseUrl);
    url.password = '***';
    console.log('   Connection:', url.toString());
  } catch (e) {
    console.log('   Format might be incorrect');
  }
}

// Check OpenAI
const openaiKey = process.env.OPENAI_API_KEY;
console.log('\n🤖 OpenAI Configuration:');
if (!openaiKey) {
  console.error('❌ OPENAI_API_KEY is not set');
} else {
  console.log('✅ OPENAI_API_KEY is set');
  console.log('   Key prefix:', openaiKey.substring(0, 7) + '...');
}

console.log('\n📋 Summary:');
console.log('The callback URL for Google OAuth should be:');
console.log(`   ${nextAuthUrl || 'http://localhost:3000'}/api/auth/callback/google`);
console.log('\nMake sure this EXACT URL is added to your Google OAuth client.');
console.log('No trailing slashes, must match exactly!\n');