define([
	'goo/renderer/MeshData'
], /** @lends */ function(
	MeshData
) {
	'use strict';
	/**
	 * @class The mesh for the force graph links
	 * @extends MeshData
	 */
	function ForceGraphLine(nodeA, nodeB) {
		this.nodeA = nodeA;
		this.nodeB = nodeB;
	
	
		MeshData.call(this);
		
		var attributeMap = MeshData.defaultMap([MeshData.POSITION]);
		attributeMap['NODE_ID'] = MeshData.createAttribute(1, 'Short');
		MeshData.call(this, attributeMap, 2, 2);
		this.rebuild();
	}
	ForceGraphLine.prototype = Object.create(MeshData.prototype);
	ForceGraphLine.prototype.constructor = ForceGraphLine;
	
	ForceGraphLine.prototype.setNodeId = function(id) {
		
		this.rebuild();
	}
	
	ForceGraphLine.prototype.rebuild = function() {
		var nbuf = this.getAttributeBuffer('NODE_ID');
		nbuf[0] = this.nodeA;
		nbuf[1] = this.nodeB;
		
		var vBuf = this.getAttributeBuffer(MeshData.POSITION);
	}
	
	return ForceGraphLine;
});