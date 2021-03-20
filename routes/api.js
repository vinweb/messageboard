"use strict";
const mongoose = require("mongoose");
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
require("./db-connection");

const replySchema = new Schema({
    text: String,
    delete_password: String,
    created_on: { type: Date, default: Date.now },
    reported: { type: Boolean, default: true },
});

const threadSchema = new Schema({
    text: String,
    delete_password: String,
    created_on: { type: Date, default: Date.now },
    bumped_on: { type: Date, default: Date.now },
    reported: { type: Boolean, default: true },
    replies: [replySchema],
});

module.exports = function (app) {
    app.route("/api/threads/:board")
        .post((req, res) => {
            let board = req.params.board;
            let thread = mongoose.model(board, threadSchema);
            let newThread = new thread({
                text: req.body.text,
                delete_password: req.body.delete_password,
            });
            //console.log(req.body);
            //console.log(req.params);
            newThread.save((err, doc) => {
                if (err) return console.log("Error: " + err);
                console.log("Save is successful.");
                return res.redirect(`/b/${board}/`);
            });
        })
        .get((req, res) => {
            let board = req.params.board;
            let thread = mongoose.model(board, threadSchema);
            /* thread
                .find({}, { replies: { $limit: 1 } })
                .sort({ created_on: -1 })
                .limit(10)
                .exec((err, result) => {
                    console.log("find");
                    if (err) console.log(err);
                    res.json(result);
                }); */
            thread
                .aggregate([{ $limit: 10 }, { $sort: { created_on: -1 } }])
                .exec((err, result) => {
                    //console.log(result[9].replies);
                    if (err) console.log(err);
                    for (let thread of result) {
                        delete thread.delete_password;
                        delete thread.reported;
                        if (thread.replies.length > 3) {
                            thread.replies.splice(0, thread.replies.length - 3);
                        }
                        if (thread.replies.length > 0) {
                            for (let reply of thread.replies) {
                                delete reply.delete_password;
                                delete reply.reported;
                            }
                            //console.log(thread.replies);
                        }
                    }
                    res.json(result);
                });
        })
        .delete((req, res) => {
            // console.log(req.body);
            // console.log(req.params);
            let board = req.params.board;
            let thread = mongoose.model(board, threadSchema);
            let id = req.body.thread_id;
            thread.findById(id, (err, doc) => {
                if (err) {
                    console.log(err);
                    res.json("incorrect id");
                } else if (req.body.delete_password === doc.delete_password) {
                    doc.remove();
                    res.json("success");
                } else if (req.body.delete_password !== doc.delete_password) {
                    res.json("incorrect password");
                }
            });
            /* thread.findByIdAndRemove(id, (err, docs) => {
                if (err) {
                    console.log(err);
                } else {
                    alert("success");
                }
            }); */
        });

    app.route("/api/replies/:board")
        .post(async (req, res) => {
            let board = req.params.board;
            let thread = mongoose.model(board, threadSchema);
            let id = req.body.thread_id;

            thread.findByIdAndUpdate(
                id,
                {
                    $set: { bumped_on: Date.now() },
                    $push: {
                        replies: {
                            text: req.body.text,
                            delete_password: req.body.delete_password,
                        },
                    },
                },
                function (err, docs) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Updated thread.");
                    }
                }
            );
        })
        .get((req, res) => {
            let board = req.params.board;
            let id = req.query.thread_id;
            let thread = mongoose.model(board, threadSchema);
            /* thread.findById(id, (err, doc) => {
                if (err) console.log(err);
                delete doc.delete_password;
                console.log(doc.delete_password);
                delete doc.reported;
                console.log(doc);
                res.json(doc);
            }); */
            thread
                .aggregate([{ $match: { _id: ObjectId(id) } }])
                .exec((err, doc) => {
                    if (err) console.log(err);
                    delete doc[0].reported;
                    delete doc[0].delete_password;
                    if (doc[0].replies.length > 0) {
                        for (let reply of doc[0].replies) {
                            delete reply.delete_password;
                            delete reply.reported;
                        }
                    }
                    res.json(doc);
                });
        });
};
