import { Model, DataTypes } from 'sequelize';
import { UserRoles } from '../config/constants.js';

export default class User extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: true // Allow null for Google OAuth users
      },
      role: {
        type: DataTypes.STRING,
        defaultValue: UserRoles.USER,
        validate: {
          isIn: [Object.values(UserRoles)]
        }
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      acceptedTermsAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      whatsapp: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
      },
      // Só é true quando o número foi confirmado pelo próprio WhatsApp (via OTP),
      // capturado do JID que a Evolution envia. Um número digitado no perfil NÃO
      // conta como vinculado — pode estar errado e o Copiloto não acharia a conta.
      whatsappVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'users',
      underscored: true,
      timestamps: true
    });
  }

  static associate(models) {
    this.hasOne(models.UserProfile, { foreignKey: 'userId', as: 'profile' });
    this.hasMany(models.Simulation, { foreignKey: 'createdByUserId', as: 'simulations' });
    this.hasMany(models.CommercialLearning, { foreignKey: 'createdByUserId', as: 'learnings' });
    this.hasMany(models.Achievement, { foreignKey: 'userId', as: 'achievements' });
    this.hasMany(models.Client, { foreignKey: 'createdByUserId', as: 'clients' });
    this.hasMany(models.Goal, { foreignKey: 'createdByUserId', as: 'goals' });
    this.hasMany(models.Note, { foreignKey: 'createdByUserId', as: 'notes' });
    this.hasMany(models.Subscription, { foreignKey: 'userId', as: 'subscriptions' });
    this.hasMany(models.UserDeviceSession, { foreignKey: 'userId', as: 'deviceSessions' });
  }
}
