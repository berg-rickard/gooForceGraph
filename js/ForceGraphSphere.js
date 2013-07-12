define([
	'goo/shapes/Sphere',
	'goo/renderer/MeshData'
], /** @lends */ function(
	Sphere,
	MeshData
) {
	'use strict';
	/**
	 * @class The mesh for the force graph nodes
	 * @extends Sphere
	 */
	function ForceGraphSphere(index) {
		this.nodeId = index;
		
		
		var attr = MeshData.createAttribute(1, 'Short');
		Sphere.call(this, 20, 20);
		this.attributeMap['NODE_ID'] = attr;
		this.rebuildData();
		this._rebuild();
	}
	ForceGraphSphere.prototype = Object.create(Sphere.prototype);
	ForceGraphSphere.prototype.constructor = ForceGraphSphere;
	
	ForceGraphSphere.prototype.setNodeId = function(id) {
		
		this._rebuild();
	}
	
	ForceGraphSphere.prototype._rebuild = function() {
		Sphere.prototype.rebuild.call(this);
		var nbuf = this.getAttributeBuffer('NODE_ID');
		for (var i = 0; i < this.vertexCount; i++) {
			nbuf[i] = this.nodeId;
		}
	}
	
	
	return ForceGraphSphere;
});