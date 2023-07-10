const api = require("../src/api/api");

api.users.addUser(
  {
    query: {
      username: process.argv[2],
      password: process.argv[3],
      email: process.argv[4],
      ip: "192.168.0.1",
    },
  },
  (err, user) => {
    console.log(`${user.username} created!`);
  }
);
