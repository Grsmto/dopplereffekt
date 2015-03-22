Physijs.scripts.worker = '/javascripts/vendors/physijs_worker.js';
Physijs.scripts.ammo = '/javascripts/vendors/ammo.js';

var SCREEN_WIDTH = document.documentElement.clientWidth;
var SCREEN_HEIGHT = document.documentElement.clientHeight;

var container, stats;
var camera, scene, renderer, sphere, intersectPlane;

var raycaster;

var mousePosition;

var selectedObject = null;

var controls;

var mouse = new THREE.Vector3(), INTERSECTED;

var worldWidth = 128, worldDepth = 128,
    worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;

var clock = new THREE.Clock();

var _v3 = new THREE.Vector3;

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    scene = new Physijs.Scene();

    scene.setGravity(new THREE.Vector3( 0, -1000, 0 ));

    scene.fog = new THREE.FogExp2( 0x111111, 0.001 );

    data = generateHeight( worldWidth, worldDepth );

    camera = new THREE.PerspectiveCamera( 50, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 10000 );
    camera.position.z = 500;
    camera.position.x = -800;
    camera.position.y = 400;


    controls = new THREE.FirstPersonControls( camera );
                    controls.movementSpeed = 600;
                    controls.lookSpeed = 0.15;

    raycaster = new THREE.Raycaster();

    intersectPlane = new THREE.Mesh(
        new THREE.PlaneGeometry( 1200, 1200 ),
        new THREE.MeshBasicMaterial({ opacity: 0, transparent: true })
    );

    scene.add(intersectPlane);

    var ground = new THREE.PlaneGeometry( 7500, 7500, worldWidth - 1, worldDepth - 1 );

    ground.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

    // var vertices = ground.attributes.position.array;

    // for ( var i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
    //     vertices[ j + 1 ] = data[ i ] * 1.5;
    // }

    texture = new THREE.Texture( generateTexture( data, worldWidth, worldDepth ), THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping );
    texture.needsUpdate = true;

    // var material = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true } ); //new THREE.MeshBasicMaterial( { map: texture } )
    var material = Physijs.createMaterial(
                        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }),
                        .8, // high friction
                        .5 // low restitution
                    );
    var plane = new Physijs.PlaneMesh( ground, material, 0 );
    scene.add( plane );

    var sphereMaterial = Physijs.createMaterial(
                            new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }),
                            .6, // medium friction
                            1 // low restitution
                        );
    sphere = new Physijs.SphereMesh( new THREE.SphereGeometry( 100, 16, 8 ), sphereMaterial );
    
    sphere.position.y = 400;

    scene.add( sphere );

    // Box
    box = new Physijs.BoxMesh(
        new THREE.BoxGeometry( 100, 100, 100 ),
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
    );
    box.position.y = 700;
    box.position.z = 100;

    scene.add( box );

    // var geometry = new THREE.Geometry();

    // for ( var i = 0; i < 10000; i ++ ) {

    //     var vertex = new THREE.Vector3();
    //     vertex.x = THREE.Math.randFloatSpread( 2000 );
    //     vertex.y = THREE.Math.randFloatSpread( 2000 );
    //     vertex.z = THREE.Math.randFloatSpread( 2000 );

    //     geometry.vertices.push( vertex );

    // }

    // var particles = new THREE.PointCloud( geometry, new THREE.PointCloudMaterial( { color: 0x888888 } ) );
    // scene.add( particles );

    //


    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    renderer.domElement.style.position = "relative";
    container.appendChild( renderer.domElement );

    renderer.autoClear = false;


    stats = new Stats();
    container.appendChild( stats.domElement );


    window.addEventListener( 'resize', onWindowResize, false );

    renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
    renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
    renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );


    scene.addEventListener('update', function() {
        if (selectedObject !== null) {

            intersectPlane.position.copy(camera.position);
            intersectPlane.position.add(THREE.Utils.cameraLookDir(camera).multiplyScalar(500));
            
            // _v3.copy(mouse).sub(selectedObject.position).multiplyScalar(5);
            _v3.copy(intersectPlane.position).sub(selectedObject.position).multiplyScalar(5);
            // _v3 = intersectPlane.position.copy;
            // intersectPlane.position.copy(camera.position);
            // intersectPlane.position.add(THREE.Utils.cameraLookDir(camera).multiplyScalar(300));

            selectedObject.setLinearVelocity( _v3 );
            
            // // Reactivate all of the blocks
            // _v3.set( 0, 0, 0 );
            // for ( _i = 0; _i < blocks.length; _i++ ) {
            //     blocks[_i].applyCentralImpulse( _v3 );
            // }
        }

        intersectPlane.lookAt(camera.position);

        scene.simulate();
    });


    requestAnimationFrame(render);
    scene.simulate();
}

