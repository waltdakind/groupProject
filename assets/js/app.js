// SETUP VARIABLES
// ==========================================================

// arrays and objects for saving info
var trends = [];
var siteInfo = [];
var appendages = [];

var dateRef = new Firebase("https://uncommitteds.firebaseio.com/timeAdded");
var appendageRef = new Firebase("https://uncommitteds.firebaseio.com/appendages");
// user's inputs via HTML
var wikiSearch 	= "";

// URL  to query wikipedia
var wikiUrlBase = "https://en.wikipedia.org/w/api.php?format=json&action=query&&redirects&prop=extracts|pageimages&exintro=&explaintext=&titles=";

// ==========================================================
/* 2: Functions / Obejects
 * ======================= */  

// main interface
var interface = {

  // format any trend names with hashtags and camelCasing
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

  // call twitter and push trends into a global trends array
  twitter: function() {
    // start ajax call
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
    // jquery promise calls wikipedia for each trend
    }).done(function(){
      appendageRef.set("");
      for (var i = 0; i < trends.length || 10 < siteInfo.length; i++) {
        interface.wikipedia(wikiUrlBase + trends[i], i);
      } 
    })
  },
  // call wikipedia api
  wikipedia: function(wikiUrl, iterator) {    
    // The AJAX function uses the URL and Gets the JSON data associated with it. 
    // The data then gets stored in the variable called: "wikiData"
    $.ajax({url: wikiUrl,
        jsonp: "callback",
        dataType: 'jsonp',
        data: {
          q: "Get relevant data from twitter trend",
          format: "json"
        },
      success: function(wikiData) {
        // containers for what we'll be grabbing
        var pageid  = "";
        var intro   = "";
        var title   = "";
        var thumbURL = "";
        var imageFile = "";

        // run through each of the pages (there's only one)
        $.each(wikiData.query.pages, function() {

          // if there's a page id, run this information
          if(this.pageid){
            // grab pageid
            pageid = this.pageid;
            var wikiLink = "https://en.wikipedia.org/?curid=" + pageid;

            // grab intro
            intro = this.extract;

            // grab title
            title = this.title;

            // push to wikiInfo arr
            siteInfo[iterator] = {
              title: title,
              intro: intro,
              link: wikiLink
            };

            // if there's a page image, grab the image info
            if(this.pageimage) {

              // save the image filename
              imageFile = this.pageimage;

              // save the url for the thumbnail
              thumbURL = this.thumbnail.source;

              // with Regex, grab the portion of the thumbnail we need to construct the full image url
              var fullPortion = thumbURL.match(/thumb\/(.*?)(....|$)/)[2];

              // concatenate the right vars for the full-res image src
              var fullURL = "https://upload.wikimedia.org/wikipedia/commons/" +
                            fullPortion + "/" + imageFile;

              // add that to the corresponding siteInfo
              siteInfo[iterator].imageURL = fullURL;
            }
          }
        })
      }
    // jQuery promise calls youtube to get a video for the wiki entry
    }).done(function() {

      // if there's no site, don't move forward
      if (siteInfo[iterator] != undefined) {
        // otherwise call our youtube function
        interface.youtube(siteInfo[iterator].title, iterator);
      }
    })
  },

  // youtube api call
  youtube: function(topic, iterator) {
    topic = encodeURI(topic);
    // base youtube URL
    var youtube_url = "https://www.googleapis.com/youtube/v3/" +
                      "search?part=snippet&maxResults=1&type=video&order=relevance" +
                      "&key=AIzaSyDmDiJaKVpOL729WgW2zpbnpzR_XKKM_Es&q=";
    // add topic to url
    youtube_url += topic;

    // make API call to youtube api
    $.ajax({
      url: youtube_url,
      type: 'GET',
      success: function(response) {        
        // get video id
        var videoID = response.items[0].id.videoId;

        // make the youtube embed
        var embed = $('<iframe frameborder="0" allowfullscreen></iframe>')
        embed.attr('width', "560") 
             .attr('height', "315" )
             .attr('src', "https://www.youtube.com/embed/" + videoID);
        
        // send the iframe to the right part of siteInfo as a string
        siteInfo[iterator].video = embed[0].outerHTML;
      },
      // catch errors
      error: function(error) {
        console.log("youtubeCatch Error: " + error);
      }
    // jQuery promise to push the current element of the siteInfo array to fireBase
    }).done(function(){
      // first push to firebase
      appendageRef.push(siteInfo[iterator]);
      // then push to our local array
      appendages.push(siteInfo[iterator]);
      // then check if it has the image url
      if (appendages[appendages.length - 1].imageURL) {
        var img = $('<img>').addClass("c-img" + (appendages.length - 1))
                  .addClass("carImage").addClass("img-responsive")
                  .attr("alt", appendages[appendages.length - 1].title)
                  .attr("src", appendages[appendages.length - 1].imageURL);

        var theTitle = $('<h3>').text(appendages[appendages.length - 1].title)
                        .addClass("title");
        var theDiv = $('<div>').addClass("col-xs-4");
        theDiv.append(img, theTitle);
        $("div.c" + (appendages.length-1)).append(theDiv);
      }
      // if no image, remove it from the appendages array
      else {
        appendages.splice((appendages.length - 1), 1);
      }
    })
  },

  // api method: call twitter API for Trends, save it to firebase
  api: function() {
    // first check if time has been updated
    dateRef.once("value", function(snapshot){
      // // catch the appendages obj in a global var
      // appendageRef.once("value", function(snapshot){
      //   appendages = snapshot.val();
      // })
      // catch the timestamp of the last update
      if (snapshot.exists()) {
        var time_record = snapshot.val();
        // catch the current timestamp
        var time_now = Date.now();
        // figure out the dif between the recorded time and now
        var time_dif = time_now - time_record;
      }
      if (time_dif >= 300000 || !snapshot.exists()) { 
        // First log the date to firebase
        dateRef.set(Date.now());
        // then make ajax calls. 
        interface.twitter();
      }
      // if updated within 5 mins, console how many mins we have left for new data
      else {
        var minutes = Math.ceil(5 - (time_dif / 60000));
        console.log("already updated. Wait " + minutes + " mins for a new updates");
      }
    })
  }
}

//CALLS
// ==========================================================
	
// make the API call on doc ready
$(document).ready(interface.api());

// make it so that images populate the div on click
