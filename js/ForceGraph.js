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
		gravity: 1000
	};
	
	var vec = new Float32Array(3);

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
		this.nodeMapping = nodeMapping || {};
		this.linkMapping = linkMapping || {};
		
		this.inputNodes = {};
		this.inputLinks = [];
		this.nodeData = [];
		this.linkData = [];
		this.transforms = [];
		this.inToOut = {};
		
		//this.nodeMin = [0,0,0];
		//this.nodeMax = [0,0,0];
		//this.nodeRange = [0,0,0];
		
		//this.gridSize = 4;
		//this._grid = null;
		//this._buildGrid();
		
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
			id = this._map('id', tuple, 'node');

			if (id === undefined) {
				console.error('Data is missing id');
				continue;
			}
			

			if (this.inputNodes[id]) {
				console.log('Updating tuple '+id);

				outputId = this.inToOut[id];
				node = this.nodeData[outputId];
				
				for (var key in ForceGraphNode.defaults) {
					var value = this._map(key, tuple, 'node');
					if (value !== undefined) {
						node[key] = value;
					}
				}
			} else {
				console.log('Adding tuple '+id);
				var item = {};
				for (var key in ForceGraphNode.defaults) {
					var value = this._map(key, tuple, 'node');
					if (value !== undefined) {
						item[key] = value;
					}
				}

				node = new ForceGraphNode(item);

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
			
			nodeA = this._map('nodeA', tuple, 'link');
			nodeB = this._map('nodeB', tuple, 'link');
			
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
				for (var key in ForceGraphLink.defaults) {
					var value = this._map(key, tuple, 'link');
					if (value !== undefined) {
						link[key] = value;
					}
				}
				this.inputLinks[idx] = tuple;
			} else {
				console.log('Adding link ', nodeA, nodeB);
				var item = {}
				
				for (var key in ForceGraphLink.defaults) {
					var value = this._map(key, tuple, 'link');
					if(value) {
						item[key] = value;
					}
				}
				
				link = new ForceGraphLink(item);
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
			nodeA = this._map('nodeA', data[i], 'link');
			nodeB = this._map('nodeB', data[i], 'link');
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
	
	ForceGraph.prototype._map = function(key, data, type) {
		var mapping;
		if (type === 'node') {
			mapping = this.nodeMapping;
		} else {
			mapping = this.linkMapping;
		}
		if (mapping[key] instanceof Function) {
			return mapping[key](data);
		} else if (typeof mapping[key] === 'string') {
			return data[mapping[key]];
		} else {
			return data[key];
		}
	}
	
	ForceGraph.prototype.process = function(tpf) {
		var iterations = Math.ceil(tpf / 0.01);
		tpf /= iterations;
		for (var i = 0; i < iterations; i++) {
			this._updateGravity();
			
			this._updateRepulsion();
			this._updateAttraction();
			for (var i = 0; i < this.nodeData.length; i++) {
				this.nodeData[i].process(tpf);
			}
		}
		//this.updateMinMax();
	};
	
	ForceGraph.prototype._updateGravity = function() {
		var pos, node, lenSq, len;
		for (var i = 0; i < this.nodeData.length; i++) {
			node = this.nodeData[i];
			pos = node.position;
			vec = node._acceleration;
			
			vec[0] = -pos[0];
			vec[1] = -pos[1];
			vec[2] = -pos[2];
			
			lenSq = vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2];
			if (lenSq > 16e-4) {
				len = Math.sqrt(lenSq);
				vec[0] /= len;
				vec[1] /= len;
				vec[2] /= len;
			}
			vec[0] *= this.gravity;
			vec[1] *= this.gravity;
			vec[2] *= this.gravity;
		}
	};
	
	ForceGraph.prototype._updateRepulsion = function() {
		var nodeA, nodeB, posA, posB, force, inv, len, lenSq;
		var vd = vec;
		for (var i = this.nodeData.length - 1; i >= 0; i--) {
			nodeA = this.nodeData[i];
			posA = nodeA.position;

			for (var j = i - 1; j >= 0; j--) {

				nodeB = this.nodeData[j];
				posB = nodeB.position;
				
				// vec.setv(posB).subv(posA)
				vd[0] = posB[0] - posA[0];
				vd[1] = posB[1] - posA[1];
				vd[2] = posB[2] - posA[2];
				
				// lenSq = vec.lengthSquared()
				lenSq = vd[0] * vd[0] + vd[1] * vd[1] + vd[2] * vd[2];
				if (lenSq > 1e4) continue;
				
				force = nodeA.charge * nodeB.charge / (lenSq * nodeB.mass);
				if (force < 1e-6) continue;
				
				// vec.normalize()
				len = Math.sqrt(lenSq);
				vd[0] = vd[0] * force / len;
				vd[1] = vd[1] * force / len;
				vd[2] = vd[2] * force / len;
				
				// node._acceleration.addv(vec)
				nodeB._acceleration[0] += vd[0];
				nodeB._acceleration[1] += vd[1];
				nodeB._acceleration[2] += vd[2];
				
				inv = -nodeB.mass / nodeA.mass;
				
				// vec.scale(inv)
				vd[0] *= inv;
				vd[1] *= inv;
				vd[2] *= inv;

				// nodeA._acceleration.addv(vec);
				nodeA._acceleration[0] += vd[0];
				nodeA._acceleration[1] += vd[1];
				nodeA._acceleration[2] += vd[2];
			}
		}
	};
	
	ForceGraph.prototype._updateAttraction = function() {
		var nodeA, nodeB, posA, posB, force, len;
		for (var i = 0; i < this.linkData.length; i++) {
			nodeA = this.nodeData[this.inToOut[this.linkData[i].nodeA]];
			nodeB = this.nodeData[this.inToOut[this.linkData[i].nodeB]];

			posA = nodeA.position;
			posB = nodeB.position;

			vec[0] = posA[0] - posB[0];
			vec[1] = posA[1] - posB[1];
			vec[2] = posA[2] - posB[2];
			
			len = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
			force = (this.linkData[i].length - len) * this.linkData[i].strength;
			
			vec[0] = vec[0] * force / len;
			vec[1] = vec[1] * force / len;
			vec[2] = vec[2] * force / len;
			
			nodeA._acceleration[0] += vec[0] / nodeA.mass;
			nodeA._acceleration[1] += vec[1] / nodeA.mass;
			nodeA._acceleration[2] += vec[2] / nodeA.mass;

			nodeB._acceleration[0] -= vec[0] / nodeB.mass;
			nodeB._acceleration[1] -= vec[1] / nodeB.mass;
			nodeB._acceleration[2] -= vec[2] / nodeB.mass;
		}
	}
	/**
	ForceGraph.prototype.__updateRepulsion = function() {
		this.updateMinMax();
		this._buildGrid()
		this._fillGrid();

		var nodeA, nodeB, posA, posB, gi, force, inv, len, lenSq;
		var vd = vec.data;
		for (var i = this.nodeData.length - 1; i >= 0; i--) {
			nodeA = this.nodeData[i];
			posA = nodeA.transform.translation.data;
			gi = nodeA.gridIndex;
			for (var idx = this._grid.length - 1; idx >= 0; idx--) {
				if (this._grid[idx].charge === 0) {
					continue;
				}
				if (gi === idx) {
					for (var j = this._grid[idx].nodes.length - 1; j >= 0; j--) {
						nodeB = this._grid[idx].nodes[j];
						if (nodeA === nodeB) continue;
						posB = nodeB.transform.translation.data;
						
						// vec.setv(posB).subv(posA)
						vd[0] = posA[0] - posB[0];
						vd[1] = posA[1] - posB[1];
						vd[2] = posA[2] - posB[2];
						
						// lenSq = vec.lengthSquared()
						lenSq = vd[0] * vd[0] + vd[1] * vd[1] + vd[2] * vd[2];
						if (lenSq > 1e4) continue;
						
						force = nodeA.charge * nodeB.charge / (lenSq * nodeA.mass);
						if (force < 1e-6) continue;
						
						// vec.normalize()
						len = Math.sqrt(lenSq);
						
						// node._acceleration.addv(vec)
						nodeA._acceleration.data[0] += vd[0] * force / len;
						nodeA._acceleration.data[1] += vd[1] * force / len;
						nodeA._acceleration.data[2] += vd[2] * force / len;

					}
				} else {
					posB = this._grid[idx].position;
					
					// vec.setv(posB).subv(posA)
					vd[0] = posA[0] - posB[0];
					vd[1] = posA[1] - posB[1];
					vd[2] = posA[2] - posB[2];

					// lenSq = vec.lengthSquared()
					lenSq = vd[0] * vd[0] + vd[1] * vd[1] + vd[2] * vd[2];
					if (lenSq > 1e4) continue;
					
					force = nodeA.charge * this._grid[idx].charge / (lenSq * nodeA.mass);
					if (force < 1e-6) continue;
					
					// vec.normalize()
					len = Math.sqrt(lenSq);
					
					// node._acceleration.addv(vec)
					nodeA._acceleration.data[0] += vd[0] * force / len;
					nodeA._acceleration.data[1] += vd[1] * force / len;
					nodeA._acceleration.data[2] += vd[2] * force / len;
				}
			}
		}
		
	}

	ForceGraph.prototype.updateMinMax = function() {
		this.nodeMin = [0,0,0];
		this.nodeMax = [0,0,0];
		var t;
		for (var i = 0; i < this.nodeData.length; i++) {
			t = this.nodeData[i].transform.translation.data;
			if(t[0] < this.nodeMin[0]) this.nodeMin[0] = t[0];
			else if (t[0] > this.nodeMax[0]) this.nodeMax[0] = t[0];

			if(t[1] < this.nodeMin[1]) this.nodeMin[1] = t[1];
			else if (t[1] > this.nodeMax[1]) this.nodeMax[1] = t[1];

			if(t[2] < this.nodeMin[2]) this.nodeMin[2] = t[2];
			else if (t[2] > this.nodeMax[2]) this.nodeMax[2] = t[2];
		}
		this.nodeMax[0] *= 1.001;
		this.nodeMax[1] *= 1.001;
		this.nodeMax[2] *= 1.001;

		this.nodeMin[0] *= 1.001;
		this.nodeMin[1] *= 1.001;
		this.nodeMin[2] *= 1.001;
		
		this.nodeRange[0] = this.nodeMax[0] - this.nodeMin[0];
		this.nodeRange[1] = this.nodeMax[1] - this.nodeMin[1];
		this.nodeRange[2] = this.nodeMax[2] - this.nodeMin[2];
	}

	ForceGraph.prototype._buildGrid = function() {
		var size = this.gridSize;
		if(!this._grid) {
			var grid = this._grid = [];
			for (var i = Math.pow(size, 3) - 1; i >= 0; i--) {
				grid[i] = {
						position: [0,0,0],
						charge: 0.0,
						nodes: []
				}
			}
		} else {
			var grid = this._grid;
			for (var i = Math.pow(size, 3) - 1; i >= 0; i--) {
				grid[i].position = [0,0,0];
				grid[i].charge = 0.0;
				grid[i].nodes = [];
			}
		}
	}
	
	ForceGraph.prototype._fillGrid = function() {
		var x, y, z, idx, t, g, node, chargeSum;
		var scale = [
			this.gridSize / this.nodeRange[0],
			this.gridSize / this.nodeRange[1],
			this.gridSize / this.nodeRange[2]
		];
		for (var i = this.nodeData.length - 1; i >= 0; i--) {
			node = this.nodeData[i];
			t = node.transform.translation.data;
			x = ((t[0] - this.nodeMin[0]) * scale[0]) & 0xf;
			y = ((t[1] - this.nodeMin[1]) * scale[1]) & 0xf;
			z = ((t[2] - this.nodeMin[2]) * scale[2]) & 0xf;
			idx = x << 2;
			idx |= y << 1;
			idx |= z;
			
			node.gridIndex = idx;
			g = this._grid[idx];
			g.nodes.push(node);
			chargeSum = g.charge + node.charge;
			g.position[0] = (g.position[0] * g.charge + t[0] * node.charge) / chargeSum;
			g.position[1] = (g.position[1] * g.charge + t[1] * node.charge) / chargeSum;
			g.position[2] = (g.position[2] * g.charge + t[2] * node.charge) / chargeSum;
			
			g.charge += node.charge;
		}
	}
	*/
	return ForceGraph
});