import React, { useState, useEffect } from 'react';
import { Box } from '@material-ui/core';
import { BadgeAvatar, ChatContent } from '../Sidebar';
import { makeStyles } from '@material-ui/core/styles';
import UnreadBubble from './UnreadBubble';

const useStyles = makeStyles((theme) => ({
  root: {
    borderRadius: 8,
    height: 80,
    boxShadow: '0 2px 10px 0 rgba(88,133,196,0.05)',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
      cursor: 'grab',
    },
  },
}));

const Chat = ({ userId, conversation, setActiveChat, activeConversation }) => {
  const classes = useStyles();
  const { otherUser } = conversation;

  const activeUser = conversation.hasOwnProperty('user2') ? 'user2' : 'user1';
  const [unreadCount, setUnreadCount] = useState(activeUser === 'user1' ? conversation.user1UnreadCount : conversation.user2UnreadCount);

  useEffect(() => {
    //set unreadCount to 0 when conversation exists and is active.
    if (conversation.id !== undefined && activeConversation.otherUsername === conversation.otherUser.username) {
      setUnreadCount(0);
    //set unreadCount to stored value from database when conversation exists and is inactive.
    } else if (conversation.id !== undefined && activeConversation.otherUsername !== conversation.otherUser.username) {
      const newUnreadCount = activeUser === 'user1' ? conversation.user1UnreadCount : conversation.user2UnreadCount;
      setUnreadCount(newUnreadCount);
    }
  }, [activeUser, conversation, activeConversation]);

  const handleClick = (conversation) => {
    setActiveChat({
      id: conversation.id, 
      activeUser, 
      otherUsername: conversation.otherUser.username,
    });
  };

  return (
    <Box onClick={() => handleClick(conversation, activeConversation)} className={classes.root}>
      <BadgeAvatar
        photoUrl={otherUser.photoUrl}
        username={otherUser.username}
        online={otherUser.online}
        sidebar={true}
      />
      <ChatContent conversation={conversation} />
      {unreadCount > 0 && <UnreadBubble unreadCount={unreadCount} />}
    </Box>
  );
};

export default Chat;
