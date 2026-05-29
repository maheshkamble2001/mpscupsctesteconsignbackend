'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class tbl_tests extends Model {
        static associate(models) {
            // If any associations in future
            tbl_tests.belongsTo(models.tbl_testtypes, {
                foreignKey: 'TestTypeID',
                as: 'TestType'
            });

            tbl_tests.hasMany(models.tbl_mcqtestquestions, {
                foreignKey: 'TestID',
                as: 'Questions'
            });

            tbl_tests.belongsTo(models.tbl_examtype, {
                foreignKey: 'ExamTypeID',
                as: 'ExamType'
            });

            tbl_tests.hasMany(models.tbl_testlanguages, {
                foreignKey: 'TestID',
                as: 'TestLanguages'
            });
        }
    }

    tbl_tests.init({
        TestID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        TestTitle: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        TestTypeID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        ExamTypeID: {
            type: DataTypes.INTEGER,
        },
        TotalMarks: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        TotalQuestions: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        TestPaperPdf: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        ModelAnswerPdf: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        Status: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 1
        },
        Syllabus: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        TargetYear: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        TeacherName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        Duration: {
            type: DataTypes.STRING(200),
            allowNull: true,
            defaultValue: null
        },
        PositiveMarks: {
            type: DataTypes.DECIMAL(10, 2), // 2 decimal places allowed
            allowNull: true,
            defaultValue: null
        },
        NegativeMarks: {
            type: DataTypes.DECIMAL(10, 2), // 2 decimal places allowed
            allowNull: true,
            defaultValue: null
        },

        Description: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
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
    }, {
        sequelize,
        modelName: 'tbl_tests',
        tableName: 'tbl_tests',
        timestamps: false
    });

    return tbl_tests;
};
