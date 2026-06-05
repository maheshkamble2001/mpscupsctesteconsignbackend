'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class tbl_testquestions extends Model {
    static associate(models) {

      // 🔗 Relation with Test
      tbl_testquestions.belongsTo(models.tbl_examtests, {
        foreignKey: 'TestId',
        targetKey: 'TestId',
        as: 'Test'
      });

      // 🔗 Optional: Subject relation
      tbl_testquestions.belongsTo(models.tbl_subjects, {
        foreignKey: 'SubjectId',
        targetKey: 'SubjectID',
        as: 'Subject'
      });

    }
  }

  tbl_testquestions.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },

    TestId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    SubjectId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    questionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    addedOn: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }

  }, {
    sequelize,
    tableName: 'tbl_testquestions',
    modelName: 'tbl_testquestions',
    timestamps: false
  });

  return tbl_testquestions;
};