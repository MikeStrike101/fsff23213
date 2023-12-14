const mongoose = require("mongoose");

const mongoDBUri =
  process.env.MONGO_URI ||
  "mongodb+srv://mihai:zC5NW3hR9R7YP7UO@cluster0.ungilcp.mongodb.net/myDatabase?retryWrites=true&w=majority";

const connectDB = async () => {
  try {
    await mongoose.connect(mongoDBUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      //useFindAndModify: false,
      //useCreateIndex: true
    });
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
