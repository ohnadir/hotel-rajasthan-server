const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

// Mildwares
app.use(cors());
app.use(express.json());

// MongoDb Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@hotel-rajasthan.5ddqnrf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    // await client.connect();
    const bookingCollection = client.db("Hotel-Rajasthan").collection("booking");
    const roomCollection = client.db("Hotel-Rajasthan").collection("rooms");
    
    // room POST api
    app.post("/rooms", async (req, res) => {
      const room = req.body;
      const result = await roomCollection.insertOne(room);
      res.status(201).json({
        success: true,
        statusCode : 200,
        message: "Room added successful",
        result
      })
    });

    // room GET api
    app.get("/rooms", async (req, res) => {
      const date= new Date().toISOString().slice(0, 10);
      const result = await roomCollection.find({}).toArray();
      const newDate = result.filter((item)=> item.bookedDate[0] !== date);
      res.status(201).json({
        success: true,
        statusCode : 200,
        message: "Room Fetch successfully",
        result: newDate
      })
    });
    // room put api
    app.put("/rooms/:id", async (req, res) => {
      const id = req.params.id;
      const docs = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $push: bookedDate = docs
      };
      const result = await roomCollection.updateOne(filter, updateDoc, options);
      
      res.status(201).json({
        success: true,
        statusCode : 200,
        message: "Room booked successfully",
        result
      })
    });

    //  booking post api
    app.post("/booking", async (req, res) => {
      const todayBooking = req.body;
      const result = await bookingCollection.insertOne(todayBooking);
      res.status(201).json({
        success: true,
        statusCode : 200,
        message: "Room Booking successfully",
        result
      })
    });

    app.get("/booking", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = bookingCollection.find(query);
      let booking;
      if (page || size) {
        booking = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        booking = await cursor.toArray();
      }
      res.send(booking.reverse());
    });

    // get today booking
    app.get("/todayBooking", async (req, res) => {
      const date= new Date().toISOString().slice(0, 10);
      const result = await bookingCollection.find({createdAt: date}).toArray();
      res.status(201).json({
        success: true,
        statusCode : 200,
        message: "Today Booking list Fetch successfully",
        result
      })
    });

    // get due booking
    app.get("/due", async (req, res) => {
      const result = await bookingCollection.find({}).toArray();
      const due = result.filter((item)=> item.due > 0)
      res.status(201).json({
        success: true,
        statusCode : 200,
        message: "Today Booking list Fetch successfully",
        result: due
      })
    });











    

    // pagination
    app.get("/bookingCount", async (req, res) => {
      const count = await bookingCollection.estimatedDocumentCount();
      res.send({ count });
    });
    // update data
    app.get("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await bookingCollection.findOne(query);
      res.send(result);
    });

    // Get UpPaid all Booking
    app.get("/getUnpaidBooking", async (req, res) => {
      const query = { status: "unpaid" };
      const result = await bookingCollection.find(query).toArray();
      res.send(result.reverse());
    });
    // handle Paid Booking Now
    app.put("/handlePaidBooking/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const findOrder = await bookingCollection.findOne(filter);
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: "paid",
          totalDue: 0,
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });
//  Get ToDays All Booking
    app.get("/getTodaysBooking", async (req, res) => {
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const initialDay = date.getDate();
      let day;
      if (initialDay <= 9) {
        day = `0${initialDay}`;
      } else if (initialDay > 9) {
        day = initialDay;
      }
      const todays = `${year}-${month}-${day}`;
      // console.log("getTodaysBooking", todays);
      const filter = { date: todays };
      // console.log(todays);
      const result = await bookingCollection.find(filter).toArray();
      res.send(result);
      console.log("todaydare", result);
    });

    //  Get Today Total Amount
    app.get("/getTodaysTotalAmount", async (req, res) => {
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const initialDay = date.getDate();
      let day;
      if (initialDay <= 9) {
        day = `0${initialDay}`;
      } else if (initialDay > 9) {
        day = initialDay;
      }
      const todays = `${year}-${month}-${day}`;
      // console.log("getTodaysTotalAmount",todays);
      const filter = { date: todays };
      // console.log("total adamon", todays);
      const initialValue = 0;
      const getArray = await bookingCollection.find(filter).toArray();

      if (getArray.length > 0) {
        let sum = 0;
        getArray.forEach((element) => {
          sum += element?.totalPrice;
        });
        res.send({ sum });
      } else {
        res.send({ sum: initialValue });
      }
    });
    //  getTodaysAdvancedAmount
    app.get("/getTodaysAdvancedAmount", async (req, res) => {
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const initialDay = date.getDate();
      let day;
      if (initialDay <= 9) {
        day = `0${initialDay}`;
      } else if (initialDay > 9) {
        day = initialDay;
      }
      const todays = `${year}-${month}-${day}`;
      // console.log("getTodaysAdvancedAmount",todays);
      const filter = { date: todays };
      const initialValue = 0;
      const getArray = await bookingCollection.find(filter).toArray();

      if (getArray.length > 0) {
        let sum = 0;
        getArray.forEach((element) => {
          sum += element?.advancedAmount;
        });
        res.send({ sum });
      } else {
        res.send({ sum: initialValue });
      }
    });

    



    // Update Booking Data
    app.put("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updateUser = req.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: updateUser,
      };
      const result = await bookingCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
  
    // delete data
    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hotel-Rajasthans Server Running");
});

//port
const PORT =  process.env.PORT;
const HOST = process.env.HOST
app.listen(port, () => {
  console.log(`Server started on ${HOST}:${PORT}, url http://${HOST}:${PORT}`);
});
