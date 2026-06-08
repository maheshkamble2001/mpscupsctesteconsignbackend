"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class tbl_upcomingexams extends Model {
    static associate(models) {
      // Example associations (you can enable later)

      // tbl_upcomingexams.hasMany(models.tbl_mocktests, {
      //   foreignKey: "ExamID",
      //   as: "MockTests",
      // });

      // tbl_upcomingexams.belongsTo(models.tbl_states, {
      //   foreignKey: "StateId",
      //   as: "State",
      // });
    }
  }

  tbl_upcomingexams.init(
    {
      ExamID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      ExamTitle: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },

      Slug: {
        type: DataTypes.STRING(255),
        unique: true,
      },

      Organization: {
        type: DataTypes.STRING(100), // UPSC, MPSC
      },

      Category: {
        type: DataTypes.STRING(100), // Civil, Police, Banking
      },

      ExamType: {
        type: DataTypes.STRING(50), // State / Central
      },

      StateId: {
        type: DataTypes.INTEGER, // if ExamType = State
      },

      NotificationDate: {
        type: DataTypes.DATE,
      },

      ApplicationStartDate: {
        type: DataTypes.DATE,
      },

      ApplicationEndDate: {
        type: DataTypes.DATE,
      },

      ExamDate: {
        type: DataTypes.DATE,
      },

      Status: {
        type: DataTypes.ENUM("UPCOMING", "OPEN", "CLOSED"),
        defaultValue: "UPCOMING",
      },

      TotalPosts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      Eligibility: {
        type: DataTypes.TEXT,
      },

      Description: {
        type: DataTypes.TEXT,
      },

      OfficialURL: {
        type: DataTypes.TEXT,
      },

      SyllabusURL: {
        type: DataTypes.TEXT,
      },

      Source: {
        type: DataTypes.ENUM("ADMIN", "SCRAPER"),
        defaultValue: "ADMIN",
      },

      IsActive: {
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

      UpdatedOn: {
        type: DataTypes.DATE,
        defaultValue:DataTypes.NOW
      },
    },
    {
      sequelize,
      tableName: "tbl_upcomingexams",
      modelName: "tbl_upcomingexams",
      timestamps: false, // since you use AddedOn manually
    }
  );

  return tbl_upcomingexams;
};