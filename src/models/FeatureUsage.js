import { Model, DataTypes } from 'sequelize';

/**
 * Registro de uso de uma funcionalidade que NÃO gera um registro próprio
 * contável (Copiloto IA, Gerador, Copiloto no WhatsApp). Cada ação bem-sucedida
 * grava uma linha; o enforceLimit conta as linhas no período do plano para
 * decidir se ainda cabe mais uma.
 *
 * Funcionalidades que já criam registro (Simulação, Cliente, Meta, Anotação,
 * Análise de Áudio) são contadas na própria tabela — não passam por aqui.
 */
export default class FeatureUsage extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      featureKey: { type: DataTypes.STRING(40), allowNull: false }
    }, {
      sequelize,
      tableName: 'feature_usages',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['user_id', 'feature_key', 'created_at'] }
      ]
    });
  }

  static associate() {
    // Sem associações: contagem simples por user_id + feature_key.
  }
}
