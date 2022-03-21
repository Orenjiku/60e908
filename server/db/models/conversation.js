const { Op, Sequelize } = require("sequelize");
const db = require("../db");
const Message = require("./message");

const Conversation = db.define("conversation", {
  user1Active: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  user2Active: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  user1UnreadCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  },
  user2UnreadCount: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  },
});

// find conversation given two user Ids

Conversation.findConversation = async function (user1Id, user2Id) {
  const conversation = await Conversation.findOne({
    where: {
      user1Id: {
        [Op.or]: [user1Id, user2Id]
      },
      user2Id: {
        [Op.or]: [user1Id, user2Id]
      }
    }
  });

  // return conversation or null if it doesn't exist
  return conversation;
};

module.exports = Conversation;
