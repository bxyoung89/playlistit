var express = require('express');
var router = express.Router();

router.get("/", function(req, res){
	res.sendFile("index.html", { root: __dirname+"/../../client"});
});

router.get("/callback", function(req, res){
	res.sendFile("callback.html", { root: __dirname+"/../../client"});
});

module.exports = router;