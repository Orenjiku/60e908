const { Op, Sequelize } = require("sequelize");
const db = require("../db");

const Conversation = db.define("conversation");

module.exports = Conversation;