class Processor {
	constructor({ access, batch }) {
		this.access = access;
		this.batch = batch;
		this.queue = [];
		this.pending = new Set();
	}
	enqueue(id, type, relation, object, i, resolve, reject) {
		var request = {
			id: id,
			type: type,
			relation: relation,
			object,
			i,
			resolve,
			reject
		};
		this.queue.push(request);
		return request;
	}
	flush() {
		var promise = [];
		for (var [batch, request] of this.batch(this.queue)) {
			var p = this.access.get(batch);
			promise.push(p);
			p.batch = batch;
			p.request = request;
			this.pending.add(p);
		}
		promise.forEach(promise => {
			promise.then(object => {
				this.pending.delete(promise);
				promise.request.forEach(
					object instanceof Array ?
						(request, i) => {
							request.resolve(object[i]);
						} :
						request => {
							request.resolve(object[request.id]);
						}
				);
			}, e => {
				this.pending.delete(promise);
				promise.request.forEach(
					request => {
						request.reject(e);
					}
				);
			});
		});
		this.queue.length = 0;
		return promise;
	}
}
module.exports = Processor;
