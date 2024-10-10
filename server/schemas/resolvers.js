// import user model
const { User } = require("../models");
// import sign token function from auth
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    // get a single user
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
    // create a user
    addUser: async (parent, input, context) => {
      console.log('input', input);
      const user = await User.create(input);
      const token = signToken(user);
      return { token, user };
    },
    // login a user
    login: async (parent, input, context) => {
      const user = await User.findOne({
        email: input.email
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
      console.log(context.user);
      const user = context.user; 
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
      const user = context.user; 
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
