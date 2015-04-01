// users.js
// Routes to CRUD users.

var User = require('../models/user');

module.exports = function(app, passport) {

	app.get('/users', function(req, res) {
		User.getAll(function (err, users) {
			if (err) return next(err);
			res.render('pages/users', {
				users: users
			});
		});
	});

};