#!/usr/bin/env node

// This script loads .env.local before running Prisma migrations
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = envContent.split('\n').filter(line => line && !line.startsWith('#'));
  
  envVars.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
}

// Get command line arguments
const args = process.argv.slice(2).join(' ');

try {
  // Run Prisma command with environment variables
  execSync(`npx prisma ${args}`, { 
    stdio: 'inherit',
    env: process.env 
  });
} catch (error) {
  process.exit(1);
}