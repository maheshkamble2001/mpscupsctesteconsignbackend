'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class tbl_mcqtestuserresults extends Model {
    static associate(models) {
      // Associations (optional)
      // tbl_mcqtestuserresults.belongsTo(models.tbl_mcqtestquestions, {
      //   foreignKey: 'questionid',
      //   as: 'Question'
      // });

      // tbl_mcqtestuserresults.belongsTo(models.tbl_webusers, {
      //   foreignKey: 'studentid',
      //   as: 'Student'
      // });

      // tbl_mcqtestuserresults.belongsTo(models.tbl_tests, {
      //   foreignKey: 'testid',
      //   as: 'Test'
      // });
    }
  }

  tbl_mcqtestuserresults.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      studentid: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      testid: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      questionid: {
        type: DataTypes.BIGINT,
        allowNull: true
      },

      qanswer: {
        type: DataTypes.STRING(50),
        allowNull: true
      },

      IsCorrectAnswer: {
        type: DataTypes.TINYINT,
        allowNull: true
      },

      qoption: {
        type: DataTypes.STRING(50),
        allowNull: true
      },

      addedon: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: true
      },

      language: {
        type: DataTypes.STRING(100),
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'tbl_mcqtestuserresults',
      modelName: 'tbl_mcqtestuserresults',
      timestamps: false   // Your table has no createdAt / updatedAt
    }
  );

  return tbl_mcqtestuserresults;
};
