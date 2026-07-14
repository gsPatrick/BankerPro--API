import { Model, DataTypes } from 'sequelize';

export default class SystemPrompt extends Model {
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
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    }, {
      sequelize,
      tableName: 'system_prompts',
      underscored: true,
      timestamps: true
    });
  }

  static associate(models) {
    // Sem relações necessárias
  }
}
