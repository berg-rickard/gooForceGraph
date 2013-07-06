require([
	'myWorld',
	'ForceGraph',
	'ForceGraphDisplayer'
], function(
	goo,
	ForceGraph,
	ForceGraphDisplayer
) {
	var data = {
		nodes: [],
		links: []
	};
	for (var i = 0; i < 1000; i++) {
		data.nodes.push({
			id: 'asdf' + i,
		});
	}
	/*
	for (var i = 1; i < 10; i++) {
		data.links.push({
			a: 'asdf0',
			b: 'asdf' + i
		});
	}
	*/
	var fg = new ForceGraph(data, {
		charge: 'weight'
	});
	
	
	fg.removeNodes('asdf3');

	/*
	fg.addNodes({
		id: 'asdf6',
		weight: 100
	});
	*/
	/*
	fg.addLinks({
		a: 'asdf0',
		b: 'asdf6',
		length: 10
	});
	
	fg.addLinks({
		a: 'asdfff',
		b: 'ölkj'
	});
	
	*/
	fg.removeLinks({
		a: 'asdf0',
		b: 'asdf4'
	});
	
	console.log(fg);
	
	fgd = new ForceGraphDisplayer(fg);
	
});