var redditApiToken = undefined;
var redditAppSecret = "UdelAjmA01zs8wGNlcq5T16qzUc";
var redditAppId = "vRZAAou_olWArw";
var appRedirectUrl = "http://playlistit.com";
var redditUserName = "playlistit";
var redditPassword = "playlistitpassword";

var soundcloudClientId = "c00bfada0bbf8456e4ac1387ecfe7520";
var soundcloudClientSecret = "91b883332d3d15da6d0910f4837a785b";
var soundcloudUserEmail = "playlistit@gmail.com";
var soundcloudApiUrl = "http://api.soundcloud.com";
var soundcloudUserPassword = "playlistitpassword";
var soundcloudUserId = "618584601";
var soundcloudAccessToken = undefined;

var express = require("express");
var router = express.Router();
var rawjs = require("raw.js");
var request = require("request");
var sugar = require("sugar");
var SoundcloudNode = require("soundcloud-node");
var reddit = new rawjs(makeUserAgent());
var soundcloud = undefined;


reddit.setupOAuth2(redditAppId, redditAppSecret);

router.post("/makePlaylist", function (req, res) {
	console.log("got request");
	reddit.hot({
		r: req.body.subReddit,
		limit: 100,
		all: true
	}, function (error, data) {
		console.log("got reddit data");
		var posts = data.children;
		var filteredPosts = posts.filter(function (post) {
			return post.data.domain === req.body.domain;
		});
		var links = filteredPosts.map(function (post) {
			return post.data.url;
		});
		var trackIds = [];
		console.log("getting track ids");
		links.forEach(function (link) {
			return soundcloudLinkToTrackId(link, function (trackId) {
				trackIds.push(trackId);
			});
		});
		var trackInterval = setInterval(function () {
			if (trackIds.length < links.length) {
				console.log("waiting on " + (links.length - trackIds.length) + " of " + links.length + " tracks");
				return;
			}
			clearInterval(trackInterval);
			trackIds = trackIds.compact();

			var playlistTitle = (new Date()).toISOString() + " r/" + req.body.subReddit + " Playlist";
			var tracks = trackIds.map(function (trackId) {
				return {
					id: trackId
				};
			});
			console.log("got the track ids");

			authenticateSoundcloud(function (error) {
				console.log("finished authenticating");
				if (error) {
					res.send(error);
					return;
				}
				console.log("posting the playlist");


				//step 1 make the playlist
				var url = "https://api.soundcloud.com/playlists?client_id="+soundcloudClientId;
				var formData = {
					playlist:{
						title: playlistTitle,
						sharing: "public",
						_resource_id: "undefined",
						_resource_type: "playlist"
						//tracks: tracks
					}
				};
				var headers = {
					Authorization: "OAuth "+soundcloudAccessToken
				};

				request.post({
					url: url,
					form: formData,
					headers: headers
				}, function(error, response, body){
					console.log("made hte playlist");
					if(error){
						res.send(error);
						return;
					}
					var playlistId = JSON.parse(body).id;

					var url = "https://api.soundcloud.com/playlists/"+playlistId+"?client_id="+soundcloudClientId;
					var postData = {
						playlist: {
							tracks: tracks
						}
					};
					var headers = {
						Authorization: "OAuth "+soundcloudAccessToken
					};
					console.log("adding tracks!");
					console.log(url);
					request.put({
						url: url,
						headers: headers,
						body: postData,
						json: true
					}, function(error, response, body){
						console.log(error);
						console.log(body);
						if(error){
							res.send(error);
							return;
						}
						res.send(body);
					});
				});
			});
		}, 100);
	});
});


router.post("/getPosts", function (req, res) {
	console.log(JSON.stringify(Object.keys(req)));
	reddit.hot({
		r: req.body.subReddit,
		limit: 100,
		all: true
	}, function (error, data) {
		var posts = data.children;
		var filteredPosts = posts.filter(function (post) {
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


//function authenticate(onAuthenticateCallback){
//	if(redditApiToken !== undefined && redditApiToken.expires_in > (new Date()).getTime()/1000 ){
//		onAuthenticateCallback();
//		return;
//	}
//	reddit.auth({
//		username: redditUserName,
//		password: redditPassword
//	}, function(error, response){
//		if(error){
//			console.log("unable to authenticate");
//			onAuthenticateCallback(error);
//			return;
//		}
//		redditApiToken = response.access_token;
//		onAuthenticateCallback();
//	});
//}
//

function makeUserAgent() {
	var platform = "web";
	var version = "1.0";
	var user = "playlistit";
	return platform + ":" + redditAppId + ":" + version + " (by /u/" + user + ")";
}

function soundcloudLinkToTrackId(link, callback) {
	request("https://api.soundcloud.com/resolve.json?url=" + encodeURI(link) + "&client_id=" + soundcloudClientId,
		function (error, response, body) {
			var jsonBody = JSON.parse(body);
			if (!jsonBody.id) {
				callback(undefined);
			}
			callback(jsonBody.id);
		});
}


function authenticateSoundcloud(callback) {
	if (soundcloudAccessToken !== undefined) {
		console.log("already authenticated");
		callback();
	}

	var postOptions = {
		"client_id": soundcloudClientId,
		"client_secret": soundcloudClientSecret,
		"username": soundcloudUserEmail,
		"password": soundcloudUserPassword,
		"scope": "non-expiring",
		"grant_type": "password",
		"verify_ssl": false
	};
	var url = soundcloudApiUrl + "/oauth2/token";
	console.log("posting to " + url);
	request.post({
		url: url,
		qs: postOptions
	}, function (error, response, body) {
		console.log("authentication call returned.");
		console.log(response.body);
		console.log(body);
		if (error) {
			callback(error);
			return;
		}
		soundcloudAccessToken = JSON.parse(body)["access_token"];
		var soundcloudCredentials = {
			"access_token": soundcloudAccessToken,
			"user_id": soundcloudUserId
		};
		soundcloud = new SoundcloudNode(soundcloudClientId, soundcloudClientSecret, appRedirectUrl, soundcloudCredentials);
		callback();
	});
}


module.exports = router;