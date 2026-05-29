'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class tbl_states extends Model {
        static associate(models) {
            // Define associations here if needed
           tbl_states.hasMany(models.tbl_adminusers, {
                foreignKey: 'StateID',
                as: 'AdminUsers'
            });
            tbl_states.hasMany(models.tbl_students, {
                foreignKey: 'StateID',
                as: 'Students'
            });
        }
    }

    tbl_states.init(
        {
            StateID: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
                unique: true
            },
            StateName: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            IsDeleted: {
                type: DataTypes.TINYINT,
                allowNull: false,
                defaultValue: 0
            },
            AddedOn: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            }
        },
        {
            sequelize,
            tableName: 'tbl_states',
            modelName: 'tbl_states',
            timestamps: false
        }
    );

    return tbl_states;
};
