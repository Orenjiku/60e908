import React, { useCallback, useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { Grid, CssBaseline, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { SidebarContainer } from '../components/Sidebar';
import { ActiveChat } from '../components/ActiveChat';
import { SocketContext } from '../context/socket';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100vh',
  },
}));

const Home = ({ user, logout }) => {
  const history = useHistory();
  
  const socket = useContext(SocketContext);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState({id: null, activeUser: null, otherUsername: null});
  //tracks previous conversation
  const prevActiveConversation = useRef(activeConversation);

  const classes = useStyles();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const addSearchedUsers = (users) => {
    const currentUsers = {};

    // make table of current users so we can lookup faster
    conversations.forEach((convo) => {
      currentUsers[convo.otherUser.id] = true;
    });

    const newState = [...conversations];
    users.forEach((user) => {
      // only create a fake convo if we don't already have a convo with this user
      if (!currentUsers[user.id]) {
        let fakeConvo = { otherUser: user, messages: [] };
        newState.push(fakeConvo);
      }
    });

    setConversations(newState);
  };

  const clearSearchedUsers = () => {
    setConversations((prev) => prev.filter((convo) => convo.id));
  };

  //updates user's active status in previous conversation to inactive and current conversation to active.
  const setUserActiveInChat = useCallback(async ({activeConvoId, activeUser, isActive}) => {
    const body = {
      prevActiveConvoId: prevActiveConversation.current.id,
      prevActiveUser: prevActiveConversation.current.activeUser,
      activeConvoId,
      activeUser,
      isActive,
    };
    await axios.put('api/conversations/activeChat/user', body);
  }, [prevActiveConversation]);

  const setActiveChat = useCallback(async ({id, activeUser, otherUsername}) => {
    //updates prevActiveConversation only if activeConversation exists.
    if (activeConversation.id) prevActiveConversation.current = activeConversation;

    await setUserActiveInChat({activeConvoId: id, activeUser, isActive: true});

    setActiveConversation(prev => ({...prev, id, activeUser, otherUsername}));
  }, [activeConversation, setUserActiveInChat]);

  const saveMessage = async (body) => {
    const { data } = await axios.post('/api/messages', body);
    return data;
  };

  const sendMessage = (data, body) => {
    socket.emit('new-message', {
      message: data.message,
      recipientId: body.recipientId,
      sender: data.sender,
    });
  };

  //checks if otherUser is inactive. if inactive, updates otherUser's unreadCount.
  const updateOtherUserUnreadCount = async (body) => {
    await axios.put('/api/conversations/activeChat/unread', body);
  };

  const postMessage = async (body) => {
    try {
      const data = await saveMessage(body);

      if (!body.conversationId) {
        addNewConvo(body.recipientId, data.message);
      } else {
        addMessageToConversation(data);
      }
      
      sendMessage(data, body);

      updateOtherUserUnreadCount({
        convoId: data.message.conversationId, 
        userId: data.message.senderId,
        recipientId: body.recipientId,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const addNewConvo = useCallback(
    (recipientId, message) => {
      setConversations(prev => prev.map((convo) => {
        if (convo.otherUser.id === recipientId) {
          const convoCopy = { ...convo };
          convoCopy.messages = [...convoCopy.messages, message];
          convoCopy.latestMessageText = message.text;
          convoCopy.id = message.conversationId;
          //set new conversation as activeConversation. a user creating a new conversation is 'user1' in database.
          setActiveChat({
            id: message.conversationId,
            activeUser: 'user1',
            otherUsername: convo.otherUser.username
          });
          return convoCopy;
        } else {
          return convo;
        }
      }));
    },
    [setActiveChat]
  );

  const addMessageToConversation = useCallback(
    (data) => {
      // if sender isn't null, that means the message needs to be put in a brand new convo
      const { message, sender = null } = data;
      if (sender !== null) {
        const newConvo = {
          id: message.conversationId,
          otherUser: sender,
          messages: [message],
        };
        newConvo.latestMessageText = message.text;
        setConversations((prev) => [newConvo, ...prev]);
      }

      setConversations(prev => prev.map((convo) => {
        if (convo.id === message.conversationId) {
          const convoCopy = { ...convo };
          convoCopy.messages = [...convoCopy.messages, message];
          convoCopy.latestMessageText = message.text;
          return convoCopy;
        } else {
          return convo;
        }
      }));
    },
    []
  );

  //repopulates last activeConversation in edge cases where user refreshes the page while in a conversation.
  const getLastActiveConversation = useCallback(async (userId, conversations) => {
    const { data } = await axios.get(`/api/conversations/activeChat/${userId}`);
    if (data) {
      const activeUser = data.user1Id === userId ? 'user1' : 'user2';
      const otherUsername = conversations.find(convo => convo.id === data.id).otherUser.username;
      setActiveConversation({ id: data.id, activeUser, otherUsername })
    }
  }, [])

  useEffect(() => {
    //only checks for last activeConversation if there is no activeConversation.
    if (user.id && conversations.length > 0 && !activeConversation.id) {
      getLastActiveConversation(user.id, conversations);
    }
  }, [user, conversations, activeConversation, getLastActiveConversation]);

  const addOnlineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: true };
          return convoCopy;
        } else {
          return convo;
        }
      })
    );
  }, []);

  const removeOfflineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: false };
          return convoCopy;
        } else {
          return convo;
        }
      })
    );
  }, []);

  // Lifecycle

  useEffect(() => {
    // Socket init
    socket.on('add-online-user', addOnlineUser);
    socket.on('remove-offline-user', removeOfflineUser);
    socket.on('new-message', addMessageToConversation);
    return () => {
      // before the component is destroyed
      // unbind all event handlers used in this component
      socket.off('add-online-user', addOnlineUser);
      socket.off('remove-offline-user', removeOfflineUser);
      socket.off('new-message', addMessageToConversation);
    };
  }, [addMessageToConversation, addOnlineUser, removeOfflineUser, socket]);

  useEffect(() => {
    // when fetching, prevent redirect
    if (user?.isFetching) return;

    if (user && user.id) {
      setIsLoggedIn(true);
    } else {
      // If we were previously logged in, redirect to login instead of register
      if (isLoggedIn) history.push('/login');
      else history.push('/register');
    }
  }, [user, history, isLoggedIn]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await axios.get('/api/conversations');
        setConversations(data);
      } catch (error) {
        console.error(error);
      }
    };
    if (!user.isFetching) {
      fetchConversations();
    }
  }, [user]);

  const handleLogout = async () => {
    if (user && user.id) {
      //when logging out set the user's active status in current conversation to inactive.
      await setUserActiveInChat({
        activeConvoId: activeConversation.id, 
        activeUser: activeConversation.activeUser, 
        isActive: false
      });
      await logout(user.id);
    }
  };

  return (
    <>
      <Button onClick={handleLogout}>Logout</Button>
      <Grid container component="main" className={classes.root}>
        <CssBaseline />
        <SidebarContainer
          conversations={conversations}
          user={user}
          clearSearchedUsers={clearSearchedUsers}
          addSearchedUsers={addSearchedUsers}
          setActiveChat={setActiveChat}
          activeConversation={activeConversation}
        />
        <ActiveChat
          activeConversation={activeConversation}
          conversations={conversations}
          user={user}
          postMessage={postMessage}
        />
      </Grid>
    </>
  );
};

export default Home;
