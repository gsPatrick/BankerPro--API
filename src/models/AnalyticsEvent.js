import { Model, DataTypes } from 'sequelize';

/**
 * Um evento individual dentro de uma sessão: pageview, clique, identificação,
 * início/abandono de checkout, compra, heartbeat. É o rastro cru que monta a
 * linha do tempo da visita no painel.
 */
export default class AnalyticsEvent extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      sessionId: { type: DataTypes.STRING(64), allowNull: false },
      visitorId: { type: DataTypes.STRING(64), allowNull: false },

      // pageview | click | identify | checkout_start | checkout_abandon |
      // purchase | heartbeat | custom
      type: { type: DataTypes.STRING(40), allowNull: false },
      // Rótulo legível (texto do botão clicado, nome da etapa, etc).
      name: { type: DataTypes.STRING(200), allowNull: true },
      path: { type: DataTypes.STRING(255), allowNull: true },
      // Detalhes livres (plano escolhido, posição do clique, etc).
      metadata: { type: DataTypes.JSONB, allowNull: true },

      // Momento em que o evento ocorreu NO CLIENTE (pode diferir do created_at
      // do servidor quando o lote é enviado com atraso / via beacon no unload).
      occurredAt: { type: DataTypes.DATE, allowNull: true }
    }, {
      sequelize,
      tableName: 'analytics_events',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['session_id'] },
        { fields: ['visitor_id'] },
        { fields: ['type'] },
        { fields: ['created_at'] }
      ]
    });
  }

  static associate() {
    // Ligações por string no service (ver AnalyticsVisitor).
  }
}
