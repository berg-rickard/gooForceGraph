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
	
	var nodesPerMesh = 300;
	
	function ForceGraphDisplayer(forceGraph) {
		var goo = new GooRunner({
			showStats: true,
			//manuallyStartGameLoop: true,
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
		cameraEntity.setComponent(new CameraComponent(new Camera(45, 1, 1, 1000)));
		cameraEntity.addToWorld();
	
		// Camera control
		var scriptComponent = new ScriptComponent();
	
		/* Use orbitcam */
		scriptComponent.scripts.push(new MyControlScript({
			spherical: new Vector3(150, 0,0),
			baseDistance: 150 / 4,
			domElement: goo.renderer.domElement
		}));
		cameraEntity.setComponent(scriptComponent);
		
		
		// General material
		
		this.nodeEntities = [];
		this.linkEntities = [];
		this.goo = goo;
		this.forceGraph = forceGraph;
		this.update();
		this.rebuild();
		
		goo.callbacks.push(function(tpf) {
			this.forceGraph.process(tpf);
			this.update();
		}.bind(this));
	}
	
	ForceGraphDisplayer.prototype.rebuild = function() {
		// Nodes
		var meshes = ForceGraphMesh.buildNodes(this.forceGraph, nodesPerMesh);
		this._rebuild(meshes, this.nodeEntities, nodeShaderDef, 'Node');
		
		// Links
		var meshes = ForceGraphMesh.buildLinks(this.forceGraph, nodesPerMesh);
		//this._rebuild(meshes, this.linkEntities, linkShaderDef, 'Link');
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
		var translations = this.getUniforms('translation', 1e5);
		for (var i = this.linkEntities.length - 1; i >= 0; i--) {
			this.linkEntities[i].meshRendererComponent.materials[0].uniforms.nodeTranslations = translations[0];
		}
	}
	
	ForceGraphDisplayer.prototype.getUniforms = function(type, idsPerMesh) {
		var nodeData = this.forceGraph.nodeData;
		var arrays = [];
		var trans = [];
		var c = 0;
		var len, d;
		for (var i = 0; i < nodeData.length; i++) {
			if (type === 'translation') {
				d = nodeData[i].transform.translation.data;
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
			c += len;
			if(i > 0 && i % idsPerMesh === 0) {
				arrays.push(trans);
				trans = [];
				c = 0;
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
			nodeColors : []
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

		ShaderBuilder.light.prevertex,

		'varying vec3 normal;',//
		'varying vec3 color;',
		'varying vec3 vWorldPos;',
		'varying vec3 viewPosition;',

		'void main(void) {', //
		' int id = int(nodeId);',
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
			NODE_COUNT: 10
		},
		attributes : {
			vertexPosition : MeshData.POSITION,
			nodeId : 'NODE_ID'
		},
		uniforms : {
			viewProjectionMatrix : Shader.VIEW_PROJECTION_MATRIX,
			worldMatrix : Shader.WORLD_MATRIX,
			nodeTranslations : []
		},
		vshader : [ //
		'attribute vec3 vertexPosition;', //
		'attribute float nodeId;', //

		'uniform mat4 viewProjectionMatrix;',
		'uniform mat4 worldMatrix;',//
		'uniform vec3 nodeTranslations[NODE_COUNT];',

		'void main(void) {', //
		' vec3 pos = vertexPosition + nodeTranslations[int(nodeId)];',
		'	vec4 worldPos = vec4(pos, 1.0);', //
		'	gl_Position = viewProjectionMatrix * worldPos;', //
		'}'//
		].join('\n'),
		fshader : [//
		'precision mediump float;',//

		'void main(void)',//
		'{',//
		'	vec4 final_color = vec4(1.0);',//
		'	gl_FragColor = final_color;',//
		'}'//
		].join('\n')
	};
	
	
	return ForceGraphDisplayer;
});