require([
	'ForceGraph',
	'ForceGraphDisplayer'
], function(
	ForceGraph,
	ForceGraphDisplayer
) {
	'use strict';
	var data = {
		nodes: [],
		links: []
	};
	//return;
	for (var i = 0; i < 1000; i++) {
		data.nodes.push({
			a: 'asdf' + i,
			b: Math.random(),
		});
	}
	
	
	/**
	setInterval(function() {
		var a = Math.floor(Math.random() * data.nodes.length);
		var b = Math.floor(Math.random() * data.nodes.length);
		fg.addLinks({
			nodeA: 'asdf'+a,
			nodeB: 'asdf'+b,
			length: 20,
			strength: 1e-4
		});
		//fgd.rebuildNodes();
		fgd.rebuildLinks();
	}, 200);
	/**/
	/**/
	for (var i = 0; i < data.nodes.length * 0.95; i++) {
		if (i === 0) {
			continue;
		}
		var idx = Math.floor(i / 8);
		data.links.push({
			nodeA: 'asdf'+idx,
			nodeB: 'asdf'+i
		});
	}
	/**/
	
	
	
	var fg = new ForceGraph(data, {
		id: 'a',
		size: function(d) {
			return d.b * 4 + 6
		},
		charge: function(d) {
			return d.b * 2 + 0.1;
		},
		color: function(d) {
			return [Math.random(), Math.random(), Math.random()];
		}
	});
	
	var fgd = new ForceGraphDisplayer(fg);

	/*
	setInterval(function() {
		var idx = Math.floor(Math.random() * fg.nodeData.length);
		fg.removeNodes('asdf'+idx);
		fgd.rebuildLinks();
	}, 150);
	*/	
});