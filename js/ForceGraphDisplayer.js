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
			spherical: new Vector3(50, 0,0),
			baseDistance: 50 / 4,
			domElement: goo.renderer.domElement
		}));
		cameraEntity.setComponent(scriptComponent);
		
		
		// General material
		this.material = Material.createMaterial(shaderDef, 'ForceGraphMaterial');
		
		this.entities = [];
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
		var meshes = ForceGraphMesh.build(this.forceGraph);
		for(var i = 0; i < meshes.length; i++) {
			if (i < this.entities.length) {
				//Reuse entity
				this.entities[i].meshDataComponent.meshData = meshes[i];
			} else {
				// Add new entity
				var entity = EntityUtils.createTypicalEntity(this.goo.world, meshes[i], 'ForceGraphEntity_'+i);
				entity.meshRendererComponent.materials[0] = this.material;
				this.entities.push(entity);
				entity.addToWorld();
			}
		}
		while (meshes.length < this.entities.length) {
			// Remove unused entities
			var entity = this.entities.pop();
			entity.removeFromWorld();
		}
	};
	
	ForceGraphDisplayer.prototype.update = function() {
		this.material.shader.defines.NODE_COUNT = this.forceGraph.nodeData.length;
		this.material.uniforms.nodeTranslations = this.forceGraph.getTranslationsArray();
	}
	
	var shaderDef = {
		processors: [
			ShaderBuilder.light.processor
		],
		defines: {
			NODE_COUNT: 4
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
			nodeTranslations : []
		},
		vshader : [ //
		'attribute vec3 vertexPosition;', //
		'attribute vec3 vertexNormal;', //
		'attribute float nodeId;', //

		'uniform mat4 viewProjectionMatrix;',
		'uniform mat4 worldMatrix;',//
		'uniform vec3 cameraPosition;', //
		'uniform vec3 nodeTranslations[NODE_COUNT];',

		ShaderBuilder.light.prevertex,

		'varying vec3 normal;',//
		'varying vec3 vWorldPos;',
		'varying vec3 viewPosition;',

		'void main(void) {', //
		' vec3 pos = vertexPosition + nodeTranslations[int(nodeId)];',
		'	vec4 worldPos = vec4(pos, 1.0);', //
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

		'void main(void)',//
		'{',//
		'	vec3 N = normalize(normal);',//
		'	vec4 final_color = vec4(1.0);',//

			ShaderBuilder.light.fragment,

		'	gl_FragColor = final_color;',//
		'}'//
		].join('\n')
	};
	
	
	return ForceGraphDisplayer;
});