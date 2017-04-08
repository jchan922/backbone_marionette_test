// Initializea new Backbone.Marionette Application
var MyApp = new Backbone.Marionette.Application();

MyApp.addRegions({
	mainRegion: "#cat_table"							// refers to CSS id on index.html
														// this region will display our content
})

// Model (of one Cat)
var AngryCat = Backbone.Model.extend({
	defaults: {
		votes: 0
	},

	addVote: function() {
		this.set('votes', this.get('votes') + 1);
	},

	rankUp: function() {
		this.set({ rank: this.get('rank') - 1});
	},
	rankDown: function() {
		this.set({ rank: this.get('rank') + 1});
	},
});

// Collection (of all Cat Models)
var AngryCats = Backbone.Collection.extend({
	model: AngryCat,										// collections need to know what kind of model it contains

	initialize: function(cats){
		var rank = 1;
		var self = this;

		_.each(cats, function(cat) {
			cat.set('rank', rank);
			++rank;
		});

		this.on('add', function(cat){
		  if( ! cat.get('rank') ) {
		    var error =  Error('Cat must have a rank defined before being added to the collection');
		    error.name = 'NoRankError';
		    throw error;
		  }
		});

		MyApp.on("rank:up", function(cat){					// runs when user clicks on up button
			if (cat.get('rank') === 1) {
				return true;
			}
			self.rankUp(cat);
			self.sort();
			self.trigger('reset');
			console.log("rank up");
		});

		MyApp.on("rank:down", function(cat){				// runs when user clicks on down button
			self.rankDown(cat);
			self.sort();
			self.trigger('reset');
			console.log("rank down");
		});

		MyApp.on("cat:disqualify", function(cat){
			var disqualifiedRank = cat.get("rank");
			var catsToUprank = self.filter(
				function(cat){
					return cat.get('rank') > disqualifiedRank;
				}
			);
			console.log(disqualifiedRank);
			console.log(catsToUprank);
			catsToUprank.forEach(function(cat){
				cat.rankUp();
			});
			self.trigger('reset');
		});

	},

	comparator: function(cat) {
		console.log(cat);
		return cat.get("rank");
	},

	rankUp: function(cat) {
		// find cat we need to swap ranks with
		var rankToSwap = cat.get('rank') - 1;
		var otherCat = this.at(rankToSwap - 1);

		// swap ranks
		cat.rankUp();
		otherCat.rankDown();
	},

	rankDown: function(cat) {
		// find cat we need to swap ranks with
		var rankToSwap = cat.get('rank') + 1;
		var otherCat = this.at(rankToSwap - 1);

		// swap ranks
		cat.rankDown();
		otherCat.rankUp();
	},

});

/////////////////////////////////////////////////////////////////////////////
// Backbone.Marionette.ItemView - "a view that represents a single item."
// *** Marionette automatically calls render() and creates DOM element on parent CompositeView ***

var AngryCatView = Backbone.Marionette.ItemView.extend({
	template: "#angry_cat-template",					// id of script on index.html we want
	tagName: "tr",										// refers to the tag selected element
	className: "angry_cat",								// class that gets added on new tr creation

	events: {											// events are the click handlers for each up/down on a row
		"click .rank_up img": "rankUp",					// rankUp is the method below
		"click .rank_down img": "rankDown",				// rankDown is the method below
		"click a.disqualify": "disqualify"
	},

	initialize: function() {
		this.bindTo(this.model, 'change:votes', this.render);		// binds to model's "change:votes" event, run render when votes change
	},

	disqualify: function() {							// triggers "cat:disqualify" on AngryCats Collection
		MyApp.trigger("cat:disqualify", this.model);
		this.model.destroy();
	},

	rankUp: function(){									// rankUp method
		this.model.addVote();
		MyApp.trigger("rank:up", this.model);			// on click, trigger "rank:up" on AngryCats Collection
		console.log("ItemView clicked");
	},

	rankDown: function(){								// rankDown method
		this.model.addVote();
		MyApp.trigger("rank:down", this.model);			// on click, trigger "rank:down" on AngryCats Collection
		console.log("ItemView clicked");
	},

});
/////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////////////////
// Backbone.Marionette.CollectionView - wraps items in a <div> upon render
// *** Not what we want to use in this example ***
/////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////
// Backbone.Marionette.CompositeView - like Marionette.CollectionView but allows us to have surrounding HTML (ex. tables)

var AngryCatsView = Backbone.Marionette.CompositeView.extend({
	tagname: "table",									// regers to the tag of selected element
	id: "angry_cats",									// id that gets added on CompositeView render
	className: "table-striped table-bordered",			// class(s) that gets added on CompositeView render
	template: "#angry_cats-template",					// id of script on index.html we want
	itemView: AngryCatView,								// children views to render

	// initialize: function(){								// method that rerenders table on sort event
	// 	this.listenTo(this.collection, "sort", this.renderCollection);
	// },

	appendHtml: function(collectionView, itemView){		// method that adds itemView.el to tbody element selector
		collectionView.$("tbody").append(itemView.el);
	}

})

/////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////
// Initializer - runs initial state on app start

MyApp.addInitializer(function(options){
	console.log(options);
	var angryCatsView = new AngryCatsView({
		collection: options.cats
	});
	MyApp.mainRegion.show(angryCatsView);
});
/////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////
// Start the Application - launch once DOM is ready

$(document).ready(function(){
	var cats = new AngryCats([
		new AngryCat( { name: "Wet Cat", image_path: "assets/images/cat1.jpg" }),
		new AngryCat( { name: "Bitey Cat", image_path: "assets/images/cat2.jpg" }),
		new AngryCat( { name: "Surprised Cat", image_path: "assets/images/cat3.jpg" }),
	]);

	var globalObj = {
		cats: cats,
		test: "TESTING"
	}

	MyApp.start(globalObj);

	cats.add(new AngryCat({ name: "Cranky Cat", image_path: "assets/images/cat4.jpg", rank: cats.size() + 1 }))

})
/////////////////////////////////////////////////////////////////////////////
