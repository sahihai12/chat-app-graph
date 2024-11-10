const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PubSub } = require("graphql-subscriptions");

// Models
const User = require("./models/User");
const Message = require("./models/Message");

// Initialize Express
const app = express();

// GraphQL Schema
const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    password: String!
  }

  type Message {
    id: ID!
    text: String!
    sender: String!
  }

  type Query {
    getMessages: [Message]
  }

  type Mutation {
    registerUser(username: String!, password: String!): User
    loginUser(username: String!, password: String!): String
    sendMessage(text: String!): Message
  }

  type Subscription {
    messageReceived: Message
  }
`;

const resolvers = {
  Query: {
    getMessages: async () => await Message.find(),
  },

  Mutation: {
    registerUser: async (_, { username, password }) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username, password: hashedPassword });
      await user.save();
      return user;
    },
    loginUser: async (_, { username, password }) => {
      const user = await User.findOne({ username });
      if (!user) throw new Error("User not found");

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) throw new Error("Invalid password");

      const token = jwt.sign({ userId: user.id, username: user.username }, `jkashdkja98798278931mnkjhfd9823q7n324hksd98fj4`, {
        expiresIn: "1h",
      });
      return token;
    },
    sendMessage: async (_, { text }, { user }) => {
      if (!user) throw new Error("Unauthorized");
      
      console.log('user' , user)
      const message = new Message({
        text,
        sender: user.username, // Ensure `sender` is populated with the authenticated user's username
      });
      
      await message.save();
  
      pubsub.publish("MESSAGE_RECEIVED", { messageReceived: message });
  
      return message;
    },
  },

  Subscription: {
    messageReceived: {
      subscribe: () => pubsub.asyncIterator("MESSAGE_RECEIVED"),
    },
  }

};

// Authentication Middleware
const getUser = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, `jkashdkja98798278931mnkjhfd9823q7n324hksd98fj4`);
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};

const pubsub = new PubSub();

// Initialize Apollo Server
const startServer = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const token = req.headers.authorization || "";
      const user = getUser(token.split(" ")[1]);
      return { user };
    },
  });
  

  // Await server start before applying middleware
  await server.start();
  server.applyMiddleware({ app });

  // Connect to MongoDB and start Express server
  mongoose
    .connect("mongodb://localhost:27017/chat-app", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      app.listen(4000, () => {
        console.log("Server is running on http://localhost:4000");
      });
    });
};

// Start the server
startServer();
