/* PRIMARY FUNCTIONS */

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

//data coloring
function candidateColors(data, donationsData) {
    var colorScale = d3.scaleOrdinal()
        .domain(["WARREN", "HARRIS", "BIDEN", "SANDERS", "KLOBUCHAR", "BUTTIGIEG", "OROURKE", "OTHER"])
        .range(d3.range(0, 1, 0.16)
            .concat(1)
            .map(d3.scaleOrdinal(['#386cb0', '#f0027f', '#beaed4', '#7fc97f', '#bf5b17', '#fdc086', '#D8D861', '#666666'])));
    
    data.forEach(function (d, i) {
        var rgbArray = d3.rgb(colorScale(donationsData[i].donor_can));
        d.color = [rgbArray.r / 255, rgbArray.g / 255, rgbArray.b / 255];
    });
}

//field layout
function fieldSpill(points, width, height, donationsData) {
    var pointWidth = width / 800;
    var pointMargin = 1;
    
    var bydonor_can = d3.nest()
        .key(function (d) {
            return d.all;
        })
        .entries(donationsData);
    
    var binMargin = 0;
    var numBins = bydonor_can.length;
    var minBinWidth = width / (numBins * 2.5);
    var totalExtraWidth = width - binMargin * (numBins - 1) - minBinWidth * numBins;

    var binWidths = bydonor_can.map(function (d) {
        return Math.ceil(d.values.length / donationsData.length * totalExtraWidth) + minBinWidth
    });
    
    var increment = pointWidth + pointMargin;

    var cumulativeBinWidth = 0;
    
    var binsArray = binWidths.map(function (binWidth, i) {
        var bin = {
            all: bydonor_can[i].key,
            binWidth: binWidth,
            binStart: cumulativeBinWidth + i * binMargin,
            binCount: 0,
            binCols: Math.floor(binWidth / increment)
        };
        cumulativeBinWidth += binWidth - 1;
        return bin
    });
    
    var bins = d3.nest()
        .key(function (d) {
            return d.all;
        })
        .rollup(function (d) {
            return d[0];
        })
        .object(binsArray);
    
    var arrangement = points.map(function (d, i) {
        var all = donationsData[i].all;
        var bin = bins[all];
        var binWidth = bin.binWidth;
        var binCount = bin.binCount;
        var binStart = bin.binStart;
        var binCols = bin.binCols;
        var row = Math.floor(binCount / binCols);
        var col = binCount % binCols;
        var x = binStart + col * increment;
        var y = -row * increment + height;
        
        bin.binCount += 1;
        return {
            x: x,
            y: y, 
            color: [66 / 255, 134 / 255, 244 / 255]
        }
    });
    
    arrangement.forEach(function (d, i) {
        Object.assign(points[i], d)
    });
    
}

//chart layout
function chartSpill(points, width, height, donationsData) {
    var pointWidth = width / 800;
    var pointMargin = 1;
    
    var bydonor_can = d3.nest()
        .key(function (d) {
            return d.donor_can;
        })
        .entries(donationsData);
    
    var binMargin = pointWidth * 10;
    var numBins = bydonor_can.length;
    var minBinWidth = width / (numBins * 2.5);
    var totalExtraWidth = width - binMargin * (numBins - 1) - minBinWidth * numBins;
    var binWidths = bydonor_can.map(function (d) {
        return Math.ceil(d.values.length / donationsData.length * totalExtraWidth) + minBinWidth
    });
    
    var increment = pointWidth + pointMargin;
    var cumulativeBinWidth = 0;
    var binsArray = binWidths.map(function (binWidth, i) {
        var bin = {
            donor_can: bydonor_can[i].key,
            binWidth: binWidth,
            binStart: cumulativeBinWidth + i * binMargin,
            binCount: 0,
            binCols: Math.floor(binWidth / increment)
        };
        cumulativeBinWidth += binWidth - 1;
        return bin
    });
    var bins = d3.nest()
        .key(function (d) {
            return d.donor_can;
        })
        .rollup(function (d) {
            return d[0];
        })
        .object(binsArray);
    
    candidateColors(points, donationsData);
    
    var arrangement = points.map(function (d, i) {
        var donor_can = donationsData[i].donor_can;
        var bin = bins[donor_can];
        var binWidth = bin.binWidth;
        var binCount = bin.binCount;
        var binStart = bin.binStart;
        var binCols = bin.binCols;
        var row = Math.floor(binCount / binCols);
        var col = binCount % binCols;
        var x = binStart + col * increment;
        var y = -row * increment + height;
        
        bin.binCount += 1;
        return {
            x: x, 
            y: y, 
            color: d.color
        }
    });
    
    arrangement.forEach(function (d, i) {
        Object.assign(points[i], d);
    });
}

