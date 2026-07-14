import { Model, DataTypes } from 'sequelize';

export default class Achievement extends Model {
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
      achievementKey: {
        type: DataTypes.STRING,
        allowNull: false
      },
      unlockedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize,
      tableName: 'achievements',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'achievement_key']
        }
      ]
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}
