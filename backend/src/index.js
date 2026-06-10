const express = require('express');
const app =express();
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const main=require('./config/db');
const cookieParser=require('cookie-parser');
const redisClient = require('./config/redis');
const authRouter = require('./routes/userAuth');
const problemRouter = require('./routes/problemCreator');
const submitRouter = require('./routes/submit');
const aiRouter = require('./routes/ai');

app.use(express.json());
app.use(cookieParser());

app.use('/user',authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);
app.use('/ai', aiRouter);

const InitializationConnection=async ()=>{
    try{
        await Promise.all([main(),redisClient.connect()]);
        console.log("Database Connected successfully");

        app.listen(process.env.PORT,()=>{
            console.log("server Listining at port number:"+process.env.PORT);
        })
    }
    catch(err){
        console.log("Error: "+err);
    }
}

InitializationConnection();
