'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class tbl_examcourses extends Model {
    static associate(models) {

      // 🔗 Relation with Exam
      tbl_examcourses.belongsTo(models.tbl_exam, {
        foreignKey: 'ExamId',
        targetKey: 'ExamId',
        as: 'Exam'
      });

      tbl_examcourses.hasMany(models.tbl_coursecurriculum, {
        foreignKey: 'CourseId',
        sourceKey: 'CourseId',
        as: 'CourseCurriculum'
      });
    }
  }

  tbl_examcourses.init({
    CourseId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },

    CourseTitle: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    ExamId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    CourseCode: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    StartDate: {
      type: DataTypes.DATE, // ✅ supports date + time
      allowNull: true
    },

    TagLine: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    Description: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    CoverImage: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    CourseListPrice: {
      type: DataTypes.FLOAT,
      allowNull: true
    },

    CourseLaunchPrice: {
      type: DataTypes.FLOAT,
      allowNull: true
    },

    NoOfSeats: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    EMI: {
      type: DataTypes.BOOLEAN, // true = EMI available
      defaultValue: false
    },
    Status: {
      type: DataTypes.BOOLEAN, // true = active, false = inactive
      defaultValue: true
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
    tableName: 'tbl_examcourses',
    modelName: 'tbl_examcourses',
    timestamps: false
  });

  return tbl_examcourses;
};