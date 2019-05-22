/**
 * Main JS file for project.
 */

/**
 * Define globals that are added through the js.globals in
 * the config.json file, here, mostly so linting won't get triggered
 * and its a good queue of what is available:
 */
// /* global $, _ */

// Dependencies
import utils from './shared/utils.js';

// Mark page with note about development or staging
utils.environmentNoting();



/**
 * Adding dependencies
 * ---------------------------------
 * Import local ES6 or CommonJS modules like this:
 * import utilsFn from './shared/utils.js';
 *
 * Or import libraries installed with npm like this:
 * import module from 'module';
 */


/**
 * Adding Svelte templates in the client
 * ---------------------------------
 * We can bring in the same Svelte templates that we use
 * to render the HTML into the client for interactivity.  The key
 * part is that we need to have similar data.
 *
 * First, import the template.  This is the main one, and will
 * include any other templates used in the project.
 *
 *   `import Content from '../templates/_index-content.svelte.html';`
 *
 * Get the data parts that are needed.  There are two ways to do this.
 * If you are using the buildData function to get data, then add make
 * sure the config for your data has a `local: "content.json"` property
 *
 *  1. For smaller datasets, just import them like other files.
 *     `import content from '../assets/data/content.json';`
 *  2. For larger data points, utilize window.fetch.
 *     `let content = await (await window.fetch('../assets/data/content.json')).json();`
 *
 * Once you have your data, use it like a Svelte component:
 *
 * const app = new Content({
 *  target: document.querySelector('.article-lcd-body-content'),
 *  hydrate: true,
 *  data: {
 *    content
 *  }
 * });
 */



// Common code to get svelte template loaded on the client and hack-ishly
// handle sharing
//
// import Content from '../templates/_index-content.svelte.html
//
// $(document).ready(() => {
//   // Hack to get share back
//   let $share = $('.share-placeholder').size()
//     ? $('.share-placeholder')
//       .children()
//       .detach()
//     : undefined;
//   let attachShare = !$share
//     ? undefined
//     : () => {
//       $('.share-placeholder').append($share);
//     };

//   // Main component
//   const app = new Content({
//     target: document.querySelector('.article-lcd-body-content'),
//     hydrate: true,
//     data: {
//       attachShare
//     }
//   });
// });

// https://stardustjs.github.io/playground/

