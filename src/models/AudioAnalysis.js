import { Model, DataTypes } from 'sequelize';

export default class AudioAnalysis extends Model {
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
      // O áudio em si não é guardado: é apagado assim que a transcrição sai.
      // O que fica é o texto, que é o insumo da análise e o que o usuário relê.
      transcription: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      // Feedback do treinador comercial, em texto corrido.
      analysis: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      // Nota de 0 a 10 que a IA atribuiu, extraída para listar e ordenar o
      // histórico sem precisar reprocessar o texto. Nula se não vier no feedback.
      score: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true
      },
      durationSeconds: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      // De onde veio o áudio: a plataforma ou o WhatsApp.
      source: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'painel',
        validate: {
          isIn: [['painel', 'whatsapp']]
        }
      }
    }, {
      sequelize,
      tableName: 'audio_analyses',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['created_by_user_id', 'created_at'] }
      ]
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'createdByUserId', as: 'creator' });
  }
}
