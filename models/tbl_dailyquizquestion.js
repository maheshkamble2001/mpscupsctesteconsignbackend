'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tbl_dailyquizquestion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  tbl_dailyquizquestion.init({
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    dailyquizId: DataTypes.BIGINT,
    question: DataTypes.STRING,
    correctOption: DataTypes.STRING,
    description: DataTypes.TEXT,
    optionA: DataTypes.STRING,
    optionB: DataTypes.STRING,
    optionC: DataTypes.STRING,
    optionD: DataTypes.STRING,
    status: DataTypes.BOOLEAN(1),
    isDeleted: DataTypes.BOOLEAN(0),
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },

  }, {
    sequelize,
    tableName: 'tbl_dailyquizquestions',
    modelName: 'tbl_dailyquizquestion',
  });
  return tbl_dailyquizquestion;
};