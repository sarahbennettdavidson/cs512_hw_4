// cube
const cubePos = new Float32Array([
  // front (z = 1)
  -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,
  // back (z = -1)
   1, -1, -1,  -1, -1, -1,  -1,  1, -1,   1,  1, -1,
  // top (y = 1)
  -1,  1,  1,   1,  1,  1,   1,  1, -1,  -1,  1, -1,
  // bottom (y = -1)
  -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,
  // right (x = 1)
   1, -1,  1,   1, -1, -1,   1,  1, -1,   1,  1,  1,
  // left (x = -1)
  -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1
]);

//this cube is one unit, for easier scaling,  center at 000 for rot, for hierarchical 
const unitCubePos = new Float32Array([
  // Front face (Z = +0.5)
  -0.5, 0.0,  0.5,
   0.5, 0.0,  0.5,
   0.5, 1.0,  0.5,
  -0.5, 1.0,  0.5,

  // Back face (Z = -0.5)
  -0.5, 0.0, -0.5,
  -0.5, 1.0, -0.5,
   0.5, 1.0, -0.5,
   0.5, 0.0, -0.5,

  // Top face (Y = 1.0)
  -0.5, 1.0, -0.5,
  -0.5, 1.0,  0.5,
   0.5, 1.0,  0.5,
   0.5, 1.0, -0.5,

  // Bottom face (Y = 0.0)
  -0.5, 0.0, -0.5,
   0.5, 0.0, -0.5,
   0.5, 0.0,  0.5,
  -0.5, 0.0,  0.5,

  // Right face (X = +0.5)
   0.5, 0.0, -0.5,
   0.5, 1.0, -0.5,
   0.5, 1.0,  0.5,
   0.5, 0.0,  0.5,

  // Left face (X = -0.5)
  -0.5, 0.0, -0.5,
  -0.5, 0.0,  0.5,
  -0.5, 1.0,  0.5,
  -0.5, 1.0, -0.5
]);

const cubeColors = new Float32Array([
  1,0,1,  0,1,1,  1,1,0,  1,0,1,   // front
  0,1,0,  1,0,0,  1,1,0,  0,0,1,   // back
  1,0,1,  1,1,0,  0,0,1,  1,1,0,   // top
  1,0,0,  0,1,0,  0,1,1,  1,0,1,   // bottom
  0,1,1,  0,1,0,  0,0,1,  1,1,0,   // right
  1,0,0,  1,0,1,  1,0,1,  1,1,0    // left
]);

const cubeUVs = new Float32Array([
  0,0,  1,0,  1,1,  0,1,   // front
  0,0,  1,0,  1,1,  0,1,   // back
  0,0,  1,0,  1,1,  0,1,   // top
  0,0,  1,0,  1,1,  0,1,   // bottom
  0,0,  1,0,  1,1,  0,1,   // right
  0,0,  1,0,  1,1,  0,1    // left
]);

const cubeIndices = new Uint16Array([
   0,  1,  2,    0,  2,  3,   // front
   4,  5,  6,    4,  6,  7,   // back
   8,  9, 10,    8, 10, 11,   // top
  12, 13, 14,   12, 14, 15,   // bottom
  16, 17, 18,   16, 18, 19,   // right
  20, 21, 22,   20, 22, 23    // left
]);

// pyramid prism
const pyramidPos = new Float32Array([
  // front (facing +z)
  -1, -1,  1,   1, -1,  1,   0,  1,  0,
  // right (facing +x)
   1, -1,  1,   1, -1, -1,   0,  1,  0,
  // back (facing -z)
   1, -1, -1,  -1, -1, -1,   0,  1,  0,
  // left (facing -x)
  -1, -1, -1,  -1, -1,  1,   0,  1,  0,
  // bottom (y = -1)
  -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1
]);

const pyramidColors = new Float32Array([
  1,1,0,  0,1,1,  1,0,1,          // front
  0,1,1,  0,1,0,  1,0,1,          // right
  0,1,0,  1,0,0,  0,0,1,          // back
  1,0,0,  1,1,0,  1,0,1,          // left
  1,0,0,  0,1,0,  0,1,1,  1,1,0   // bottom
]);

const pyramidUVs = new Float32Array([
  0,0,  1,0,  0.5,1,          // front
  0,0,  1,0,  0.5,1,          // right
  0,0,  1,0,  0.5,1,          // back
  0,0,  1,0,  0.5,1,          // left
  0,0,  1,0,  1,1,  0,1       // bottom
]);

const pyramidIndices = new Uint16Array([
   0,  1,  2,     // front
   3,  4,  5,     // right
   6,  7,  8,     // back
   9, 10, 11,     // left
  12, 13, 14,   12, 14, 15   // bottom
]);

// sphere
function makeSphere(latRes, lonRes) {
  const pos = [], col = [], uv = [], idx = [];
  for (let lat = 0; lat <= latRes; lat++) {
    const latAngle = lat * Math.PI / latRes;          // 0 at top, PI at bottom
    const sinT = Math.sin(latAngle), cosT = Math.cos(latAngle);
    for (let lon = 0; lon <= lonRes; lon++) {
      const lonAngle = lon * 2 * Math.PI / lonRes;    // around the ring
      const x = sinT * Math.cos(lonAngle);
      const y = cosT;
      const z = sinT * Math.sin(lonAngle);
      pos.push(x, y, z);
      col.push((x + 1) / 2, (y + 1) / 2, (z + 1) / 2);
      uv.push(lon / lonRes, 1 - lat / latRes);
    }
  }

  for (let lat = 0; lat < latRes; lat++) {
    for (let lon = 0; lon < lonRes; lon++) {
      const a = lat * (lonRes + 1) + lon;  // current ring
      const b = a + lonRes + 1;            // next ring down
      idx.push(a, a + 1, b,   b, a + 1, b + 1);
    }
  }

  return {
    sphPositions: new Float32Array(pos),
    sphColors: new Float32Array(col),
    sphUVs: new Float32Array(uv),
    sphIndices: new Uint16Array(idx)
  };
}

const sphere = makeSphere(32, 32);
const spherePos = sphere.sphPositions;
const sphereColors = sphere.sphColors;
const sphereIndices = sphere.sphIndices;
const sphereUVs = sphere.sphUVs;

const positions = pyramidPos;
const colors = pyramidColors;
const indices = pyramidIndices;
