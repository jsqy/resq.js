var user = {};
for (var i = 1; i <= 2; i++)
	user[i] = { id: i, type: 'user' };
var post = {};
post[1] = { id: 1, type: 'post' };
post[1].userId = 1;
var data = { user, post };
module.exports = data;
