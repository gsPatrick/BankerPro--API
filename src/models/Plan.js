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
      // Cobrança: 'monthly' | 'yearly' | 'custom' | 'free'. Antes o período vivia
      // no sufixo da key (_monthly/_yearly); agora é um campo, para suportar
      // prazo personalizado e plano gratuito de forma explícita.
      billingPeriod: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'monthly'
      },
      // Duração do ciclo em dias. Usada como janela dos limites de uso e para o
      // prazo do plano personalizado. Mensal ≈ 30, anual ≈ 365.
      durationDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      isFree: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      limitSimulations: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10 // -1 significa ilimitado
      },
      // Limite numérico por funcionalidade, por ciclo: { [featureKey]: number }.
      // -1 (ou ausente) = ilimitado; 0 = bloqueado; N = teto no período. É o que
      // o enforceLimit consulta para barrar ao atingir o teto.
      limits: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
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
