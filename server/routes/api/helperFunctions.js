const { Conversation } = require("../../db/models");
const { Op, col } = require("sequelize");

const helperFunctions = {
    getUserActive: function (user) {
        return user === 'user1' ? 'user1Active' : 'user2Active';
    },

    getUserUnread: function (user) {
        return user === 'user1' ? 'user1UnreadCount' : 'user2UnreadCount';
    },
    
    setUserInactive: async function (activeUser, activeConvoId) {
        activeUser = this.getUserActive(activeUser);
        console.log(activeUser, activeConvoId);
        const b = await Conversation.update({ [activeUser]: false }, { where: { id: activeConvoId }});
        console.log(b);
    },
    
    setUserActive: async function (activeUser, activeConvoId) {
        const userUnread = this.getUserUnread(activeUser);
        activeUser = this.getUserActive(activeUser);
        await Conversation.update({ [activeUser]: true, [userUnread]: 0 }, { where: { id: activeConvoId }});
    },
    
    incrementUnreadCount: async function (otherUser, convoId) {
        const userUnread = this.getUserUnread(otherUser);
        otherUser = this.getUserActive(otherUser);
        await Conversation.increment([userUnread], { 
            by: 1, 
            where: { 
                [Op.and]: [{ id: convoId }, { [otherUser]: false }]
            }
        });
    },

    getUser: async function (convoId, userId, recipientId) {
        const amIUser1 = await Conversation.findOne({where: { 
            [Op.and]: [
                { id: convoId }, 
                { user1Id: userId }, 
                { user2Id: recipientId }
            ]
        }});
        return amIUser1 ? 'user2' : 'user1';
    }
}

module.exports = helperFunctions;