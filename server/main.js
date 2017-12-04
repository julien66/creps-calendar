import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  // code to run on server at startup
	Resas = new Mongo.Collection('resas');
	Resas.allow({
		insert : function(userId, doc) {
			return userId && checkAvailable(doc);
		},
		update : function(userId, docs, fields, modif) {
			return userId;
		},
		remove : function(userId, docs) {
			return userId;
		}
	});

	Meteor.methods({
		'resas.removeBySerie' : function(serie) {
			if (!Meteor.userId()) {
				throw new Meteor.Error('not-authorized');
			}
			
			Resas.remove({'serie' : serie});
		}
	});

	// This function unsure there is no other reservation done for the same : date / col / install.
	function checkAvailable(resa) {
		return !Resas.find({
			start : { '$gte' : resa.start},
			end : { '$lte' : resa.end},
			colStart : { '$gte' : resa.colStart},
			colEnd : { '$lte' : resa.colEnd},
			install : resa.install,
		}).fetch().length > 0;
	}

	Installations = new Mongo.Collection('installations');
	Installations._ensureIndex('name', {unique: 1, sparse:1});

	Installations.allow({
		insert : function(userId, doc) {
			return userId;
		},	
		update : function(userId, docs, fields, modif) {
			return false;
		},
		remove : function(userId, docs) {
			return userId;
		}
	});

	Groupes = new Mongo.Collection("groupes");
	Groupes._ensureIndex('name', {unique: 1, sparse:1});
	
	Groupes.allow({
		insert : function(userId, doc) {
			return userId;
		},	
		update : function(userId, docs, fields, modif) {
			return userId && !_.contains(fields, "name");
		},
		remove : function(userId, docs) {
			return userId;
		}
	});
});
