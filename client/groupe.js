Template.groupe.helpers({
	list : function () {
		return Groupes.find({}, {sort: {name: 1}});
	},
});

Template.groupe.onRendered(function groupOnRendered() {
	$('#cp2').colorpicker();
});

Template.listGroup.helpers({
	count : function(name) {
		return Resas.find({group : name}).count();
	},
});

Template.listGroup.onRendered(function groupListOnRendered() {
	var id = Template.instance().data._id;
	$('#cp-' + id).colorpicker().on('hidePicker', function(e) {
		var color = $(this).parent().find('input').val();
		Groupes.update(
			{
				'_id' : id,
			},
			{
				'$set' : {
					color : color,
				},
			}
		);
	});
});

Template.listGroup.events({
	'click .trash' : function(evt) {
		var id = $(evt.target).attr('rel');
		Groupes.remove({
			_id : id,
		});
	},
});

Template.groupe.events({
	'submit form' : function(evt) {
		evt.preventDefault();
		var groupe = {
			name : evt.target.name.value,
			color : evt.target.color.value,
		};	
		Groupes.insert(groupe);
		$('form').find("input,textarea,select").val('');
	}
});
