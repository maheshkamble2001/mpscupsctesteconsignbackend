'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class tbl_examtype extends Model {
        static associate(models) {
            // define association here
          tbl_examtype.hasMany(models.tbl_tests, {
                foreignKey: 'ExamTypeID',
                as: 'Tests'
            });
        }
    }

    tbl_examtype.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
                unique: true
            },
            name: DataTypes.STRING,
            status: {
                type: DataTypes.TINYINT,
                defaultValue: 1,
                allowNull: false
            },
            isdeleted: {
                type: DataTypes.TINYINT,
                defaultValue: 0,
                allowNull: false
            },
            addedOn: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        },
        {
            sequelize,
            tableName: 'tbl_examtype',
            modelName: 'tbl_examtype'
        }
    );

    return tbl_examtype;
};
