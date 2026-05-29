let DailyQuiz = require('../../../../models').tbl_dailyquiz;
let DailyQuizQuestion = require('../../../../models').tbl_dailyquizquestion;
let {
    dump
} = require('../../../helper/logs');
let {
    success,
    failed,
    failedValidation,
    response
} = require('../../../helper/response');
const jwtConfig = require('../../../../config/jwt.config');
const {
    Validator
} = require('node-input-validator');
const {
    decrypter
} = require('../../../helper/crypto');
const {
    fn,
    col
} = require('../../../../models').sequelize
const moment = require('moment');
const {
    Op
} = require("sequelize");

module.exports = {
    createDailyQuiz: async (req, res) => {
        try {

            var requests = await decrypter(req.body);
            if (requests == false) {
                return failed(res, "Internal server error");
            }

            const v = new Validator(requests, {
                action: 'required|in:add,edit',
                quizDate: 'required|dateFormat:YYYY-MM-DD',
                title: 'nullable',
                questions: 'required|array',
                "questions.*.question": "required",
                "questions.*.correctOption": "required|in:Option 1,Option 2,Option 3,Option 4",
                "questions.*.optionA": "required",
                "questions.*.optionB": "required",
                "questions.*.optionC": "required",
                "questions.*.optionD": "required",
                "questions.*.description": "nullable",
                quizId: 'requiredIf:action,edit'

            });
            const matched = await v.check();
            if (!matched) {
                return failedValidation(res, v);
            }
            if (requests.action == 'add') {
                let dailyQuiz = await DailyQuiz.findOne({
                    where: {
                        quizDate: {
                            [Op.eq]: new Date(requests.quizDate)
                        }
                    }
                })
                if (dailyQuiz)
                    return response(res, 422, 'Quiz already created for the date')
                let created = await DailyQuiz.create(requests)
                for (let i = 0; i < requests.questions.length; i++) {
                    requests.questions[i].dailyquizId = created.dataValues.id
                    await DailyQuizQuestion.create(requests.questions[i])
                }
                return success(res, 'Quiz created');
            } else {
                if (!await DailyQuiz.findOne({
                        where: {
                            id: requests.quizId
                        }
                    }))
                    return response(res, 422, 'Quiz not found')
                let dailyQuiz = await DailyQuiz.findOne({
                    where: {
                        id: {
                            [Op.ne]: requests.quizId
                        },
                        quizDate: {
                            [Op.eq]: new Date(requests.quizDate)
                        }
                    }
                })
                if (dailyQuiz)
                    return response(res, 422, 'Quiz already created for the date')

                await DailyQuiz.update(requests, {
                    where: {
                        id: requests.quizId
                    }
                })
                await DailyQuizQuestion.destroy({
                    where: {
                        dailyquizId: requests.quizId
                    }
                })
                for (let i = 0; i < requests.questions.length; i++) {
                    requests.questions[i].dailyquizId = requests.quizId
                    await DailyQuizQuestion.create(requests.questions[i])
                }
                return success(res, 'Quiz edited');
            }

        } catch (error) {
            dump('Error', error);
            return failed(res, error.message);
        }
    },
    getDailyQuiz: async (req, res) => {
        try {
            var requests = await decrypter(req.query);
            if (requests == false) {
                return failed(res, "Internal server error");
            }
            let pageSize = requests.limit ? parseInt(requests.limit) : 10;
            let page = requests.page ? parseInt(requests.page) : 1;
            let offset = pageSize * (page - 1);
            let search = requests.search ? requests.search : "";

            let params = {
                isDeleted: 0
            };

            if (search) {
                params = Object.assign(params, {
                    [Op.or]: [{
                            title: {
                                [Op.substring]: search
                            }
                        },
                        {
                            quizDate: {
                                [Op.substring]: search
                            }
                        }
                    ]
                })
            }
            let dailyQuiz = await DailyQuiz.findAll({
                where: params,
                attributes: ['id', 'quizDate', 'title', 'status', 'createdAt'],
                include: [{
                    model: DailyQuizQuestion,
                    as: 'questions',
                    attributes: ['id', 'dailyquizId', 'question', 'correctOption', 'description', 'optionA', 'optionB', 'optionC', 'optionD'],

                }],
                order: [
                    ['quizDate', 'DESC']
                ],
                limit: pageSize,
                offset: offset

            })
            return success(res, 'Quiz data', {
                dailyQuiz: dailyQuiz,
                count: await DailyQuiz.count({
                    where: params
                })
            })
        } catch (error) {
            dump('Error', error);
            return failed(res, error.message);
        }
    },
    getDailyQuizDetails: async (req, res) => {
        try {
            var requests = await decrypter(req.query);
            if (requests == false) {
                return failed(res, "Internal server error");
            }

            const v = new Validator(requests, {
                quizid: 'required'
            });
            const matched = await v.check();
            if (!matched) {
                return failedValidation(res, v);
            }

            let dailyQuiz = await DailyQuiz.findOne({
                where: {
                    id: requests.quizid
                },
                attributes: ['id', 'quizDate', 'title', 'status', 'createdAt'],
                include: [{
                    model: DailyQuizQuestion,
                    as: 'questions',
                    attributes: ['id', 'dailyquizId', 'question', 'correctOption', 'description', 'optionA', 'optionB', 'optionC', 'optionD'],

                }]

            })
            return success(res, 'Quiz data', dailyQuiz)
        } catch (error) {
            dump('Error', error);
            return failed(res, error.message);
        }
    },
    deleteDailyQuiz: async (req, res) => {
        try {
            var requests = await decrypter(req.query);
            if (requests == false) {
                return failed(res, "Internal server error");
            }

            const v = new Validator(requests, {
                quizIds: 'required|array'
            });
            const matched = await v.check();
            if (!matched) {
                return failedValidation(res, v);
            }
            await DailyQuizQuestion.destroy({
                where: {
                    dailyquizId: {
                        [Op.in]: requests.quizIds
                    }
                }
            })
            await DailyQuiz.destroy({
                where: {
                    id: {
                        [Op.in]: requests.quizIds
                    }
                }
            })

            return success(res, 'Quiz deleted');

        } catch (error) {
            dump('Error', error);
            return failed(res, error.message);
        }

    },


}