const prisma = require("../config/prisma");

exports.getUserById = (userId) => {
  return prisma.user.findFirst({
    where: {
      userId,
    },
  });
};

exports.getUserByEmail = (email) => {
  return prisma.user.findFirst({
    where: {
      email,
    },
  });
};

exports.createUser = (firstName, lastName, phone, email, password) => {
  return prisma.user.create({
    data: {
      firstName,
      lastName,
      phone,
      email,
      password,
    },
  });
};
