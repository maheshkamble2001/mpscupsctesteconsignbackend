'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class tbl_usertypes extends Model {
    static associate(models) {
      tbl_usertypes.hasMany(models.tbl_roleaccess, {
        foreignKey: 'role_id',
        as: 'RoleAccess'
      });

      tbl_usertypes.hasMany(models.tbl_adminusers, {
        foreignKey: 'UserTypeID',
        as: 'AdminUsers'
      });
    }
  }

  tbl_usertypes.init(
    {
      UserTypeID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true
      },
      UserType: DataTypes.STRING,
      Status: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
        allowNull: false
      },
      IsDeleted: DataTypes.BOOLEAN,
      AddedOn: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: 'tbl_usertypes',
      modelName: 'tbl_usertypes'
    }
  );

  return tbl_usertypes;
};
