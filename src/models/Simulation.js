import { Model, DataTypes } from 'sequelize';
import { SimulationStatus } from '../config/constants.js';

export default class Simulation extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      scenarioId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'scenarios',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      scenarioTitle: {
        type: DataTypes.STRING,
        allowNull: true
      },
      scenarioCategory: {
        type: DataTypes.STRING,
        allowNull: true
      },
      createdByUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: SimulationStatus.IN_PROGRESS,
        validate: {
          isIn: [Object.values(SimulationStatus)]
        }
      },
      messages: {
        type: DataTypes.JSONB,
        defaultValue: []
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      scoreDiagnostico: {
        type: DataTypes.DECIMAL(4, 1),
        allowNull: true
      },
      scoreArgumentacao: {
        type: DataTypes.DECIMAL(4, 1),
        allowNull: true
      },
      scoreObjeccoes: {
        type: DataTypes.DECIMAL(4, 1),
        allowNull: true
      },
      scoreCrossSell: {
        type: DataTypes.DECIMAL(4, 1),
        allowNull: true
      },
      scoreFechamento: {
        type: DataTypes.DECIMAL(4, 1),
        allowNull: true
      },
      scoreTotal: {
        type: DataTypes.DECIMAL(5, 1),
        allowNull: true
      },
      pontosFortes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      oportunidadesMelhoria: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      argumentosSugeridos: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      feedback: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'simulations',
      underscored: true,
      timestamps: true,
      // O histórico e a contagem de limite filtram por dono e ordenam/filtram
      // por data — sem este índice viram varredura da tabela inteira.
      indexes: [
        { fields: ['created_by_user_id', 'created_at'] }
      ]
    });
  }

  static associate(models) {
    this.belongsTo(models.Scenario, { foreignKey: 'scenarioId', as: 'scenario' });
    this.belongsTo(models.User, { foreignKey: 'createdByUserId', as: 'creator' });
    this.hasOne(models.CommercialLearning, { foreignKey: 'sourceSimulationId', as: 'learning' });
  }
}
