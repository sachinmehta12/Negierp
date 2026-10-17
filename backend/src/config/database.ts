import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';
import { config } from './env';

// Sequelize Database Connection for MySQL
export const sequelize = new Sequelize(
  config.dbName,
  config.dbUser,
  config.dbPassword,
  {
    host: config.dbHost,
    port: config.dbPort,
    dialect: 'mysql',
    dialectModule: mysql2,
    logging: config.nodeEnv === 'development' ? (msg) => console.log(`[Sequelize] ${msg}`) : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+05:30', // IST
    define: {
      underscored: true,
      timestamps: false
    }
  }
);

export default sequelize;
