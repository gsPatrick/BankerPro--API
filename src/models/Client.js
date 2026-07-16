import { Model, DataTypes } from 'sequelize';
import { ClientStatus } from '../config/constants.js';

export default class Client extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
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
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      whatsapp: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      objective: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      approximateIncome: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      offeredProduct: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      status: {
        type: DataTypes.STRING(50),
        defaultValue: 'Novo',
        validate: {
          isIn: [ClientStatus]
        }
      },
      lastContact: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      nextReturn: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'clients',
      underscored: true,
      indexes: [
        { fields: ['created_by_user_id', 'created_at'] }
      ],
      timestamps: true
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'createdByUserId', as: 'creator' });
  }
}
