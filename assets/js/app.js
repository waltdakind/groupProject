/* 1: Global Vars
 * ============== */

// Trend Array
var trends = [];

// Firebase ref
trendRef = new Firebase('https://uncommitteds.firebaseio.com/');



/* 2: Functions / Obejects
 * ======================= */

// get a popular youtube video with a keyword
function youtubeCatch(topic) {
	topic = encodeURI(topic);
	// base youtube URL
	var youtube_url = "https://www.googleapis.com/youtube/v3/" +
										"search?part=snippet&maxResults=1&order=viewCount&" +
										"key=AIzaSyDmDiJaKVpOL729WgW2zpbnpzR_XKKM_Es&q=";
	// add topic to url
	youtube_url += topic;

	console.log(youtube_url);

	// make API call to youtube api
	$.ajax({
		url: youtube_url,
		type: 'GET',
		success: function(response) {
			console.log(response.items[0].id.videoId);
			
			// get video id
			var videoID = response.items[0].id.videoId;

			// make embed
			var embed = $('<iframe frameborder="0" allowfullscreen></iframe>')
			embed.attr('width', "560") 
					 .attr('height', "315" )
					 .attr('src', "https://www.youtube.com/embed/" + videoID);
			$('body').html(embed);
		},
		error: function(error) {
			console.log("youtubeCatch Error: " + error);
		}
	})
};

// main interface
var interface = {

	formatter : function(trendName){
		// first, remove any initial hashtags
		var newName = "";
		if (trendName[0] === '#') {
			trendName = trendName.slice(1);
		}

		// now find every instance of a capital letter, starting with second char
		for (var i = 1; i < trendName.length; i++) {

			// save current and next char's ascii
			var curChar = trendName.charCodeAt(i);
			var nextChar = trendName.charCodeAt(i+1);
			var lastChar = trendName.charCodeAt(i-1);

			// if curChar is the value for a cap letter, add a space before it...
			if ( 65 <= curChar && curChar <= 95 ) {
				// ...but only if there's no issue with other chars
				if (trendName[i-1] !== " " && trendName[i-1] !== "-") {
					if (65 >= lastChar || lastChar >= 95) {
							trendName = trendName.slice(0, i) + " " + trendName.slice(i);
							// increase counter by 1 on success
							i++;
							console.log(trendName);
					}
				}
			}
		}

		// return the new word
		return trendName;
	},

	// api method: call twitter API for Trends, save it to firebase
	api: function() {
		// grab a snapshot of the database this one time
		trendRef.once("value", function(snapshot){
			// catch the timestamp of the last update
			if (snapshot.child("twitter").child("timeAdded").exists()) {
				var time_record = snapshot.child("twitter").val().timeAdded;
				console.log(time_record);
				// catch the current timestamp
				var time_now = Date.now();
				console.log(time_now);
				// figure out the dif between the recorded time and now
				var time_dif = time_now - time_record;
				console.log(time_dif);
			}
			if (time_dif >= 300000 || !snapshot.child("twitter").child("timeAdded").exists()) {

				// then make ajax call
				$.ajax({

					// call our get_tweets php file
					url: 'get_tweets.php',
					type: 'GET',

					// on success, save all latest trends to the global trend arr
					success: function(response) {

						// first remove all data from firebase
						trendRef.child('twitter').set({
						
						})

						// shortcut for trends in api
						var latestTrends = response[0].trends;

						// go through each trend
						for (var i = 0; i < latestTrends.length; i++){

							// format the name of the current trend
							latestTrends[i].name = interface.formatter(latestTrends[i].name);

							// push all of the current trend's data to firebase
							trends.push(latestTrends[i]);
						}

						// send our trends arr to firebase, along with a timestamp
						trendRef.child("twitter").set({
							trends : trends,
	          	timeAdded: Firebase.ServerValue.TIMESTAMP
						})
					},
					// send error message on error
					error: function(errors) {
						console.log(errors);
					}
				})
			}
			// if updated within 5 mins, tell us how many mins we have left for new data
			else {
				var minutes = Math.ceil(5 - (time_dif / 60000));
				console.log("already updated. Wait " + minutes + " mins for a new update");
			}
		})
	},
};


// 3: Calls

$(document).on("ready", function() {
	var video = youtubeCatch("Ben-Hur");
})

		


