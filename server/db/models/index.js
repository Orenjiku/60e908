const Conversation = require("./conversation");
const User = require("./user");
const Message = require("./message");
const UserConversation = require('./userConversation');
const UserMessage = require('./userMessage');

// associations

User.belongsToMany(Conversation, {through: UserConversation});
Conversation.belongsToMany(User, {through: UserConversation});

Conversation.hasMany(Message);
Message.belongsTo(Conversation);

User.belongsToMany(Message, {through: UserMessage});
Message.belongsToMany(User, {through: UserMessage});

module.exports = {
  User,
  Conversation,
  UserConversation,
  Message,
  UserMessage
};
