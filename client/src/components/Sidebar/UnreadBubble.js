import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Typography } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  bubble: {
    borderRadius: '10px',
    backgroundColor: '#3F92FF',
    marginRight: 20,
  },
  text: {
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    padding: '3px 7px 3px 7px',
    fontWieght: 'bold',
  }
}));

const UnreadBubble = ({ unreadCount }) => {
    const classes = useStyles();
    return (
        <Box className={classes.bubble}>
            <Typography className={classes.text}>{unreadCount}</Typography>
        </Box>
    )
}

export default UnreadBubble;