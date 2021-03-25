require('dotenv').config();
const cors=require('cors');
const express=require('express');
const app=express();
app.use(express.json());
app.use(cors());
const mongodb=require('mongodb');
const bcrypt=require('bcrypt');
const mongoClient=mongodb.MongoClient;
const objectId=mongodb.ObjectID;
const nodemailer=require('nodemailer');

const transporter=nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:'padmapriyakarthik97@gmail.com',
        pass:process.env.PASSWORD
    }
});

const dbUrl=process.env.DB_URL || "mongodb://127.0.0.1:27017";
const port=process.env.PORT || 4000;

app.get("/",async (req,res)=>{
    try{
        let client=await mongoClient.connect(dbUrl);
        let db=client.db("Users");
        let data=await db.collection("user_info").find().project({password:0}).toArray();
        res.status(200).json(data);
        client.close();
    }
    catch(error)
    {
        console.log(error);
    }
});


app.post("/register",async (req,res)=>{
    try{
        let client=await mongoClient.connect(dbUrl);
        let db=client.db("Users");
        let data=await db.collection("user_info").findOne({email:req.body.email});
        if(data)
        {
            res.status(400).json({message:"User Already Exists"});
        }
        else{

            let salt=await bcrypt.genSalt(10);//key to encrypt password
            let hash=await bcrypt.hash(req.body.password,salt);
            req.body.password=hash;
            await db.collection("user_info").insertOne(req.body);
            
            let info = await transporter.sendMail({
                from: 'padmapriyakarthik97@gmail.com', // sender address
                to: req.body.email, // list of receivers
                subject: "Hai!", // Subject line
                html: "<p>Hello "+req.body.name+" your sign up is successful</p>", // html body
              })
            res.status(200).json({message:info});
        }
        
        client.close();
    }
    catch(error)
    {
        console.log(error);
    }
});


app.post("/login",async(req,res)=>{
    try{
        let client=await mongoClient.connect(dbUrl);
        let db=client.db("Users");
        let data=await db.collection("user_info").findOne({email:req.body.email});
        if(data)
        {
            let isvalid =await bcrypt.compare(req.body.password,data.password);   
            if(isvalid)
            {
                let info = await transporter.sendMail({
                    from: 'padmapriyakarthik97@gmail.com', // sender address
                    to: req.body.email, // list of receivers
                    subject: "Hai!", // Subject line
                    html: "<h3>Hello "+data.name+"</h3><p>Welcome you have successfully loggedin</p>", // html body
                  })
                  console.log(info);
                res.status(200).json({message:"Login Success"});
            }
            else{
                res.status(400).json({message:"Login Unsuccesful"})
            }
        }
        else{
            res.status(400).json({message:"User Does Not Exists "});// 401 unauthorized
        }

    }
    catch(error){
        console.log(error);
    }
})
app.listen(port,()=>{console.log("port started")});