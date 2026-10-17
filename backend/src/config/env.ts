import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'negi-tutorials-jwt-secret-key-2026-production-grade',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/negi_tutorials?schema=public',
  institute: {
    name: process.env.INSTITUTE_NAME || 'NEGI TUTORIALS',
    tagline: process.env.INSTITUTE_TAGLINE || 'Learn • Grow • Succeed',
    phone: process.env.INSTITUTE_PHONE || '+91 98765 43210',
    email: process.env.INSTITUTE_EMAIL || 'contact@negitutorials.com',
    address: process.env.INSTITUTE_ADDRESS || 'Plot 12, Sector 4, Main Road, New Delhi, India'
  }
};
