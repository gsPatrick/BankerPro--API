import { Model, DataTypes } from 'sequelize';

/**
 * Visitante da landing page — a "pessoa" por trás de uma ou mais visitas.
 * Identificado por um `visitorId` gerado no navegador e guardado no localStorage,
 * então persiste entre sessões e recargas. Começa anônimo; quando digita
 * nome/e-mail em algum formulário, os campos de identificação são preenchidos e
 * o IP fica ligado a essa pessoa — é o que permite, no futuro, disparar
 * mensagens de compra abandonada.
 */
export default class AnalyticsVisitor extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      // UUID gerado no cliente e guardado no localStorage do navegador.
      visitorId: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true
      },
      firstSeenAt: { type: DataTypes.DATE, allowNull: false },
      lastSeenAt: { type: DataTypes.DATE, allowNull: false },

      // Contexto do dispositivo (última visita).
      ipAddress: { type: DataTypes.STRING(64), allowNull: true },
      userAgent: { type: DataTypes.TEXT, allowNull: true },
      deviceType: { type: DataTypes.STRING(20), allowNull: true }, // mobile | tablet | desktop
      os: { type: DataTypes.STRING(40), allowNull: true },
      browser: { type: DataTypes.STRING(40), allowNull: true },

      // Identificação (preenchida quando a pessoa digita nome/e-mail).
      name: { type: DataTypes.STRING(160), allowNull: true },
      email: { type: DataTypes.STRING(160), allowNull: true },
      phone: { type: DataTypes.STRING(40), allowNull: true },
      identifiedAt: { type: DataTypes.DATE, allowNull: true },
      // Se o visitante virou usuário cadastrado.
      userId: { type: DataTypes.UUID, allowNull: true },

      // Atribuição de primeiro toque (de onde veio o tráfego pago).
      firstUtmSource: { type: DataTypes.STRING(120), allowNull: true },
      firstUtmMedium: { type: DataTypes.STRING(120), allowNull: true },
      firstUtmCampaign: { type: DataTypes.STRING(160), allowNull: true },
      firstReferrer: { type: DataTypes.STRING(255), allowNull: true },

      // Estágio no funil (acumulado entre as sessões da pessoa).
      sessionsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      checkoutStarted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      purchased: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    }, {
      sequelize,
      tableName: 'analytics_visitors',
      underscored: true,
      timestamps: true,
      indexes: [
        { unique: true, fields: ['visitor_id'] },
        { fields: ['email'] },
        { fields: ['ip_address'] },
        { fields: ['last_seen_at'] },
        { fields: ['checkout_started'] },
        { fields: ['purchased'] }
      ]
    });
  }

  static associate() {
    // Sem associações Sequelize: as ligações são feitas por visitorId/sessionId
    // (strings do cliente) direto no service, evitando FK sobre chaves não-PK.
  }
}
