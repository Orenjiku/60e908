const Sequelize = require("sequelize");
const db = require("../db");

const UserMessage = db.define("userMessage", {
    unread: {
        type: Sequelize.BOOLEAN,
        default: true,
      },
    conversationId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    }
});

module.exports = UserMessage;