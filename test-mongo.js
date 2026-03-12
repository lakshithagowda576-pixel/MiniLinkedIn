const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = "mongodb+srv://LakshithaGG:Lakshitha%402026@cluster0.oq2okha.mongodb.net/?appName=Cluster0";

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
    console.log("Connecting...");
    await client.connect();
    console.log("Sending ping...");
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    console.log("Closing...");
    await client.close();
  }
}
run().catch(console.dir);
