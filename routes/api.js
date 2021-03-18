"use strict";
const mongoose = require("mongoose");
const { Schema } = mongoose;
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
                return res.redirect("/b/board/");
            });
        })
        .get((req, res) => {
            let board = req.params.board;
            let thread = mongoose.model(board, threadSchema);
            thread.find({}, (err, result) => {
                console.log("find");
                if (err) console.log(err);
                res.json(result);
            });
        });

    app.route("/api/replies/:board").post(async (req, res) => {
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
    });
};
