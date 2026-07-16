import { Model, DataTypes } from 'sequelize';

export default class Goal extends Model {
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
      label: {
        type: DataTypes.STRING,
        allowNull: false
      },
      target: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      achieved: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      // Mês de competência da meta no formato YYYY-MM. Quando o mês vira, o
      // realizado zera e o alvo continua valendo para o mês novo.
      periodMonth: {
        type: DataTypes.STRING(7),
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'goals',
      underscored: true,
      timestamps: true
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'createdByUserId', as: 'creator' });
  }
}
