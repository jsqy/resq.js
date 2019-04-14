var group = require('./group');
module.exports = function* (queue) {
	var request = group.call(queue, [
		request => request.relation || "", [
			request => request.type, []
		]
	]);
	for (var relation in request)
		for (var type in request[relation])
			yield [
				{
					id: request[relation][type].map(request => request.id),
					type,
					relation
				},
				request[relation][type]
			];
};
