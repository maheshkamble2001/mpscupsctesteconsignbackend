'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tbl_dailyquiz extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tbl_dailyquiz.hasMany(models.tbl_dailyquizquestion, {
        foreignKey: 'dailyquizId',
        as: 'questions'
      })
    }
  }
  tbl_dailyquiz.init({
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    quizDate: DataTypes.DATE,
    title: DataTypes.STRING,
    status: DataTypes.BOOLEAN(1),
    isDeleted: DataTypes.BOOLEAN(0),
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    tableName: 'tbl_dailyquiz',
    modelName: 'tbl_dailyquiz',
  });
  return tbl_dailyquiz;
};