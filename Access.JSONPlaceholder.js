var q = require('q');
var request = require('request-promise-any');
var request = request.defaults({ json: true });
var group = require('./group');
module.exports = endpoint => ({
	get: ({ id, type, relation }) =>
		relation ?
			request.get(`${endpoint}/${type}s/${id}/${relation}s`).promise().then(object => [object]) :
			id instanceof Array ?
				request.get(`${endpoint}/${type}s?${id.map(id => `id=${id}`).join('&')}`).promise() :
				request.get(`${endpoint}/${type}s/${id}`).promise().then(object => [object]),
	batch: function* (queue) {
		var request = group.call(queue, [
			request => request.relation || "", [
				request => request.type, []
			]
		]);
		for (var relation in request)
			for (var type in request[relation])
				if (relation)
					for (var id in request[relation][type])
						yield [
							{ id, type, relation },
							[request[relation][type][id]]
						];
				else
					yield [
						{
							id:
								request[relation][type].length > 1 ?
									request[relation][type].map(request => request.id) :
									request[relation][type][0].id,
							type,
							relation
						},
						request[relation][type]
					];
	}
});
