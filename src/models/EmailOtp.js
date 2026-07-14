import { Model, DataTypes } from 'sequelize';

export default class EmailOtp extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      otpCode: {
        type: DataTypes.STRING(6),
        allowNull: false
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'email_otps',
      underscored: true,
      timestamps: true
    });
  }

  static associate(models) {
    // No associations needed for temporary OTP codes
  }
}
