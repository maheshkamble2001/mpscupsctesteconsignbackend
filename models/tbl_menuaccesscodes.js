'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class tbl_menuaccesscodes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define associations here if needed
      tbl_menuaccesscodes.belongsTo(models.tbl_menumodules, {
        foreignKey: 'moduleid',
        as: 'module'
      });
    }
  }

  tbl_menuaccesscodes.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },

    moduleid: {
      type: DataTypes.INTEGER,
    },

    access_code: {
      type: DataTypes.INTEGER,
    },

    access_name: {
      type: DataTypes.STRING,
    },

    status: {
      type: DataTypes.TINYINT(1),
    },

    isdeleted: {
      type: DataTypes.TINYINT,
    },
    
    addedon: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    tableName: 'tbl_menuaccesscodes',
    modelName: 'tbl_menuaccesscodes',
  });

  return tbl_menuaccesscodes;
};
