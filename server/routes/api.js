var redditApiToken = undefined;
var appSecret = "UdelAjmA01zs8wGNlcq5T16qzUc";
var appId = "vRZAAou_olWArw";
var appRedirectUrl = "http://playlistit.com";
var appUserName = "playlistit";
var appPassword = "playlistitpassword";



var express = require('express');
var router = express.Router();
var rawjs = require('raw.js');
var reddit = new rawjs(makeUserAgent());






reddit.setupOAuth2(appId, appSecret);

router.post("/getLinks", function(req, res){
	console.log(JSON.stringify(Object.keys(req)));
	reddit.hot({
		r: req.body.subReddit,
		limit: 100,
		all: true
	}, function(error, data){
		var posts = data.children;
		var filteredPosts = posts.filter(function(post){
			return post.data.domain === req.body.domain;
		});
		var links = filteredPosts.map(function(post){
			return post.data.url;
		});
		res.send(links);
	});
});


router.post("/getPosts", function(req, res){
	console.log(JSON.stringify(Object.keys(req)));
	reddit.hot({
		r: req.body.subReddit,
		limit: 100,
		all: true
	}, function(error, data){
		var posts = data.children;
		var filteredPosts = posts.filter(function(post){
			return post.data.domain === req.body.domain;
		});
		res.send(filteredPosts);
	});
	//authenticate(function(authenticationError){
	//	if(authenticationError){
	//		res.send({
	//			error: authenticationError
	//		});
	//		return;
	//	}
	//	reddit.hot({})
	//});
});

function authenticate(onAuthenticateCallback){
	if(redditApiToken !== undefined && redditApiToken.expires_in > (new Date()).getTime()/1000 ){
		onAuthenticateCallback();
		return;
	}
	reddit.auth({
		username: appUserName,
		password: appPassword
	}, function(error, response){
		if(error){
			console.log("unable to authenticate");
			onAuthenticateCallback(error);
			return;
		}
		redditApiToken = response.access_token;
		onAuthenticateCallback();
	});
}

function makeUserAgent() {
	var platform = "web";
	var version = "1.0";
	var user = "playlistit";
	return platform+":"+appId+":"+version+" (by /u/"+user+")";
}


module.exports = router;