import { Model, DataTypes } from 'sequelize';

export default class ProductKnowledge extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      topicTitle: {
        type: DataTypes.STRING,
        allowNull: false
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          // "Geral" cobre conhecimentos que não são de um produto específico
          // (abordagem, cross-sell, plano B, persistência comercial, etc.).
          isIn: [['Geral', 'Investimentos', 'Previdência', 'Seguros', 'Crédito', 'Cartões', 'Consórcio', 'Capitalização']]
        }
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'product_knowledge',
      underscored: true,
      timestamps: true
    });
  }

  static associate(models) {
    // No direct associations required for knowledge snippets
  }
}
