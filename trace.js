'use strict';


window.onload = function() {
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

  var world = {objs: [{center: [-0.5, 0.25, -8], radius: 1, col: 'yellow'},
               {center: [1.2, 0.52, -4.2], radius: 0.05, col: 'yellow'},
//               {center: [0.7, 0.52, -4.2], radius: 0.05, col: 'yellow'},
               {center: [1, 1, -5], radius: 0.05, col: 'yellow'},
               {center: [0.12, 0.9, -5], radius: 0.05, col: 'yellow'},
               {center: [-1.7, 0.5, -7], radius: 0.05, col: 'yellow'},
               {center: [0.5, 0.25, -7.6], radius: 1, col: 'red'}],
               lights: [light, light2] };
//  var world = [{x: 0, y: 0, z: -3, col: 'green'}];

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

  var worker1 = new Worker('render.js');
  var worker2 = new Worker('render.js');
  var curWorker = 0;
  var workers = [worker1, worker2];

  var nFrames = 20;
  var finishedFrames = 0;
  var frames = [];
  for (var i = 0; i < workers.length; i++) {
    workers[i].addEventListener('message', function(e) {
      frames[e.data.idx] = e.data.img;
      finishedFrames++;
      console.log('done rendering frame');

      document.getElementById('output').innerText = (100 * finishedFrames / nFrames) + " %";
    });
  }

  for (var i = 0; i < nFrames; i++) {
    world.objs[1].center[0] -= (0.2 * 1/3);

    var job = {
      idx: i,
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

      showVid();
    }
  };
  awaitRendering();

  var showVid = function() {
    var forEver = function(f) {
      f();
      requestAnimationFrame(function() {
        //    setTimeout(function() {
        forEver(f);
      }, 50);
    };

    var cnt = 0;
    forEver(function() {
      paint(frames[cnt++]);
      if (cnt >= frames.length) cnt = 0;
    });
  };

};
