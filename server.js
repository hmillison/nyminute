var fs = require('fs'),
express = require('express'),
app = express();
var request = require('request')

var example = __dirname + '/example.json';
var Converter=require("csvtojson").core.Converter;
var fs=require("fs");

// load auth variables
var auth = require('./auth');

var port = process.env.PORT || 3000;    // set our port

var router = express.Router();

app.use(express.static(__dirname + '/public'));


app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});



app.get('/',function(req,res){
  res.render('index');
  
});

//Converts MTA Schedule Data from a CSV to JSON
app.get('/getcsvjson/:file', function(req,res){
	var csvFileName="./data/" + req.param("file") + ".csv";
	var fileStream=fs.createReadStream(csvFileName);
	var csvConverter=new Converter({constructResult:true});
	//end_parsed will be emitted once parsing finished
	csvConverter.on("end_parsed",function(jsonObj){
   		res.send(jsonObj); //here is your result json object
	});

	//read from file
	fileStream.pipe(csvConverter);	
});

app.use('/', router);

app.listen(port);
console.log('Listening on port ' + port);
