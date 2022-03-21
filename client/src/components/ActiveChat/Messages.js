import React from 'react';
import { Box, Avatar } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { SenderBubble, OtherUserBubble } from '.';
import moment from 'moment';

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  avatar: {
    height: 24,
    width: 24,
    marginTop: 8,
  },
}));

const Messages = (props) => {
  const classes = useStyles();
  const { messages, otherUser, userId, otherUserUnreadCount } = props;

  const messagesSent = messages.filter(message => message.senderId === userId);
  const otherUserLastReadMessageIdx = messagesSent.length === otherUserUnreadCount ? -1 : messagesSent.length - 1 - otherUserUnreadCount;
  const otherUserLastReadMessageId = messagesSent[otherUserLastReadMessageIdx]?.id;

  return (
    <Box>
      {messages.map((message) => {
        const time = moment(message.createdAt).format('h:mm');
        return message.senderId === userId ? (
          <Box className={classes.root} key={message.id}>
            <SenderBubble text={message.text} time={time} />
            {otherUserLastReadMessageId === message.id &&
              <Avatar
                alt={otherUser.username}
                src={otherUser.photoUrl}
                className={classes.avatar}
              />
            }
          </Box>
        ) : (
          <OtherUserBubble
            key={message.id}
            text={message.text}
            time={time}
            otherUser={otherUser}
          />
        );
      })}
    </Box>
  );
};

export default Messages;