function onDocumentMouseDown( event ) {
    event.preventDefault();

    var mouseX = ( event.clientX / window.innerWidth ) * 2 - 1;
    var mouseY = - ( event.clientY / window.innerHeight ) * 2 + 1;

    var mouseVector = new THREE.Vector3( mouseX, mouseY, 0.5 ).unproject( camera );

    var raycaster = new THREE.Raycaster( camera.position, mouseVector.sub( camera.position ).normalize() );

    var intersects = raycaster.intersectObjects([ sphere, box ]);

    if ( intersects.length > 0 ) {

        var strength = 35, distance, effect, offset;
        selectedObject = intersects[0].object;

        mouse.copy(intersects[0].point);

        var vector = new THREE.Vector3(0, 0, 0);

        selectedObject.setAngularFactor( vector );
        selectedObject.setAngularVelocity( vector );
        selectedObject.setLinearFactor( vector );
        selectedObject.setLinearVelocity( vector );

        // intersectPlane.position.copy(mouse);
    }

}

function onDocumentMouseMove( event ) {
    event.preventDefault();

    var mouseX = ( event.clientX / window.innerWidth ) * 2 - 1;
    var mouseY = - ( event.clientY / window.innerHeight ) * 2 + 1;

    var vector = new THREE.Vector3(0, 0, 0);
    var mouseVector = new THREE.Vector3( mouseX, mouseY, 0.5 ).unproject( camera );

    if (selectedObject !== null) {
        var raycaster = new THREE.Raycaster( camera.position, mouseVector.sub( camera.position ).normalize() );
        var intersects = raycaster.intersectObject(intersectPlane);
        // console.log(intersects)
        intersectPlane.x = intersects[0].point.x;
        intersectPlane.y = intersects[0].point.y;
    }
}

function onDocumentMouseUp( event ) {
    event.preventDefault();

    if ( selectedObject !== null ) {
        var vector = new THREE.Vector3(1, 1, 1);
        selectedObject.setAngularFactor(vector);
        selectedObject.setLinearFactor(vector);
        
        selectedObject = null;
    }
}

function applyForce() {
    if (!mousePosition) return;
    var strength = 35, distance, effect, offset, box;
    
    for ( var i = 0; i < boxes.length; i++ ) {
        box = boxes[i];
        distance = mousePosition.distanceTo( box.position ),
        effect = mousePosition.clone().sub( box.position ).normalize().multiplyScalar( strength / distance ).negate(),
        offset = mousePosition.clone().sub( box.position );
        box.applyImpulse( effect, offset );
    }
}

//

function onWindowResize( event ) {

    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();
}

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    controls.update(clock.getDelta());
    stats.update();
}

function generateHeight( width, height ) {

    var size = width * height, data = new Uint8Array( size ),
    perlin = new ImprovedNoise(), quality = 1, z = Math.random() * 100;

    for ( var j = 0; j < 4; j ++ ) {

        for ( var i = 0; i < size; i ++ ) {

            var x = i % width, y = ~~ ( i / width );
            data[ i ] += Math.abs( perlin.noise( x / quality, y / quality, z ) * quality * 1.75 );

        }

        quality *= 5;

    }

    return data;

}


function generateTexture( data, width, height ) {

    var canvas, canvasScaled, context, image, imageData,
    level, diff, vector3, sun, shade;

    vector3 = new THREE.Vector3( 0, 0, 0 );

    sun = new THREE.Vector3( 1, 1, 1 );
    sun.normalize();

    canvas = document.createElement( 'canvas' );
    canvas.width = width;
    canvas.height = height;

    context = canvas.getContext( '2d' );
    context.fillStyle = '#000';
    context.fillRect( 0, 0, width, height );

    image = context.getImageData( 0, 0, canvas.width, canvas.height );
    imageData = image.data;

    for ( var i = 0, j = 0, l = imageData.length; i < l; i += 4, j ++ ) {

        vector3.x = data[ j - 2 ] - data[ j + 2 ];
        vector3.y = 2;
        vector3.z = data[ j - width * 2 ] - data[ j + width * 2 ];
        vector3.normalize();

        shade = vector3.dot( sun );

        imageData[ i ] = ( 96 + shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
        imageData[ i + 1 ] = ( 96 + shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
        imageData[ i + 2 ] = ( 96 + shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );

    }

    context.putImageData( image, 0, 0 );

    // Scaled 4x

    canvasScaled = document.createElement( 'canvas' );
    canvasScaled.width = width * 4;
    canvasScaled.height = height * 4;

    context = canvasScaled.getContext( '2d' );
    context.scale( 4, 4 );
    context.drawImage( canvas, 0, 0 );

    image = context.getImageData( 0, 0, canvasScaled.width, canvasScaled.height );
    imageData = image.data;

    for ( var i = 0, l = imageData.length; i < l; i += 4 ) {

        var v = ~~ ( Math.random() * 5 );

        imageData[ i ] += v;
        imageData[ i + 1 ] += v;
        imageData[ i + 2 ] += v;

    }

    context.putImageData( image, 0, 0 );

    return canvasScaled;

}


$(document).ready(function() {
    init();
});


THREE.Utils = {
    cameraLookDir: function(camera) {
        var vector = new THREE.Vector3(0, 0, -1);
        vector.applyEuler(camera.rotation, camera.rotation.order);
        return vector;
    }
};