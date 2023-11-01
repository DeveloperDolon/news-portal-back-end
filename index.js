require("dotenv").config();
const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
var jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DATA_USERNAME}:${process.env.DATA_PASSWORD}@cluster0.evacz3b.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const logger = (req, res, next) => {
  console.log("log info : ", req.method, req.url);
  next();
} 

const verify = (req, res, next) => {
  const token = req?.cookies?.token;

  if(!token) {
    return res.status(401).send({message: "unauthorized access"}); 
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
    if(err) {
      return res.status(500).send({message: "unauthorized access"});
    }

    req.user = decode;
    next();
  })

}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection]

    const allNewsCollection = client.db("planetNewsDB").collection("allNewsCollection");

    // jwt related requests
    app.post("/jwt", logger, async(req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "2h"});

      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: "none"
      }).send({success : true})
    })

    // news related requests

    app.get("/news/:id", logger, async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};

      const result = await allNewsCollection.findOne(filter);
      res.send(result);
    })

    app.get("/all-news", logger, async (req, res) => {

        try{

            const options = {
                projection: {
                    headline : 1,
                    image: 1,
                    date_published: 1,
                    author: 1
                }
            }

            const cursor = allNewsCollection.find({},options);
            const news = await cursor.toArray();

            res.send(news);
        }catch(error) {
            console.log(error);
        }
    })

    app.get("/news/:id" , async (req, res) => {

    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get("/", (req, res) => {
    res.send("Welcome to Planet News Server (❁´◡`❁)");
})

app.listen(port, () => {
    console.log("Server listening on port", port);
}) 