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

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// convert req.body data into javascript object
app.use(cookieParser())

app.use('/user',authRouter);
app.use('/problem',problemRouter);
app.use('/submission', submitRouter)
app.use('/ai', aiRouter)
app.use("/video",videoRouter);


const InitializeConnection = async()=>{
 

  try{

    await Promise.all([main(), redisClient.connect()]);
    console.log("DB connected");

    app.listen(process.env.PORT, () => {
      console.log("Server listening at port number : " + process.env.PORT);
    })

  }
  catch(err){

    console.log("Error : "+err.message);

  }
}

InitializeConnection();

 






