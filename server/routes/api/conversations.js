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
      order: [[Message, "updatedAt", "ASC"]],
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

    res.json(conversations.reverse());
  } catch (error) {
    next(error);
  }
});

//returns last active conversation to handle cases where the user refreshes the page or crashes and doesn't actually log out.
router.get("/activeChat/:userId", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }

    const { userId } = req.params;

    //searches conversations for the case where userId === user1Id and active is true.
    const convo1 = await hFn.getLastActiveConvo(userId, 'user1Id', 'user1Active');
    //searches convrsations for the case where userId === user2Id and active is true.
    const convo2 = await hFn.getLastActiveConvo(userId, 'user2Id', 'user2Active');

    //if user is active in a conversation returns the conversation info.
    res.json(convo1 || convo2);
  } catch (error) {
    next(error);
  }
});

//when user leaves one convo for another, set user to be inactive in the previous convo and active in current one.
router.put("/activeChat/user", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }

    const { prevActiveConvoId, prevActiveUser, activeConvoId, activeUser, isActive } = req.body;

    //sets user's active status of previous conversation to false before setting a new active conversation.
    if (prevActiveConvoId) await hFn.setUserInactive(prevActiveUser, prevActiveConvoId);

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

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

router.put("/activeChat/unread", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }

    const { convoId, userId, recipientId } = req.body;

    //find out whether otherUser is 'user1' or 'user2'
    const otherUser = await hFn.getUser(convoId, userId, recipientId);
    //increment only if otherUser is inactive
    const result = await hFn.incrementUnreadCount(otherUser, convoId);

    res.json({ conversationId: result[0][0][0].id, user1UnreadCount: result[0][0][0].user1UnreadCount, user2UnreadCount: result[0][0][0].user2UnreadCount });
  } catch (error) {
    next(error);
  }
});

module.exports = router;