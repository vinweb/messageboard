const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");
/* const mongoose = require("mongoose");
const { Schema } = mongoose;
const ObjectId = mongoose.Types.ObjectId;
require("../routes/db-connection"); */

/* const replySchema = new Schema({
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
}); */

chai.use(chaiHttp);

let newThreadId;
let newReplyId;

suite("Functional Tests", function () {
    test("Creating a new thread: POST request to /api/threads/{board}", function (done) {
        chai.request(server)
            .post("/api/threads/board")
            .send({
                board: "test",
                text: "New thread.",
                delete_password: "pw",
            })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                done();
            });
    });
    test("Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}", function (done) {
        chai.request(server)
            .get("/api/threads/board")
            .query({})
            .end(function (err, res) {
                let repliesArray = [];
                for (thread of res.body) {
                    repliesArray.push(thread.replies.length);
                }
                //console.log(res.body[0]);
                newThreadId = res.body[0]._id;
                //console.log(newId);
                assert.equal(res.status, 200);
                assert.isArray(res.body);
                assert.isAtMost(res.body.length, 10);
                assert.notInclude(repliesArray, 4);
                done();
            });
    });
    test("Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password", function (done) {
        chai.request(server)
            .delete("/api/threads/board")
            .send({
                board: "board",
                thread_id: newThreadId,
                delete_password: "abc123",
            })
            .end(function (err, res) {
                //console.log(res.body);
                assert.equal(res.status, 200);
                assert.equal(res.body, "incorrect password");
                done();
            });
    });
    test("Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password", function (done) {
        chai.request(server)
            .delete("/api/threads/board")
            .send({
                board: "board",
                thread_id: newThreadId,
                delete_password: "pw",
            })
            .end(function (err, res) {
                //console.log(res.body);
                assert.equal(res.status, 200);
                assert.equal(res.body, "success");
                done();
            });
    });
    test("Reporting a thread: PUT request to /api/threads/{board}", function (done) {
        chai.request(server)
            .put("/api/threads/board")
            .send({
                board: "board",
                thread_id: "6054beac52a9ac2ab832663c",
            })
            .end(function (err, res) {
                //console.log(res.body);
                assert.equal(res.status, 200);
                assert.equal(res.body, "success");
                done();
            });
    });
    test("Creating a new reply: POST request to /api/replies/{board}", function (done) {
        chai.request(server)
            .post("/api/replies/board")
            .send({
                board: "board",
                thread_id: "605b378dfeac401a581c72ee",
                text: "New reply.",
                delete_password: "pw",
            })
            .end(function (err, res) {
                //console.log(res.body);
                assert.equal(res.status, 200);
                done();
            });
    });
    test("Viewing a single thread with all replies: GET request to /api/replies/{board}", function (done) {
        chai.request(server)
            .get("/api/replies/board")
            .query({ thread_id: "605b378dfeac401a581c72ee" })
            .end(function (err, res) {
                //console.log(res.body[0].replies[0]._id);
                newReplyId = res.body[0].replies[0]._id;
                //console.log(newReplyId);
                assert.equal(res.status, 200);
                assert.equal(res.body[0]._id, "605b378dfeac401a581c72ee");
                assert.isArray(res.body[0].replies);
                done();
            });
    });
    test("Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password", function (done) {
        chai.request(server)
            .delete("/api/replies/board")
            .send({
                board: "board",
                thread_id: "605b378dfeac401a581c72ee",
                reply_id: newReplyId,
                delete_password: "abc123",
            })
            .end(function (err, res) {
                //console.log(res.body);
                assert.equal(res.status, 200);
                assert.equal(res.body, "incorrect password");
                done();
            });
    });
    test("Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password", function (done) {
        chai.request(server)
            .delete("/api/replies/board")
            .send({
                board: "board",
                thread_id: "605b378dfeac401a581c72ee",
                reply_id: newReplyId,
                delete_password: "pw",
            })
            .end(function (err, res) {
                //console.log(res.body);
                assert.equal(res.status, 200);
                assert.equal(res.body, "success");
                done();
            });
    });
    test("Reporting a reply: PUT request to /api/replies/{board}", function (done) {
        chai.request(server)
            .put("/api/replies/board")
            .send({
                board: "board",
                thread_id: "605b378dfeac401a581c72ee",
                reply_id: "605b4f05c0d0d218143a9c17",
            })
            .end(function (err, res) {
                //console.log(res.body);
                assert.equal(res.status, 200);
                assert.equal(res.body, "success");
                done();
            });
    });
});
