import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './bar.html';

Installations = new Mongo.Collection('installations');
Groupes = new Mongo.Collection("groupes");

Router.configure({
	layoutTemplate: 'layout',
});

Router.route('/', {
	template : 'bar',
});

Router.route('/groupes', {
	template : 'groupe',
});

Router.route('/installations', {
	template : 'installations',
});

Resas = new Mongo.Collection('resas');

accountsUIBootstrap3.setLanguage('fr');

Template.layout.helpers({
	getPage: function() {
		if (!Router.current().route.getName()) {
			return 'home';
		}
		return Router.current().route.getName();
	}
});


Template.bar.onCreated(function barOnCreated() {
	this.moment = moment();
	this.date = new ReactiveVar(this.moment.format('dddd, D MMM YYYY'));	
	this.minRange = this.moment.clone().startOf('day').toDate();
	this.maxRange = this.moment.clone().endOf('day').toDate();	
	// Mode can be day, week or month
	this.mode = new ReactiveVar('day');
	this.name = new ReactiveVar('Grand Gymnase');

	this.dateRange = new ReactiveVar(this.moment.clone().startOf('day').format('L'));

	this.refresh = function() {
		if (moment().isSame(this.moment, 'day')) {
			$('#today').addClass("active");	
		}
		else {
			$('#today').removeClass("active");
		}

		switch (this.mode.get()) {
			case 'day':
				this.date.set(this.moment.format('dddd, D MMM YYYY'));
				this.dateRange.set(this.moment.clone().startOf('day').format('L'));
				this.minRange = this.moment.clone().startOf('day').toDate();
				this.maxRange = this.moment.clone().endOf('day').toDate();	
			break;
			case 'week':
				var begin = this.moment.clone().startOf('week').format('D MMM');
				var end = this.moment.clone().endOf('week').format('D MMM YYYY');
				this.date.set(begin + ' - ' + end);
				var dates = [];
				for (var i = 0; i < 7; i++) {
					dates.push({
						timeString : this.moment.clone().startOf('week').add(i, 'days').format('ddd D/M'),
						day : this.moment.clone().startOf('week').add(i, 'days').format('L'),
					});
				}
				this.dateRange.set(dates);
				this.minRange = new moment(dates[0].day, 'DD/MM/YYYY').startOf('day').toDate();
				this.maxRange = new moment(dates[dates.length - 1].day, 'DD/MM/YYYY').endOf('day').toDate();
			break;
			case 'month':
				this.date.set(this.moment.format('MMMM YYYY'));
				var begin = this.moment.clone().startOf('month').startOf('week');
				var end = this.moment.clone().endOf('month').endOf('week');
				var month = moment.range(begin, end);
				var dates = [];
				var final = [];	
				// Iterate month by days.
				month.by('days', function(moment) {
					var date = {
						date : moment.format('L'),
						day : moment.format("D"),
					};
					dates.push(date);
				});
				// Structure days into multidim array per week
				while (dates.length > 0) {
					final.push(dates.splice(0,7));
				}
				this.dateRange.set(final);
				this.minRange = new moment(final[0][0].date, 'DD/MM/YYYY').startOf('day').toDate();
				this.maxRange = new moment(final[final.length - 1][6].date, 'DD/MM/YYYY').endOf('day').toDate();
		}
	};
});

Template.registerHelper('loopCount', function(count) {
	var countArr = [];
	var end;
	for (var i=0; i<count; i++){
		end = false;
		if (i + 1 == count) {
			end = true;
		}
		countArr.push({index : i + 1, end : (end ? "end" : false)});
	}
	return countArr;
});

Template.registerHelper('equals', function(a, b) {
	return a === b;
});

Template.bar.helpers({
	list: function() {
		return Installations.find({}, {sort : {name : 1}});
	},
	modeData: function() {
		var T = Template.instance();
		var list = Installations.find({name : T.name.get()});
		var installation = list.fetch();
		return {
			installation : installation[0],
			dateRange : T.dateRange.get(),
			hours : [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23],
			minRange : T.minRange,
			maxRange : T.maxRange,
			mode : T.mode.get(),
		};
	},
	showDate: function() {
		return Template.instance().date.get();
	},
});

