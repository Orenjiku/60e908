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

const Chat = ({ conversation, setActiveChat, activeConversation }) => {
  const classes = useStyles();
  const { otherUser } = conversation;

  const [readCount, setReadCount] = useState(0);

  useEffect(() => {
    if (activeConversation === conversation.otherUser.username) {
      setReadCount(conversation.messages.length);
    }
  }, [conversation, activeConversation]);


  const handleClick = async (conversation) => {
    await setActiveChat(conversation.otherUser.username);
  };

  return (
    <Box onClick={() => handleClick(conversation)} className={classes.root}>
      <BadgeAvatar
        photoUrl={otherUser.photoUrl}
        username={otherUser.username}
        online={otherUser.online}
        sidebar={true}
      />
      <ChatContent conversation={conversation} />
      {readCount < conversation.messages.length && <UnreadBubble unreadCount={conversation.messages.length - readCount} />}
    </Box>
  );
};

export default Chat;
