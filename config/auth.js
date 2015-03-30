// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

	'facebookAuth' : {
		'clientID' 		: '', // your App ID
		'clientSecret' 	: '', // your App Secret
		'callbackURL' 	: 'http://localhost:3000/auth/facebook/callback'
	},

	'twitterAuth' : {
		'consumerKey' 		: '',
		'consumerSecret' 	: '',
		'callbackURL' 		: 'http://localhost:3000/auth/twitter/callback'
	}

};