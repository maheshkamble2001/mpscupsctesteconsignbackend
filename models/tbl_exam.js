'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class tbl_exam extends Model {
        static associate(models) {
            // Relation with exam type
            tbl_exam.belongsTo(models.tbl_examtype, {
                foreignKey: 'ExamTypeId',
                targetKey: 'id',
                as: 'ExamType'
            });

            tbl_exam.hasMany(models.tbl_examsubjects, {
                foreignKey: 'ExamId',
                as: 'ExamSubjects'
            });

            // Optional: If exams have tests
            tbl_exam.hasMany(models.tbl_tests, {
                foreignKey: 'ExamId',
                as: 'Tests'
            });

            tbl_exam.belongsToMany(models.tbl_subjects, {
                through: models.tbl_examsubjects,
                foreignKey: 'ExamId',
                otherKey: 'SubjectId',
                as: 'Subjects'
            });
        }
    }

    tbl_exam.init({
        ExamId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        ExamName: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        ExamShortName: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        ExamTypeId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        Stage: {
            type: DataTypes.STRING(100), // e.g., Prelims, Mains
            allowNull: true
        },
        Duration: {
            type: DataTypes.INTEGER, // in minutes
            allowNull: true
        },
        TotalMarks: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        TotalQuestions: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        MarkPerCorrect: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        NegativeMark: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        CuttOff: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        ExamMedium: {
            type: DataTypes.STRING(100), // e.g., English, Hindi
            allowNull: true
        },
        ShowInCatalogue: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: true
        },
        AllFreeTrial: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: true
        },
        OpenEnrollment: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: true
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
        tableName: 'tbl_exam',
        modelName: 'tbl_exam',
    });

    return tbl_exam;
};