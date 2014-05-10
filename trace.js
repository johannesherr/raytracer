'use strict';

var m = (function() {
  return {solveQuad: function(a, b, c) {
    var d = Math.pow(b, 2) - 4 * a * c;
    if (d < 0) {
      return [];
    } else {
      var solve = function(d, sig) {
        return (-b + sig * Math.sqrt(d)) / (2 * a);
      };
      var solutions = [solve(d, 1), solve(d, -1)];
      if (d === 0) {
        return solutions.slice(0, 1);
      } else {
        return solutions;
      }
    }
  }};
}());

window.onload = function() {
  var c = document.querySelector('#canvas');
  var ctx = c.getContext('2d');

  var drawRaster = false;
  var nPix = 500;
  var pixel = c.width / nPix;

  console.log('picture dimensions: ' + c.width + ', ' + c.height);
  console.log('number of pixels: ' + nPix);
  console.log('pixel width: ' + pixel);

  var world = [{x: 10, y: -7, z: -30, col: 'yellow'}, {x: 0.5, y: 0.25, z: -3, col: 'green'}];
//  var world = [{x: 0, y: 0, z: -3, col: 'green'}];

  var paintPixel = function(x, y, col) {
    ctx.fillStyle = col;
    ctx.fillRect(Math.floor(x * pixel), Math.floor(y * pixel), Math.ceil(pixel), Math.ceil(pixel));
  };

  var intersect = function(ray, world) {
    var col = null;
    var min = Number.MAX_VALUE;
    for (var i = 0; i < world.length; i++) {
      var obj = world[i];

      var p = function(x) {
        return Math.pow(x, 2);
      };
      var sum = function() {
        return Array.prototype.slice.apply(arguments).reduce(function(acc, b) {
          return acc + b;
        }, 0);
      };

      var origin = [0, 0, 0];
      var a = ray.map(p).reduce(function(acc, x) {
        return acc + x;
      }, 0);
      var b = 2 * (ray[0] * (origin[0] - obj.x) + ray[1] * (origin[1] - obj.y) + ray[2] * (origin[2] - obj.z));
      var c = p(origin[0] - obj.x) + p(origin[1] - obj.y) + p(origin[2] - obj.z) - 1;

      var intersections = m.solveQuad(a, b, c);

      if (intersections.length !== 0) {
        var curMin = intersections.reduce(function(a, b) {
          return Math.min(a, b);
        }, Number.MAX_VALUE);

        if (curMin < min) {
          min = curMin;
          col = obj.col;
        }
      }
    }
    return col;
  };


  for (var px = 0; px < nPix; px++) {
    for (var py = 0; py < nPix; py++) {

      var ray = [
        (px + 0.5) / nPix - 0.5,
        0.5 - (py + 0.5) / nPix,
        -1
      ];

      if (ray[1] > 0) {
        paintPixel(px, py, 'blue');
      } else {
        paintPixel(px, py, 'red');
      }

      var col = intersect(ray, world);
      if (col) {
        paintPixel(px, py, col);
      }

    }
  }

  if (drawRaster) {
    for (var c1 = 0; c1 < nPix; c1++) {
      for (var c2 = 0; c2 < nPix; c2++) {
        ctx.strokeStyle = '#BBB';
        ctx.strokeRect(c2 * pixel, c1 * pixel, pixel, pixel);
      }
    }
  }
};
