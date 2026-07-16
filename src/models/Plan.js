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
      // Funcionalidades liberadas, conforme o catálogo PlanFeatures em
      // config/constants.js. Plano novo nasce sem nada liberado: é o admin quem
      // marca o que entra, e liberar por engano é pior do que faltar.
      permissions: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
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
