import { Model, DataTypes } from 'sequelize';

export default class Note extends Model {
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
      content: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'notes',
      underscored: true,
      timestamps: true
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'createdByUserId', as: 'creator' });
  }
}
