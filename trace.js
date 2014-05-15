'use strict';


window.onload = raytrace;

var stopVid;
function raytrace() {
  stopVid = true;
  document.getElementById('output').innerText = "0 %";
  var start = new Date().getTime();

  var c = document.querySelector('#canvas');
  var ctx = c.getContext('2d');

  var drawRaster = false;
  var nPix = 500;
  var pixel = c.width / nPix;
  var light = [1, 2, 0];
  var light2 = [-1, 3, -10];

  console.log('picture dimensions: ' + c.width + ', ' + c.height);
  console.log('number of pixels: ' + nPix);
  console.log('pixel width: ' + pixel);

  var world = {objs:
               [{center: [-0.5, 0.25, -8], radius: 1, col: 0, type: 'sphere'},
                {center: [0.7, 0.4, -2.2], radius: 0.05, col: 0, type: 'sphere'},
                {center: [1, 1, -5], radius: 0.05, col: 0, type: 'sphere'},
                {center: [0.12, 0.9, -5], radius: 0.05, col: 0, type: 'sphere'},
                {center: [-1.7, 0.5, -7], radius: 0.05, col: 0, type: 'sphere'},
                {center: [0.5, 0.25, -7.6], radius: 1, col: 0, type: 'sphere'},
                {center: [0, -0.3, 0], normal: [0, 1, 0], col: 2, type: 'plane'}],
               lights: [light, light2] };


  var paintPixel = function(x, y, col) {
    ctx.fillStyle = col;
    ctx.fillRect(Math.floor(x * pixel), Math.floor(y * pixel), Math.ceil(pixel), Math.ceil(pixel));
  };

  var paint = function(img) {
    for (var y = 0; y < img.length; y++) {
      for (var x = 0; x < img[y].length; x++) {
        paintPixel(x, y, img[y][x]);
      }
    }
  };

  var workers = [];
  for (var i = 0; i < 6; i++) {
    workers.push(new Worker('render.js'));
  }
  var curWorker = 0;

  var nFrames = document.getElementById('numFrames').value || 1;
  var finishedFrames = 0;
  var frames = [];
  for (var k = 0; k < workers.length; k++) {
    workers[k].addEventListener('message', function(e) {
      frames[e.data.idx] = e.data.img;
      finishedFrames++;
      console.log('done rendering frame');

      document.getElementById('output').innerText = (100 * finishedFrames / nFrames) + " %";
    });
  }

  for (var j = 0; j < nFrames; j++) {
    world.objs[1].center[0] -= (0.2 * 1/3);

    var job = {
      idx: j,
      nPix: nPix,
      pixel: pixel,
      sphereRadius: 1,
      world: world
    };

    workers[curWorker++ % workers.length].postMessage(job);
  }

  var awaitRendering = function() {
    if (finishedFrames < nFrames) {
      setTimeout(awaitRendering, 100);
    } else {
      var end = new Date().getTime();
      console.log( 'rendering took: ' + ((end - start) / 1000) + ' seconds' );

      stopVid = false;
      showVid();
    }
  };
  awaitRendering();

  var showVid = function() {
    var forEver = function(f) {
      f();
      if (!stopVid) {
        requestAnimationFrame(function() {
          forEver(f);
        });
      }
    };

    if (frames.length == 1) {
      paint(frames[0]);
    } else {
      var cnt = 0;
      forEver(function() {
        paint(frames[cnt++]);
        if (cnt >= frames.length) cnt = 0;
      });
    }
  };

};
