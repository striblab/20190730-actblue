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
import Dots from './dots.js'

var datapoints = './data/donations_data.json';

//data loader
function dataSpill(source) {
    return new Promise(function (load) {
        function donationsJSON() {
            var argumentCount = [],
            length = arguments.length;
            while (length--) {
                argumentCount[length] = arguments[length];
            }
            return d3.json(argumentCount[0], argumentCount[1])
        };
        d3.queue()
            .defer(donationsJSON, source)
            .await(function (error, donationsData) {
                load({
                    donationsData: donationsData.donations
                 });
            });
    });
}

dataSpill(datapoints)
    .then(function (d) {
        var donationsData = d.donationsData;
        createREGL({
            onDone: function onDone(err, regl) {
                const launch = new Dots(regl, donationsData);
                launch.render();
            }
        });
    });