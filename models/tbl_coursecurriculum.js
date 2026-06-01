'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class tbl_coursecurriculum extends Model {
    static associate(models) {

      // 🔗 Relation with Course
      tbl_coursecurriculum.belongsTo(models.tbl_examcourses, {
        foreignKey: 'CourseId',
        targetKey: 'CourseId',
        as: 'Course'
      });

    }
  }

  tbl_coursecurriculum.init({
    CurriculumId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },

    CourseId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    CourseCarriculam: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    ModuleName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    Duration: {
      type: DataTypes.INTEGER, // minutes
      allowNull: true
    },

    addedon: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },

    isdeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }

  }, {
    sequelize,
    tableName: 'tbl_coursecurriculum',
    modelName: 'tbl_coursecurriculum',
    timestamps: false
  });

  return tbl_coursecurriculum;
};