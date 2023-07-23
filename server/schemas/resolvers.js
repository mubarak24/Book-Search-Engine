const { User } = require('../models');
const { signToken } = require('../utils/auth');
const { AuthenticationError } = require('apollo-server-express');

const resolvers = {
  Query: {
    getSingleUser: async (_, { id, username }) => {
      const foundUser = await User.findOne({
        $or: [{ _id: id }, { username }],
      });

      if (!foundUser) {
        throw new Error('Cannot find a user with this id or username!');
      }

      return foundUser;
    },
    me: async (parent, args, context) => {
      if (context.user) {
        const userWithSavedBooks = await User.findOne({ _id: context.user._id }).populate('savedBooks');
        return userWithSavedBooks;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },

  Mutation: {
    createUser: async (_, { userInput }) => {
      const user = await User.create(userInput);

      if (!user) {
        throw new Error('Something went wrong while creating the user!');
      }

      const token = signToken(user);
      return { token, user };
    },

    login: async (_, { loginInput }) => {
      const { usernameOrEmail, password } = loginInput;

      const user = await User.findOne({
        $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      });

      if (!user) {
        throw new Error("Can't find a user with this username or email!");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new Error('Invalid password!');
      }

      const token = signToken(user);
      return { token, user };
    },

    saveBook: async (_, { bookInput }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Authentication required!');
      }

      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $addToSet: { savedBooks: bookInput } },
          { new: true, runValidators: true }
        );

        return updatedUser;
      } catch (err) {
        console.log(err);
        throw new Error('Failed to save the book.');
      }
    },

    deleteBook: async (_, { bookId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Authentication required!');
      }

      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error("Couldn't find user with this id!");
      }

      return updatedUser;
    },
  },
};

module.exports = resolvers;
