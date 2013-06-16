var identity = [[1,0,0,0],
                [0,1,0,0],
                [0,0,1,0],
                [0,0,0,1]];

var camera = [0, 0, 150];
var light = [250,-250,500];

var angle = 0.0;
var normalSize = 15.0;

var drawing = false;
var red = 255, green = 255, blue = 255;

var canv = document.getElementById('myCanvas');
var out = document.getElementById('out');
var modelSelect = document.getElementById('model');
var showNormals = document.getElementById('normals');
var showEdges = document.getElementById('showEdges');
var info = document.getElementById('info');
var rotX = document.getElementById('rotX');
var rotY = document.getElementById('rotY');
var rotZ = document.getElementById('rotZ');
var xRot = document.getElementById('xRot');
var yRot = document.getElementById('yRot');
var zRot = document.getElementById('zRot');

var getRadians = function(degrees){
   return degrees * (Math.PI / 180);
};

var delay = function(){
   return parseInt(document.getElementById('delay').value);
};

var fill = function(){
   return document.getElementById('fill').checked;
};

var rotateMatrix = function(x,y,z){
   var output = identity.slice(0);

   x = getRadians(x);
   y = getRadians(y);
   z = getRadians(z);

   output[0][0] = Math.cos(y) * Math.cos(z);
   output[0][1] = -Math.cos(y) * Math.sin(z);
   output[0][2] = Math.sin(y);

   output[1][0] = (Math.cos(x) * Math.sin(z)) + (Math.sin(x) * Math.sin(y) * Math.cos(z));
   output[1][1] = (Math.cos(x) * Math.cos(z)) - (Math.sin(x) * Math.sin(y) * Math.sin(z));
   output[1][2] = -Math.sin(x) * Math.cos(y);

   output[2][0] = (Math.sin(x) * Math.sin(z)) - (Math.cos(x) * Math.sin(y) * Math.cos(z));
   output[2][1] = (Math.sin(x) * Math.cos(z)) + (Math.cos(x) * Math.sin(y) * Math.sin(z));
   output[2][2] = Math.cos(x) * Math.cos(y);

   return output;
};

var transform = function(points, matrix){
   var output = [];

   for(var v = 0; v < points.length; v++){
      output[v] = [];
      output[v][0] = (points[v][0] * matrix[0][0]) +
                     (points[v][1] * matrix[0][1]) +
                     (points[v][2] * matrix[0][2]);

      output[v][1] = (points[v][0] * matrix[1][0]) +
                     (points[v][1] * matrix[1][1]) +
                     (points[v][2] * matrix[1][2]);

      output[v][2] = (points[v][0] * matrix[2][0]) +
                     (points[v][1] * matrix[2][1]) +
                     (points[v][2] * matrix[2][2]);
   };

   return output;
};

var project = function(shape){
   var output = [];

   for(var v in shape){
      var vertex = shape[v];
      output[v] = [];

      output[v][0] = camera[2] * (vertex[0]-camera[0]) / (camera[2] + vertex[2]) + camera[0]; // X
      output[v][1] = camera[2] * (vertex[1]-camera[1]) / (camera[2] + vertex[2]) + camera[1]; // Y
   }

   return output;
};

var normalise = function(v){
   var output = v.slice(0);

   // calculate vector magnitude
   var magnitude = Math.sqrt(output[0] * output[0] +
                             output[1] * output[1] +
                             output[2] * output[2]);

   // normalise vector;
   output[0] /= magnitude;
   output[1] /= magnitude;
   output[2] /= magnitude;

   return output;
};

var calculateNormal = function(points, triangle){
   var u = [points[triangle[1]][0] - points[triangle[0]][0],
            points[triangle[1]][1] - points[triangle[0]][1],
            points[triangle[1]][2] - points[triangle[0]][2]];

   var v = [points[triangle[2]][0] - points[triangle[0]][0],
            points[triangle[2]][1] - points[triangle[0]][1],
            points[triangle[2]][2] - points[triangle[0]][2]];

   // Calculate cross product.
   var normal = [(u[1] * v[2]) - (u[2] * v[1]),
                 (u[2] * v[0]) - (u[0] * v[2]),
                 (u[0] * v[1]) - (u[1] * v[0])];

   return normalise(normal);
};

