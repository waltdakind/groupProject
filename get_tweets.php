<?php
// code from https://github.com/andyfitch/twitter-proxy


require_once('twitter_proxy.php');

// Twitter OAuth Config options
$oauth_access_token = '309792138-MCuIbvttkOhZIJl0VwGY31SvfmvB70ljyHW4gJ3d';
$oauth_access_token_secret = 'yXQQZLRLFFH4tcANRiXD0wcrlSAV4tJB9obtFaet0VXKi';
$consumer_key = '3XDKFbqEJtM2m03myki998wTH';
$consumer_secret = 'CBgxlKx08piTzW3D1aThWlVE0agoXyLDtIOk2F94stYkOEj8zC';
$woe_id = 23424977;

$twitter_url = 'trends/place.json';
$twitter_url .= '?id=' . $woe_id;
// $twitter_url .= '&screen_name=' . $screen_name;
// $twitter_url .= '&count=' . $count;

// Create a Twitter Proxy object from our twitter_proxy.php class
$twitter_proxy = new TwitterProxy(
	$oauth_access_token,			// 'Access token' on https://apps.twitter.com
	$oauth_access_token_secret,		// 'Access token secret' on https://apps.twitter.com
	$consumer_key,					// 'API key' on https://apps.twitter.com
	$consumer_secret,				// 'API secret' on https://apps.twitter.com
	$user_id,						// User id (http://gettwitterid.com/)
	$woe_id,					// Location (1 = world)
	$count							// The number of tweets to pull out
);

// Invoke the get method to retrieve results via a cURL request
$tweets = $twitter_proxy->get($twitter_url);

echo $tweets;

?>