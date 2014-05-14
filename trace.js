'use strict';

var m = (function() {
  var module = {};
  module.dotProduct = function(vecA, vecB) {
    var ret = 0;
    for (var i = 0; i < vecA.length; i++) {
      ret += vecA[i] * vecB[i];
    }
    return ret;
  };

  module.solveQuad = function(a, b, c) {
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
  };
  module.sq = function(x) {
    return x * x;
  };
  module.sum = function(a, b) {
    return a + b;
  };

  module.intersectSphere = function(rayDirection, rayOrigin, sphereCenter, sphereRadius) {
    var ray = rayDirection;
    var origin = rayOrigin;
    var center = sphereCenter;

    var a = module.dotProduct(ray, ray);
    var b = 2 * (ray[0] * (origin[0] - center[0]) +
                 ray[1] * (origin[1] - center[1]) +
                 ray[2] * (origin[2] - center[2]));
    var c = module.sq(origin[0] - center[0]) +
          module.sq(origin[1] - center[1]) +
          module.sq(origin[2] - center[2]) -
          sphereRadius;

    var solutions = module.solveQuad(a, b, c);
    var ret = [];
    for (var i = 0; i < solutions.length; i++) {
      if (solutions[i] > 0.001)
        ret.push(solutions[i]);
    }
    return ret;
  };

  module.vecMult = function(scalar, vector) {
    var ret = new Array(vector.length);
    for (var i = 0; i < ret.length; i++) {
      ret[i] = scalar * vector[i];
    }
    return ret;
  };

  module.vecAdd = function(vecA, vecB) {
    var ret = new Array(vecA.length);
    for (var i = 0; i < ret.length; i++) {
      ret[i] = vecA[i] + vecB[i];
    }
    return ret;
  };

  module.vecSub = function(vecA, vecB) {
    var ret = new Array(vecA.length);
    for (var i = 0; i < ret.length; i++) {
      ret[i] = vecA[i] - vecB[i];
    }
    return ret;
  };

  module.length = function(v) {
    return Math.sqrt(module.dotProduct(v, v));
  };

  module.normalize = function(v) {
    return module.vecMult(1 / m.length(v), v);
  };

  module.mirror = function(normal, v) {
    normal = module.normalize(normal);
    v = module.normalize(v);
    var t = Math.abs(module.dotProduct(normal, v));
    var base = module.vecMult(t, normal);

    return module.vecAdd(base, module.vecSub(base, v));
  };

  return module;
}());

window.onload = function() {
  var start = new Date().getTime();

  var c = document.querySelector('#canvas');
  var ctx = c.getContext('2d');

  var drawRaster = false;
  var nPix = 500;
  var pixel = c.width / nPix;
  var sphereRadius = 1;
//  var light = [2.5, 3, 0];
  var light = [1, 2, 0];
  var light2 = [-1, 3, -10];

  console.log('picture dimensions: ' + c.width + ', ' + c.height);
  console.log('number of pixels: ' + nPix);
  console.log('pixel width: ' + pixel);

  var world = [{center: [-0.5, 0.25, -8], radius: 1, col: 'yellow'},
               {center: [1.2, 0.52, -4.2], radius: 0.05, col: 'yellow'},
//               {center: [0.7, 0.52, -4.2], radius: 0.05, col: 'yellow'},
               {center: [1, 1, -5], radius: 0.05, col: 'yellow'},
               {center: [0.12, 0.9, -5], radius: 0.05, col: 'yellow'},
               {center: [-1.7, 0.5, -7], radius: 0.05, col: 'yellow'},
               {center: [0.5, 0.25, -7.6], radius: 1, col: 'red'}];
//  var world = [{x: 0, y: 0, z: -3, col: 'green'}];

  var paintPixel = function(x, y, col) {
    ctx.fillStyle = col;
    ctx.fillRect(Math.floor(x * pixel), Math.floor(y * pixel), Math.ceil(pixel), Math.ceil(pixel));
  };

  var trace = function(ray, origin, world, limit) {
    if (limit === 0) return null;

    var result = intersect(ray, origin, world);

    if (result) {
      var hitPoint = m.vecAdd(m.vecMult(result.min, ray), origin);
      var normalDir = m.vecSub(hitPoint, result.obj.center);

      var getLight = function(light) {
        var dir2 = m.vecSub(light, hitPoint);
        var lightIsBlocked = intersect(dir2, hitPoint, world);

        var selectedColor = result.obj.col;
        var directLight;
        if (lightIsBlocked) {
          directLight = [100, 0, 0];
        } else {
          var amountOfLight = Math.abs(m.dotProduct(
            m.normalize(normalDir),
            m.normalize(dir2)));

          directLight = [Math.max(Math.floor(255 * amountOfLight), 100), 0, 0];
        }

        return directLight;
      };

      var mirrored = trace(m.mirror(normalDir, ray), hitPoint, world, limit - 1);

      var sum = [0,0,0];

      var l1 = getLight(light);
      var l2 = getLight(light2);
      for (i = 0; i < sum.length; i++) {
        sum[i] = Math.floor((l1[i] + l2[i]) * 0.7);
      }

      if (mirrored) {
        for (var i = 0; i < sum.length; i++) {
          sum[i] = Math.floor(sum[i] * 0.3 + mirrored[i] * 0.7);
        }
      }
      return sum;

    } else {
      return null;
    }
  };

  var intersect = function(ray, origin, world) {
    var hitObj = null;
    var col = null;
    var min = Number.MAX_VALUE;
    for (var i = 0; i < world.length; i++) {
      var obj = world[i];

      var intersections = m.intersectSphere(ray, origin, obj.center, obj.radius);

      if (intersections.length !== 0) {

        var curMin;
        if (intersections.length == 2) {
          curMin = Math.min(intersections[0], intersections[1]);
        } else {
          curMin = intersections[0];
        }

        if (curMin < min) {
          min = curMin;
          col = obj.col;
          hitObj = obj;
        }
      }
    }

    if (min != Number.MAX_VALUE) {
      return { obj: hitObj, min: min};
    } else {
      return null;
    }
  };

  var draw = function() {
    var img = [];
    for (var py = 0; py < nPix; py++) {
      var row = [];
      for (var px = 0; px < nPix; px++) {
        var ray = [
          (px + 0.5) / nPix - 0.5,
          0.5 - (py + 0.5) / nPix,
            -2
        ];

        var col = trace(ray, [0, 0, 0], world, 4);
        if (col) {
          row.push('rgb(' + col[0] + ', ' + col[1] + ', ' + col[2] + ')');
        } else {
          if (ray[1] > 0) {
            row.push('rgb(215, 215, 255)');
          } else {
            row.push('rgb(171, 255, 151)');
          }
        }
      }
      img.push(row);
    }
    return img;
  };

  var paint = function(img) {
    for (var y = 0; y < img.length; y++) {
      for (var x = 0; x < img[y].length; x++) {
        paintPixel(x, y, img[y][x]);
      }
    }
  };

  var nFrames = 1;
  var frames = [];
  for (var i = 0; i < nFrames; i++) {
    world[1].center[0] -= (0.2 * 1/3);
    frames.push(draw());
    console.log('done rendering frame ' + (i + 1));
  }

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

  if (drawRaster) {
    for (var c1 = 0; c1 < nPix; c1++) {
      for (var c2 = 0; c2 < nPix; c2++) {
        ctx.strokeStyle = '#BBB';
        ctx.strokeRect(c2 * pixel, c1 * pixel, pixel, pixel);
      }
    }
  }

  var end = new Date().getTime();
  console.log( 'rendering took: ' + ((end - start) / 1000) + ' seconds' );

};
