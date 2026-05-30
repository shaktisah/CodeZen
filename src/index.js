const express = require('express');
const app =express();
require('dotenv').config({ quiet: true });
const main=require('./config/db');
const cookieParser=require('cookie-parser');
const redisClient = require('./config/redis');
const authRouter = require('./routes/userAuth');
const problemRouter = require('./routes/problemCreator');



app.use(express.json());
app.use(cookieParser());

app.use('/user',authRouter);
app.use('/problem', problemRouter);

const InitializationConnection=async ()=>{
    try{
        await Promise.all([main(),redisClient.connect()]);
        console.log("Database Connected sucessfully");

        app.listen(process.env.PORT,()=>{
    console.log("server Listining at port number:"+process.env.PORT);
})
    }
    catch(err){
        console.log("Error: "+err);
    }
}

InitializationConnection();







// main()
// .then(async ()=>{
// app.listen(process.env.PORT,()=>{
//     console.log("server Listining at port number:"+process.env.PORT);
// })
// })
// .catch(err=> console.log("Error Occure"));