Template.bar.events({
  'click #type li a': function(event, instance) {
    $(event.target).parent().siblings().removeClass('active');
    $(event.target).parent().addClass('active');
		var index = $(event.target).parent().index();
		var T = Template.instance();
		T.mode.set($(event.target).parent().attr('id'));
		T.refresh();
	},
	'change #installations': function(evt) {
		var name = $(evt.target).val();
		var T = Template.instance();
		T.name.set(name);
	},
	'click button#next' : function(evt) {
		var T = Template.instance();
		T.moment.add(1, T.mode.get());
		T.refresh();
	},
	'click button#previous' : function(evt) {
		var T = Template.instance();
		T.moment.add(-1, T.mode.get());
		T.refresh();	
	},
	'click #today' : function(evt) {
		var T = Template.instance();
		T.moment = moment();
		T.mode.set('day');
		$('#type li').removeClass('active');
		$('#day').addClass('active');
		T.refresh();
	},
	'click .toDay' : function(evt) {
		var T = Template.instance();
		T.moment = new moment($(evt.target).parent().attr('rel'), 'DD/MM/YYYY');
		T.mode.set('day');
		$('#type li').removeClass('active');
		$('#day').addClass('active');
		T.refresh();
	},
});

Template.grid.onCreated(function() {
	this.isPressed = false;
	this.startTD = false;
	this.endTD = false;
	this.mode =  function() {
		return this.data.mode;
	};
	this.getResas = function(date) {
		// For month there is a different range date for each days...
		if (date) {
			var m = new moment(date, 'DD/MM/YYYY');
			var min = m.clone().startOf('day').toDate();
			var max = m.clone().endOf('day').toDate();
		}
		var find = Resas.find({
			"start" : {
				"$gte" : min ? min : this.data.minRange,
			},
			"end" : {
				"$lte" : max ? max : this.data.maxRange,
			},
			"install" : this.data.installation ? this.data.installation.name : 'Grand Gymnase',
		});
		return find;
	};
});

Template.grid.helpers({	
	resas : function(date) {
		var T = Template.instance();
		return T.getResas(date);
	},
	resaData : function() {
		var T = Template.instance();
		this.mode = T.mode();
		return this;
	},

});

Template.grid.events({
	'mousedown td[col]' : function(evt) {
		evt.preventDefault();
		var T = Template.instance();
		T.startTD = $(evt.target);
		T.endTD = $(evt.target);
		if (Meteor.user()) {
			T.isPressed = true;
			$("#resa-temp").css({
				left : T.startTD.offset().left,
				top : T.startTD.offset().top,
				width : T.startTD.width(), 
				height : T.startTD.height(),
				'line-height' : T.startTD.height() + 'px',
				'pointer-events' : 'none',
			}).removeClass('hidden');
		}
	},
	'mousemove' : function(evt) {
		evt.preventDefault();
		var T = Template.instance();
		var target = $(evt.target);
		if (T.isPressed && target.attr('col') > 0) {
			if ((target.attr('col') >= T.startTD.attr('col')) && (target.attr('day') === T.startTD.attr('day')) ) {
				T.endTD = target; 
				$("#resa-temp").css({
					left : T.startTD.offset().left,
					top :  T.startTD.offset().top,
					width : T.endTD.offset().left - T.startTD.offset().left + T.endTD.width(),
					height : T.endTD.offset().top - T.startTD.offset().top + T.endTD.height(),
					'line-height' :T.endTD.offset().top - T.startTD.offset().top + T.endTD.height() + 'px',
				});
			}
		}
	},
	'mouseup' : function(evt) {
		var T = Template.instance();
		if (T.isPressed) {
			var start = new moment(T.startTD.attr('day') + ' ' + T.startTD.attr('hours'), 'DD/MM/YYYY H:mm').format();
			var end = new moment(T.endTD.attr('day') + ' ' + T.endTD.attr('hours'), 'DD/MM/YYYY H:mm').add('30', 'minutes').format();
			var data = {
				colStart : T.startTD.attr('col'),
				colEnd : T.endTD.attr('col'),
				end : end,
				groups : Groupes.find({}, {name : 1}),
				install : $('table').attr('install'),
				start : start
			};
			Modal.show('resaForm', data);
			$("#resa-temp").addClass('hidden');
		}
		T.isPressed = false;
	}
});

Template.resa.helpers({
	rangeHours : function() {
		if (this.mode == 'month') {
			return new moment(new Date(this.start)).format('HH:mm') + '-' + new moment(new Date(this.end)).format('HH:mm');
		}
	}
});

