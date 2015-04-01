// user.js
// User model logic.

var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(
	process.env['NEO4J_URL'] ||
	process.env['GRAPHENEDB_URL'] ||
	'http://localhost:7474'
);
var bcrypt   = require('bcrypt-nodejs');

// private constructor:
var User = module.exports = function User(_node) {
	// all we'll really store is the node; the rest of our properties will be
	// derivable or just pass-through properties (see below).
	this._node = _node;
}

// static methods:
User.get = function (id, callback) {
	var qp = {
		query: [
			'MATCH (user:User)',
			'WHERE ID(user) = {userId}',
			'RETURN user',
		].join('\n'),
		params: {
			userId: parseInt(id)
		}
	}

	db.cypher(qp, function (err, result) {
		if (err) return callback(err);
		callback(null, result[0]['user']);
	});
};

User.getAll = function (callback) {
	var qp = {
		query: [
			'MATCH (user:User)',
			'RETURN user',
			'LIMIT 100'
		].join('\n')
	}

	db.cypher(qp, function (err, result) {
		if (err) return callback(err);
		console.log(result);
		callback(null, result);
	});
};

User.getBy = function (field, value, callback) {
	var qp = {
		query: [
			'MATCH (user:User)',
			'WHERE ' + field + ' = {value}',
			'RETURN user',
		].join('\n'),
		params: {
			value: value
		}
	}

	db.cypher(qp, function (err, result) {
		if (err) return callback(err);
		if (!result[0]) {
			callback(null, null);
		} else {
			callback(null, result[0]['user']);
		}
	});
}

// creates the user and persists (saves) it to the db, incl. indexing it:
User.create = function (data, callback) {
	var qp = {
		query: [
			'CREATE (user:User {data})',
			'RETURN user',
		].join('\n'),
		params: {
			data: data
		}
	}

	db.cypher(qp, function (err, results) {
		if (err) return callback(err);
		callback(null, results[0]['user']);
	});
};

User.update = function (data, callback) {
	var qp = {
		query: [
			'MATCH (user:User)',
			'WHERE id(user) = {userId}',
			'SET user += {props}',
			'RETURN user',
		].join('\n'),
		params: {
			userId: data.id,
			props: data.props,
		}
	}

	db.cypher(qp, function (err, results) {
		if (err) return callback(err);
		callback(null, results[0]['user']);
	});
}

// generating a hash
User.generateHash = function(password, next) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null, next);
};

// checking if password is valid
User.validPassword = function(password, pass, next) {
	return bcrypt.compareSync(password, pass, next);
};