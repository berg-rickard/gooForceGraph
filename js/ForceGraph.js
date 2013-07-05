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
		
		this.nodeMin = [0,0,0];
		this.nodeMax = [0,0,0];
		
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
		var iterations = Math.ceil(tpf / 0.1);
		tpf /= iterations;
		for (var i = 0; i < iterations; i++) {
			this._updateAcceleration();
			for (var i = 0; i < this.nodeData.length; i++) {
				this.nodeData[i].process(tpf);
			}
		}
		this.updateMinMax();
	};
	
	ForceGraph.prototype.updateMinMax = function() {
		this.nodeMin = [0,0,0];
		this.nodeMax = [0,0,0];
		var t;
		for (var i = 0; i < this.nodeData.length; i++) {
			t = this.nodeData[i].transform.translation.data;
			if(t[0] < this.nodeMin[0]) this.nodeMin[0] = t[0] * 1.001;
			else if (t[0] > this.nodeMax[0]) this.nodeMax[0] = t[0] * 1.001;

			if(t[1] < this.nodeMin[1]) this.nodeMin[1] = t[1] * 1.001;
			else if (t[1] > this.nodeMax[1]) this.nodeMax[1] = t[1] * 1.001;

			if(t[2] < this.nodeMin[2]) this.nodeMin[2] = t[2] * 1.001;
			else if (t[2] > this.nodeMax[2]) this.nodeMax[2] = t[2] * 1.001;
		}
	}
	
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
	
	var depth = 5;
	var pDepth = Math.pow(2, depth);
	ForceGraph.prototype.__updateRepulsion = function() {
		var tree = {};
		var leaves = makeTree(tree, 8, depth);

		var t, x, y, z;
		var min = this.nodeMin;
		var max = this.nodeMax;
		var max_min = [
			max[0]-min[0],
			max[1]-min[1],
			max[2]-min[2]
		];
		for (var i = this.nodeData.length - 1; i >= 0; i--) {
			t = this.nodeData[i].transform.translation.data;
			x = Math.floor((t[0] - min[0])/(max_min[0])*pDepth)
			y = Math.floor((t[1] - min[1])/(max_min[1])*pDepth);
			z = Math.floor((t[2] - min[2])/(max_min[2])*pDepth);
			putInTree(this.nodeData[i], tree, x, y, z, depth)
		}
		var nodeData;
		for (var i = leaves.length - 1; i >= 0; i--) {
			for (var j = leaves[i].children.length - 1; j >= 0; j--) {
				nodeData = leaves[i].children[j];
				this._calcNode(nodeData, leaves[i]);
			}
		}
	}

	ForceGraph.prototype._calcNode = function(nodeData, branch, node) {
		var acc = nodeData._acceleration;
		var q1 = nodeData.charge;
		var m = nodeData.mass;
		var pos1 = nodeData.transform.translation;

		var child, q2, pos2, force, mid = vec;
		for (var i = branch.children.length - 1; i >= 0; i--) {
			child = branch.children[i];
			if (node && !child.charge || node === child || nodeData === child) continue;
			
			if (node) {
				q2 = child.charge;
				pos2 = child.center;
				mid.setv(pos1).sub(pos2[0], pos2[1], pos2[2]);
			} else {
				q2 = child.charge;
				pos2 = child.transform.translation;
				mid.setv(pos1).subv(pos2);
			}
			force = q2*q1 / mid.lengthSquared();

			mid.normalize();
			mid.scale(force / m);
			acc.addv(mid);
		}
		if (branch.parent) {
			this._calcNode(nodeData, branch.parent, branch);
		}
	}
	
	
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
	
	function makeTree(root, count, level, leaves) {
		leaves || (leaves = []);
		root.children || (root.children = []);
		for(var i = 0; i < count; i++) {
			var obj = {
				center: [0,0,0],
				charge: 0,
				children: [],
				parent: root
			}
			root.children.push(obj);
			if(level > 1) makeTree(obj, count, level - 1, leaves);
			else leaves.push(obj);
		}
		return leaves;
	}

	function putInTree(node, tree, x, y, z, level) {
		var bx = x >> (level - 1);
		var by = y >> (level - 1);
		var bz = z >> (level - 1);
		var branch = tree.children[bx << 2 | by << 1 | bz];
		var t = node.transform.translation.data;
		branch.center[0] = (branch.center[0] * branch.charge + t[0] * node.charge) / (branch.charge + node.charge);
		branch.center[1] = (branch.center[1] * branch.charge + t[1] * node.charge) / (branch.charge + node.charge);
		branch.center[2] = (branch.center[2] * branch.charge + t[2] * node.charge) / (branch.charge + node.charge);
		branch.charge += node.charge;
		
		x ^= bx << (level - 1);
		y ^= by << (level - 1);
		z ^= bz << (level - 1);
		if(level > 1) putInTree(node, branch, x, y, z, level - 1);
		else branch.children.push(node);
	}
	
	return ForceGraph
});