var plotObject = function(original, shape, object, xOff, yOff, scale, ctx){
   var polysDrawn = 0;

   for(var i = 0; i < object.triangles.length; i++){
      var t = object.triangles[i];

      var normal = calculateNormal(original, t);
      var camVertex = normalise(camera);
      var camAngle = camVertex[0] * normal[0] + camVertex[1] * normal[1] + camVertex[2] * normal[2];

      if(camAngle > 0 || !fill()) {
         polysDrawn++;

         var lightVertex = normalise(light);
         var lightAngle = lightVertex[0] * normal[0] + lightVertex[1] * normal[1] + lightVertex[2] * normal[2];
         lightAngle = lightAngle < 0 ? 0 : lightAngle;

         ctx.lineWidth = 1;
         ctx.beginPath();

         var redRatio = (((red * 0.9) * lightAngle) + (red * 0.1)).toFixed(0);
         var greenRatio = (((green * 0.9) * lightAngle) + (green * 0.1)).toFixed(0);
         var blueRatio = (((blue * 0.9) * lightAngle) + (blue * 0.1)).toFixed(0);

         ctx.fillStyle = 'rgb(' + redRatio + ',' + greenRatio + ',' + blueRatio + ')';

         ctx.moveTo(xOff + shape[t[0]][0] * scale, yOff + shape[t[0]][1] * scale);
         for(var j=0; j < t.length; j++){
            ctx.lineTo(xOff + (shape[t[j]][0] * scale), yOff + (shape[t[j]][1] * scale));
         }

         ctx.closePath();
         if(fill()) ctx.fill();

         ctx.strokeStyle = (showEdges.checked || !fill()) ? ((camAngle > 0) ? '#900' : '#400') : ctx.fillStyle;
         ctx.stroke();

         if(showNormals.checked){
            var nXs = camera[2] * (object.normals[i][0] - camera[0]) / (camera[2] + object.normals[i][2]) + camera[0];
            var nYs = camera[2] * (object.normals[i][1] - camera[1]) / (camera[2] + object.normals[i][2]) + camera[1];

            var nXf = (camera[2] * ((object.normals[i][0] + ((normal[0] / scale) * normalSize)) - camera[0])) / (camera[2] + (object.normals[i][2] + ((normal[2] / scale) * normalSize))) + camera[0];
            var nYf = (camera[2] * ((object.normals[i][1] + ((normal[1] / scale) * normalSize)) - camera[1])) / (camera[2] + (object.normals[i][2] + ((normal[2] / scale) * normalSize))) + camera[1];

            ctx.beginPath();
            ctx.strokeStyle = camAngle > 0 ? '#0b0' : '#050';
            ctx.lineWidth = 3;
            ctx.moveTo(xOff + (nXs * scale), yOff + (nYs * scale));
            ctx.lineTo(xOff + (nXf * scale), yOff + (nYf * scale));
            ctx.stroke();
         }
      }
   }

   document.getElementById('count').innerText = ' (' +polysDrawn + ' rendered)';
};

var sortByZIndex = function(transformedPoints, object){
   object.triangles.sort(function(a,b){
      var aDistance = 0;
      for(var i=0; i<a.length; i++){
         aDistance += transformedPoints[a[i]][2];
      }

      var bDistance = 0;
      for(var i=0; i<b.length; i++){
         bDistance += transformedPoints[b[i]][2];
      }

      return aDistance - bDistance;
   });
};

var calculateCenter = function(points, obj){
   for(var t = 0; t<obj.triangles.length; t++){
      var triangle = obj.triangles[t];
      var cX = 0, cY = 0, cZ = 0;

      for(var v=0; v<triangle.length; v++){
         cX += points[triangle[v]][0];
         cY += points[triangle[v]][1];
         cZ += points[triangle[v]][2];
      }

      cX /= triangle.length;
      cY /= triangle.length;
      cZ /= triangle.length;

      obj.normals[t] = [cX, cY, cZ];
   }
};

var plotShape = function(obj, ctx){
   var transformedPoints = transform(obj.points, rotateMatrix(parseFloat(xRot.value), parseFloat(yRot.value), parseFloat(zRot.value)));
   sortByZIndex(transformedPoints, obj);

   if(showNormals.checked)
      calculateCenter(transformedPoints, obj);

   var twoDPoints = project(transformedPoints);
   plotObject(transformedPoints, twoDPoints, obj, 240, 240, 120.0, ctx);
};

var clearCanvas = function(ctx){
   ctx.fillStyle = '#000';
   ctx.clearRect(0, 0, 480, 480);
};

var fixIndexing = function(obj){
   if(obj){
      // Correct for 1-based indexing in exported data.
      for(var i=0; i < obj.triangles.length; i++) {
         for(var j=0; j < obj.triangles[i].length; j++)
            obj.triangles[i][j] -= 1;
      }
   }
};

var displayInfo = function(obj){
   info.innerText = 'Points: ' + obj.points.length + ', polygons: ' + obj.triangles.length;
};

var setColor = function(r, g, b){
   red = parseInt(r);
   green = parseInt(g);
   blue = parseInt(b);
};

var renderSelectedModel = function(){
   clearCanvas(context);

   switch(modelSelect.value){
      default:
      case '0':
         plotShape(cubeObject, context);
         displayInfo(cubeObject);
         break;

      case '1':
         plotShape(sphereObject, context);
         displayInfo(sphereObject);
         break;

      case '2':
         plotShape(torusObject, context);
         displayInfo(torusObject);
         break;

      case '3':
         plotShape(chimpObject, context);
         displayInfo(chimpObject);
         break;

      case '4':
         plotShape(cogObject, context);
         displayInfo(cogObject);
         break;

      case '5':
         plotShape(uvSphereObject, context);
         displayInfo(uvSphereObject);
         break;
   }

   if(rotX.checked) xRot.value = (parseFloat(xRot.value) + 0.5) % 360;
   if(rotY.checked) yRot.value = (parseFloat(yRot.value) + 0.5) % 360;
   if(rotZ.checked) zRot.value = (parseFloat(zRot.value) + 0.5) % 360;

   angle += 0.5;
   angle = angle % 360;

   setTimeout(renderSelectedModel, delay());
};

fixIndexing(cogObject);
fixIndexing(cubeObject);
fixIndexing(torusObject);
fixIndexing(chimpObject);
fixIndexing(uvSphereObject);

if(canv && canv.getContext){
   var context = canv.getContext('2d');

   if(context){
      renderSelectedModel();
   }
}