//map layout
function mapSpill(points, width, height, donationsData) {
        var latitude = d3.extent(donationsData, function (d) {
            return d.lat
        });
        var longitude = d3.extent(donationsData, function (d) {
            return d.lng
        });
        
        var extentGeoJson = {
            type: "LineString", coordinates: [
                [longitude[0], latitude[0]], 
                [longitude[1], latitude[1]]
            ]
        };

        var projection = d3.geoMercator().fitSize([width, height], extentGeoJson);
            
        points.forEach(function (d, i) {
            var location = projection([donationsData[i].lng, donationsData[i].lat]);
            d.x = location[0];
            d.y = location[1];
        })

         candidateColors(points, donationsData);
}

//zip chart layout
function zipSpill(points, pointWidth, xOffset, yOffset, donationsData) {
    if (xOffset === void 0) xOffset = 0;
    if (yOffset === void 0) yOffset = 0;
    candidateColors(points, donationsData);
    var sortData = donationsData.map(function (donor, index) {
            return {
                index: index, 
                donor_can: donor.donor_can
            }
        })
        .sort(function (a, b) {
            return a.donor_can.localeCompare(b.donor_can)
        });
    var theta = Math.PI * (2 - Math.sqrt(2));
    var pointRadius = pointWidth / 2;
    sortData.forEach(function (d, i) {
        var point = points[d.index];
        var index = i % points.length;
        var phylloX = pointRadius * Math.sqrt(index) * Math.cos(index * theta);
        var phylloY = pointRadius * Math.sqrt(index) * Math.sin(index * theta);
        point.x = xOffset + phylloX - pointRadius;
        point.y = yOffset + phylloY - pointRadius
    });
    return points
}

//totals chart layout
function totalsSpill(points, width, height, donationsData) {
    var pointWidth = width / 800;
    var pointMargin = 1;
    
    var bydonor_can = d3.nest()
        .key(function (d) {
            return d.donor_can
        })
        .entries(donationsData)
        .filter(function (d) {
            return d.values.length > 10
        });
    
    var binMargin = pointWidth * 10;
    var numBins = bydonor_can.length;
    var minBinWidth = width / (numBins * 2.5);
    var totalExtraWidth = width - binMargin * (numBins - 1) - minBinWidth * numBins;
    var binWidths = bydonor_can.map(function (d) {
        return Math.ceil(d.values.length / donationsData.length * totalExtraWidth) + minBinWidth
    });
    
    var increment = pointWidth + pointMargin;
    var cumulativeBinWidth = 0;
    var binsArray = binWidths.map(function (binWidth, i) {
        var bin = {
            donor_can: bydonor_can[i].key
            , binWidth: binWidth
            , binStart: cumulativeBinWidth + i * binMargin
            , binCount: 0
            , binCols: Math.floor(binWidth / increment)
        };
        cumulativeBinWidth += binWidth - 1;
        return bin
    });
    var bins = d3.nest()
        .key(function (d) {
            return d.donor_can
        })
        .rollup(function (d) {
            return d[0]
        })
        .object(binsArray);
    
    candidateColors(points, donationsData);
    
    var arrangement = points.map(function (d, i) {
        var donor_can = donationsData[i].donor_can;
        var bin = bins[donor_can];
        if (!bin) {
            return {
                x: d.x
                , y: d.y
                , color: [0, 0, 0]
            }
        }
        var binWidth = bin.binWidth;
        var binCount = bin.binCount;
        var binStart = bin.binStart;
        var binCols = bin.binCols;
        var row = Math.floor(binCount / binCols);
        var col = binCount % binCols;
        var x = binStart + col * increment;
        var y = -row * increment + height;
        
        bin.binCount += 1;
        return {
            x: x,
            y: y,
            color: d.color
        }
    });
    
    arrangement.forEach(function (d, i) {
        Object.assign(points[i], d)
    });
}

//area layout
function areaSpill(points, width, height, donationsData) {
    candidateColors(points, donationsData);
    var rng = d3.randomNormal(0, .2);
    var pointWidth = Math.round(width / 800);
    var pointMargin = 1;
    var pointHeight = pointWidth * .375;
    var latExtent = d3.extent(donationsData, function (d) {
        return d.lat
    });
    var xScale = d3.scaleQuantize()
        .domain(latExtent)
        .range(d3.range(0, width, pointWidth + pointMargin));
    var binCounts = xScale.range()
        .reduce(function (accum, binNum) {
            accum[binNum] = 0;
            return accum
        }, {});
    var bydonor_can = d3.nest()
        .key(function (d) {
            return d.donor_can
        })
        .entries(donationsData);
    donationsData.forEach(function (donor, i) {
        donor.d = points[i]
    });
    bydonor_can.forEach(function (donor_can, i) {
        donor_can.values.forEach(function (donor, j) {
            var d = donor.d;
            var binNum = xScale(donor.lat);
            d.x = binNum;
            d.y = height - pointHeight * binCounts[binNum];
            binCounts[binNum] += 1
        })
    })
}


