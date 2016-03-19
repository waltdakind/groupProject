// SETUP VARIABLES
// ==========================================================

// Trend Array
var trends = [];
var siteInfo = [];

var wikiBaseRef = new Firebase("https://uncommitteds.firebaseio.com/wikiSearch");
var trendRef = new Firebase("https://uncommitteds.firebaseio.com/twitter/trends");
// user's inputs via HTML
var wikiSearch 	= "";

// URL  to query wikipedia
var wikiUrlBase = "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=";

// Array to hold the various article info
//var wikiArray = [];

// FUNCTIONS wikiUrl
// ==========================================================
/* 2: Functions / Obejects
 * ======================= */

// get a popular youtube video with a keyword, place at 'location' (like jQuery)
  

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
          }
        }
      }
    }

    // return the new word
    return trendName;
  },
  // call twitter push trends into trend array
  twitter: function() {
    $.ajax({

      // call our get_tweets php file
      url: 'get_tweets.php',
      type: 'GET',

      // on success, save all latest trends to the global trend arr
      success: function(response) {

        // shortcut for trends in api
        var latestTrends = response[0].trends;

        // go through each trend
        for (var i = 0; i < latestTrends.length; i++){

          // format the name of the current trend
          latestTrends[i].name = interface.formatter(latestTrends[i].name);

          // push all of the current trend's data to firebase
          trends.push(latestTrends[i].name);
        }
      },
      // send error message on error
      error: function(errors) {
        console.log(errors);
      }
    })
  },
  // call wikipedia api
  wikipedia: function(wikiUrl) {    
    // The AJAX function uses the URL and Gets the JSON data associated with it. The data then gets stored in the variable called: "wikiData"
    $.ajax({url: wikiUrl,
        jsonp: "callback",
        dataType: 'jsonp',
        data: {
          q: "Get relevant data from twitter trend",
          format: "json"
        },
    }) 
    .done(function(wikiData) {
      // containers for what we'll be grabbing
      var pageid  = "";
      var intro   = "";
      var title   = "";

      // run through each of the pages (there's only one)
      $.each(wikiData.query.pages, function() {

        // if there's a page id, run this information
        if(this.pageid){
          // grab pageid
          pageid = this.pageid;
          var wikiLink = "https://en.wikipedia.org/?curid=" + pageid;

          // grab intro
          intro = this.extract;
          // console.log(intro);
          // grab title
          title = this.title;
          // console.log(title);

          // push to wikiInfo arr
          siteInfo.push({
            title: this.title,
            intro: this.extract,
            link: wikiLink
          })
        }
        else {
          console.log('No wiki'); 
        };
      })
    })
  },
  // youtube api call
  youtube: function(topic, location) {
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
        // get video id
        var videoID = response.items[0].id.videoId;

        // make embed
        var embed = $('<iframe frameborder="0" allowfullscreen></iframe>')
        embed.attr('width', "560") 
             .attr('height', "315" )
             .attr('src', "https://www.youtube.com/embed/" + videoID);
        
        // return the iframe
        return embed;
      },
      error: function(error) {
        console.log("youtubeCatch Error: " + error);
      }
    })
  },

  // api method: call twitter API for Trends, save it to firebase
  api: function() {
    // first check if time has been updated
    trendRef.once("value", function(snapshot){
      // catch the timestamp of the last update
      if (snapshot.child("timeAdded").exists()) {
        var time_record = snapshot.child("twitter").val().timeAdded;
        // catch the current timestamp
        var time_now = Date.now();
        // figure out the dif between the recorded time and now
        var time_dif = time_now - time_record;
      }
      if (time_dif >= 300000 || !snapshot.child("timeAdded").exists()) {
        // then make ajax calls
        interface.twitter().then(function(){
          // for each trend, do the siteInfo 
          for (var i = 0; i < trends.length || 10 < siteInfo.length; i++) {
            interface.wikipedia(trends[i]);
          }
        }).then(function() {
          for (var i = 0; i < siteInfo.length; i++) {
            siteInfo[i].video = interface.youtube(wikiInfo[i].title);
          }
        }).then(function() {
          console.log(all done);
          console.log(siteInfo);
        }); 
      }
      // if updated within 5 mins, tell us how many mins we have left for new data
      else {
        var minutes = Math.ceil(5 - (time_dif / 60000));
        console.log("already updated. Wait " + minutes + " mins for a new updates");
      }
    })
  },
}

// METHODS
// ==========================================================
	
	// On Ready for API calls
$(document).ready(interface.api());
