import { Model, DataTypes } from 'sequelize';

export default class SystemSetting extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'system_settings',
      underscored: true,
      timestamps: true
    });
  }

  static associate(models) {
    // Sem relações
  }
}
