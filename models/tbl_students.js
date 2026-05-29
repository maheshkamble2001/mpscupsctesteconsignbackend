"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class tbl_students extends Model {
    static associate(models) {
      // Example association with a states table
      tbl_students.belongsTo(models.tbl_states, {
        foreignKey: "StateID",
        as: "State",
      });
      // tbl_students.hasMany(models.tbl_webusercourses, {
      //   sourceKey: "ID", // column in tbl_students
      //   foreignKey: "studentid", // column in tbl_webusercourses
      //   as: "courses",
      // });

      // Add other associations if needed
    }
  }

  tbl_students.init(
    {
      ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      Name: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },
      Mobile: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      EmailID: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },
      Password: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },
      StateID: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      City: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },
      Address: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },
      AdmissionDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      Status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      IsDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      AddedOn: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "tbl_students",
      modelName: "tbl_students",
    },
  );

  return tbl_students;
};
