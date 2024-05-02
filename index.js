const express = require('express')
const app = express()
const cors = require('cors')
const Bodyparse = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()

//connecting to mongoose

mongoose.connect(process.env.MONGO_URL,{ useNewUrlParser: true, useUnifiedTopology: true })
.then(()=>{
  console.log("database connected!!")
})
.catch((error)=>{
  console.log("database connecting failed due to: " + error)
});

//creating mongodb schemas and models

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});

const userModel = mongoose.model('user',userSchema);

const exerciseSchema = new mongoose.Schema({
  description:{
    type: String,
    required: true
  },
  duration:{
    type: Number,
    required: true
  },
  date:{
    type: Date,
    required: true
  },
  user_id:{
    type: String,
    required: true
  }
})

const exerciseModel = mongoose.model('exercise',exerciseSchema)

const logsSchema = new mongoose({
  _id:{
    type: String,
    required: true
  }
})
//middlewares
app.use(cors())
app.use(express.static('public'))
app.use(Bodyparse.urlencoded({ extended: false }));
app.use(Bodyparse.json());


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


//user Routes

app.post('/api/users',async(req, res)=>{
  const {username} = req.body;
  var createUser = new userModel({
    username: username
  });
  try{
  var user=await createUser.save()
  console.log("successfully created user: "+user)
  res.json({username: user.username,_id: user._id})
  }
  catch(error){
    console.log("encountered an error while saving user "+ username +" due to error: "+ error.name + error.message)
    res.status(500).send(error.message);
  }
});

app.get('/api/users',async(req, res)=>{
try{
  var allUsers = await userModel.find();
  console.log("all users were found!!");
  res.json(allUsers)
}
catch(err){
  console.log("encountered an error while retrieving all the users. error: "+ err)
  res.status(500).send(err.message)
}
});


//exercise Routes

app.post('/api/users/:_id/exercises',async(req, res)=>{

  // user id: 66313d053e27cf18a791e904

var {_id} = req.params;
var {description, duration, date} = req.body;
console.log("the id is this one: "+_id)
try{
  var user = await userModel.findById({_id});
  if(!user){
    res.send("userId doesn't exist")
  }
  else{
  console.log("found and extracted userdata as: "+ user)
  if(!date){
    date =new Date()
    }
    else{
      date = new Date(date)
    }
 

  var createExercise = new exerciseModel(
    {
    description,
    duration,
    date: date,
    user_id: _id});

  var exercise = await createExercise.save();

 console.log(exercise)
  res.json({ 
    _id: _id,
    username: user.username,
    description,
    duration,
    date: date.toDateString()
  })
  }
}
catch(err){
  console.log("encountered an error while posting an exercise for id: "+_id+" with error:"+ err)
  res.status(500).send(err.message)
}
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