let width = 960;
let height = 470;
let canvas = document.getElementById("main-canvas");
let platform = Stardust.platform("webgl-2d", canvas, width, height);
platform.set3DView(Math.PI / 2, width / height);
platform.setPose(new Stardust.Pose(
    new Stardust.Vector3(0, 0, 200),
    new Stardust.Quaternion(0, 0, 0, 1)
));
platform.clear([ 1, 1, 1, 1 ]);
loadData("./data/demovoteclean.tsv", (data) => {
    let demovote = data;
    let mark = Stardust.mark.compile(`
        import { Cube } from P3D;
        let longitude: float;
        let latitude: float;
        let state: float;
        let stateBinIndex: float;
        let xBin: float;
        let yBin: float;
        let xyBinIndex: float;
        let index: float;
        function getPositionScatterplot(): Vector3 {
            let scaleX = 0.2;
            let scaleY = 0.3;
            return Vector3(
                scaleX * (longitude - (-95.9386152570054)),
                scaleY * (latitude - (37.139536624928695)),
                0
            );
        }
        function getPositionStateBins(): Vector3 {
            return Vector3(
                (state - 48 / 2) * 0.3 + (stateBinIndex % 10 - 4.5) * 0.02,
                floor(stateBinIndex / 10) * 0.02 - 2.0, 0
            );
        }
        function getPositionXYBinning(): Vector3 {
            let n = 6;
            let txy = xyBinIndex % (n * n);
            let tx = txy % n;
            let ty = floor(txy / n);
            let tz = floor(xyBinIndex / (n * n));
            return Vector3(
                (xBin - 9 / 2) * 0.6 + (tx - n / 2 + 0.5) * 0.04,
                tz * 0.04 - 2.0,
                (yBin - 6 / 2) * 0.6 + (ty - n / 2 + 0.5) * 0.04
            );
        }
        function clamp01(t: float): float {
            if(t < 0) t = 0;
            if(t > 1) t = 1;
            return t;
        }
        mark Mark(color: Color, t1: float, t2: float, t3: float, ki1: float, ki2: float, ki3: float) {
            let p1 = getPositionScatterplot();
            let p2 = getPositionStateBins();
            let p3 = getPositionXYBinning();
            let p = p1 * clamp01(t1 + ki1 * index) +
                p2 * clamp01(t2 + ki2 * index) +
                p3 * clamp01(t3 + ki3 * index);
            Cube(
                p * 50,
                0.7,
                color
            );
        }
    `)["Mark"];
    let marks = Stardust.mark.create(mark, Stardust.shader.lighting(), platform);
    demovote.forEach(d => {
        d.Longitude = +d.Longitude;
        d.Latitude = +d.Latitude;
    });
    let longitudeExtent = d3.extent(demovote, d => d.Longitude);
    let latitudeExtent = d3.extent(demovote, d => d.Latitude);
    let longitudeScale = d3.scaleLinear().domain(longitudeExtent).range([ 0, 1 ])
    let latitudeScale = d3.scaleLinear().domain(latitudeExtent).range([ 0, 1 ])
    // Map states to integer.
    let states = new Set();
    let state2number = {};
    let state2count = {};
    demovote.forEach(d => states.add(d.StateAbb));
    states = Array.from(states);
    states.sort();
    states.forEach((d, i) => {
        state2number[d] = i;
        state2count[d] = 0;
    });
    let xyBinCounter = {};
    let xBinCount = 10;
    let yBinCount = 7;
    demovote.sort((a, b) => a.Obama - b.Obama);
    demovote.forEach((d, i) => {
        d.index = i;
        if(state2count[d.StateAbb] == null) state2count[d.StateAbb] = 0;
        d.stateBinIndex = state2count[d.StateAbb]++;
        let xBin = Math.floor(longitudeScale(d.Longitude) * xBinCount);
        let yBin = Math.floor(latitudeScale(d.Latitude) * yBinCount);
        let bin = yBin * (xBinCount + 1) + xBin;
        d.xBin = xBin;
        d.yBin = yBin;
        if(xyBinCounter[bin] == null) xyBinCounter[bin] = 0;
        d.xyBinIndex = xyBinCounter[bin]++;
    });
    let s1 = d3.interpolateLab("#f7f7f7", "#0571b0");
    let s2 = d3.interpolateLab("#f7f7f7", "#ca0020");
    let strToRGBA = (str) => {
        let rgb = d3.rgb(str);
        return [ rgb.r / 255, rgb.g / 255, rgb.b / 255, 1 ];
    }
    let scaleColor = (value) => {
        if(value > 0.5) {
            return strToRGBA(s1((value - 0.5) * 2));
        } else {
            return strToRGBA(s2((0.5 - value) * 2));
        }
    }
    marks
        .attr("index", d => d.index / (demovote.length - 1))
        .attr("longitude", d => d.Longitude)
        .attr("latitude", d => d.Latitude)
        .attr("state", (d) => state2number[d.StateAbb])
        .attr("stateBinIndex", (d) => d.stateBinIndex)
        .attr("xBin", (d) => d.xBin)
        .attr("yBin", (d) => d.yBin)
        .attr("xyBinIndex", (d) => d.xyBinIndex)
        .attr("color", (d) => scaleColor(d.Obama));
    let skewing = 1;
    function transition12(t) {
        let tt = t * (1 + skewing) - skewing;
        marks.attr("t1", 1 - tt).attr("t2", tt).attr("t3", 0).attr("ki1", -skewing).attr("ki2", +skewing).attr("ki3", 0);
    }
    function transition23(t) {
        let tt = t * (1 + skewing) - skewing;
        marks.attr("t1", 0).attr("t2", 1 - tt).attr("t3", tt).attr("ki1", 0).attr("ki2", -skewing).attr("ki3", +skewing);
    }
    function transition31(t) {
        let tt = t * (1 + skewing) - skewing;
        marks.attr("t1", tt).attr("t2", 0).attr("t3", 1 - tt).attr("ki1", +skewing).attr("ki2", 0).attr("ki3", -skewing);
    }
    marks.data(demovote);
    function render() {
        platform.clear([ 1, 1, 1, 1 ]);
        marks.render();
    }
    transition12(0);
    render();
    var transitions = {
        "mode1mode2": (t) => transition12(t),
        "mode2mode1": (t) => transition12(1 - t),
        "mode2mode3": (t) => transition23(t),
        "mode3mode2": (t) => transition23(1 - t),
        "mode3mode1": (t) => transition31(t),
        "mode1mode3": (t) => transition31(1 - t),
    }
    switches.mode_changed = (newMode, previousMode) => {
        beginTransition((t) => {
            transitions[previousMode + newMode](t);
            render();
        });
    };
});

