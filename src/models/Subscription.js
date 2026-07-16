import { Model, DataTypes } from 'sequelize';
import { SubscriptionStatus } from '../config/constants.js';

export default class Subscription extends Model {
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
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      plan: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'plans',
          key: 'key'
        }
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: SubscriptionStatus.ACTIVE,
        validate: {
          isIn: [Object.values(SubscriptionStatus)]
        }
      },
      mpSubscriptionId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true
      },
      startsAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      endsAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'subscriptions',
      underscored: true,
      timestamps: true,
      // Toda request autenticada busca a assinatura ativa do usuário por
      // (userId, status). É a query mais quente do sistema.
      indexes: [
        { fields: ['user_id', 'status'] },
        { fields: ['plan'] }
      ]
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    this.belongsTo(models.Plan, { foreignKey: 'plan', targetKey: 'key', as: 'planDetails' });
  }
}
