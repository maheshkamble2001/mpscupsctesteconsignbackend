"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tbl_subjects extends Model {
    static associate(models) {
      // define association here if needed
    }
  }
  tbl_subjects.init(
    {
      SubjectID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      SubjectName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      Description: DataTypes.TEXT,
      Status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 1,
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
      tableName: "tbl_subjects",
      modelName: "tbl_subjects",
      timestamps: false,
    },
  );

  return tbl_subjects;
};
