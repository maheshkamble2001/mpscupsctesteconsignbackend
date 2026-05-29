'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tbl_roleaccess extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      tbl_roleaccess.belongsTo(models.tbl_menuaccesscodes, {
        foreignKey: 'access_code',
        targetKey: 'access_code', 
        as: 'menuAccess'
      });
    }
  }
  tbl_roleaccess.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    role_id : DataTypes.INTEGER,
    access_name : DataTypes.STRING,
    access_code : DataTypes.INTEGER,
    status : {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 1
    },
    created_at : {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    tableName: 'tbl_roleaccess',
    modelName: 'tbl_roleaccess',
  });
  return tbl_roleaccess;
};