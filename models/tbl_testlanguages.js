'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class tbl_testlanguages extends Model {
        static associate(models) {
            // Relation with tbl_tests
            tbl_testlanguages.belongsTo(models.tbl_tests, {
                foreignKey: 'TestID',
                as: 'Test'
            });

            // Relation with tbl_languages (अगर language table है तो)
            tbl_testlanguages.belongsTo(models.tbl_languages, {
                foreignKey: 'LanguageID',
                as: 'Language'
            });
        }
    }

    tbl_testlanguages.init(
        {
            ID: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            TestID: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            LanguageID: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            AddedOn: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        },
        {
            sequelize,
            tableName: 'tbl_testlanguages',
            modelName: 'tbl_testlanguages',
            timestamps: false // क्योंकि आपके table में createdAt/updatedAt नहीं हैं
        }
    );

    return tbl_testlanguages;
};
