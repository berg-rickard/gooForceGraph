require([
	'ForceGraph',
	'ForceGraphDisplayer'
], function(
	ForceGraph,
	ForceGraphDisplayer
) {
	var data = {
		nodes: [],
		links: []
	};
	//return;
	for (var i = 0; i < 600; i++) {
		var a = Math.random() * 3 + 1;
		data.nodes.push({
			id: 'asdf' + i,
			size: a,
			weight: 3,
			color: [Math.random(), Math.random(), Math.random()]
		});
	}
	/*for (var i = 1; i < 200; i++) {
		var a = Math.floor(Math.random() * data.nodes.length);
		var b = Math.floor(Math.random() * data.nodes.length);
		data.links.push({
			a: 'asdf'+a,
			b: 'asdf'+b,
			length: 2
		});
	}*/
	/*
	setInterval(function() {
		var a = Math.floor(Math.random() * data.nodes.length);
		var b = Math.floor(Math.random() * data.nodes.length);
		fg.addLinks({
			a: 'asdf'+a,
			b: 'asdf'+b,
			length: 30
		});
		fgd.rebuild();
	}, 2000)
	*/
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
	
	
	//fg.removeNodes('asdf3');

	console.log(fg);
	
	fgd = new ForceGraphDisplayer(fg);

	/*
	setTimeout(function() {
		fg.addNodes({
			id: 'tjalou',
			weight: 10
		});
		fgd.rebuild();
	}, 3000);
	setTimeout(function() {
		fg.addNodes({
			id: 'tjenix',
			weight: 5
		});
		fgd.rebuild();
	}, 4000);
	*/
	setTimeout(function() {
		fg.removeNodes('asdf5');
		fgd.rebuild();
	}, 5000);
	
});