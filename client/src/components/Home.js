import React, { useCallback, useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { Grid, CssBaseline, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { SidebarContainer } from '../components/Sidebar';
import { ActiveChat } from '../components/ActiveChat';
import { SocketContext } from '../context/socket';
import usePreviousActiveConversation from '../hooks/usePreviousActiveConversation';

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
  //tracks previous conversation if it has been assigned an id, i.e. users exchanged at least 1 message.
  let prevActiveConversation = usePreviousActiveConversation(activeConversation);

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

  const updateOtherUserChatUnreadCount = async (body) => {
    axios.put('/api/conversations/activeChat/unread', body);
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

      updateOtherUserChatUnreadCount({
        convoId: data.message.conversationId, 
        userId: data.message.senderId,
        recipientId: body.recipientId,
        isOtherUserOnline: body.isOtherUserOnline
      })
    } catch (error) {
      console.error(error);
    }
  };

  const setMostRecentConversation = useCallback(
    (message, recipientId = null) => {
      const conversationsCopy = [ ...conversations ];

      const convoIdx = recipientId !== null 
        ? conversationsCopy.findIndex(convo => convo.otherUser.id === recipientId) 
        : conversationsCopy.findIndex(convo => convo.id === message.conversationId);
        
      const convoCopy = { ...conversationsCopy[convoIdx] };
      conversationsCopy.splice(convoIdx, 1);

      convoCopy.messages = [...convoCopy.messages, message];
      convoCopy.latestMessageText = message.text;
      convoCopy.id = message.conversationId;

      conversationsCopy.unshift(convoCopy);
      setConversations(conversationsCopy);
    }
  , [conversations]);

  const addNewConvo = (recipientId, message) => {
    setActiveChat({
      id: message.conversationId,
      activeUser: 'user1',
      isActive: true
    });

    setMostRecentConversation(message, recipientId);
  };

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

      setMostRecentConversation(message);
    }, [setMostRecentConversation]);

  const setActiveChat = (body) => {
    setActiveConversation(prev => ({...prev, ...body}));
  };

  const setUserActiveInChat = useCallback(async (body) => {
    try {
      await axios.put('api/conversations/activeChat/userActive', body);
    } catch (error) {
      console.error(error);
    }
  }, []);

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

  //whenever user clicks on a conversation, the user is set to inactive in the previous conversaton and set to active on the clicked conversation. 
  useEffect(() => {
    //does not run when both are null
    if (!(!prevActiveConversation.id && !activeConversation.id)) {
      setUserActiveInChat({
        prevActiveConvoId: prevActiveConversation.id,
        prevActiveUser: prevActiveConversation.activeUser,
        activeConvoId: activeConversation.id,
        activeUser: activeConversation.activeUser,
        isActive: true,
      });
    }
  }, [prevActiveConversation, activeConversation, setUserActiveInChat]);

  const handleLogout = async () => {
    if (user && user.id) {
      //sets user to inactive both previous conversation and current conversation.
      if (activeConversation.id) {
        setUserActiveInChat({
          prevActiveConvoId: prevActiveConversation.id,
          prevActiveUser: prevActiveConversation.activeUser,
          activeConvoId: activeConversation.id,
          activeUser: activeConversation.activeUser,
          isActive: false,
        });
      }
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
