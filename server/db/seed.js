const db = require("./db");
const { User } = require("./models");
const Conversation = require("./models/conversation");
const UserConversation = require('./models/userConversation');
const Message = require("./models/message");
const UserMessage = require('./models/userMessage');

async function seed() {
  await db.sync({ force: true });
  console.log("db synced!");

  const thomas = await User.create({
    username: "thomas",
    email: "thomas@email.com",
    password: "123456",
    photoUrl:
      "https://res.cloudinary.com/dmlvthmqr/image/upload/v1607914467/messenger/thomas_kwzerk.png",
  });

  const santiago = await User.create({
    username: "santiago",
    email: "santiago@email.com",
    password: "123456",
    photoUrl:
      "https://res.cloudinary.com/dmlvthmqr/image/upload/v1607914466/messenger/775db5e79c5294846949f1f55059b53317f51e30_s3back.png",
  });

  const convo1 = await Conversation.create();
  await UserConversation.create({
    userId: santiago.id,
    conversationId: convo1.id,
  })
  await UserConversation.create({
    userId: thomas.id,
    conversationId: convo1.id,
  })

  const convo1Message1 = await Message.create({
    conversationId: convo1.id,
    senderId: santiago.id,
    text: "Where are you from?",
  });
  const convo1Message2 = await Message.create({
    conversationId: convo1.id,
    senderId: thomas.id,
    text: "I'm from New York",
  });
  const convo1Message3 = await Message.create({
    conversationId: convo1.id,
    senderId: santiago.id,
    text: "Share photo of your city, please",
  });

  //make connection between users, convo1, and convo1Message1
  await UserMessage.create({
    userId: santiago.id,
    conversationId: convo1.id,
    messageId: convo1Message1.id,
    unread: false
  });
  await UserMessage.create({
    userId: thomas.id,
    conversationId: convo1.id,
    messageId: convo1Message1.id,
    unread: true
  });

  //make connection between users, convo1, and convo1Message2
  await UserMessage.create({
    userId: santiago.id,
    conversationId: convo1.id,
    messageId: convo1Message2.id,
    unread: true
  });
  await UserMessage.create({
    userId: thomas.id,
    conversationId: convo1.id,
    messageId: convo1Message2.id,
    unread: false
  });

  //make connection between users, convo1, and convo1Message3
  await UserMessage.create({
    userId: santiago.id,
    conversationId: convo1.id,
    messageId: convo1Message3.id,
    unread: false
  });
  await UserMessage.create({
    userId: thomas.id,
    conversationId: convo1.id,
    messageId: convo1Message3.id,
    unread: true
  });
  
  const chiumbo = await User.create({
    username: "chiumbo",
    email: "chiumbo@email.com",
    password: "123456",
    photoUrl:
      "https://res.cloudinary.com/dmlvthmqr/image/upload/v1607914468/messenger/8bc2e13b8ab74765fd57f0880f318eed1c3fb001_fownwt.png",
  });

  const convo2 = await Conversation.create();
  await UserConversation.create({
    userId: chiumbo.id,
    conversationId: convo2.id,
  });
  await UserConversation.create({
    userId: thomas.id,
    conversationId: convo2.id,
  });

  const convo2Message1 = await Message.create({
    conversationId: convo2.id,
    senderId: chiumbo.id,
    text: "Sure! What time?",
  });

  //make connection between users, convo2, and convo2Message1
  await UserMessage.create({
    userId: chiumbo.id,
    conversationId: convo2.id,
    messageId: convo2Message1.id,
    unread: false,
  });
  await UserMessage.create({
    userId: thomas.id,
    conversationId: convo2.id,
    messageId: convo2Message1.id,
    unread: true,
  });

  const hualing = await User.create({
    username: "hualing",
    email: "hualing@email.com",
    password: "123456",
    photoUrl:
      "https://res.cloudinary.com/dmlvthmqr/image/upload/v1607914466/messenger/6c4faa7d65bc24221c3d369a8889928158daede4_vk5tyg.png",
  });

  const convo3 = await Conversation.create();
  await UserConversation.create({
    userId: hualing.id,
    conversationId: convo3.id,
  }) 
  await UserConversation.create({
    userId: thomas.id,
    conversationId: convo3.id,
  });

  for (let i = 0; i < 11; i++) {
    const convo3Message = await Message.create({
      conversationId: convo3.id,
      senderId: hualing.id,
      text: "a test message",
    });
  //make connection between users, convo3, and convo3Messages
    await UserMessage.create({
      userId: hualing.id,
      conversationId: convo3.id,
      messageId: convo3Message.id,
      unread: false,
    });
    await UserMessage.create({
      userId: thomas.id,
      conversationId: convo3.id,
      messageId: convo3Message.id,
      unread: true,
    });
  }

  const convo3Message = await Message.create({
    conversationId: convo3.id,
    senderId: hualing.id,
    text: "😂 😂 😂",
  });

  //make connection between users, convo3, and convo3Message
  await UserMessage.create({
    userId: hualing.id,
    conversationId: convo3.id,
    messageId: convo3Message.id,
    unread: false,
  });
  await UserMessage.create({
    userId: thomas.id,
    conversationId: convo3.id,
    messageId: convo3Message.id,
    unread: true,
  });

  const otherUsers = await Promise.all([
    ,
    User.create({
      username: "ashanti",
      email: "ashanti@email.com",
      password: "123456",
      photoUrl:
        "https://res.cloudinary.com/dmlvthmqr/image/upload/v1607914466/messenger/68f55f7799df6c8078a874cfe0a61a5e6e9e1687_e3kxp2.png",
    }),
    User.create({
      username: "julia",

      email: "julia@email.com",
      password: "123456",
      photoUrl:
        "https://res.cloudinary.com/dmlvthmqr/image/upload/v1607914468/messenger/d9fc84a0d1d545d77e78aaad39c20c11d3355074_ed5gvz.png",
    }),
    User.create({
      username: "cheng",
      email: "cheng@email.com",
      password: "123456",
      photoUrl:
        "https://res.cloudinary.com/dmlvthmqr/image/upload/v1607914466/messenger/9e2972c07afac45a8b03f5be3d0a796abe2e566e_ttq23y.png",
    }),
  ]);

  console.log(`seeded users and messages`);
}

async function runSeed() {
  console.log("seeding...");
  try {
    await seed();
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    console.log("closing db connection");
    await db.close();
    console.log("db connection closed");
  }
}

if (module === require.main) {
  runSeed();
}
