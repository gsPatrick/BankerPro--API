import { Model, DataTypes } from 'sequelize';
import {
  ExperienceLevels,
  WorkSituations,
  CertificationOptions
} from '../config/constants.js';

export default class UserProfile extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      roleTitle: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Não informado'
      },
      experienceLevel: {
        type: DataTypes.STRING,
        defaultValue: 'Iniciante',
        validate: {
          isIn: [ExperienceLevels]
        }
      },
      bankName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      workSituation: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isIn: [Object.values(WorkSituations)]
        }
      },
      certification: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isIn: [CertificationOptions]
        }
      },
      certificationOther: {
        type: DataTypes.STRING,
        allowNull: true
      },
      avatarUrl: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      onboardingCompleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      onboardingCompletedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      weeklyGoal: {
        type: DataTypes.INTEGER,
        defaultValue: 5
      },
      weeklyCompleted: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      totalSimulations: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      averageScore: {
        type: DataTypes.DECIMAL(5, 1),
        defaultValue: 0.0
      },
      bestScore: {
        type: DataTypes.DECIMAL(5, 1),
        defaultValue: 0.0
      },
      streakDays: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      xpPoints: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      lastActiveDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'user_profiles',
      underscored: true,
      timestamps: true
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}
