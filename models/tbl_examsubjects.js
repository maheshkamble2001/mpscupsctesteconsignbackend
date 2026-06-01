'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class tbl_examsubjects extends Model {
        static associate(models) {
            tbl_examsubjects.belongsTo(models.tbl_exam, {
                foreignKey: 'ExamId',
                targetKey: 'ExamId',
                as: 'Exam'
            });

            tbl_examsubjects.belongsTo(models.tbl_subjects, {
                foreignKey: 'SubjectId',
                targetKey: 'SubjectID',
                as: 'Subject'
            });
        }
    }

    tbl_examsubjects.init({
        ExamSubjectId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        ExamId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        SubjectId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        addedon: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: true
        },
        isdeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: true
        }
    }, {
        sequelize,
        tableName: 'tbl_examsubjects',
        modelName: 'tbl_examsubjects',
        timestamps: false,
    });

    return tbl_examsubjects;
};