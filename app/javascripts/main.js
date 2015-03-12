Physijs.scripts.worker = '/javascripts/vendors/physijs_worker.js';
Physijs.scripts.ammo = '/javascripts/vendors/ammo.js';

var SCREEN_WIDTH = document.documentElement.clientWidth;
var SCREEN_HEIGHT = document.documentElement.clientHeight;

var container, stats;
var camera, scene, renderer, mesh;
var cameraRig, activeCamera, activeHelper;
var cameraPerspective, cameraOrtho;
var cameraPerspectiveHelper, cameraOrthoHelper;

var controls;

var worldWidth = 256, worldDepth = 256,
    worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;

var clock = new THREE.Clock();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    scene = new THREE.Scene();

    scene.fog = new THREE.FogExp2( 0x111111, 0.001 );

    data = generateHeight( worldWidth, worldDepth );

    camera = new THREE.PerspectiveCamera( 50, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 10000 );
    camera.position.z = 1000;

    camera.position.y = data[ worldHalfWidth + worldHalfDepth * worldWidth ] * 10 - 500;

    controls = new THREE.FirstPersonControls( camera );
                    controls.movementSpeed = 150;
                    controls.lookSpeed = 0.1;

    var geometry = new THREE.PlaneBufferGeometry( 7500, 7500, worldWidth - 1, worldDepth - 1 );

    geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

    var vertices = geometry.attributes.position.array;

    for ( var i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
        vertices[ j + 1 ] = data[ i ] * 1.5;
    }

    texture = new THREE.Texture( generateTexture( data, worldWidth, worldDepth ), THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping );
    texture.needsUpdate = true;

    var material = new THREE.MeshBasicMaterial( { map: texture } );
    var plane = new THREE.Mesh( geometry, material );
    scene.add( plane );

    mesh = new THREE.Mesh( new THREE.SphereGeometry( 100, 16, 8 ), new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true } ) );
    
    mesh.position.y = 400;

    scene.add( mesh );


    var geometry = new THREE.Geometry();

    for ( var i = 0; i < 10000; i ++ ) {

        var vertex = new THREE.Vector3();
        vertex.x = THREE.Math.randFloatSpread( 2000 );
        vertex.y = THREE.Math.randFloatSpread( 2000 );
        vertex.z = THREE.Math.randFloatSpread( 2000 );

        geometry.vertices.push( vertex );

    }

    var particles = new THREE.PointCloud( geometry, new THREE.PointCloudMaterial( { color: 0x888888 } ) );
    scene.add( particles );

    //


    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    renderer.domElement.style.position = "relative";
    container.appendChild( renderer.domElement );

    renderer.autoClear = false;

    //

    stats = new Stats();
    container.appendChild( stats.domElement );

    //

    window.addEventListener( 'resize', onWindowResize, false );

}

//

function onWindowResize( event ) {

    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();
}

//

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();

}


function render() {

    // var r = Date.now() * 0.0005;

    // mesh.position.x = 700 * Math.cos( r );
    // mesh.position.z = 700 * Math.sin( r );
    // mesh.position.y = 700 * Math.sin( r );
    mesh.rotateOnAxis(new THREE.Vector3( 0, 1, 0 ), Math.PI/100);

    // camera.lookAt( mesh.position );

    controls.update( clock.getDelta() );

    // renderer.clear();

    renderer.render( scene, camera );

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
    animate();
});
