require({
	paths: {
		// Adjust depending of from where you serve goo
		'goo': '/js/goo'
	}
}, [/*goo*/], function() {
require(
[
	'SimpleWorld',
	'goo/loaders/Loader',
	'goo/loaders/SceneLoader',
	'goo/shapes/ShapeCreator',
	'goo/entities/EntityUtils',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/Material',
	'goo/math/MathUtils',
	'ForceTreeComponent',
	'ForceTreeSystem',
	'goo/entities/components/MeshRendererComponent',
	'goo/entities/components/MeshDataComponent'
], function(
	SimpleWorld,
	Loader,
	SceneLoader,
	ShapeCreator,
	EntityUtils,
	ShaderLib,
	Material,
	MathUtils,
	ForceTreeComponent,
	ForceTreeSystem,
	MeshRendererComponent,
	MeshDataComponent
) {
	"use strict";

	// Setting up the goo engine and with a camera and camera controls
	var goo = SimpleWorld.createTypicalRunner();


	// A plane
	var box = ShapeCreator.createBox(0.1, 0.1, 0.1, 1, 1);
	var boxEntity = EntityUtils.createTypicalEntity(goo.world, box);
	
	var boxMat = Material.createMaterial(ShaderLib.simpleLit);
	boxMat.uniforms.materialAmbient = [0.2, 0.2, 0.2, 1];
	boxMat.uniforms.materialDiffuse = [0.6, 0.6, 0.6, 1];
	boxEntity.meshRendererComponent.materials.push(boxMat);
	
	boxEntity.addToWorld();
	
	// Force directed tree system
	var fts = new ForceTreeSystem({
		gravity: 100
	});
	goo.world.setSystem(fts);
	
	
	// Sphere setup
	var sphere = ShapeCreator.createSphere(12, 12, 1e-1);
	var mdc = new MeshDataComponent(sphere);
	
	var sphereShader = Material.createShader(ShaderLib.simpleLit, 'simplelit');
	var sphereMat = Material.createMaterial(ShaderLib.simpleLit)
	sphereMat.uniforms.materialAmbient = [0.2,0.2,0.2,1];
	sphereMat.uniforms.materialDiffuse = [1.0,0.2,1.0,1];
	
	function rnd() {
		return (Math.random() - .5);
	}
	// Bunch of spheres
	var count = 100;
	
	var ftcs = [];
	for (var i = 0; i < count; i++) {
		var entity = goo.world.createEntity();
		var mrc = new MeshRendererComponent();
		var material = Material.createMaterial(ShaderLib.simpleLit);
		if(i < 2) {
			material.uniforms.materialAmbient = [0,1,0,1];		
		} else {
			material.uniforms.materialAmbient = [.7*i/count, 0, .7*(1-i/count), 1];
		}
		material.uniforms.materialDiffuse = [ .1, .1, .1, 1];
		mrc.materials.push(material);
		entity.setComponent(mrc);
		entity.setComponent(mdc);
		
		var charge = (Math.random()+.5) * 1e-3;
		var ftc = new ForceTreeComponent({
			charge: charge
		})
		charge *= 1e3;
		charge = (charge - 1)*5 + 1;
		entity.setComponent(ftc);
		ftcs.push(ftc);
		entity.transformComponent.transform.translation.setd(rnd(), rnd(), rnd());
		entity.transformComponent.transform.scale.setd(charge, charge, charge);
		entity.addToWorld();
	}
	
	ftcs[0].connect(ftcs[1], 0.3, 1);
	
	// Bunch of edges
	/*var cylinder = ShapeCreator.createBox(1,0.1,0.1,1,1);
	
	var entity = goo.world.createEntity();
	var mrc = new MeshRendererComponent();
	var mdc2 = new MeshDataComponent(cylinder);
	var material = Material.createMaterial(ShaderLib.simpleLit);
	mrc.materials.push(material);
	entity.setComponent(mrc);
	entity.setComponent(mdc2);
	entity.setComponent(new ForceTreeComponent({
		type: 'edge'
	}));
	//entity.addToWorld();
	*/
	
	document.body.addEventListener('click', function() {
		var entity = goo.world.createEntity();
		var mrc = new MeshRendererComponent();
		var material = Material.createMaterial(ShaderLib.simpleLit);
		material.uniforms.materialAmbient = [.7, .7, .7, 1];
		material.uniforms.materialDiffuse = [ .1, .1, .1, 1];
		mrc.materials.push(material);
		entity.setComponent(mrc);
		entity.setComponent(mdc);
		entity.setComponent(new ForceTreeComponent({
			nodes: [ftcs[0], ftcs[1]]
		}));
		entity.transformComponent.transform.translation.setd(8*rnd(), 8*rnd(), 8*rnd());
		entity.addToWorld();
	});
});
});