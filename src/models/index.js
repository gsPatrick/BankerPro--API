import { Sequelize } from 'sequelize';
import databaseConfig from '../config/database.js';

// Import all models
import User from './User.js';
import UserProfile from './UserProfile.js';
import EmailOtp from './EmailOtp.js';
import Scenario from './Scenario.js';
import Simulation from './Simulation.js';
import CommercialLearning from './CommercialLearning.js';
import ProductKnowledge from './ProductKnowledge.js';
import CommercialOpportunity from './CommercialOpportunity.js';
import Achievement from './Achievement.js';
import Client from './Client.js';
import Goal from './Goal.js';
import Note from './Note.js';
import Subscription from './Subscription.js';
import Plan from './Plan.js';
import SystemPrompt from './SystemPrompt.js';
import SystemSetting from './SystemSetting.js';
import UserDeviceSession from './UserDeviceSession.js';
import AudioAnalysis from './AudioAnalysis.js';
import WhatsappOtp from './WhatsappOtp.js';

const env = process.env.NODE_ENV || 'development';
const config = databaseConfig[env];

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const db = {
  User,
  UserProfile,
  EmailOtp,
  Scenario,
  Simulation,
  CommercialLearning,
  ProductKnowledge,
  CommercialOpportunity,
  Achievement,
  Client,
  Goal,
  Note,
  Subscription,
  Plan,
  SystemPrompt,
  SystemSetting,
  UserDeviceSession,
  AudioAnalysis,
  WhatsappOtp
};

// Initialize all models
Object.keys(db).forEach((modelName) => {
  if (db[modelName].init) {
    db[modelName].init(sequelize);
  }
});

// Run associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export {
  sequelize,
  Sequelize,
  User,
  UserProfile,
  EmailOtp,
  Scenario,
  Simulation,
  CommercialLearning,
  ProductKnowledge,
  CommercialOpportunity,
  Achievement,
  Client,
  Goal,
  Note,
  Subscription,
  Plan,
  SystemPrompt,
  SystemSetting,
  UserDeviceSession,
  AudioAnalysis,
  WhatsappOtp
};

export default db;
