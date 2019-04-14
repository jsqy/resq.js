var group = require('./group');
module.exports = function* (queue) {
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
};
