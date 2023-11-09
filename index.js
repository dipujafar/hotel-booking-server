const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const verify = async(req, res, next)=>{
  const token = req?.cookies?.token;
  if(!token){
    return res.status(401).send({message: "Unauthorized Access"})
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({message : "Unauthorized Access"})
    }
    res.user = decoded;
    next()
  })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@jafardipu.hwlq4pv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const roomCollection = client.db('hotelRooms').collection('rooms');
    const bookingCollection = client.db('hotelRooms').collection('booking');

    //jwt related api
    app.post('/jwt', async(req,res)=>{
      try{
        const user = req.body;
        console.log(user);
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn : '1h'
        });

        res.cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none'
        })
        .send({success : true})
      }
      catch{(error)=>{
        console.log(error)
      }}
    })

    //room related apis
    app.get('/rooms', async(req,res)=>{
      try{
         const query = {availability: true};
      const options = {
        projection: { _id: 1, image: 1, price_per_night: 1, reviews: 1},
      };

      const result = await roomCollection.find(query, options).toArray();
      res.send(result)
      }
      catch{(error)=>console.log(error)}
     
    });

    app.get('/rooms/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await roomCollection.findOne(query);
      res.send(result)
    });


    // booking related apis
    app.post('/booking', async(req,res)=>{
      const room = req.body;
      const result = await roomCollection.insertOne(room);
      res.send(result);
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req,res)=>{
    res.send("Hotel Booking Server is Running");
});

app.listen(port, ()=>{
    console.log(`Hotel server Running on port ${port}`)
})



