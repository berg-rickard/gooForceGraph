require({
	paths: {
		// Adjust depending of from where you serve goo
		'goo': '/js/goo'
	}
}, [/*goo*/], function() {
require(
[
	'SimpleWorld',
	'goo/shapes/ShapeCreator',
	'goo/entities/EntityUtils',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/Material',
	'ForceTreeComponent',
	'ForceTreeSystem',
	'goo/entities/components/MeshRendererComponent',
	'goo/entities/components/MeshDataComponent',
	'goo/math/Vector3',
	'goo/math/Ray',
	'goo/entities/systems/PickingSystem',
	'goo/picking/PrimitivePickLogic'	
], function(
	SimpleWorld,
	ShapeCreator,
	EntityUtils,
	ShaderLib,
	Material,
	ForceTreeComponent,
	ForceTreeSystem,
	MeshRendererComponent,
	MeshDataComponent,
	Vector3,
	Ray,
	PickingSystem,
	PrimitivePickLogic

) {
	"use strict";

	// Setting up the goo engine and with a camera and camera controls
	var goo = SimpleWorld.createTypicalRunner();
	function init() {
		addPicker(function(pickedList) {
			for (var i = 0; i < pickedList.length; i++) {
				if(pickedList[i].entity.forceTreeComponent) {
					// REVIEW: accessing private member
					goo.world.entityManager._entities[1].scriptComponent.scripts[0].goingToLookAt = pickedList[i].entity.transformComponent.transform.translation;
					break;
				}
			}
		});
		var ftc = new ForceTreeSystem({
			//gravity: 10,
		});
		goo.world.setSystem(ftc);

		
		// Force directed tree system
		var count = 200;
		for(var i = 0; i < count; i++) {
			addSphere(Math.random(), count);
		}
		goo.startGameLoop();
	}
	
	var addSphere = (function() {
		// shared, encapsulated sphere settings
		var sphere = ShapeCreator.createSphere(12, 12, 1);
		var mdc = new MeshDataComponent(sphere);
		
		var sphereShader = Material.createShader(ShaderLib.simpleLit, 'simplelit');
		// REVIEW: sphereShader and sphereMat are never used
		var sphereMat = Material.createMaterial(ShaderLib.simpleLit)
		sphereMat.uniforms.materialAmbient = [0.3,0.3,0.3,1];
		sphereMat.uniforms.materialDiffuse = [1.0,0.2,1.0,1];
	
		// generate random values between -20 and +20 to be used later as sphere positions.
		function rnd() {
			return (Math.random() - .5)*40;
		}

		// array of ForceTreeComponents to find suitable parent nodes to connect to.
		var ftcs = [];
		
		/* @param val - a numeric value that will be used for the sphere size and charge.
		*/
		function addSphere(val, count) {
			var scale = val*3 + .7;

			var entity = goo.world.createEntity();
			entity.transformComponent.transform.translation.setd(rnd(), rnd(), rnd());
	
			var mrc = new MeshRendererComponent();
			var material = Material.createMaterial(ShaderLib.simpleLit);
			material.uniforms.materialDiffuse = [.7*ftcs.length/count, 0, .7*(1-ftcs.length/count), 1];
			material.uniforms.materialAmbient = [ .4*ftcs.length/count, 0, .4*(1-ftcs.length/count), 1];
			mrc.materials.push(material);
			mrc.cullMode = 'Never';

			entity.setComponent(mrc);
			entity.setComponent(mdc);

			// Force tree
			var ftc = new ForceTreeComponent({
				charge: scale * .5e-1,
			});
			entity.setComponent(ftc);

			if(ftcs.length === 0) {
				// Style root node
				material.uniforms.materialAmbient = [0,0.4,0,1];
				material.uniforms.materialDiffuse = [0,0.7,0,1];
				entity.transformComponent.transform.scale.setd(5, 5, 5);	
				//ftc.fixed = Vector3.ZERO;
				ftc.charge = .5;
			} else {
				// Style the rest
				entity.transformComponent.transform.scale.setd(scale, scale, scale);

				var length = 10
				var strength = (ftcs.length > 5) ? 50 : 200;
				// Math.pow( x:x<1, 1.5) results in values significantly lower than x
				var parent = Math.floor(Math.pow(Math.random(),1.5)*ftcs.length);
				addConnection(ftcs[parent], ftc, length, strength);
			}
			
			ftcs.push(ftc);
			entity.addToWorld();
		}
		// REVIEW: why not return an anonymous function
		return addSphere;
	}());
	
	
	var addConnection = (function() {
		var mid = new Vector3();
		function connectionCallback(ftc1, ftc2) {
			if(ftc1 && ftc2) {
				// REVIEW: accessing a private member
				mid.setv(ftc1._pos).addv(ftc2._pos).muld(.5,.5,.5);
				this.transformComponent.transform.translation.setv(mid);
				
				mid.setv(ftc1._pos).subv(ftc2._pos);
				this.transformComponent.transform.rotation.lookAt(mid, Vector3.UNIT_Y);
				this.transformComponent.transform.scale.setd(1, 1, mid.length());
				this.transformComponent.setUpdated();
			}
		}
	
		var binder = ShapeCreator.createBox(.3, .3, 1, 1, 1);
		var binderMdc = new MeshDataComponent(binder);

		var binderMaterial = Material.createMaterial(ShaderLib.simpleLit);
		// REVIEW: .uniforms is missing here.
		binderMaterial.materialAmbient = [.6, .6, .6];

		var binderMrc = new MeshRendererComponent();
		binderMrc.materials.push(binderMaterial);
		binderMrc.cullMode = 'Never';
	
		function addConnection(ftc1, ftc2, length, strength) {
			ftc1.connect(ftc2, length, strength);
	
			// Edge visualizers
			var edgeEntity = goo.world.createEntity();
			edgeEntity.setComponent(binderMrc);
			edgeEntity.setComponent(binderMdc);
			edgeEntity.addToWorld();
		
			ftc1.addCallback(connectionCallback.bind(edgeEntity, ftc1, ftc2));
		}
		
		return addConnection;
	}());
	
	function addPicker(callback) {
		var picking = new PickingSystem();
		picking.setPickLogic(new PrimitivePickLogic());
		goo.world.setSystem(picking);

		picking.onPick = function(pickedList) {
			console.log(pickedList);
			if (pickedList && pickedList.length) {
				if(callback) callback(pickedList);
				// REVIEW: maybe add a console.log if the callback is missing
			}
		}


		function pickEntity(x, y) {
			var camera = goo.renderSystem.camera
			var width = goo.renderer.viewportWidth
			var height = goo.renderer.viewportHeight
			var ray = new Ray()

			camera.getPickRay(x, y, width, height, ray)
			picking.pickRay = ray

			// REVIEW: accessing a private member
			picking._process()
		}

		var startX = 0
		var startY = 0

		goo.renderer.domElement.addEventListener('mousedown', function(e) {
			startX = e.offsetX
			startY = e.offsetY
		});
		document.body.addEventListener('mouseup', function(e) {
			if (e.offsetX === startX && e.offsetY === startY) {
				pickEntity(startX, startY);		
			}
		});
	}
	
	init();
});
});