/* DATAVIZ BUILD */

//initialize data load
dataSpill("donations_data.json")
    .then(function (_ref4) {
        var donationsData = _ref4.donationsData;
        createREGL({
            onDone: function onDone(err, regl) {
                launch(regl, donationsData);
            }
        });
    });

//canvas sizes
var width = 1000;
var height = 1500;

function launch(regl, donationsData) {
    
    //initialize quantities
    var numPoints = 200000;
    var pointWidth = 3;
    var duration = 1000;
    var delayByIndex = 500 / numPoints;
    var maxDuration = duration + delayByIndex * numPoints;
    
    //chart transformation calls
    function showField(points) {
        return fieldSpill(points, width, height, donationsData);
    };
    
    function showChart(points) {
        return chartSpill(points, width, height, donationsData);
    };
    
    function showMap(points) {
        return mapSpill(points, width, height, donationsData);
    };
    
    function showZips(points) {
        return zipSpill(points, pointWidth, width / 2, height / 2, donationsData);
    };
    
    function showTotals(points) {
        return totalsSpill(points, width, height, donationsData);
    };
    
    function showArea(points) {
        return areaSpill(points, width, height, donationsData);
    };
    
    function fadeout(points) {
        points.forEach(function (d, i) {
            d.color = [255, 255, 255];
        });
    };
    
    
    //chart layout array
    var layouts = [showField, showChart, showMap, showZips, showTotals, showArea, fadeout];
    var currentLayout = 0;
    
    //color scales
    function wrapColorScale(scale) {
        var tScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0.4, 1]);
        return function (t) {
            var rgb = d3.rgb(scale(tScale(t)));
            return [rgb.r / 255, rgb.g / 255, rgb.b / 255];
        };
    }
    var colorScales = [d3.scaleSequential(d3.interpolateViridis), d3.scaleSequential(d3.interpolateMagma), d3.scaleSequential(d3.interpolateInferno), d3
        .scaleSequential(d3.interpolateCool)].map(wrapColorScale);
    var currentColorScale = 0;
    
    //generate points
    function buildPoints(points) {
        var drawPoints = regl({
            frag: '\n\t\t  precision highp float;\n\t\t\tvarying vec3 fragColor;\n\t\t\tvoid main() {\n\t\t\t\tgl_FragColor = vec4(fragColor, 1);\n\t\t\t}\n\t\t\t',
            vert: '\n\t\t\tattribute vec2 positionStart;\n\t\t\tattribute vec2 positionEnd;\n\t\t\tattribute float index;\n\t\t\tattribute vec3 colorStart;\n\t\t\tattribute vec3 colorEnd;\n\n\t\t\tvarying vec3 fragColor;\n\n\t\t\tuniform float pointWidth;\n\t\t\tuniform float stageWidth;\n\t\t\tuniform float stageHeight;\n\t\t\tuniform float elapsed;\n\t\t\tuniform float duration;\n\t\t\tuniform float delayByIndex;\n\t\t\t// uniform float tick;\n\t\t\t// uniform float animationRadius;\n\t\t\tuniform float numPoints;\n\n\t\t\t// helper function to transform from pixel space to normalized device coordinates (NDC)\n\t\t\t// in NDC (0,0) is the middle, (-1, 1) is the top left and (1, -1) is the bottom right.\n\t\t\tvec2 normalizeCoords(vec2 position) {\n\t\t\t\t// read in the positions into x and y vars\n\t      float x = position[0];\n\t      float y = position[1];\n\n\t\t\t\treturn vec2(\n\t\t      2.0 * ((x / stageWidth) - 0.5),\n\t\t      // invert y since we think [0,0] is bottom left in pixel space\n\t\t      -(2.0 * ((y / stageHeight) - 0.5)));\n\t\t\t}\n\n\t\t\t// helper function to handle cubic easing (copied from d3 for consistency)\n\t\t\t// note there are pre-made easing functions available via glslify.\n\t\t\tfloat easeCubicInOut(float t) {\n\t\t\t\tt *= 2.0;\n        t = (t <= 1.0 ? t * t * t : (t -= 2.0) * t * t + 2.0) / 2.0;\n\n        if (t > 1.0) {\n          t = 1.0;\n        }\n\n        return t;\n\t\t\t}\n\n\t\t\tvoid main() {\n\t\t\t\tgl_PointSize = pointWidth;\n\n\t\t\t\tfloat delay = delayByIndex * index;\n\t      float t;\n\n\t      // drawing without animation, so show end state immediately\n\t      if (duration == 0.0) {\n\t        t = 1.0;\n\n\t      // still delaying before animating\n\t      } else if (elapsed < delay) {\n\t        t = 0.0;\n\t      } else {\n\t        t = easeCubicInOut((elapsed - delay) / duration);\n\t      }\n\n\t      // interpolate position\n\t      vec2 position = mix(positionStart, positionEnd, t);\n\n\t      // apply an ambient animation\n\t\t\t\t// float dir = index > numPoints / 2.0 ? 1.0 : -1.0;\n\t      // position[0] += animationRadius * cos((tick + index) * dir);\n\t      // position[1] += animationRadius * sin((tick + index) * dir);\n\n\t      // above we + index to offset how they move\n\t      // we multiply by dir to change CW vs CCW for half\n\n\n\t      // interpolate color\n\t      fragColor = mix(colorStart, colorEnd, t);\n\n\t      // scale to normalized device coordinates\n\t\t\t\t// gl_Position is a special variable that holds the position of a vertex\n\t      gl_Position = vec4(normalizeCoords(position), 0.0, 1.0);\n\t\t\t}\n\t\t\t',
            attributes: {
                positionStart: points.map(function (d) {
                    return [d.sx, d.sy];
                }),
                positionEnd: points.map(function (d) {
                    return [d.tx, d.ty];
                }),
                colorStart: points.map(function (d) {
                    return d.colorStart;
                }),
                colorEnd: points.map(function (d) {
                    return d.colorEnd;
                }),
                index: d3.range(points.length)
            }, 
            uniforms: {
                pointWidth: regl.prop('pointWidth'),
                stageWidth: regl.prop('stageWidth'),
                stageHeight: regl.prop('stageHeight'),
                delayByIndex: regl.prop('delayByIndex'),
                duration: regl.prop('duration'),
                numPoints: numPoints, 
                elapsed: function elapsed(_ref, _ref2) {
                    var time = _ref.time;
                    var _ref2$startTime = _ref2.startTime,
                    startTime = _ref2$startTime === undefined ? 0 : _ref2$startTime;
                    return (time - startTime) * 1000;
                }
            }, 
            count: points.length, 
            primitive: 'points'
        });
        return drawPoints;
    }
    
    //start animation
    function transition(layout, points) {
        points.forEach(function (d) {
            d.sx = d.tx;
            d.sy = d.ty;
            d.colorStart = d.colorEnd;
        });
        
        layout(points);
        
        var colorScale = colorScales[currentColorScale];
        
        points.forEach(function (d, i) {
            d.tx = d.x;
            d.ty = d.y;
            d.colorEnd = d.color;
        });
        
        var drawPoints = buildPoints(points);
        
        var startTime = null;
        var frameLoop = regl.frame(function (_ref3) {
            var time = _ref3.time;

            if (startTime === null) {
                startTime = time;
            }
            regl.clear({
                color: [255, 255, 255, 1], 
                depth: 1
            });

            drawPoints({
                pointWidth: pointWidth,
                stageWidth: width,
                stageHeight: height,
                duration: duration,
                delayByIndex: delayByIndex,
                startTime: startTime
            });
            
            var delayAtEnd = 0.1;
            
            if (time - startTime > maxDuration / 1000 + delayAtEnd) {
                frameLoop.cancel();
                currentLayout = (currentLayout + 1) % layouts.length;
                currentColorScale = (currentColorScale + 1) % colorScales.length;
            }
        });
    }

    var points = d3.range(numPoints)
        .map(function (d) {
            return {};
        });
    
    points.forEach(function (d, i) {
        d.tx = width / 2;
        d.ty = height / 2;
        d.colorEnd = [0, 0, 0];
    });
    
    function step(index) {
        if (index == 0) {
            //the field
            transition(layouts[index], points);
            
        } else if (index == 1) {
            //the contributors by candidate bars
            transition(layouts[index], points);
            
        } else if (index == 2) {
            //the contributors map
            transition(layouts[index], points);
            
        } else if (index == 3) {
            //the zip code bars by candidate
            transition(layouts[index], points);
            
        } else if (index == 4) {
            //donation totals bars by candidate
            transition(layouts[index], points);
            
        } else if (index == 5) {
            //comparison to 2015/2016
            transition(layouts[index], points);
            
        } else if (index == 6) {
            //fade out
            transition(layouts[index], points);
        }
        
        return index;
    }
    
    /* INTERFACE TRIGGERS */
    
    $(".button")
        .on("click", function () {
            step($(this).attr("index"));
        });
    
}