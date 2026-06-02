const { tbl_examcourses: Course,
    tbl_coursecurriculum: Curriculum,
    tbl_coursecoupons: Coupon,
    tbl_exam: Exam } = require('../../../../models');

const { Op, Sequelize } = require("sequelize");
const { Validator } = require('node-input-validator');

const { success, failed, failedValidation } = require('../../../helper/response');
const { decrypter } = require('../../../helper/crypto');
const path = require('path');

exports.createCourse = async (req, res) => {
    try {
        const requests = await decrypter(req.body);

        const v = new Validator(requests, {
            CourseTitle: 'required|string',
            ExamId: 'required|integer',
            CourseCode: 'required|string',
            StartDate: 'required',
        });

        if (!(await v.check())) return failedValidation(res, v);

        const isExamExist = await Exam.findOne({ where: { ExamId: requests.ExamId } });
        if (!isExamExist) return failed(res, "Exam not found");

        const isCourseCodeExist = await Course.findOne({ where: { CourseCode: requests.CourseCode } });
        if (isCourseCodeExist) return failed(res, "Course code already exists");

        const isCourseTitleExist = await Course.findOne({ where: { CourseTitle: requests.CourseTitle } });
        if (isCourseTitleExist) return failed(res, "Course title already exists");

        let logoPath = null;

        if (req.files && req.files.CourseCoverImage) {
            const file = req.files.CourseCoverImage;

            const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
            if (!allowedTypes.includes(file.mimetype)) {
                return failed(res, "Invalid course cover image type");
            }


            const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
            const newPath = path.join("storedata/", fileName);

            await file.mv(newPath);

            logoPath = `storedata/${fileName}`;
        }


        const course = await Course.create({
            ...requests,
            CoverImage: logoPath,
            addedon: new Date(),
            isdeleted: 0
        });

        return success(res, "Course added successfully!");

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const requests = await decrypter(req.body);

        const v = new Validator(requests, {
            CourseId: 'required|integer',
            CourseTitle: 'required|string',
            ExamId: 'required|integer',
            CourseCode: 'required|string',
            StartDate: 'required'
        });

        if (!(await v.check())) return failedValidation(res, v);

        // ✅ Check course exists
        const existingCourse = await Course.findOne({
            where: { CourseId: requests.CourseId }
        });
        if (!existingCourse) return failed(res, "Course not found");

        // ✅ Check exam exists
        const isExamExist = await Exam.findOne({
            where: { ExamId: requests.ExamId }
        });
        if (!isExamExist) return failed(res, "Exam not found");

        // ✅ Check duplicate CourseCode (exclude current record)
        const isCourseCodeExist = await Course.findOne({
            where: {
                CourseCode: requests.CourseCode,
                CourseId: { [Op.ne]: requests.CourseId }
            }
        });
        if (isCourseCodeExist) return failed(res, "Course code already exists");

        // ✅ Check duplicate CourseTitle (exclude current record)
        const isCourseTitleExist = await Course.findOne({
            where: {
                CourseTitle: requests.CourseTitle,
                CourseId: { [Op.ne]: requests.CourseId }
            }
        });
        if (isCourseTitleExist) return failed(res, "Course title already exists");

        let logoPath = existingCourse.CoverImage;

        // ✅ Handle image upload (optional in update)
        if (req.files && req.files.CourseCoverImage) {
            const file = req.files.CourseCoverImage;

            const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
            if (!allowedTypes.includes(file.mimetype)) {
                return failed(res, "Invalid course cover image type");
            }

            const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
            const newPath = path.join("storedata/", fileName);

            await file.mv(newPath);

            logoPath = `storedata/${fileName}`;
        }

        const updatedData = {
            ...requests,
            CoverImage: logoPath
        };

        delete updatedData.CourseId;

        await Course.update(updatedData, {
            where: { CourseId: requests.CourseId }
        });

        return success(res, "Course updated successfully!");

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.listCourses = async (req, res) => {
    try {
        let requests = await decrypter(req.query) || req.query;

        const search = requests.search?.trim() || "";
        const page = parseInt(requests.page) || 1;
        const limit = parseInt(requests.limit) || 10;
        const offset = (page - 1) * limit;

        let whereClause = { isdeleted: 0 };

        if (search !== "") {
            whereClause[Op.or] = [
                { CourseTitle: { [Op.substring]: search } },
                { CourseCode: { [Op.substring]: search } },
            ];
        }

        const { rows, count } = await Course.findAndCountAll({
            where: whereClause,
            include: [{
                model: Exam,
                as: 'Exam',
                attributes: ['ExamId', 'ExamName']
            }],
            order: [['CourseId', 'DESC']],
            distinct: true,
            limit,
            offset
        });

        const updatedRows = rows.map(course => {
            const data = course.toJSON();

            return {
                ...data,
                CoverImage: data.CoverImage
                    ? process.env.IMAGE_BASE_URL + data.CoverImage
                    : null
            };
        });

        return success(res, "Courses fetched successfully!", { rows: updatedRows, count });

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const requests = await decrypter(req.body);

        const v = new Validator(requests, {
            CourseId: 'required|integer'
        });

        if (!(await v.check())) return failedValidation(res, v);

        // ✅ Check course exists
        const course = await Course.findOne({
            where: { CourseId: requests.CourseId }
        });

        if (!course) return failed(res, "Course not found");

        // ✅ Already deleted check
        if (course.isdeleted) {
            return failed(res, "Course already deleted");
        }

        // ✅ Soft delete
        await Course.update(
            { isdeleted: 1 },
            { where: { CourseId: requests.CourseId } }
        );

        return success(res, "Course deleted successfully");

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.updateCourseStatus = async (req, res) => {
    try {
        const requests = await decrypter(req.body);

        const v = new Validator(requests, {
            CourseId: 'required|integer'
        });

        if (!(await v.check())) return failedValidation(res, v);

        // ✅ Check course exists
        const course = await Course.findOne({
            where: { CourseId: requests.CourseId }
        });

        if (!course) return failed(res, "Course not found");

        // ✅ Update course status
        await Course.update(
            { Status: !course.Status },
            { where: { CourseId: requests.CourseId } }
        );

        return success(res, "Course status updated successfully");

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.courseDropdown = async (req, res) => {
    try {
        const courses = await Course.findAll({
            where: { isdeleted: 0 },
            attributes: ['CourseId', 'CourseTitle'],
            order: [['CourseTitle', 'ASC']]
        });

        return success(res, "Course dropdown fetched successfully!", { rows: courses });
    } catch (e) {
        return failed(res, e.message);
    }
};

exports.listCourseCurriculum = async (req, res) => {
    try {
        let requests = await decrypter(req.query) || req.query;

        const v = new Validator(requests, {
            CourseId: 'required|integer'
        });
        if (!(await v.check())) return failedValidation(res, v);

        const isCourseExist = await Course.findOne({ where: { CourseId: requests.CourseId, isdeleted: 0 } });
        if (!isCourseExist) return failed(res, "Course not found");

        const search = requests.search?.trim() || "";
        const page = parseInt(requests.page) || 1;
        const limit = parseInt(requests.limit) || 10;
        const offset = (page - 1) * limit;

        let whereClause = { isdeleted: 0, CourseId: requests.CourseId };

        if (search !== "") {
            whereClause[Op.or] = [
                { ModuleName: { [Op.substring]: search } },
            ];
        }

        const { rows, count } = await Curriculum.findAndCountAll({
            where: whereClause,
            include: [{
                model: Course,
                as: 'Course',
                attributes: ['CourseId', 'CourseTitle']
            }],
            attributes: ['CurriculumId', 'CourseId', ['CourseCarriculam', 'Description'], 'ModuleName'],
            order: [['CurriculumId', 'DESC']],
            distinct: true,
            limit,
            offset
        });

        const updatedRows = rows.map(course => {
            const data = course.toJSON();

            return {
                ...data
            };
        });

        return success(res, "Course curriculum fetched successfully!", { rows: updatedRows, count });

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.createCurriculum = async (req, res) => {
    try {
        const requests = await decrypter(req.body);

        const v = new Validator(requests, {
            CourseId: 'required|integer',
            ModuleName: 'required|string',
        });

        if (!(await v.check())) return failedValidation(res, v);

        // ✅ Check course exists
        const course = await Course.findOne({
            where: { CourseId: requests.CourseId }
        });
        if (!course) return failed(res, "Course not found");

        const isModuleExist = await Curriculum.findOne({
            where: {
                ModuleName: requests.ModuleName,
                CourseId: requests.CourseId,
                isdeleted: 0
            }
        });
        if (isModuleExist) return failed(res, "Module name already exists for this course");

        const curriculum = await Curriculum.create({
            ...requests,
            addedon: new Date(),
            isdeleted: 0
        });

        return success(res, "Curriculum added successfully");

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.updateCurriculum = async (req, res) => {
    try {
        const requests = await decrypter(req.body);

        const v = new Validator(requests, {
            CurriculumId: 'required|integer',
            CourseId: 'required|integer',
            ModuleName: 'required|string',
        });

        if (!(await v.check())) return failedValidation(res, v);

        // ✅ Check curriculum exists
        const existing = await Curriculum.findOne({
            where: { CurriculumId: requests.CurriculumId }
        });

        if (!existing) return failed(res, "Curriculum not found");

        // ✅ Check course exists
        const course = await Course.findOne({
            where: { CourseId: requests.CourseId }
        });
        if (!course) return failed(res, "Course not found");

        const isModuleExist = await Curriculum.findOne({
            where: {
                ModuleName: requests.ModuleName,
                CourseId: requests.CourseId,
                isdeleted: 0,
                CurriculumId: { [Op.ne]: requests.CurriculumId }
            }
        });
        if (isModuleExist) return failed(res, "Module name already exists for this course");


        const updatedData = {
            ...requests
        };

        delete updatedData.CurriculumId;

        await Curriculum.update(updatedData, {
            where: { CurriculumId: requests.CurriculumId }
        });

        return success(res, "Curriculum updated successfully");

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.deleteCurriculum = async (req, res) => {
    try {
        const requests = await decrypter(req.body);

        const v = new Validator(requests, {
            CurriculumId: 'required|integer'
        });

        if (!(await v.check())) return failedValidation(res, v);

        const existing = await Curriculum.findOne({
            where: { CurriculumId: requests.CurriculumId }
        });

        if (!existing) return failed(res, "Curriculum not found");

        if (existing.isdeleted) {
            return failed(res, "Curriculum already deleted");
        }

        await Curriculum.update(
            { isdeleted: 1 },
            { where: { CurriculumId: requests.CurriculumId } }
        );

        return success(res, "Curriculum deleted successfully");

    } catch (e) {
        return failed(res, e.message);
    }
};


exports.listCourseCoupons = async (req, res) => {
    try {
        let requests = await decrypter(req.query) || req.query;

        const v = new Validator(requests, {
            CourseId: 'required|integer'
        });
        if (!(await v.check())) return failedValidation(res, v);

        const isCourseExist = await Course.findOne({
            where: { CourseId: requests.CourseId, isdeleted: 0 }
        });
        if (!isCourseExist) return failed(res, "Course not found");

        const search = requests.search?.trim() || "";
        const page = parseInt(requests.page) || 1;
        const limit = parseInt(requests.limit) || 10;
        const offset = (page - 1) * limit;

        let whereClause = {
            isdeleted: 0,
            CourseId: requests.CourseId
        };

        if (search !== "") {
            whereClause[Op.or] = [
                { CouponCode: { [Op.substring]: search } }
            ];
        }

        const { rows, count } = await Coupon.findAndCountAll({
            where: whereClause,
            include: [{
                model: Course,
                as: 'Course',
                attributes: ['CourseId', 'CourseTitle']
            }],
            order: [['CouponId', 'DESC']],
            distinct: true,
            limit,
            offset
        });

        return success(res, "Coupon list fetched successfully!", { rows, count });

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.createCoupon = async (req, res) => {
    try {
        const requests = await decrypter(req.body);

        const v = new Validator(requests, {
            CourseId: 'required|integer',
            CouponCode: 'required|string',
            DiscountType: 'required|in:PERCENT,FLAT',
            DiscountValue: 'required|numeric',
            StartDate: 'required',
            EndDate: 'required'
        });

        if (!(await v.check())) return failedValidation(res, v);

        // ✅ Check course exists
        const course = await Course.findOne({
            where: { CourseId: requests.CourseId, isdeleted: 0 }
        });
        if (!course) return failed(res, "Course not found");

        // ✅ Unique coupon code
        const existingCoupon = await Coupon.findOne({
            where: { CouponCode: requests.CouponCode }
        });
        if (existingCoupon) return failed(res, "Coupon code already exists");

        // ✅ Date validation
        if (new Date(requests.StartDate) > new Date(requests.EndDate)) {
            return failed(res, "StartDate cannot be greater than EndDate");
        }

        if (requests.DiscountType === 'PERCENT' && requests.DiscountValue > 100) {
            return failed(res, "Percentage cannot be more than 100");
        }

        const coupon = await Coupon.create({
            ...requests,
            StartDate: new Date(requests.StartDate),
            EndDate: new Date(requests.EndDate),
            addedon: new Date(),
            isdeleted: 0
        });

        return success(res, "Coupon created successfully");

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.updateCoupon = async (req, res) => {
    try {
        const requests = await decrypter(req.body);

        const v = new Validator(requests, {
            CouponId: 'required|integer',
            CourseId: 'required|integer',
            CouponCode: 'required|string',
            DiscountType: 'required|in:PERCENT,FLAT',
            DiscountValue: 'required|numeric',
            StartDate: 'required',
            EndDate: 'required'
        });

        if (!(await v.check())) return failedValidation(res, v);

        // ✅ Check coupon exists
        const existing = await Coupon.findOne({
            where: { CouponId: requests.CouponId }
        });
        if (!existing) return failed(res, "Coupon not found");

        // ✅ Check course exists
        const course = await Course.findOne({
            where: { CourseId: requests.CourseId, isdeleted: 0 }
        });
        if (!course) return failed(res, "Course not found");

        // ✅ Unique CouponCode (exclude current)
        const duplicate = await Coupon.findOne({
            where: {
                CouponCode: requests.CouponCode,
                CouponId: { [Op.ne]: requests.CouponId }
            }
        });
        if (duplicate) return failed(res, "Coupon code already exists");

        // ✅ Date validation
        if (new Date(requests.StartDate) > new Date(requests.EndDate)) {
            return failed(res, "StartDate cannot be greater than EndDate");
        }

        if (requests.DiscountType === 'PERCENT' && requests.DiscountValue > 100) {
            return failed(res, "Percentage cannot be more than 100");
        }

        const updatedData = {
            ...requests,
            StartDate: new Date(requests.StartDate),
            EndDate: new Date(requests.EndDate)
        };

        delete updatedData.CouponId;

        await Coupon.update(updatedData, {
            where: { CouponId: requests.CouponId }
        });

        return success(res, "Coupon updated successfully");

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.deleteCoupon = async (req, res) => {
    try {
        const requests = await decrypter(req.body);

        const v = new Validator(requests, {
            CouponId: 'required|integer'
        });

        if (!(await v.check())) return failedValidation(res, v);

        const existing = await Coupon.findOne({
            where: { CouponId: requests.CouponId }
        });

        if (!existing) return failed(res, "Coupon not found");

        if (existing.isdeleted) {
            return failed(res, "Coupon already deleted");
        }

        await Coupon.update(
            { isdeleted: 1 },
            { where: { CouponId: requests.CouponId } }
        );

        return success(res, "Coupon deleted successfully");

    } catch (e) {
        return failed(res, e.message);
    }
};
