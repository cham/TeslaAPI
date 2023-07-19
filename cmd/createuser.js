const api = require("../src/api/api");

// node ./cmd/createuser.js username password email
api.users.addUser(
  {
    query: {
      username: process.argv[2],
      password: process.argv[3],
      email: process.argv[4],
      ip: "192.168.0.1",
    },
  },
  (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log(`user created!`);
    }
  }
);
