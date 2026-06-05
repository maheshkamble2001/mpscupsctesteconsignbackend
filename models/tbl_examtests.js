'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class tbl_examtests extends Model {
    static associate(models) {

      // 🔗 Relation with Exam
      tbl_examtests.belongsTo(models.tbl_exam, {
        foreignKey: 'ExamId',
        targetKey: 'ExamId',
        as: 'Exam'
      });

      // 🔗 Relation with Test Questions
      tbl_examtests.hasMany(models.tbl_testquestions, {
        foreignKey: 'TestId',
        sourceKey: 'TestId',
        as: 'TestQuestions'
      });

    }
  }

  tbl_examtests.init({
    TestId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },

    TestName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    TestType: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    ExamId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    Duration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    Attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    Description: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    Tags: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    noOfQuestions: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    marksPerQuestion: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },

    negativeMarks: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },

    languages: {
      type: DataTypes.STRING(255), // comma separated
      allowNull: true
    },

    isShuffle: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    isAnswerShuffle: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    isAllowReview: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    isShowWarningTimer: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    isDisableRightClick: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    addedOn: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }

  }, {
    sequelize,
    tableName: 'tbl_examtests',
    modelName: 'tbl_examtests',
    timestamps: false
  });

  return tbl_examtests;
};