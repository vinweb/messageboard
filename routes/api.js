"use strict";
const mongoose = require("mongoose");
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
require("./db-connection");

const replySchema = new Schema({
    text: String,
    delete_password: String,
    created_on: { type: Date, default: Date.now },
    reported: { type: Boolean, default: false },
});

const threadSchema = new Schema({
    text: String,
    delete_password: String,
    created_on: { type: Date, default: Date.now },
    bumped_on: { type: Date, default: Date.now },
    reported: { type: Boolean, default: false },
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
            newThread.save((err, doc) => {
                if (err) return console.log("Error: " + err);
                console.log("Save is successful.");
                return res.redirect(`/b/${board}/`);
            });
        })
        .get((req, res) => {
            let board = req.params.board;
            let thread = mongoose.model(board, threadSchema);

            thread
                .aggregate([{ $limit: 10 }, { $sort: { created_on: -1 } }])
                .exec((err, result) => {
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
                        }
                    }
                    res.json(result);
                });
        })
        .delete((req, res) => {
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
        })
        .put((req, res) => {
            let thread = mongoose.model(req.body.board, threadSchema);
            thread.findByIdAndUpdate(
                req.body.thread_id,
                { reported: true },
                (err, doc) => {
                    if (err) console.log(err);
                    res.json("success");
                }
            );
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
        })
        .delete((req, res) => {
            let thread = mongoose.model(req.params.board, threadSchema);

            thread.findOne(
                { _id: req.body.thread_id, "replies._id": req.body.reply_id },
                (err, doc) => {
                    if (err) console.log(err);
                    let reply = doc.replies.id(req.body.reply_id);
                    if (req.body.delete_password === reply.delete_password) {
                        thread.findOneAndUpdate(
                            {
                                _id: req.body.thread_id,
                                "replies._id": req.body.reply_id,
                            },
                            { $set: { "replies.$.text": "[deleted]" } },
                            { new: true },
                            (err, doc) => {
                                if (err) console.log(err);
                                return res.json("success");
                            }
                        );
                    }
                    if (req.body.delete_password !== reply.delete_password) {
                        res.json("incorrect password");
                    }
                }
            );
        })
        .put((req, res) => {
            let thread = mongoose.model(req.body.board, threadSchema);

            thread.findOneAndUpdate(
                {
                    _id: req.body.thread_id,
                    "replies._id": req.body.reply_id,
                },
                { $set: { "replies.$.reported": true } },
                { new: true },
                (err, doc) => {
                    if (err) console.log(err);
                    return res.json("success");
                }
            );
        });
};
