'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class tbl_mcqtestquestions extends Model {
    static associate(models) {
      // Example association with a tests table (if needed)
      tbl_mcqtestquestions.belongsTo(models.tbl_tests, {
        foreignKey: 'TestID',
        as: 'Test'
      });

      // Add other associations if needed
    }
  }

  tbl_mcqtestquestions.init({
    QuestionID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    TestID: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ExamTypeId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    SubjectId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Question: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    Option1: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    Option2: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    Option3: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    Option4: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    CorrectOption: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    AnswerDesc: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    addedon: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: true
    },
    isdeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true
    },
    isimport: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true
    },
    parentQuestionId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    language: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbl_mcqtestquestions',
    modelName: 'tbl_mcqtestquestions',
  });

  return tbl_mcqtestquestions;
};
