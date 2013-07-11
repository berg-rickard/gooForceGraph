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
	
	ForceGraphMesh.buildNodes = function(forceGraph, nodesPerMesh) {
		var nodeData = forceGraph.nodeData;
		var meshBuilder = new MeshBuilder();
		var mesh
		var meshDatas = [];
		for (var i = 0; i < nodeData.length; i++) {
			mesh = new ForceGraphSphere(i);
			meshBuilder.addMeshData(mesh, transform);
			if (i > 0 && (i + 1) % nodesPerMesh === 0) {
				meshDatas = meshDatas.concat(meshBuilder.build());
				meshBuilder = new MeshBuilder();	
			}
		}
		meshDatas = meshDatas.concat(meshBuilder.build());
		return meshDatas;
	};
	
	ForceGraphMesh.buildLinks = function(forceGraph, linksPerMesh) {
		var linkData = forceGraph.linkData;
		var meshBuilder = new MeshBuilder();
		var meshDatas = [];
		var mesh, a, b;
		for (var i = 0; i < linkData.length; i++) {
			mesh = new ForceGraphLine(i);
			meshBuilder.addMeshData(mesh, transform);
			if (i > 0 && (i + 1) % linksPerMesh === 0) {
				meshDatas = meshDatas.concat(meshBuilder.build());
				meshBuilder = new MeshBuilder();
			}
		}
		meshDatas = meshDatas.concat(meshBuilder.build());
		return meshDatas;
	};
	
	return ForceGraphMesh;
});