/**
 * Main JS file for project.
 */

/**
 * Define globals that are added through the js.globals in
 * the config.json file, here, mostly so linting won't get triggered
 * and its a good queue of what is available:
 */
// /* global $, _ */

//https://peterbeshai.com/blog/2017-05-26-beautifully-animate-points-with-webgl-and-regl/

// Dependencies
import utils from './shared/utils.js';
import * as regl from 'regl';
import * as d3 from 'd3';

const numPoints = 100000;

// the size of the points we draw on screen
const pointWidth = 4;

// dimensions of the viewport we are drawing in
const width = window.innerWidth;
const height = window.innerHeight;

// random number generator from d3-random
const rng = d3.randomNormal(0, 0.15);

// create initial set of points
const points = d3.range(numPoints).map(i => ({
  x: (rng() * width) + (width / 2),
  y: (rng() * height) + (height / 2),
  color: [0, Math.random(), 0],
}));

// start the regl draw loop
regl.frame(() => {
    // clear the buffer
    regl.clear({
      // background color (black)
      color: [0, 0, 0, 1],
      depth: 1,
    });
  
    // draw the points using our created regl func
    // note that the arguments are available via `regl.prop`.
    drawPoints({ // we'll get to this function in a moment!
      pointWidth,
      stageWidth: width,
      stageHeight: height,
    });
  });

  const drawPoints = regl({
    frag: 'precision highp float; \
    varying vec3 fragColor; \
    void main() { \
      gl_FragColor = vec4(fragColor, 1); \
    }',
    vert: '// per vertex attributes \
    attribute vec2 positionStart; \
    attribute vec2 positionEnd; \
    attribute vec3 colorStart; \
    attribute vec3 colorEnd; \
    // variables to send to the fragment shader \
    varying vec3 fragColor; \
    // values that are the same for all vertices \
    uniform float pointWidth; \
    uniform float stageWidth; \
    uniform float stageHeight; \
    uniform float elapsed; \
    uniform float duration; \
    // helper function to transform from pixel space to normalized \
    // device coordinates (NDC). In NDC (0,0) is middle, (-1, 1) \
    // is the top left and (1, -1) is the bottom right. \
    vec2 normalizeCoords(vec2 position) { \
      // read in the positions into x and y vars \
      float x = position[0]; \
      float y = position[1]; \
      return vec2( \
        2.0 * ((x / stageWidth) - 0.5),  \
        // invert y since we think [0,0] is bottom left in pixel \
        // space \
        -(2.0 * ((y / stageHeight) - 0.5))); \
    } \
    // helper function to handle cubic easing (copied from d3) \
    // note there are premade ease functions available via glslify. \
    float easeCubicInOut(float t) { \
      t *= 2.0; \
      t = (t <= 1.0 ? t * t * t : (t -= 2.0) * t * t + 2.0) / 2.0; \
      if (t > 1.0) { \
        t = 1.0; \
      } \
      return t; \
    } \
    void main() {  \
      // update the size of a point based on the prop pointWidth \
      gl_PointSize = pointWidth; \
      // number between 0 and 1 indicating how far through the \
      // animation this vertex is. \
      float t; ] \
      // drawing without animation, so show end state immediately \
      if (duration == 0.0) { \
        t = 1.0; \
      // otherwise we are animating, so use cubic easing \
      } else { \
        t = easeCubicInOut(elapsed / duration);  \
      } \
      // interpolate position \
      vec2 position = mix(positionStart, positionEnd, t); \
      // interpolate and send color to the fragment shader \
      fragColor = mix(colorStart, colorEnd, t); \
      // scale to normalized device coordinates \
      // gl_Position is a special variable that holds the \
      // position of a vertex \
      gl_Position = vec4(normalizeCoords(position), 0.0, 1.0); \
    }', 
      attributes: {
        // each of these gets mapped to a single entry for each of
        // the points. this means the vertex shader will receive
        // just the relevant value for a given point.
        positionStart: points.map(d => [d.sx, d.sy]),
        positionEnd: points.map(d => [d.tx, d.ty]),
        colorStart: points.map(d => d.colorStart),
        colorEnd: points.map(d => d.colorEnd),
      },
      uniforms: {
        // by using `regl.prop` to pass these in, we can specify them
        // as arguments to our drawPoints function
        pointWidth: regl.prop('pointWidth'),
      
        // regl actually provides these as viewportWidth and
        // viewportHeight but I am using these outside and I want to
        // ensure they are the same numbers, so I am explicitly
        // passing them in.
        stageWidth: regl.prop('stageWidth'),
        stageHeight: regl.prop('stageHeight'),
      
        duration: regl.prop('duration'),
        // time in ms since the prop startTime (i.e. time elapsed)
        // note that `time` is passed by regl whereas `startTime`
        // is a prop passed to the drawPoints function.
        elapsed: ({ time }, { startTime = 0 }) =>
          (time - startTime) * 1000,
      },
  
    // specify the number of points to draw
    count: points.length,
  
    // specify that each vertex is a point (not part of a mesh)
    primitive: 'points',
  });



  function blueNormalLayout(points) {
    // random number generator based on a normal distribution
    // with mean = 0, std dev = 0.15
    const rng = d3.randomNormal(0, 0.15);
  
    points.forEach(d => {
      // set the x and y attributes
      d.x = (rng() * width) + (width / 2);
      d.y = (rng() * height) + (height / 2);
  
      // blue-green color
      d.color = [0, 0.5, 0.9];
    });
  }

  // make previous end the new beginning
points.forEach(d => {
    d.sx = d.tx;
    d.sy = d.ty;
    d.colorStart = d.colorEnd;
  });
  
  // layout points, updating x, y, and color attributes
  layout(points);
  
  // copy layout x, y, and color to end values
  points.forEach((d, i) => {
    d.tx = d.x;
    d.ty = d.y;
    d.colorEnd = d.color;
  });

  let startTime = null; // in seconds
regl.frame(({ time }) => {
  // keep track of start time so we can get time elapsed
  // this is important since time doesn't reset when starting
  // new animations
  if (startTime === null) {
    startTime = time;
  }

  // clear the buffer
  regl.clear({
    // background color (black)
    color: [0, 0, 0, 1],
    depth: 1,
  });

  // draw the points using our created regl func
  // note that the arguments are available via `regl.prop`.
  drawPoints({
    pointWidth,
    stageWidth: width,
    stageHeight: height,

    // here we pass in the new props:
    duration,
    startTime,
  });

  // if we have exceeded the maximum duration, move on to the
  // next animation
  if (time - startTime > (duration / 1000)) {
    switchToNextAnimation(); // see live demo code for details
  }
});