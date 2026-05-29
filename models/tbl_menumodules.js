'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class tbl_menumodules extends Model {
    /**
     * Helper method for defining associations.
     */
    static associate(models) {
      // define associations here if needed
    }
  }

  tbl_menumodules.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },

    modulename: {
      type: DataTypes.STRING,
    },

    moduledesc: {
      type: DataTypes.STRING,
    },

    addedon: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    tableName: 'tbl_menumodules',
    modelName: 'tbl_menumodules',
  });

  return tbl_menumodules;
};