// Common code for stardust examples

// Transition controller
var _previousTransition = null;

function beginTransition(func, maxTime) {
    if(_previousTransition) _previousTransition.stop();
    _previousTransition = null;
    maxTime = maxTime || 1;
    var t0 = new Date().getTime();
    var req = null;
    var totalFrames = 0;
    var rerender = function() {
        req = null;
        var t1 = new Date().getTime();
        var t = (t1 - t0) / 1000;
        var shouldStop = false;
        if(t > maxTime) {
            t = maxTime;
            shouldStop = true;
        }
        func(t);
        totalFrames += 1;
        if(!shouldStop) {
            req = requestAnimationFrame(rerender);
        } else {
            requestAnimationFrame(function() {
                var t1 = new Date().getTime();
                d3.select(".fps").text("FPS: " + (totalFrames / ((t1 - t0) / 1000)).toFixed(1));
            });
        }
    };
    req = requestAnimationFrame(rerender);
    _previousTransition = {
        stop: function() {
            if(req != null) cancelAnimationFrame(rerender);
        }
    }
    return _previousTransition;
}

function measureFPS(renderFunction) {
    var count = 10;
    var totalFrames = 0;
    var t0 = new Date().getTime();
    var doFrame = function() {
        if(totalFrames >= count) {
            var t1 = new Date().getTime();
            var fps = totalFrames / ((t1 - t0) / 1000);
            d3.select(".fps").text("FPS: " + fps.toFixed(1));
            return;
        }
        renderFunction();
        totalFrames += 1;
        requestAnimationFrame(doFrame);
    };
    requestAnimationFrame(doFrame);
}

function FPS() {
    this.updates = [];
    this.updateIndex = 0;
}

FPS.prototype.update = function() {
    this.updateIndex += 1;
    this.updates.push(new Date().getTime());
    if(this.updates.length > 100) {
        this.updates.splice(0, this.updates.length - 100);
    }
    if(this.updateIndex % 20 == 0) {
        var dt = (this.updates[this.updates.length - 1] - this.updates[0]) / (this.updates.length - 1);
        d3.select(".fps").text("FPS: " + (1000 / dt).toFixed(1));
    }
}

var switches = {};

d3.select("[data-switch]").each(function(s) {
    var name = d3.select(this).attr("data-switch");
    var modes = d3.select(this).selectAll("[data-value]");
    var valueDefault = modes.filter(".active").attr("data-value");
    switches[name] = valueDefault;
    modes.on("click", function() {
        modes.classed("active", false);
        d3.select(this).classed("active", true);
        var newValue = d3.select(this).attr("data-value");
        var previous = switches[name];
        if(previous != newValue) {
            switches[name] = newValue;
            if(switches[name + "_changed"]) {
                switches[name + "_changed"](switches[name], previous);
            }
        }
    });
});

function loadData(path, callback) {
    var loadingDiv = d3.select("body").append("div").classed("loading", true);
    loadingDiv.append("p").text("Loading data...");
    var cb = function(err, data) {
        if(err) {
            loadingDiv.append("p").text("Could not load data. Please check your network connection.");
        } else {
            loadingDiv.remove();
            callback(data);
        }
    };
    if(path.match(/\.csv$/i)) {
        d3.csv(path, cb);
    }
    if(path.match(/\.tsv$/i)) {
        d3.tsv(path, cb);
    }
    if(path.match(/\.json$/i)) {
        d3.json(path, cb);
    }
}

document.addEventListener("DOMContentLoaded", function(e) {
    d3.select(".initializing").remove();
});