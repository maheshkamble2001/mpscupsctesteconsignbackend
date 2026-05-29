'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class tbl_languages extends Model {
        static associate(models) {
            // Add associations here if needed later
            tbl_languages.hasMany(models.tbl_testlanguages, {
                foreignKey: 'LanguageID',
                as: 'Languages'
            });
        }
    }

    tbl_languages.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
                unique: true
            },
            name: {
                type: DataTypes.STRING(200),
                allowNull: false
            },
            addedon: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        },
        {
            sequelize,
            tableName: 'tbl_languages',
            modelName: 'tbl_languages'
        }
    );

    return tbl_languages;
};
