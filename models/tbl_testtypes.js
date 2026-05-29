'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class tbl_testtypes extends Model {
        static associate(models) {
            // define association here
            tbl_testtypes.hasMany(models.tbl_tests, {
                foreignKey: 'TestTypeID',
                as: 'Tests'
            });
        }
    }

    tbl_testtypes.init(
        {
            ID: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
                unique: true
            },
            TestType: DataTypes.STRING,
            Status: {
                type: DataTypes.TINYINT,
                defaultValue: 1,
                allowNull: false
            },
            IsDeleted: {
                type: DataTypes.TINYINT,
                defaultValue: 0,
                allowNull: false
            },
            AddedOn: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        },
        {
            sequelize,
            tableName: 'tbl_testtypes',
            modelName: 'tbl_testtypes'
        }
    );

    return tbl_testtypes;
};
