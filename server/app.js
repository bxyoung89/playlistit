// set variables for environment
var express = require("express");
var app = express();
var routes = require('./routes/index');
app.use("/", routes);


// Set server port
app.listen(4000);
console.log("server is running");



// instruct express to server up static assets
app.use(express.static(__dirname +"/client"));

process.on("SIGTERM", function(){
	console.log("I'm killed");
	server.close();
});