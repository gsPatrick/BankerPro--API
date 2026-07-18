import { Model, DataTypes } from 'sequelize';

/**
 * Código temporário para vincular um número de WhatsApp a uma conta. Gerado
 * quando um número ainda não vinculado manda mensagem para o bot; o código é
 * enviado de volta pelo WhatsApp e o usuário o digita no painel. Como o número
 * vem direto do WhatsApp (não é digitado à mão), o vínculo fica sempre correto.
 */
export default class WhatsappOtp extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      // Número exatamente como o WhatsApp o envia (só dígitos, com DDI).
      whatsapp: {
        type: DataTypes.STRING(30),
        allowNull: false
      },
      code: {
        type: DataTypes.STRING(6),
        allowNull: false
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    }, {
      sequelize,
      tableName: 'whatsapp_otps',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['code'] },
        { fields: ['whatsapp'] }
      ]
    });
  }

  static associate(models) {
    // Código temporário, sem associação.
  }
}
