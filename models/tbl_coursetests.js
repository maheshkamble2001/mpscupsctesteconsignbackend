"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tbl_coursetests extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      tbl_coursetests.belongsTo(models.tbl_courses, {
        foreignKey: "CourseID",
        as: "courses",
      });
      tbl_coursetests.belongsTo(models.tbl_tests, {
        foreignKey: "TestID", // column in tbl_webusercourses
        targetKey: "TestID", // column in tbl_students
        as: "tests",
      });
    }
  }
  tbl_coursetests.init(
    {
      CourseID: DataTypes.STRING,
      TestID: DataTypes.STRING,
      scheduleDate: DataTypes.DATE,
      customscheduleDate: DataTypes.DATE,
      // scheduleTime: DataTypes.DATE,
      ValidDate: DataTypes.DATE,
      // ValidTime: DataTypes.DATE,
      ValueNotes: DataTypes.STRING,
      CField1: DataTypes.STRING,
      CField2: DataTypes.STRING,
      CField3: DataTypes.STRING,
      CField4: DataTypes.STRING,
      CField5: DataTypes.STRING,
      AddedOn: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      customId: DataTypes.BIGINT,
      TestType: DataTypes.STRING,
      TestSubType: DataTypes.STRING,
      ClassTestCategory: DataTypes.STRING,
      language: DataTypes.STRING,
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      tableName: "tbl_coursetests",
      modelName: "tbl_coursetests",
    },
  );

  tbl_coursetests.removeAttribute("id");

  return tbl_coursetests;
};
