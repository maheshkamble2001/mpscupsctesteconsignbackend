'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tbl_adminusers extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */

    static associate(models) {

       tbl_adminusers.belongsTo(models.tbl_usertypes, {
        foreignKey: 'UserTypeID',
        as: 'usersType'
      });

        tbl_adminusers.belongsTo(models.tbl_states, {
                foreignKey: 'StateID',
                as: 'State'
            });
      // define association here

      // In models/tbl_adminusers.js or association setup fil

    }
  }
  tbl_adminusers.init({
    UserID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    UserTypeID: DataTypes.INTEGER,
    FirstName: DataTypes.STRING,
    LastName: DataTypes.STRING,
    EmailID: DataTypes.STRING,
    DateOfBirth: DataTypes.DATE,
    Gender: DataTypes.STRING,
    MaritalStatus: DataTypes.STRING,
    Nationality: DataTypes.STRING,
    UserName: {
      type: DataTypes.STRING,
    },
    Password: DataTypes.STRING,
    Mobile: DataTypes.STRING,
    Address: DataTypes.STRING,
    City: DataTypes.STRING,
    StateID: DataTypes.INTEGER,
    ZipCode: DataTypes.STRING,
    Status: DataTypes.BOOLEAN,
    IsDeleted: DataTypes.BOOLEAN,
    AddedOn: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },


  }, {
    sequelize,
    tableName: 'tbl_adminusers',
    modelName: 'tbl_adminusers',
  });
  return tbl_adminusers;
};