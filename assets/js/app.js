// SETUP VARIABLES
// ==========================================================

// arrays and objects for saving info
var trends = [];
var siteInfo = [];
var appendages = [];

// firebase objects
var dateRef = new Firebase("https://uncommitteds.firebaseio.com/timeAdded");
var appendageRef = new Firebase("https://uncommitteds.firebaseio.com/appendages");

// URL  to query wikipedia
var wikiUrlBase = "https://en.wikipedia.org/w/api.php?format=json&action=query&&redirects&prop=extracts|pageimages&exintro=&explaintext=&titles=";

// counters for carDisplay function
var currentCar = 0;

// ==========================================================
/* 2: Functions / Objects
 * ======================= */  

function carDisplay(iteration) {
  
  var addRow = false;
  // test if we need to add a row to the carousel
  console.log(iteration);
  if (iteration % 3 === 0 || iteration === 0) {
    addRow = true;
  }
  console.log(addRow);
  // test for the current car row
  currentRow = Math.floor(iteration/3);

  // if we need to add a row and indicator, do it now 
  if (addRow) {
    console.log('ok');
    // first make the row
    var row = $('<div>').addClass("c" + currentRow)
              .addClass('row-fluid')
              .addClass('item');

    // if its the first row, add the active class
    if (currentRow === 0) {
      row.addClass('active');
    }

    // append it to the main car div
    $('.carousel-inner').append(row);

    // now construct the indicator
    var indicator = $('<li>').attr('data-target', '#myCarousel')
                    .attr('data-slide-to' + currentRow);

    // and add it to the carousel
    $('.carousel-indicators').append(indicator);
  }

  // Now for inside the row: make the car image
  var img = $('<img>').attr("data-appendage", (iteration))
            .addClass("car-image").addClass("img-responsive").addClass("center-block")
            .attr("alt", appendages[iteration].title)
            .attr("src", appendages[iteration].imageURL);

  // make the car title
  var theTitle = $('<h3>').text(appendages[iteration].title)
                  .addClass("car-title");

  // make the car div
  var theDiv = $('<div>').addClass("col-xs-4");

  // append the image and title to the new div
  theDiv.append(img, theTitle);

  // father the current row with the latest div 
  $("div.c" + currentRow).append(theDiv);
}

function pageDisplay(iteration) {
  // save the info from this iteration in the appendages array
  var title = appendages[iteration].title;
  var intro = appendages[iteration].intro;
  var link = appendages[iteration].link;
  var video = decodeURI(appendages[iteration].video);

  // format the info
  var titleText = $('<h4>').text(title);
  var introText = $('<p>').text(intro);
  var wikiLink = $('<a>').text("Click here for more info")
                  .attr('target', '_blank')
                  .attr('href', link);
  var videoDiv = $('<div>').append(video)
                  .addClass("embed-container");

  // append it all to the proper divs
  $('#wikiSpot').empty().append(titleText, introText, wikiLink);
  $('#videoSpot').empty().append(videoDiv);

}

// what we do after a succesful AJAX call to wiki
function wikiEach(wikiData, iterator, user) {
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

      // only do this if there's a page image
      if (this.pageimage) {
        console.log("there's a pageimage!");
        // grab image name
        imageFile = this.pageimage;

        // save the url for the thumbnail
        thumbURL = this.thumbnail.source;

        // with regex, grab the en or commons portion of the full url
        var enOrCommon = thumbURL.match(/wikipedia\/(.*?)(\/|$)/)[1];

        // with regex, grab the portion of the thumbnail we need to construct the full image url
        var fullPortion = thumbURL.match(/thumb\/(.*?)(....|$)/)[2];

        // concatenate the right vars for the full-res image src
        var fullURL = "https://upload.wikimedia.org/wikipedia/"+ enOrCommon + "/" +
                      fullPortion + "/" + imageFile;
      } 
      // if we caught everything we needed, push it to the siteInfo arr
      if (title && intro && wikiLink && fullURL) {
        siteInfo[iterator] = {
          title: title,
          intro: intro,
          link: wikiLink,
          imageURL: fullURL
        }
      } 
      //otherwise, if this was a user-submitted trend, let them know Wiki didn't turn up enough info
      if(user) {
        console.log("Yep");
        // no title or link?
        if (!title || !link) {
          $('#trend-errors').html('<p>Sorry, your trend didn\'t turn up on Wikipedia.</p>')
        }
        // no intro?
        else if (!intro){
          $('#trend-errors').html('<p>Sorry, Wikipedia did not have enough written about your trend to display on the site.</p>')
        } // no image?
        else if (!fullURL){
          $('#trend-errors').html('<p>Sorry, we couldn\'t find an image from Wikipedia to display for your trend</p>')
        }
      }
    }
    // if there's no page id and it's a user submitted trend, display an error
    else if (user) {
      $('#trend-errors').html('<p>Sorry, your trend didn\'t turn up on Wikipedia</p>');
    }
  })
}

