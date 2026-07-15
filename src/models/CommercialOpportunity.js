import { Model, DataTypes } from 'sequelize';
import {
  OpportunityProducts,
  OpportunityChannels,
  OpportunityStatuses,
} from '../config/constants.js';

export default class CommercialOpportunity extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        product: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isIn: [OpportunityProducts],
          },
        },
        alternativeProduct: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        clientProfile: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        ageRange: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
        incomeRange: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
        balanceRange: {
          type: DataTypes.STRING(120),
          allowNull: true,
        },
        recommendedChannel: {
          type: DataTypes.STRING(40),
          allowNull: false,
          defaultValue: 'Ligação',
          validate: {
            isIn: [OpportunityChannels],
          },
        },
        objective: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        openingScript: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        diagnosticQuestions: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
        },
        mainArgument: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        objections: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
        },
        objectionResponses: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
        },
        fallbackPlan: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        closingScript: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        tags: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
          defaultValue: [],
        },
        status: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'Ativo',
          validate: {
            isIn: [OpportunityStatuses],
          },
        },
      },
      {
        sequelize,
        tableName: 'commercial_opportunities',
        underscored: true,
        timestamps: true,
      }
    );
  }

  static associate() {
    // Catálogo global — sem associações
  }
}
