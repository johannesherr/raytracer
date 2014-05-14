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

      var l1 = getLight(world.lights[0]);
      var l2 = getLight(world.lights[1]);
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
    for (var i = 0; i < world.objs.length; i++) {
      var obj = world.objs[i];

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

  var draw = function(nPix, pixel, sphereRadius, light, light2, world) {
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

addEventListener('message', function(e) {
  postMessage({idx: e.data.idx, img: draw(e.data.nPix, e.data.pixel, e.data.sphereRadius, e.data.light, e.data.light2, e.data.world)});
});
