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

const logsSchema = new mongoose.Schema({
  _id:{
    type: String,
    required: true
  },
  username:{
    type: String,
    required: true
  },
  count: Number,
  log:[{
    description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
}]
})

const logsModel = mongoose.model("logs",logsSchema)
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
  //console.log("successfully created user: "+user)
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
 // console.log("all users were found!!");
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
//console.log("the id is this one: "+_id)
try{
  var user = await userModel.findById({_id});
  if(!user){
    res.send("userId doesn't exist")
  }
  else{
  console.log("found and extracted user info as: "+ user)
  if(!date){
    date =new Date()
    }
    else{
      date = new Date(date)
    }
 
    /*
  var createExercise = new exerciseModel(
    {
    description,
    duration,
    date: date,
    user_id: _id});

  var exercise = await createExercise.save();

 console.log(exercise)*/

  var logsInfo =await logsModel.findById(_id);

  if(!logsInfo){
    logsInfo = new logsModel({
      _id,
      username: user.username,
      count: 1,
      log:[{
        description,
        duration: parseInt(duration),
        date: date
      }]
    })
    var saveLogs = await logsInfo.save();
    console.log("created log info: "+saveLogs);
  }
  else{
    logsInfo.log.push({
      description,
      duration: parseInt(duration),
      date: date
    });
    logsInfo.count = logsInfo.count + 1;
    var saveLogs = await logsInfo.save();
    console.log("updated log info: "+saveLogs);
  }

  res.json({ 
    _id: _id,
    username: user.username,
    description,
    duration: parseInt(duration),
    date: date.toDateString()
  })
  
  }
}
catch(err){
  console.log("encountered an error while posting an exercise for id: "+_id+" with error:"+ err)
  res.status(500).send(err.message)
}
})


app.get("/api/users/:_id/logs", async(req, res)=>{
  var {_id} = req.params
  try{
    /*
    var extractEX = await exerciseModel.find();
  var dateComp1= new Date("2020-03")
  var dateComp2= new Date("2024-05")
  var arr=extractEX.filter((current)=>{
    return dateComp2 >= current.date &&  current.date >= dateComp1;
  })
  console.log(arr.length)
  console.log(extractEX.length)
  */
 var logsInfo = await logsModel.find({_id},
  {'log._id': 0,__v: 0}
 ).exec();
  
  var {log, _id, username, count} = logsInfo[0];
  var logObj = {
    _id,
    username
  }
  var from = new Date(req.query.from)
  var to = new Date(req.query.to)
  var limit = req.query.limit

  if(from != "Invalid Date"){
    
    log= log.filter((element)=>{
      return element.date >= from
    })
    count = log.length
    logObj.from = from.toDateString();
  }
  if(to != "Invalid Date"){
    log= log.filter((element)=>{
      return element.date <= to
    })
    count = log.length
    logObj.to = to.toDateString();
  }
  if(!isNaN(limit)){
    console.log(limit)
    log= log.filter((element, index)=>{
      return index < limit
    })
    count = log.length
  }
  log = log.map((elem) => {
    //elem.date = new Date(elem.date).toString(); // Convert to Date object if needed
    return {
      description: elem.description,
      duration: elem.duration,
      date: elem.date.toDateString()
    };
  });
  console.log(log);
  res.json({
    ...logObj,
    count,
    log
  });
  }
  catch(err){
    console.log(err)

  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