Template.resa.onRendered(function resaOnRendered() {
	if (!Meteor.user()) {
		$(".resa").addClass('unclickable');
	}

	if(this.data.mode !== 'month') {
		var day = new moment(this.data.start).format('L');
		var start = $("td[day='" + day + "'][col='"+ this.data.colStart +"'][hours='" + moment(this.data.start).format('H:mm') + "']");
		var end = $("td[day='" + day + "'][col='"+ this.data.colEnd +"'][hours='" + moment(this.data.end).format('H:mm') + "']");
		$("div #resa-" + this.data._id).css({
			top : start.offset().top,
			left : start.offset().left,
			width : end.offset().left - start.offset().left + end.width() + 3,
			height : end.offset().top - start.offset().top,
			'line-height' : end.offset().top - start.offset().top + 'px',
		});
		$("#resa-" + this.data._id).removeClass('hidden');
	}
	else {
		$("#resa-" + this.data._id).removeClass('hidden');
	}
});

Template.resaForm.onRendered(function onResaFormRendered() {
	var T = Template.instance().data;
	if(T.recurrence == 'false') {
		$('#fieldEndRec').hide();
	}

	$('#recurrence').on('change', function(e) {
		if(this.value  == 'false') {
			$('#fieldEndRec').fadeOut();
		}
		else {
			$('#fieldEndRec').fadeIn();
		}
	});
	
	$('.picker').datetimepicker({
		minDate : T.endRec ? T.endRec : T.end,
	});
});

Template.resaForm.events({
	'submit form' : function(evt) {
		evt.preventDefault();
		if (evt.target.recurrence && evt.target.endRec && !evt.target.endRec.value) {
			$('#fieldEndRec').addClass('has-error');
			return;
		}

		var resa = {
			colEnd : evt.target.colEnd.value,
			colStart : evt.target.colStart.value,
			end : new Date(evt.target.end.value),
			group : evt.target.groups.value,
			start : new Date(evt.target.start.value),
			install : evt.target.install.value,
			recurrence : evt.target.recurrence ? evt.target.recurrence.value : 'false',
			endRec : evt.target.endRec ? new moment(evt.target.endRec.value, 'DD/MM/YYYY HH:mm').toDate() : null,
		};
		
		if (evt.target.id.value) {
			Resas.update({
				'_id' : evt.target.id.value
			},
			{
				'$set' : {
					endRec : resa.endRec,
					group : resa.group,
					recurrence : resa.recurrence,
					serie : evt.target.id.value,
				},
			});
	
			// Save multiple event in case of recurrence.
			if (evt.target.recurrence.value !== 'false') {
				var start = new moment(new Date(evt.target.start.value));
				var end = new moment(evt.target.endRec.value, 'DD/MM/YYYY HH:mm');
				while (start.add(1, evt.target.recurrence.value).isBefore(end)) {
					resa.start = new moment(new Date(resa.start)).add(1, evt.target.recurrence.value).toDate();
					resa.end = new moment(new Date(resa.end)).add(1, evt.target.recurrence.value).toDate();
					resa.serie = evt.target.id.value;
					Resas.insert(resa);
				}
			}
		}
		else {
			Resas.insert(resa);
		}
		Modal.hide();
	},
	'click #deleteResa' : function(evt) {
		var id = $(evt.target).attr('rel');
		Resas.remove({'_id' : id});
	},
	'click #deleteGroupResa' : function(evt) {
		var serie = $(evt.target).attr('rel');
		Meteor.call('resas.removeBySerie', serie);
	},
});

Template.resaForm.helpers({
	selected : function() {
		if (this.name == Template.instance().data.group) {
			return "selected";
		}
	},
	recSelected : function(value) {
		if (value == Template.instance().data.recurrence) {
			return "selected";
		}
	},
});

Template.resa.onRendered(function onResaRendered() {
	var data = Template.instance().data;
	var groupe = Groupes.find({name : data.group}).fetch();
	var color = groupe[0].color;
	console.log(color);
	$("#resa-" + data._id).css({
		background : "repeating-linear-gradient(45deg," + color + "," + color + " 10px," + shadeColor(color, -0.2) + " 10px," + shadeColor(color, -0.2) + " 20px)",
	});
});

function shadeColor(color, percent) {   
	var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
	return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

Template.resa.events({
	'click' : function(evt) {
		if (Meteor.user()) {
			var T = Template.instance();
			T.data.groups = Groupes.find({}),
			Modal.show('resaForm', T.data);
		}
	}
});
