import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'negi-tutorials-jwt-secret-key-2026-production-grade',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // MySQL Database Configuration
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: parseInt(process.env.DB_PORT || '3306', 10),
  dbName: process.env.DB_NAME || 'negi_erp',
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || 'root@123',
  
  institute: {
    name: process.env.INSTITUTE_NAME || 'NEGI TUTORIALS',
    tagline: process.env.INSTITUTE_TAGLINE || 'Learn • Grow • Succeed',
    phone: process.env.INSTITUTE_PHONE || '+91 98765 43210',
    email: process.env.INSTITUTE_EMAIL || 'contact@negitutorials.com',
    address: process.env.INSTITUTE_ADDRESS || 'Plot 12, Sector 4, Main Road, New Delhi, India'
  }
};

export default config;
