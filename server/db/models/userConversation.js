const Sequelize = require("sequelize");
const db = require("../db");

const UserConversation = db.define("userConversation", {
  active: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
});

module.exports = UserConversation;