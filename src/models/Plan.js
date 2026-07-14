import { Model, DataTypes } from 'sequelize';

export default class Plan extends Model {
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
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      limitSimulations: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10 // -1 significa ilimitado
      },
      features: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
      },
      permissions: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: ['simulations']
      }
    }, {
      sequelize,
      tableName: 'plans',
      underscored: true,
      timestamps: true
    });
  }

  static associate(models) {
    this.hasMany(models.Subscription, { foreignKey: 'plan', sourceKey: 'key', as: 'subscriptions' });
  }
}
