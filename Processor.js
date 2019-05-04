class Processor {
	constructor({ access, batch }) {
		this.access = access;
		this.batch = batch;
		this.queue = [];
		this.pending = new Set();
	}
	enqueue(id, type, relation, object, i, then) {
		var request = {
			id: id,
			type: type,
			relation: relation,
			object,
			i,
			then
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
			}, e => {
				this.pending.delete(promise);
			});
		});
		this.queue.length = 0;
		return promise;
	}
}
module.exports = Processor;
