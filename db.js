const dotenv = require("dotenv");
dotenv.config();
const mongodb = require("mongodb").MongoClient;

// const connectionString = 'mongodb+srv://app:app@cluster0.xnzeugc.mongodb.net/ourApp?retryWrites=true&w=majority'

mongodb.connect(process.env.DB_CONNECT, (err, client) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Successfully connected to MongoDB");
    module.exports = client;
    const app = require("./app");
    app.listen(process.env.PORT);
  }
});
