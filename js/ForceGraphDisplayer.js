define([
	'goo/entities/GooRunner',
	'goo/renderer/Camera',
	'goo/entities/components/CameraComponent',
	'goo/entities/components/ScriptComponent',
	'goo/math/Vector3',
	'goo/loaders/Loader',
	'goo/loaders/ScriptLoader',
	'goo/entities/components/LightComponent',
	'goo/renderer/light/DirectionalLight',
	'goo/entities/EntityUtils',
	'goo/renderer/MeshData',
	'goo/renderer/Shader',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderBuilder',
	'MyControlScript',
	'ForceGraphMesh'
], function(
	GooRunner,
	Camera,
	CameraComponent,
	ScriptComponent,
	Vector3,
	Loader,
	ScriptLoader,
	LightComponent,
	DirectionalLight,
	EntityUtils,
	MeshData,
	Shader,
	Material,
	ShaderBuilder,
	MyControlScript,
	ForceGraphMesh
) {
	'use strict';
	
	var nodesPerMesh = 50;
	
	function ForceGraphDisplayer(forceGraph) {
		var goo = new GooRunner({
			showStats: true,
			manuallyStartGameLoop: true,
			antialias: true
		});
		
		// DOM
		goo.renderer.domElement.id = "goo";
		document.body.appendChild(goo.renderer.domElement);
		goo.renderer.setClearColor(0.0,0.0,0.0,1.0);
	
		// Light
		var lightEntity = goo.world.createEntity('LightEntity');
		lightEntity.setComponent(new LightComponent(new DirectionalLight()));
		lightEntity.transformComponent.transform.translation.setd(-100,200,400);
		lightEntity.transformComponent.transform.lookAt(Vector3.ZERO, Vector3.UNIT_Y);
		lightEntity.addToWorld();
	
		// Camera
		var cameraEntity = goo.world.createEntity("CameraEntity");
		cameraEntity.setComponent(new CameraComponent(new Camera(45, 1, 10, 10000)));
		cameraEntity.addToWorld();
	
		// Camera control
		var scriptComponent = new ScriptComponent();
	
		/* Use orbitcam */
		scriptComponent.scripts.push(new MyControlScript({
			spherical: new Vector3(650, Math.PI / 3, Math.PI/12),
			baseDistance: 250 / 4,
			domElement: goo.renderer.domElement
		}));
		cameraEntity.setComponent(scriptComponent);
		
		
		// General material
		
		this.nodeEntities = [];
		this.linkEntities = [];
		this.goo = goo;
		this.forceGraph = forceGraph;
		this.update();
		this.rebuildNodes();
		this.rebuildLinks();
		
		goo.startGameLoop();
		
		goo.callbacks.push(function(tpf) {
			this.forceGraph.process(tpf);
			this.update();
		}.bind(this));
	}
	
	ForceGraphDisplayer.prototype.rebuildNodes = function() {
		var meshes = ForceGraphMesh.buildNodes(this.forceGraph, nodesPerMesh);
		this._rebuild(meshes, this.nodeEntities, nodeShaderDef, 'Node');
	};
	
	ForceGraphDisplayer.prototype.rebuildLinks = function() {
		var meshes = ForceGraphMesh.buildLinks(this.forceGraph, nodesPerMesh);
		this._rebuild(meshes, this.linkEntities, linkShaderDef, 'Link');
	};
	
	ForceGraphDisplayer.prototype._rebuild = function(meshes, entities, shaderDef, name) {
		for (var i = 0; i < meshes.length; i++) {
			if (i < entities.length) {
				// Reuse entity
				entities[i].meshDataComponent.meshData = meshes[i];
			} else {
				// Add new entity
				var entity = EntityUtils.createTypicalEntity(this.goo.world, meshes[i], 'ForceGraph'+name+'Entity_'+i);
				entity.meshRendererComponent.materials[0] = Material.createMaterial(shaderDef, 'ForceGraph'+name+'Material_'+i);
				entity.meshRendererComponent.materials[0].uniforms.offset = i;
				entity.meshRendererComponent.cullMode = 'Never';
				entities.push(entity);
				entity.addToWorld();
			}
		}
		while (meshes.length < this.linkEntities.length) {
			// Remove unused entities
			var entity = entities.pop();
			entity.removeFromWorld();
		}
	}
	
	
	ForceGraphDisplayer.prototype.update = function() {
		var translations = this.getUniforms('translation', nodesPerMesh);
		var scales = this.getUniforms('scale', nodesPerMesh);
		var colors = this.getUniforms('color', nodesPerMesh);
		var uniforms;
		for (var i = this.nodeEntities.length - 1; i >= 0; i--) {
			uniforms = this.nodeEntities[i].meshRendererComponent.materials[0].uniforms;
			uniforms.nodeTranslations = translations[i];
			uniforms.nodeScales = scales[i];
			uniforms.nodeColors = colors[i];
		}
		var translations = this.getUniforms('linkTranslation', nodesPerMesh);
		for (var i = this.linkEntities.length - 1; i >= 0; i--) {
			this.linkEntities[i].meshRendererComponent.materials[0].uniforms.linkTranslations = translations[i];
		}
	}
	
	ForceGraphDisplayer.prototype.getUniforms = function(type, idsPerMesh) {
		var nodeData = this.forceGraph.nodeData;
		var arrays = [];
		var trans = [];

		if (type === 'linkTranslation') {
			var tA, tB;
			var linkData = this.forceGraph.linkData;
			var inToOut = this.forceGraph.inToOut;

			for (var i = 0; i < linkData.length; i++) {
				tA = nodeData[inToOut[linkData[i].nodeA]].position;
				tB = nodeData[inToOut[linkData[i].nodeB]].position;
				
				trans.push(
					tA[0], tA[1], tA[2],
					tB[0], tB[1], tB[2]
				);
				if (i > 0 && (i + 1) % idsPerMesh === 0) {
					arrays.push(trans);
					trans = [];
				}
			}
			if (trans.length) {
				arrays.push(trans);
			}
			return arrays;
		}
		
		var len, d;
		for (var i = 0; i < nodeData.length; i++) {
			if (type === 'translation') {
				d = nodeData[i].position;
				len = 3;
			} else if (type === 'scale') {
				d = [nodeData[i].size];
				len = 1;
			} else if (type === 'color') {
				d = nodeData[i].color;
				len = 3;
			} else {
				return null;
			}
			for (var j = 0; j < len; j++) {
				trans.push(d[j]);
			}
			if(i > 0 && (i + 1) % idsPerMesh === 0) {
				arrays.push(trans);
				trans = [];
			}
		}
		if (trans.length) {
			arrays.push(trans);
		}
		return arrays;
	};
	
	var nodeShaderDef = {
		processors: [
			ShaderBuilder.light.processor
		],
		defines: {
			NODE_COUNT: nodesPerMesh
		},
		attributes : {
			vertexPosition : MeshData.POSITION,
			vertexNormal : MeshData.NORMAL,
			nodeId : 'NODE_ID'
		},
		uniforms : {
			viewProjectionMatrix : Shader.VIEW_PROJECTION_MATRIX,
			worldMatrix : Shader.WORLD_MATRIX,
			cameraPosition : Shader.CAMERA,
			nodeTranslations : [],
			nodeScales : [],
			nodeColors : [],
			offset : 0
		},
		vshader : [ //
		'attribute vec3 vertexPosition;', //
		'attribute vec3 vertexNormal;', //
		'attribute float nodeId;', //

		'uniform mat4 viewProjectionMatrix;',
		'uniform mat4 worldMatrix;',//
		'uniform vec3 cameraPosition;', //
		'uniform vec3 nodeTranslations[NODE_COUNT];',
		'uniform vec3 nodeColors[NODE_COUNT];',
		'uniform float nodeScales[NODE_COUNT];',
		'uniform float offset;',

		ShaderBuilder.light.prevertex,

		'varying vec3 normal;',//
		'varying vec3 color;',
		'varying vec3 vWorldPos;',
		'varying vec3 viewPosition;',

		'void main(void) {', //
		' int id = int(nodeId) - int(offset) * NODE_COUNT;',
		' color = nodeColors[id];',
		' vec3 newpos = vertexPosition * nodeScales[id] + nodeTranslations[id];',
		'	vec4 worldPos = vec4(newpos, 1.0);', //
		'	vWorldPos = worldPos.xyz;',
		'	gl_Position = viewProjectionMatrix * worldPos;', //

			ShaderBuilder.light.vertex,

		'	normal = (worldMatrix * vec4(vertexNormal, 0.0)).xyz;', //
		'	viewPosition = cameraPosition - worldPos.xyz;', //
		'}'//
		].join('\n'),
		fshader : [//
		'precision mediump float;',//

		ShaderBuilder.light.prefragment,

		'varying vec3 normal;',//
		'varying vec3 vWorldPos;',
		'varying vec3 viewPosition;',
		'varying vec3 color;',

		'void main(void)',//
		'{',//
		'	vec3 N = normalize(normal);',//
		'	vec4 final_color = vec4(color, 1.0);',//

			ShaderBuilder.light.fragment,

		'	gl_FragColor = final_color;',//
		'}'//
		].join('\n')
	};
	
	var linkShaderDef = {
		defines: {
			LINK_COUNT: nodesPerMesh * 2
		},
		attributes : {
			vertexPosition : MeshData.POSITION,
			linkId : 'LINK_ID'
		},
		uniforms : {
			viewProjectionMatrix : Shader.VIEW_PROJECTION_MATRIX,
			worldMatrix : Shader.WORLD_MATRIX,
			linkTranslations : [],
			offset : 0
		},
		vshader : [ //
		'attribute vec3 vertexPosition;', //
		'attribute float linkId;', //

		'uniform mat4 viewProjectionMatrix;',
		'uniform mat4 worldMatrix;',//
		'uniform vec3 linkTranslations[LINK_COUNT];',
		'uniform float offset;',

		'void main(void) {', //
		' int id = int(linkId) - int(offset) * LINK_COUNT;',
		' vec3 pos = vertexPosition + linkTranslations[id];',
		'	vec4 worldPos = vec4(pos, 1.0);', //
		'	gl_Position = viewProjectionMatrix * worldPos;', //
		'}'//
		].join('\n'),
		fshader : [//
		'precision mediump float;',//

		'void main(void)',//
		'{',//
		'	vec4 final_color = vec4(0.7);',//
		'	gl_FragColor = final_color;',//
		'}'//
		].join('\n')
	};
	
	
	return ForceGraphDisplayer;
});