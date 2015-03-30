// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;

var User = require('../models/user');

// load the auth variables
var configAuth = require('./auth');

// expose this function to our app using module.exports
module.exports = function(passport) {
	// =========================================================================
	// passport session setup ==================================================
	// =========================================================================
	// required for persistent login sessions
	// passport needs ability to serialize and unserialize users out of session

	// used to serialize the user for the session
	passport.serializeUser(function(user, done) {
		done(null, user._id);
	});

	// used to deserialize the user
	passport.deserializeUser(function(id, done) {
		User.get(id, function(err, user) {
			if (err) return next(err);
			done(err, user);
		});
	});

	// =========================================================================
	// LOCAL LOGIN =============================================================
	// =========================================================================
	passport.use('local-login', new LocalStrategy({
		// by default, local strategy uses username and password, we will override with email
		usernameField : 'email',
		passwordField : 'password',
		passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
	},
	function(req, email, password, done) {
		// asynchronous
		process.nextTick(function() {
			User.getBy('user.localEmail', email, function(err, user) {
				// if there are any errors, return the error
				if (err)
					return done(err);

				// if no user is found, return the message
				if (!user)
					return done(null, false, req.flash('loginMessage', 'No user found.'));

				if (!User.validPassword(password, user.properties.localPassword))
					return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

				// all is well, return user
				else
					return done(null, user);
			});
		});
	}));

	// =========================================================================
	// LOCAL SIGNUP ============================================================
	// =========================================================================
	passport.use('local-signup', new LocalStrategy({
		// by default, local strategy uses username and password, we will override with email
		usernameField : 'email',
		passwordField : 'password',
		passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
	},
	function(req, email, password, done) {
		// asynchronous
		process.nextTick(function() {
			//  Whether we're signing up or connecting an account, we'll need
			//  to know if the email address is in use.
			User.getBy('user.localEmail', email, function(err, existingUser) {
				// if there are any errors, return the error
				if (err)
					return done(err);

				// check to see if there's already a user with that email
				if (existingUser) {
					return done(null, false, req.flash('loginMessage', 'That email is already in use.'));
				}

				//  If we're logged in, we're connecting a new local account.
				if(req.user) {
					var update = {};
						update.id = req.user._id;
						update.props = {};
							update.props.localEmail = email;
							update.props.localPassword = User.generateHash(password);
					User.update(update, function(err, user) {
						if (err)
							throw err;
						return done(null, user);
					});
				} else {
					//  We're not logged in, so we're creating a brand new user.
					// create the user
					var newUser = {};
						newUser.localEmail = email;
						newUser.localPassword = User.generateHash(password);
					User.create(newUser, function (err, user) {
						if (err)
							return next(err);
						return done(null, user);
					});
				}
			});
		});
	}));

	// =========================================================================
	// FACEBOOK ================================================================
	// =========================================================================
	passport.use(new FacebookStrategy({
		clientID        : configAuth.facebookAuth.clientID,
		clientSecret    : configAuth.facebookAuth.clientSecret,
		callbackURL     : configAuth.facebookAuth.callbackURL,
		passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
	},
	function(req, token, refreshToken, profile, done) {
		// asynchronous
		process.nextTick(function() {
			// check if the user is already logged in
			if (!req.user) {
				User.getBy('user.facebookId', profile.id, function(err, user) {
					if (err)
						return done(err);

					if (user) {
						// if there is a user id already but no token (user was linked at one point and then removed)
						if (!user.facebookToken) {
							var update = {};
								update.id = user._id;
								update.props = {};
									update.props.facebookToken = token;
									update.props.facebookName  = profile.name.givenName + ' ' + profile.name.familyName;
									update.props.facebookEmail = profile.emails[0].value;
							User.update(update, function(err, user) {
								if (err)
									throw err;
								return done(null, user);
							});
						}

						return done(null, user); // user found, return that user
					} else {
						// if there is no user, create them
						var newUser = {};
							newUser.facebookId    = profile.id;
							newUser.facebookToken = token;
							newUser.facebookName  = profile.name.givenName + ' ' + profile.name.familyName;
							newUser.facebookEmail = profile.emails[0].value;

						User.create(newUser, function (err, user) {
							if (err)
								return next(err);
							return done(null, user);
						});
					}
				});
			} else {
                // user already exists and is logged in, we have to link accounts
                // but check if that facebook is linked already
                User.getBy('user.facebookId', profile.id, function(err, user) {
					if (err)
						return done(err);

					if (user) {
						return done(null, false, req.flash('connectMessage', 'That facebook user is already linked!'));
					} else {
						var updateUser = {};
							updateUser.id = req.user._id;
							updateUser.props = {};
								updateUser.props.facebookId    = profile.id;
								updateUser.props.facebookToken = token;
								updateUser.props.facebookName  = profile.name.givenName + ' ' + profile.name.familyName;
								updateUser.props.facebookEmail = profile.emails[0].value;

						User.update(updateUser, function(err, user) {
							if (err)
								throw err;
							return done(null, user);
						});
					}
				});
			}
		});
	}));

	// =========================================================================
	// TWITTER =================================================================
	// =========================================================================
	passport.use(new TwitterStrategy({
		consumerKey     : configAuth.twitterAuth.consumerKey,
		consumerSecret  : configAuth.twitterAuth.consumerSecret,
		callbackURL     : configAuth.twitterAuth.callbackURL,
		passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
	},
	function(req, token, tokenSecret, profile, done) {
		console.log('twitter req:' + req);
		console.log('req.user: ' + req.user);
		console.log('twitter profile.id: ' + profile.id);
		// asynchronous
		process.nextTick(function() {
			// check if the user is already logged in
			if (!req.user) {
				User.getBy('user.twitterId', profile.id, function(err, user) {
					console.log('twitter user: ' + user);
					if (err)
						return done(err);

					if (user) {
						// if there is a user id already but no token (user was linked at one point and then removed)
						if (!user.twitterToken) {
							var updateUser = {};
								updateUser.id = user._id;
								updateUser.props = {};
									updateUser.props.twitterToken       = token;
									updateUser.props.twitterUsername    = profile.username;
									updateUser.props.twitterDisplayName = profile.displayName;
							User.update(updateUser, function(err, user) {
								if (err)
									throw err;
								return done(null, user);
							});
						}

						return done(null, user); // user found, return that user
					} else {
						// if there is no user, create them
						var newUser = {};
							newUser.twitter.id          = profile.id;
							newUser.twitter.token       = token;
							newUser.twitter.username    = profile.username;
							newUser.twitter.displayName = profile.displayName;

						User.create(newUser, function (err, user) {
							if (err)
								return next(err);
							return done(null, user);
						});
					}
				});
			} else {
				// user already exists and is logged in, we have to link accounts
				// but check if tht twitter is already linked
				User.getBy('user.twitterId', profile.id, function(err, user) {
					if (err)
						return done(err);

					if (user) {
						return done(null, false, req.flash('connectMessage', 'That twitter account is already linked!'));
					} else {
						var updateUser = {};
							updateUser.id = req.user._id;
							updateUser.props = {};
								updateUser.props.twitterId          = profile.id;
								updateUser.props.twitterToken       = token;
								updateUser.props.twitterUsername    = profile.username;
								updateUser.props.twitterDisplayName = profile.displayName;

						User.update(updateUser, function(err, user) {
							if (err)
								throw err;
							return done(null, user);
						});
					}
				});
			}
		});
	}));
};