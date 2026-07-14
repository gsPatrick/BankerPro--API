import { Model, DataTypes } from 'sequelize';
import { ScenarioCategories, Difficulties } from '../config/constants.js';

export default class Scenario extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [ScenarioCategories]
        }
      },
      difficulty: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [Difficulties]
        }
      },
      clientPersona: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      clientName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      clientAge: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      clientProfile: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      openingMessage: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      userObjective: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      commercialClues: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      mainProduct: {
        type: DataTypes.STRING,
        allowNull: true
      },
      supportProducts: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      evaluationCriteria: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
      }
    }, {
      sequelize,
      tableName: 'scenarios',
      underscored: true,
      timestamps: true
    });
  }

  static associate(models) {
    this.hasMany(models.Simulation, { foreignKey: 'scenarioId', as: 'simulations' });
  }
}
