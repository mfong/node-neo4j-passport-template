// users.js
// Routes to CRUD users.

var User = require('../models/user');

module.exports = function(app, passport) {

	app.get('/users', function (req, res) {
		User.getAll(function (err, users) {
			if (err) return next(err);
			res.render('pages/users', {
				users: users
			});
		});
	});

	app.get('/user/:username', function (req, res) {
		User.getBy('user.username', req.params.username, function (err, user) {
			if (err) return next(err);
			User.getUserRelationships(user._id, function (err, relationships) {
				if (err) return next(err);

				res.render('pages/user', {
					u: req.user,
					user: user,
					relationships: relationships
				});
			});
		});
	});

	app.post('/user/:username/:relation', function (req, res) {
		if (!req.user) {
			res.status(401).body({redirectTo: '/login'});
		}

		User.getBy('user.username', req.params.username, function (err, user) {
			if (err) return next(err);

			User.addUserRelationship(req.params.relation, req.user._id, user._id, function (err, huh) {
				res.status(201).json({status: 'success'});
			})
		});



	});

};