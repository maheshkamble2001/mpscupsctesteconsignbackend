"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class tbl_courses extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      //   tbl_courses.belongsTo(models.tbl_adminusers, {
      //       foreignKey: 'CourseAdminID',
      //       as: 'CourseAdmin'
      //     }),
      //     tbl_courses.belongsTo(models.tbl_courseverticles, {
      //       foreignKey: 'CourseFor',
      //       as: 'CourseVerticle'
      //     }),
      //     tbl_courses.belongsTo(models.tbl_coursetypes, {
      //       foreignKey: 'CourseCategory',
      //       as: 'CourseCategoryData'
      //     }),
      //     tbl_courses.hasMany(models.tbl_ondemandcoursesections, {
      //       foreignKey: 'CourseID',
      //       as: 'OnDemandCourseData'
      //     }),
      //     tbl_courses.hasOne(models.tbl_coursebillingcourseassocitation, {
      //       foreignKey: 'CourseId',
      //       as: 'BillingCourse'
      //     }),
      //     tbl_courses.hasMany(models.tbl_courselectures, {
      //       foreignKey: 'courseid',
      //       as: 'CourseLectures'
      //     }),
      //     tbl_courses.hasMany(models.tbl_addoncourses, {
      //       foreignKey: 'addon_course_id',
      //       as: 'Addons'
      //     }),
      //     // tbl_courses.hasMany(models.tbl_coursesections, {
      //     //   foreignKey: 'CourseID',
      //     //   as: 'CourseSections'
      //     // }),
      //     tbl_courses.hasMany(models.tbl_ondemandcoursesections, {
      //       foreignKey: 'CourseID',
      //       as: 'CourseSections'
      //     }),
      //     tbl_courses.hasMany(models.tbl_courseplatform, {
      //       foreignKey: 'course_id',
      //       as: 'CoursePlatform'
      //     })
      //     tbl_courses.hasMany(models.tbl_expmobilecourses, {
      //       foreignKey: 'courseid',
      //       as: 'expmobilecourses'
      //     })
      //   tbl_courses.hasOne(models.tbl_courseevaluationrates, {
      //     foreignKey: 'courseid',
      //     as: 'Courseevaluationrate'
      //   })
    }
  }
  tbl_courses.init(
    {
      CourseID: {
        type: DataTypes.STRING(100),
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      CourseFor: DataTypes.TINYINT, // 1 => upsc, 2 => state pcs
      StateId: DataTypes.INTEGER, // state id id CourseFor is "state pcs"
      CourseAdminID: DataTypes.STRING(100),
      CourseTitle: DataTypes.STRING(500),
      CourseCategory: DataTypes.STRING(100),
      TargetYear: DataTypes.STRING(50),
      DisplayName: DataTypes.STRING(500),
      Description: DataTypes.TEXT,
      ShortDescription: DataTypes.TEXT,
      StartDate: DataTypes.DATE,
      EndDate: DataTypes.DATE,
      CourseFees: DataTypes.STRING,
      CourseType: DataTypes.STRING,
      Status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 1,
      },
      isPostal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      AddedOn: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      ShowMainTestSeries: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 1,
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      ShowCourseLectures: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 1,
      },
      ShowPrelimTestSeries: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      ShowEssayTestSeries: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      ShowClassTestSeries: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      ShowPSIRSectionalTestsBeforePrelims: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      ShowPSIRMainsCrashCourse: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      LectureTime: DataTypes.STRING,
      TotalLectures: DataTypes.INTEGER,
      TotalTimeAllocated: DataTypes.INTEGER,
      Platform: DataTypes.STRING,
      IsDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      Language: DataTypes.ENUM("1", "2"), //1 => english, 2 => hindi
      DisplayNameHindi: DataTypes.STRING,
      DescriptionHindi: DataTypes.STRING,
      Mentorship: DataTypes.STRING,
      ShowliveLecture: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      CourseOptions: DataTypes.STRING,
      CourseTab: DataTypes.STRING,
      image: DataTypes.STRING,
      Counsellor: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "N",
      },
      OnDemand: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "N",
      },
      IsScholarship: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "N",
      },
      telegramlink: {
        type: DataTypes.STRING,
      },
      ExpLectures: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      }, //1 => yes/ 0 => no
    },
    {
      sequelize,
      tableName: "tbl_courses",
      modelName: "tbl_courses",
    },
  );

  // tbl_courses.removeAttribute('id');

  return tbl_courses;
};
