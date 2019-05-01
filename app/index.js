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

// function getSquare(canvas, evt) {
//     var rect = canvas.getBoundingClientRect();
//     return {
//         x: 1 + (evt.clientX - rect.left) - (evt.clientX - rect.left)%10,
//         y: 1 + (evt.clientY - rect.top) - (evt.clientY - rect.top)%10
//     };
// }

// function drawGrid(context) {
//     for (var x = 0.5; x < 1001; x += 2) {
//       context.moveTo(x, 0);
//       context.lineTo(x, 1000);
//     }
    
//     for (var y = 0.5; y < 1001; y += 2) {
//       context.moveTo(0, y);
//       context.lineTo(1000, y);
//     }
    
//     context.strokeStyle = "#00f";
//     context.stroke();
// }

// function fillSquare(context, x, y){
//     context.fillStyle = "#00f"
//     context.fillRect(x,y,1,1);
// }

// var canvas = document.getElementById('grid');
// var context = canvas.getContext('2d');

// drawGrid(context);

// canvas.addEventListener('click', function(evt) {
// 	var mousePos = getSquare(canvas, evt);
// 	console.log("click");
//     fillSquare(context, mousePos.x, mousePos.y)
// }, false);

var drawGrid = function(w, h, id) {
    var canvas = document.getElementById(id);
    var ctx = canvas.getContext('2d');
    ctx.canvas.width  = w;
    ctx.canvas.height = h;
    
    var data = '<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"> \
        <defs> \
            <pattern id="smallGrid" width="3" height="6" patternUnits="userSpaceOnUse"> \
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="gray" stroke-width="0.3" /> \
            </pattern> \
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"> \
                <rect width="80" height="80" fill="url(#smallGrid)" /> \
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="gray" stroke-width="1" /> \
            </pattern> \
        </defs> \
        <rect width="100%" height="100%" fill="url(#smallGrid)" /> \
    </svg>';

    var DOMURL = window.URL || window.webkitURL || window;
    
    var img = new Image();
    var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
    var url = DOMURL.createObjectURL(svg);
    
    img.onload = function () {
      ctx.drawImage(img, 0, 0);
      DOMURL.revokeObjectURL(url);
    }
    img.src = url;
}
drawGrid(800, 400, "grid");