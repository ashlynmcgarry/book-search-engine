// import user model
const { User } = require("../models");
// import sign token function from auth
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    // get a single user by either their id or their username
    me: async (parent, { userId, username }, context) => {
      const userData = await User.findOne({
        $or: [{ _id: userId }, { username }],
      });

      if (!userData) {
        throw new Error("Cannot find a user with this id!");
      }

      return userData;
    },
  },
  Mutation: {
    // create a user, sign a token, and send it back
    addUser: async (parent, { input }, context) => {
      const user = await User.create(input);
      const token = signToken(user);
      return { token, user };
    },
    // login a user, sign a token, and send it back
    login: async (parent, { input }, context) => {
      const user = await User.findOne({
        $or: [{ username: input.username }, { email: input.email }],
      });
      if (!user) {
        throw new Error("Can't find this user");
      }

      const correctPw = await user.isCorrectPassword(input.password);

      if (!correctPw) {
        throw new Error("Wrong password!");
      }
      const token = signToken(user);
      return { token, user };
    },
    // save a book to a user's `savedBooks` field
    saveBook: async (parent, { input }, context) => {
      const user = context.user; // Assuming user is added to context via auth middleware
      if (!user) {
        throw new Error("You need to be logged in!");
      }

      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $addToSet: { savedBooks: input } },
          { new: true, runValidators: true }
        );
        return updatedUser;
      } catch (err) {
        throw new Error(err);
      }
    },
    // remove a book from `savedBooks`
    removeBook: async (parent, { bookId }, context) => {
      const user = context.user; // Assuming user is added to context via auth middleware
      if (!user) {
        throw new Error("You need to be logged in!");
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
