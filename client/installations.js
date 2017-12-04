Template.installations.helpers({
	list : function () {
		return Installations.find({}, {sort: {name: 1}});
	},
	count : function(name) {
		return Resas.find({install : name}).count();
	}
});

Template.installations.events({
	'submit form' : function(evt) {
		evt.preventDefault();
		var installation = {
			name : evt.target.name.value,
			col : evt.target.col.value,
		};
		
		Installations.insert(installation);
		$('form').find("input,textarea,select").val('');
	},
	'click .trash' : function(evt) {
		var id = $(evt.target).attr('rel');
		Installations.remove({
			_id : id,
		});
	}
});
