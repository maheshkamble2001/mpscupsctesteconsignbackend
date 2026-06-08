"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class tbl_studentexams extends Model {
    static associate(models) {
      // 🔗 Student relation
      tbl_studentexams.belongsTo(models.tbl_students, {
        foreignKey: "studentid",
        as: "Student",
      });

      // 🔗 Exam relation
      tbl_studentexams.belongsTo(models.tbl_exam, {
        foreignKey: "examid",
        as: "Exam",
      });
    }
  }

  tbl_studentexams.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      studentid: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      examid: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description:{
        type:DataTypes.TEXT,
        allowNull:true,
      },

      IsDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },

      AddedOn: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "tbl_studentexams",
      modelName: "tbl_studentexams",
      timestamps: false,
    }
  );

  return tbl_studentexams;
};