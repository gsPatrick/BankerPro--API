import { Model, DataTypes } from 'sequelize';

/**
 * Uma visita (sessão) à landing page. Um visitante pode ter várias. Guarda
 * quando começou, quanto durou, de onde veio (UTM/referrer), o dispositivo e o
 * quão longe no funil chegou (viu, começou o checkout, comprou).
 */
export default class AnalyticsSession extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      sessionId: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true
      },
      visitorId: { type: DataTypes.STRING(64), allowNull: false },

      startedAt: { type: DataTypes.DATE, allowNull: false },
      lastEventAt: { type: DataTypes.DATE, allowNull: false },
      // Duração = lastEventAt - startedAt, em segundos. Recalculada a cada lote.
      durationSeconds: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

      ipAddress: { type: DataTypes.STRING(64), allowNull: true },
      userAgent: { type: DataTypes.TEXT, allowNull: true },
      deviceType: { type: DataTypes.STRING(20), allowNull: true },
      os: { type: DataTypes.STRING(40), allowNull: true },
      browser: { type: DataTypes.STRING(40), allowNull: true },
      screenSize: { type: DataTypes.STRING(20), allowNull: true },
      language: { type: DataTypes.STRING(20), allowNull: true },

      // Origem do tráfego.
      referrer: { type: DataTypes.STRING(255), allowNull: true },
      landingPath: { type: DataTypes.STRING(255), allowNull: true },
      utmSource: { type: DataTypes.STRING(120), allowNull: true },
      utmMedium: { type: DataTypes.STRING(120), allowNull: true },
      utmCampaign: { type: DataTypes.STRING(160), allowNull: true },
      utmTerm: { type: DataTypes.STRING(160), allowNull: true },
      utmContent: { type: DataTypes.STRING(160), allowNull: true },

      // Contadores e estágio do funil nesta sessão.
      eventsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      pageviewsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      clicksCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      checkoutStarted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      purchased: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    }, {
      sequelize,
      tableName: 'analytics_sessions',
      underscored: true,
      timestamps: true,
      indexes: [
        { unique: true, fields: ['session_id'] },
        { fields: ['visitor_id'] },
        { fields: ['started_at'] },
        { fields: ['checkout_started'] },
        { fields: ['purchased'] }
      ]
    });
  }

  static associate() {
    // Ligações por string no service (ver AnalyticsVisitor).
  }
}
