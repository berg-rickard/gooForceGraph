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
	function ForceGraphLine(linkIndex) {
		this.linkIndex = linkIndex;
	
	
		MeshData.call(this);
		
		var attributeMap = MeshData.defaultMap([MeshData.POSITION]);
		attributeMap['LINK_ID'] = MeshData.createAttribute(1, 'Short');
		MeshData.call(this, attributeMap, 2, 2);
		this.indexModes = ['Lines'];
		this.rebuild();
	}
	ForceGraphLine.prototype = Object.create(MeshData.prototype);
	ForceGraphLine.prototype.constructor = ForceGraphLine;
	
	ForceGraphLine.prototype.setNodeId = function(id) {
		
		this.rebuild();
	}
	
	ForceGraphLine.prototype.rebuild = function() {
		this.getAttributeBuffer('LINK_ID').set([this.linkIndex * 2, this.linkIndex * 2 + 1]);
		this.getAttributeBuffer(MeshData.POSITION).set([
			0, 0, 0,
			0, 0, 0
		]);
		this.getIndexBuffer().set([0, 1]);
	}
	
	return ForceGraphLine;
});