var admin = require("firebase-admin");
const User = require('../../models').tbl_webusers;
const UserLogin = require('../../models').tbl_userloginhistory;
const Notification = require('../../models').tbl_notification;
const NotificationUser = require('../../models').tbl_notificationusers;
const {
    dump
} = require("./logs");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
module.exports = {
    createUser: async (data) => {
        admin.auth()
            .createUser(data)
            .then(async (userRecord) => {
                // See the UserRecord reference doc for the contents of userRecord.
                console.log('Successfully created new user:', userRecord.uid);
                await User.update({
                    fcmUid: userRecord.uid
                }, {
                    where: {
                        UserID: data.UserID
                    }
                })
            })
            .catch((error) => {
                console.log('Error creating new user:', error);
            });
        return true;
    },
    getUserDetails: async (uid) => {
        try {

            // const updatedUser = {
            //     email: 'nitish.ripenapps@gmail.com', // Update the email
            //     displayName: 'Nitish', // Update the display name
            //     phoneNumber: '+11234567890', // Update the phone number
            //     customClaims: [{
            //         "name": "test"
            //     }]
            // };

            // // Update the user
            // admin.auth().updateUser(uid, updatedUser)
            //     .then((userRecord) => {
            //         console.log('Successfully updated user:', userRecord.uid);

            //     })
            //     .catch((error) => {
            //         console.log('Error updating user:', error);
            //     });
            // return updatedUser;
            admin.auth().getUser(uid)
                .then(async (userRecord) => {
                    console.log('Successfully fetched user data:', userRecord.toJSON());
                    return userRecord.toJSON();
                })
                .catch((error) => {
                    console.log('Error fetching user data:', error);
                });
        } catch (error) {
            dump(error)
        }
    },
    sendNotificationUsingFirebase: async (data) => {
        try {
            if (data.sender && data.sender == 'admin') {
                var created = "";
                if (data.send == 0) {
                    created = await Notification.create({
                        title: data.title,
                        description: data.description,
                        sendTo: data.sendTo,
                        type: data.type,
                        isSent: 1,
                        categoryIds: data.categoryIds,
                        courseIds: data.courseIds,
                        videoid: data.videoid,
                        pdfUrl: data.pdfUrl,
                        isAdmin: data.isAdmin
                    })
                } else {
                    await Notification.update({
                        isSent: 1
                    }, {
                        where: {
                            id: data.notificationId
                        }
                    })
                }
                for (let i = 0; i < data.users.length; i++) {
                    if (data.sendTo == 4 && individual) {
                        await NotificationUser.create({
                            studentid: data.users[i].studentid,
                            nid: data.send == 0 ? created.id : data.notificationId,
                        })
                    }
                    if (await UserLogin.findOne({
                            where: {
                                studentId: data.users[i].studentid
                            }
                        })) {
                        if (data.users[i].token) {
                            const nmessage = {
                                token: data.users[i].token,
                                notification: {
                                    title: data.title,
                                    body: data.description
                                },
                            };
                            admin.messaging().send(nmessage);
                        }
                    }
                }


            } else {
                let created = await Notification.create({
                    title: data.title,
                    description: data.description,
                    sendTo: data.sendTo,
                    type: data.type,
                    isSent: 1,
                    categoryIds: data.categoryIds ? data.categoryIds : '',
                    courseIds: data.courseId ? data.courseId : ""
                })
                await NotificationUser.create({
                    studentid: data.studentid,
                    nid: created.dataValues.id,
                })
                const nmessage = {
                    token: data.token,
                    notification: {
                        title: data.title,
                        body: data.description,
                    },
                };
                admin.messaging().send(nmessage);
            }

            return true;
        } catch (error) {
            dump(error)
        }
    }
}