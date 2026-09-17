const express = require('express')
const app = express();
require('dotenv').config();
const main = require('./config/db')
const cookieParser = require('cookie-parser')
const authRouter = require("./routes/userAuth");
const redisClient = require('./config/redis');
const problemRouter = require('./routes/problemCreater')
const submitRouter = require('./routes/submit')
const aiRouter = require('./routes/aiChatting')
const videoRouter = require("./routes/videoCreator");
const cors = require('cors')

app.set('trust proxy', 1);

const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter)
app.use('/ai', aiRouter)
app.use("/video", videoRouter);


const InitializeConnection = async () => {

  try {

    await Promise.all([main(), redisClient.connect()]);
    console.log("DB connected");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log("Server listening at port number : " + PORT);
    })

  }
  catch (err) {

    console.log("Error : " + err.message);

  }
}

InitializeConnection();