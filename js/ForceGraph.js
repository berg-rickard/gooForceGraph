define([
	'goo/math/Vector3',
	'ForceGraphNode',
	'ForceGraphLink',
],/** @lends */ function(
	Vector3,
	ForceGraphNode,
	ForceGraphLink
) {
	'use strict';
	

	
	function fillDefaults(data, defaults, store) {
		data = data || {};
		for (var key in defaults) {
			store[key] = (data[key] !== undefined) ? data[key] : defaults[key];
		}
	}
	
	var defaults = {
		gravity: 100
	};
	
	var vec = new Vector3();

	/**
	 * @class Creates a forcegraph structure, handling all data and calculations
	 * @param {object|object[]} [data] The data tuples to be used in the forcegraph
	 * @param {object} [nodeMappine] How to map the data object to the forcegraph item properties
	 * @param {string} [nodeMapping.id='id']
	 * @param {string} [nodeMapping.size='size']
	 * @param {string} [nodeMapping.charge='charge']
	 * @param {string} [nodeMapping.mass='mass']
	 */
	function ForceGraph(data, nodeMapping, linkMapping, properties) {
		fillDefaults(properties, defaults, this);
		this.nodeMapping = {};
		fillDefaults(nodeMapping, ForceGraphNode.defaultMapping, this.nodeMapping);		
		this.linkMapping = {};
		fillDefaults(linkMapping, ForceGraphLink.defaultMapping, this.linkMapping);		
		
		this.inputNodes = {};
		this.inputLinks = [];
		this.nodeData = [];
		this.linkData = [];
		this.transforms = [];
		this.inToOut = {};
		
		if(data instanceof Object) {
			if (data.nodes) {
				this.addNodes(data.nodes);
			}
			if (data.links) {
				this.addLinks(data.links);
			}
		}
	}

	/**
	 * Adds one or more data nodes to the force graph
	 * @param {object|object[]} data
	 */
	ForceGraph.prototype.addNodes = function(data) {
		if(!(data instanceof Array)) {
			data = [data];
		}
		var input, node, id, tuple, outputId;
		for (var i = 0; i < data.length; i++) {
			tuple = data[i];
			outputId = null;
			id = tuple[this.nodeMapping.id];

			if (id === undefined) {
				console.error('Data is missing id');
				continue;
			}
			

			if (this.inputNodes[id]) {
				console.log('Updating tuple '+id);

				outputId = this.inToOut[id];
				node = this.nodeData[outputId];

				for (var key in this.nodeMapping) {
					if (tuple[this.nodeMapping[key]] !== undefined) {
						node[key] = tuple[this.nodeMapping[key]];
					}
				}
			} else {
				console.log('Adding tuple '+id);

				node = new ForceGraphNode(tuple, this.nodeMapping);

				this.nodeData.push(node);
				this.inToOut[id] = this.nodeData.length - 1;
			}

			this.inputNodes[id] = tuple;
		}
	};
	
	/**
	 * Removes one or more data nodes from the force graph
	 * @param {string[]|string|number[]|number} ids
	 */
	ForceGraph.prototype.removeNodes = function(ids) {
		if(!(ids instanceof Array)) {
			ids = [ids];
		}
		var id, outId;
		for (var i = 0; i < ids.length; i++) {
			id = ids[i];
			if (!this.inputNodes[id]) {
				console.error('Id ' + id + ' is not in the data');
				continue;
			}
			console.log('Removing tuple ' + id);

			outId = this.inToOut[id];

			delete this.inputNodes[id];
			delete this.inToOut[id];
			this.removeLinksTo(id);

			this.nodeData.splice(outId, 1);
			for (var key in this.inToOut) {
				if (this.inToOut[key] > outId) {
					this.inToOut[key]--;
				}
			}
		}
	};
	
	ForceGraph.prototype.addLinks = function(data) {
		if(!(data instanceof Array)) {
			data = [data];
		}
		var idx, link, nodeA, nodeB, tuple
		for (var i = 0; i < data.length; i++) {
			tuple = data[i];
			nodeA = tuple[this.linkMapping.nodeA];
			nodeB = tuple[this.linkMapping.nodeB];
			
			if (nodeA === undefined || nodeB === undefined) {
				console.error('Data is missing node ids');
				continue;
			}
			if(!this.inputNodes[nodeA] || !this.inputNodes[nodeB]) {
				console.error('Can not add link between non existant nodes');
				continue;
			}
			idx = this.getLink(nodeA, nodeB);
			if (idx) {
				console.log('Updating link', nodeA, nodeB);
				link = this.linkData[idx];
				for (var key in this.linkMapping) {
					if (tuple[this.linkMapping[key]] !== undefined) {
						link[key] = tuple[this.linkMapping[key]];
					} 
				}
				this.inputLinks[idx] = tuple;
			} else {
				console.log('Adding link ', nodeA, nodeB);
				
				link = new ForceGraphLink(tuple, this.linkMapping);
				this.linkData.push(link);
				this.inputLinks.push(tuple);
			}
		}
	}
	
	ForceGraph.prototype.removeLinks = function(data) {
		if(!(data instanceof Array)) {
			data = [data];
		}
		var nodeA, nodeB, idx;
		for (var i = 0; i < data.length; i++) {
			nodeA = data[i][this.linkMapping.nodeA];
			nodeB = data[i][this.linkMapping.nodeB];
			idx = this.getLink(nodeA, nodeB);
			if (idx) {
				console.log('Removing link between ' + nodeA + ' and ' +nodeB);
				this.inputLinks.splice(idx, 1);
				this.linkData.splice(idx, 1);
			}
		}
	}
	
	ForceGraph.prototype.removeLinksTo = function(id) {
		for (var i = 0; i < this.linkData.length; i++) {
			var ld = this.linkData[i];
			if (ld.nodeA === id || ld.nodeB === id) {
				console.log('Removing link between ' + ld.nodeA + ' and ' + ld.nodeB);
				this.linkData.splice(i, 1);
				this.inputLinks.splice(i, 1);
				i--;
			}
		}
	}
	
	ForceGraph.prototype.getLink = function(nodeA, nodeB) {
		for (var i = 0; i < this.inputLinks.length; i++) {
			var ld = this.linkData[i];
			if (ld.nodeA === nodeA && ld.nodeB === nodeB
				|| ld.nodeB === nodeA && ld.nodeA === nodeB) {
					return i;
			}
		}
	};
	
	ForceGraph.prototype.process = function(tpf) {
		var iterations = Math.ceil(tpf / 0.03);
		tpf /= iterations;
		for (var i = 0; i < iterations; i++) {
			this._updateAcceleration();
			for (var i = 0; i < this.nodeData.length; i++) {
				this.nodeData[i].process(tpf);
			}
		}
	};
	
	ForceGraph.prototype._updateAcceleration = function() {
		for (var i = 0; i < this.nodeData.length; i++) {
			this.nodeData[i]._acceleration.setd(0,0,0);
		}
		this._updateGravity();
		this._updateRepulsion();
		this._updateAttraction();
	};
	
	ForceGraph.prototype._updateGravity = function() {
		var pos, node;
		for (var i = 0; i < this.nodeData.length; i++) {
			node = this.nodeData[i];
			pos = node.transform.translation;
			vec.setv(pos).invert();
			if (vec.lengthSquared() > 16e-4) {
				vec.normalize()
			}
			vec.scale(this.gravity);
			node._acceleration.addv(vec);
		}
	};
	
	ForceGraph.prototype._updateRepulsion = function() {
		var nodeA, nodeB, posA, posB, force;
		for (var i = this.nodeData.length - 1; i >= 0; i--) {
			for (var j = i - 1; j >= 0; j--) {
				nodeA = this.nodeData[i];
				nodeB = this.nodeData[j];
				posA = nodeA.transform.translation;
				posB = nodeB.transform.translation;
				
				vec.setv(posB).subv(posA);
				force = nodeA.charge * nodeB.charge / (vec.lengthSquared() * nodeB.mass);
				
				vec.normalize();
				vec.scale(force);
				nodeB._acceleration.addv(vec);
				vec.invert().scale(nodeB.mass / nodeA.mass);
				nodeA._acceleration.addv(vec);
			}
		}
	};
	
	ForceGraph.prototype._updateAttraction = function() {
		var nodeA, nodeB, posA, posB, force;
		for (var i = 0; i < this.linkData.length; i++) {
			nodeA = this.linkData[i].nodeA;
			nodeB = this.linkData[i].nodeB;
			
			nodeA = this.nodeData[this.inToOut[nodeA]];
			nodeB = this.nodeData[this.inToOut[nodeB]];
			posA = nodeA.transform.translation;
			posB = nodeB.transform.translation;

			vec.setv(posA).subv(posB);
			force = (this.linkData[i].length - vec.length()) * this.linkData[i].strength;
			vec.normalize();

			vec.scale(force / nodeA.mass);
			nodeA._acceleration.addv(vec);
			vec.scale(nodeA.mass / nodeB.mass);
			nodeB._acceleration.addv(vec);
		}
	}
	
	ForceGraph.prototype.getMatrixArray = function() {
		var mats = [];
		for (var i = 0; i < this.nodeData.length; i++) {
			var data = this.nodeData[i].transform.matrix.data;
			for (var j = 0; j < data.length; j++) {
				mats.push(data[j]);
			}
		}
		return mats;
	}
	
	return ForceGraph
});