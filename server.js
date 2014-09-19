var fs = require('fs'),
express = require('express'),
app = express();
var request = require('request')
var Parse = require('parse').Parse;
var moment = require('moment');
var Converter=require("csvtojson").core.Converter;
var fs=require("fs");

// load auth variables
var auth = require('./auth');

Parse.initialize(auth.parse.id, auth.parse.key);

var port = process.env.PORT || 3000;    // set our port

var router = express.Router();

app.use(express.static(__dirname + '/public'));
var example = __dirname + '/example.json';


app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.get('/',function(req,res){
  res.render('index');
  
});

//Converts MTA Schedule Data from a CSV to JSON
app.get('/getcsvjson', function(req,res){
	var csvFileName="./data/" + req.query.file + ".csv";
	var fileStream=fs.createReadStream(csvFileName);
	var csvConverter=new Converter({constructResult:true});
	//end_parsed will be emitted once parsing finished
	csvConverter.on("end_parsed",function(jsonObj){
   		res.send(jsonObj); //here is your result json object
	});

	//read from file
	fileStream.pipe(csvConverter);	
});

app.get('/getstoptimes', function(req,res){
	var min = req.query.minutes
	if(min == undefined){
		min = 15;
	}
	var currenttime = moment().format('HH:mm:ss');
	var comparetime = moment().add(min,'m').format('HH:mm:ss');
	var StopTime = Parse.Object.extend("stop_times");
	var query = new Parse.Query(StopTime);
	query.equalTo("stop_id", req.query.stopid);
	query.greaterThan("arrival_time",currenttime);
	query.lessThan("arrival_time",comparetime);
	query.find({
	  success: function(data) {
	  	res.send(data)
	  },
	  error: function(error) {
	  	res.send({error : "Stop Times not found"})
	  }
	});
});

app.get('/gettrips', function(req,res){;
	var Trips = Parse.Object.extend("trips");
	var query = new Parse.Query(Trips);
	query.equalTo("trip_id", req.query.tripid);
	query.find({
	  success: function(data) {
	  	res.send(data)
	  },
	  error: function(error) {
	  	res.send({error : "Trips not found"})
	  }
	});
});

app.use('/', router);

app.listen(port);
console.log('Listening on port ' + port);
