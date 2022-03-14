const router = require("express").Router();
const { User, Conversation, Message } = require("../../db/models");
const { Op } = require("sequelize");
const onlineUsers = require("../../onlineUsers");

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

const setUserInactive = async (activeUser, activeConvoId) => {
  await Conversation.update({ [activeUser]: false }, { where: { id: activeConvoId }});
};

const setUserActive = async (activeUser, userUnread, activeConvoId) => {
  await Conversation.update({ [activeUser]: true, [userUnread]: 0 }, { where: { id: activeConvoId }});
};

const incrementUnreadCount = async (userActive, userUnread, convoId) => {
  await Conversation.increment([userUnread], { 
    by: 1, 
    where: { 
      [Op.and]: [{ id: convoId }, { [userActive]: false }]
    }
  });
};

//performs updates to the conversation the user is active in and resets the count of unread messages.
router.put("/activeChat/userActive", async (req, res, next) => {
  try {
    const { prevActiveConvoId, prevActiveUser, activeConvoId, activeUser, isActive } = req.body;

    //sets user's active status of previous conversation to false before setting a new active conversation.
    if (prevActiveConvoId) {
      const userActive = prevActiveUser === 'user1' ? 'user1Active' : 'user2Active';
      await setUserInactive(userActive, prevActiveConvoId);
    }

    if (isActive) {
      if (activeUser === 'user1') {
        if (activeConvoId !== undefined) {
          await setUserActive('user1Active', 'user1UnreadCount', activeConvoId);
        }
      } else {
        if (activeConvoId !== undefined) {
          await setUserActive('user2Active', 'user2UnreadCount', activeConvoId);
        }
      }
    } else if (!isActive) {
      if (activeUser === 'user1') {
        await setUserInactive('user1Active', activeConvoId);
      } else {
        await setUserInactive('user2Active', activeConvoId);
      }
    }
  } catch (error) {
    next(error);
  }
});

router.put("/activeChat/unread", async (req, res, next) => {
  try {
    const { convoId, userId, recipientId, isOtherUserOnline } = req.body;
    
    //determine whether if other user is user1 or user2.
    const amIUser1Active = await Conversation.findOne({where: { 
      [Op.and]: [
        { id: convoId }, 
        { user1Id: userId }, 
        { user2Id: recipientId }
      ]
    }});
    const otherUserActive = amIUser1Active ? 'user2Active' : 'user1Active';

    //set otherUser's active status to false if not online. Handles edge case where otherUser exits the chat without logging out and status remained active.
    if (!isOtherUserOnline) {
      setUserInactive(otherUserActive, convoId);
    }

    //increments otherUser's unreadCount only if they are inactive.
    if (otherUserActive === 'user1') {
      incrementUnreadCount('user1Active', 'user1UnreadCount', convoId)
    } else {
      incrementUnreadCount('user2Active', 'user2UnreadCount', convoId)
    }
  } catch (error) {
    next(error);
  }
})

module.exports = router;
