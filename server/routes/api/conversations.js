const router = require("express").Router();
const { User, Conversation, Message } = require("../../db/models");
const { Op } = require("sequelize");
const onlineUsers = require("../../onlineUsers");
const hFn = require('./helperFunctions');

// get all conversations for a user, include latest message text for preview, and all messages
// include other user model so we have info on username/profile pic (don't include current user info)
router.get("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const userId = req.user.id;
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: {
          user1Id: userId,
          user2Id: userId,
        },
      },
      attributes: ["id", "user1UnreadCount", "user2UnreadCount"],
      order: [["updatedAt", "DESC"], [Message, "updatedAt", "ASC"]],
      include: [
        { model: Message },
        {
          model: User,
          as: "user1",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
        {
          model: User,
          as: "user2",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
      ],
    });

    for (let i = 0; i < conversations.length; i++) {
      const convo = conversations[i];
      const convoJSON = convo.toJSON();

      if (convoJSON.user1) {
        convoJSON.otherUser = convoJSON.user1;
        delete convoJSON.user1;
      } else if (convoJSON.user2) {
        convoJSON.otherUser = convoJSON.user2;
        delete convoJSON.user2;
      }

      // set property for online status of the other user
      if (onlineUsers.includes(convoJSON.otherUser.id)) {
        convoJSON.otherUser.online = true;
      } else {
        convoJSON.otherUser.online = false;
      }

      // set properties for notification count and latest message preview
      convoJSON.latestMessageText = convoJSON.messages[convoJSON.messages.length - 1].text;
      conversations[i] = convoJSON;
    }

    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

//when user leaves one convo for another, set user to be inactive in the previous convo and active in current one.
router.put("/activeChat/user", async (req, res, next) => {
  try {
    const { prevActiveConvoId, prevActiveUser, activeConvoId, activeUser, isActive } = req.body;

    //sets user's active status of previous conversation to false before setting a new active conversation.
    if (prevActiveConvoId) {
      await hFn.setUserInactive(prevActiveUser, prevActiveConvoId);
    }

    if (activeConvoId !== undefined) {
      if (isActive) {
        if (activeUser === 'user1') {
          await hFn.setUserActive(activeUser, activeConvoId);
        //handles case when activeUser is 'user2' or null
        } else {
          await hFn.setUserActive(activeUser, activeConvoId);
        }
      //handles case when user logs off.
      } else if (!isActive) {
        if (activeUser === 'user1') {
          await hFn.setUserInactive(activeUser, activeConvoId);
        } else {
          await hFn.setUserInactive(activeUser, activeConvoId);
        }
      }
    }
  } catch (error) {
    next(error);
  }
});

router.put("/activeChat/unread", async (req, res, next) => {
  try {
    const { convoId, userId, recipientId } = req.body;
    const isOtherUserOnline =  onlineUsers.includes(recipientId);
    
    //returns 'user1' or 'user2'
    const otherUser = await hFn.getUser(convoId, userId, recipientId);
    
    //everytime user is sending a message, check if otherUser is offline and inactive before incrementing their unreadCount.
    //also handles edge case where otherUser's active status in the chat remains true but they are actually not, such as if they reload the page.
    if (!isOtherUserOnline) {
      await hFn.setUserInactive(otherUser, convoId);
      await hFn.incrementUnreadCount(otherUser, convoId);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;