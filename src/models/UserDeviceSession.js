import { Model, DataTypes } from 'sequelize';

export default class UserDeviceSession extends Model {
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
      deviceLabel: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Dispositivo'
      },
      browser: {
        type: DataTypes.STRING,
        allowNull: true
      },
      os: {
        type: DataTypes.STRING,
        allowNull: true
      },
      deviceType: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'desktop'
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
      },
      lastSeenAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      isCurrent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'user_device_sessions',
      underscored: true,
      timestamps: true
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}