function userTrend(trend, iterator) {
  // trim the trend
  var theTrend = trend.trim();

  // call wikipedia api
  var wikiUrl = wikiUrlBase + theTrend;
  $.ajax({url: wikiUrl,
    jsonp: "callback",
    dataType: 'jsonp',
    data: {
      q: "Get relevant data from twitter trend",
      format: "json"
    },
    // on success, save the wiki info 
    success: function(wikiData) {
      wikiEach(wikiData, iterator, true);
    },
    // display error if wikipedia has an AJAX issue
    error: function(errors) {
      $('#trend-errors').html('<p>Sorry, TrendGetter got an error when accessing the Wikipedia API.</p>')
    }
  // when ajax call finishes, do youtube
  }).done(function() {
    console.log(siteInfo);
    // if there's no site, don't move forward
    if (siteInfo[iterator] != undefined) {
      // otherwise call our youtube function, which will add it to the local array
      interface.youtube(siteInfo[iterator].title, iterator, false);
    }
  })
}



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
          console.log(latestTrends[i].name);
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
        wikiEach(wikiData, iterator, false)
      }
    // jQuery promise calls youtube to get a video for the wiki entry
    }).done(function() {

      // if there's no site, don't move forward
      if (siteInfo[iterator] != undefined) {
        // otherwise call our youtube function, with saveToFb (third param) set to true
        interface.youtube(siteInfo[iterator].title, iterator, true);
      }
    })
  },

  // youtube api call
  youtube: function(topic, iterator, saveToFb) {
    topic = encodeURI(topic);
    // base youtube URL
    var youtube_url = "https://www.googleapis.com/youtube/v3/" +
                      "search?part=snippet&maxResults=1&type=video" +
                      "&order=relevance&videoEmbeddable=true&videoSyndicated=true" +
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
      // first push to firebase if video for iteration of siteInfo exists, and if saveToFb is true
      if (siteInfo[iterator].video && saveToFb) {
        appendageRef.push(siteInfo[iterator]);
      }
      // then push to our local array if iteration of siteInfo exists
      if (siteInfo[iterator].video) {
        appendages.push(siteInfo[iterator]);
        // then append info from local array into the carousel
        carDisplay(appendages.length - 1);
      }
      // else if saveToFb is false (and thus user submitted) display an error
      else {
        if (!saveToFb) {
          $('#trend-errors').html('<p>Sorry, your trend didn\'t turn up on Youtube</p>')
        }
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
        // let the console know how long to wait for next update
        var minutes = Math.ceil(5 - (time_dif / 60000));
        console.log("already updated. Wait " + minutes + " mins for a new updates");

        // grab appendages info from firebase
        appendageRef.once("value", function(snapshot){
          snapshot.forEach(function(childSnapshot) {
            appendages.push(childSnapshot.val());
          })
          for (var i = 0; i < appendages.length; i++) {
            carDisplay(i);
          }
        })
      }
    })
  }
}

//CALLS
// ==========================================================
	
// make the API call on doc ready
$(document).ready(interface.api());

// make it so that images populate the div on click
$(document).on("click", ".car-image", function() {
  var iteration = $(this).attr("data-appendage");
  pageDisplay(iteration);
})

$(document).on('click', '#trend-button', function() {
  // get user input
  var thisTrend = $('#trend-input').val().trim();
  // clear the input field
  $('#trend-input').val('');
  console.log(siteInfo.length);
  // run the userTrend function to add it to the local carousel
  userTrend(thisTrend, (siteInfo.length));
  // stop the page from refreshing on button click
  return false;
})
