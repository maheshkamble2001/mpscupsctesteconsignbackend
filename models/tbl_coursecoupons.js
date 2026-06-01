'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class tbl_coursecoupons extends Model {
    static associate(models) {

      // 🔗 Relation with Course
      tbl_coursecoupons.belongsTo(models.tbl_examcourses, {
        foreignKey: 'CourseId',
        targetKey: 'CourseId',
        as: 'Course'
      });

    }
  }

  tbl_coursecoupons.init({
    CouponId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    CourseId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    CouponCode: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },

    DiscountType: {
      type: DataTypes.ENUM('PERCENT', 'FLAT'),
      allowNull: false
    },

    DiscountValue: {
      type: DataTypes.FLOAT,
      allowNull: false
    },

    MaxDiscountAmount: {
      type: DataTypes.FLOAT,
      allowNull: true
    },

    MinPurchaseAmount: {
      type: DataTypes.FLOAT,
      allowNull: true
    },

    UsageLimit: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    UsedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    StartDate: {
      type: DataTypes.DATE
    },

    EndDate: {
      type: DataTypes.DATE
    },

    IsActive: {
      type: DataTypes.BOOLEAN,
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
    tableName: 'tbl_coursecoupons',
    modelName: 'tbl_coursecoupons',
    timestamps: false
  });

  return tbl_coursecoupons;
};