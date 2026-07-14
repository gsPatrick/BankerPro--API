import { Model, DataTypes } from 'sequelize';
import { CommercialLearningResults } from '../config/constants.js';

export default class CommercialLearning extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      sourceSimulationId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'simulations',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      createdByUserId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      score: {
        type: DataTypes.DECIMAL(5, 1),
        defaultValue: 0.0
      },
      resultType: {
        type: DataTypes.STRING,
        defaultValue: CommercialLearningResults.VENDA,
        validate: {
          isIn: [Object.values(CommercialLearningResults)]
        }
      },
      productMain: {
        type: DataTypes.STRING,
        allowNull: false
      },
      productCrossSell: {
        type: DataTypes.STRING,
        allowNull: true
      },
      clientProfile: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      objection: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      winningArgument: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      winningScript: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      whyItWorked: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
      },
      conversationExcerpt: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'commercial_learnings',
      underscored: true,
      timestamps: true
    });
  }

  static associate(models) {
    this.belongsTo(models.Simulation, { foreignKey: 'sourceSimulationId', as: 'sourceSimulation' });
    this.belongsTo(models.User, { foreignKey: 'createdByUserId', as: 'creator' });
  }
}
