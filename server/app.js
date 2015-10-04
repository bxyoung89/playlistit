// set variables for environment
var express = require("express");
var app = express();
var routes = require('./routes/index');
var api = require('./routes/api');
var bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));

app.use("/", routes);
app.use("/api", api);


// Set server port
app.listen(4000);
console.log("server is running");



// instruct express to server up static assets
app.use(express.static(__dirname +"/client"));
