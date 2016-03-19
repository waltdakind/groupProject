// SETUP VARIABLES
// ==========================================================

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


// This runQuery function expects two parameters (the number of articles to show and the final URL to download data from)
var runQuery = function(wikiUrl) {
	// logging the URL 
	console.log(wikiUrl);
	
	// The AJAX function uses the URL and Gets the JSON data associated with it. The data then gets stored in the variable called: "wikiData"
	$.ajax({url: wikiUrl,
      jsonp: "callback",
			dataType: 'jsonp',
      data: {
        q: "Get relevant data from twitter trend",
        format: "json"
      },
      success: function (response) {
        console.log(response);
      }
		}) 
		.done(function(wikiData) {
			// containers for what we'll be grabbing
      var pageid 	= "";
      var intro 	= "";
      var title 	= "";

      // run through each of the pages (there's only one)
      $.each(wikiData.query.pages, function() {

        // if there's a page id, run this information
        if(this.pageid){
          // grab pageid
          pageid = this.pageid;
          var wikiLink = "https://en.wikipedia.org/?curid=" + pageid;

          // grab intro
          intro = this.extract;
       //   console.log(intro);
          // grab title
          title = this.title;
        //  console.log(title);

          // push to firebase
          wikiBaseRef.push({
  	title: this.title,
  	intro: this.extract,
  	link: wikiLink
	})
          $('#wikiSpot').prepend('<a href ="' + wikiLink + '">' + title + '</a> <p>' + intro + '</p>');
		}
		else {
		  console.log('No wiki');	
		};
	})
 })
}
 // var pushData = function(wikiData){(
	
 // })

// METHODS
// ==========================================================
	
	// On Click button associated with the Search Button
$(document).ready(function(){
    $("#wikiSubmit").click(function(){
        // Search Term
		var wikiSearch = $('#wikiSearch').val().trim();
		var wikiUrl = encodeURI(wikiUrlBase + wikiSearch);

		//  pass the final wikiUrl 
		runQuery(wikiUrl);

trendRef.once("value", function(snapshot) {
  // loop through and get all keys for twitter trends
  snapshot.forEach(function(childSnapshot) {
    // key value 0, 1, 2, ...
    	var key = childSnapshot.key();
		console.log(key); 
    // trend is name key value in firebase
		var trend = childSnapshot.val();
 		console.log(trend.name);  
 		wikiSearch = trend.name;
 		wikiUrl = encodeURI(wikiUrlBase + wikiSearch);
 		var keyRef = trendRef.child(key);
 		keyRef.push({
  		link: wikiUrl
	})
 				//  pass the final wikiUrl 
		runQuery(wikiUrl);
  });
});
    $("#clearAll").click(function(){
        $("#wikiSpot").empty();
    });
     return false;   
    });
});


   // title: wikipedia title,
   // intro: wikipedia intro,
   // link: wikipedia link,