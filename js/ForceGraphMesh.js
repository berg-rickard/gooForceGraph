define([
	'goo/math/Transform',
	'goo/util/MeshBuilder',
	'ForceGraphSphere',
	'ForceGraphLine'
], /** @lends */ function(
	Transform,
	MeshBuilder,
	ForceGraphSphere,
	ForceGraphLine
) {
	'use strict';
	
	function ForceGraphMesh() {
	}
	var transform = new Transform();
	
	ForceGraphMesh.build = function(forceGraph) {
		var nodeData = forceGraph.nodeData;
		var linkData = forceGraph.linkData;
		var meshBuilder = new MeshBuilder();
		var mesh, a, b;
		for (var i = 0; i < nodeData.length; i++) {
			mesh = new ForceGraphSphere(i);
			meshBuilder.addMeshData(mesh, transform);
		}
		for (var i = 0; i < linkData.length; i++) {
			a = forceGraph.inToOut[linkData[i].nodeA];
			b = forceGraph.inToOut[linkData[i].nodeB];
			mesh = new ForceGraphLine(a, b);
			meshBuilder.addMeshData(mesh, transform);
		}
		return meshBuilder.build();
	};
	
	return ForceGraphMesh;
});