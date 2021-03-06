exports.definition = {
	config: {
		columns: {
			id: "INTEGER PRIMARY KEY AUTOINCREMENT",
		    reimburseDetailId: "bigint",
		    message: "string",
		    commentDate: "datetime",
		    userId: "bigint",
		    username : "string",
		    dateCreated: "date"
		},
		adapter: {
			type: "sql",
			collection_name: "comment",
			idAttribute: 'id'
		}
	},
	extendModel: function(Model) {
		_.extend(Model.prototype, {
			// extended functions and properties go here
		});

		return Model;
	},
	extendCollection: function(Collection) {
		_.extend(Collection.prototype, {
			// extended functions and properties go here
			comparator : function(model) {
  				return (moment.parseZone(model.get('commentDate')).unix());
			},
		});

		return Collection;
	}
};