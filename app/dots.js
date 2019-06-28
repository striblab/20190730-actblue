import 'intersection-observer';
import 'waypoints/lib/noframework.waypoints.min.js';

class Dots {

    //global variable declarations and function binding
    constructor(regl, donationsData) {
        this.regl = regl;
        this.donationsData = donationsData;
        this.width = 1000;
        this.height = 1500;
        this.numPoints = donationsData.length;
        this.pointWidth = 3;
        this.duration = 1000;
        this.delayByIndex = 500 / this.numPoints;
        this.maxDuration = this.duration + this.delayByIndex * this.numPoints;
        this.currentLayout = 0;
        this.currentColorScale = 0;
        this.colorScales = [d3.scaleSequential(d3.interpolateViridis), d3.scaleSequential(d3.interpolateMagma), d3.scaleSequential(d3.interpolateInferno), d3
            .scaleSequential(d3.interpolateCool)].map(this._wrapColorScale);
        this.points = d3.range(this.numPoints).map(function (d) { return {}; });
        // this.frag = fs.readFileSync(path.join(__dirname, 'frag.txt'), 'utf8'); //important vector math file
        // this.vert = fs.readFileSync(path.join(__dirname, 'vert.txt'), 'utf8'); //important vector math file
        this._buildPoints = this._buildPoints.bind(this);
        this._candidateColors = this._candidateColors.bind(this);
        this._wrapColorScale = this._wrapColorScale.bind(this);
        this._fieldSpill = this._fieldSpill.bind(this);
        this._chartSpill = this._chartSpill.bind(this);
        this._mapSpill = this._mapSpill.bind(this);
        this._zipSpill = this._zipSpill.bind(this);
        this._totalsSpill = this._totalsSpill.bind(this);
        this._areaSpill = this._areaSpill.bind(this);
        this._fadeout = this._fadeout.bind(this);
        this._showField = this._showField.bind(this);
        this._showChart = this._showChart.bind(this);
        this._showMap = this._showMap.bind(this);
        this._showZips = this._showZips.bind(this);
        this._showTotals = this._showTotals.bind(this);
        this._showArea = this._showArea.bind(this);
        this._animate = this._animate.bind(this);
    }

    //REGL SPRITE CONSTRUCTION
    _buildPoints(points) {
        
        var self = this;

        //vector math to draw webgl sprites, in this case, a dot
        var drawPoints = self.regl({
            frag: '\n\t\t  precision highp float;\n\t\t\tvarying vec3 fragColor;\n\t\t\tvoid main() {\n\t\t\t\tgl_FragColor = vec4(fragColor, 1);\n\t\t\t}\n\t\t\t',
            vert: '\n\t\t\tattribute vec2 positionStart;\n\t\t\tattribute vec2 positionEnd;\n\t\t\tattribute float index;\n\t\t\tattribute vec3 colorStart;\n\t\t\tattribute vec3 colorEnd;\n\n\t\t\tvarying vec3 fragColor;\n\n\t\t\tuniform float pointWidth;\n\t\t\tuniform float stageWidth;\n\t\t\tuniform float stageHeight;\n\t\t\tuniform float elapsed;\n\t\t\tuniform float duration;\n\t\t\tuniform float delayByIndex;\n\t\t\t// uniform float tick;\n\t\t\t// uniform float animationRadius;\n\t\t\tuniform float numPoints;\n\n\t\t\t// helper function to transform from pixel space to normalized device coordinates (NDC)\n\t\t\t// in NDC (0,0) is the middle, (-1, 1) is the top left and (1, -1) is the bottom right.\n\t\t\tvec2 normalizeCoords(vec2 position) {\n\t\t\t\t// read in the positions into x and y vars\n\t      float x = position[0];\n\t      float y = position[1];\n\n\t\t\t\treturn vec2(\n\t\t      2.0 * ((x / stageWidth) - 0.5),\n\t\t      // invert y since we think [0,0] is bottom left in pixel space\n\t\t      -(2.0 * ((y / stageHeight) - 0.5)));\n\t\t\t}\n\n\t\t\t// helper function to handle cubic easing (copied from d3 for consistency)\n\t\t\t// note there are pre-made easing functions available via glslify.\n\t\t\tfloat easeCubicInOut(float t) {\n\t\t\t\tt *= 2.0;\n        t = (t <= 1.0 ? t * t * t : (t -= 2.0) * t * t + 2.0) / 2.0;\n\n        if (t > 1.0) {\n          t = 1.0;\n        }\n\n        return t;\n\t\t\t}\n\n\t\t\tvoid main() {\n\t\t\t\tgl_PointSize = pointWidth;\n\n\t\t\t\tfloat delay = delayByIndex * index;\n\t      float t;\n\n\t      // drawing without animation, so show end state immediately\n\t      if (duration == 0.0) {\n\t        t = 1.0;\n\n\t      // still delaying before animating\n\t      } else if (elapsed < delay) {\n\t        t = 0.0;\n\t      } else {\n\t        t = easeCubicInOut((elapsed - delay) / duration);\n\t      }\n\n\t      // interpolate position\n\t      vec2 position = mix(positionStart, positionEnd, t);\n\n\t      // apply an ambient animation\n\t\t\t\t// float dir = index > numPoints / 2.0 ? 1.0 : -1.0;\n\t      // position[0] += animationRadius * cos((tick + index) * dir);\n\t      // position[1] += animationRadius * sin((tick + index) * dir);\n\n\t      // above we + index to offset how they move\n\t      // we multiply by dir to change CW vs CCW for half\n\n\n\t      // interpolate color\n\t      fragColor = mix(colorStart, colorEnd, t);\n\n\t      // scale to normalized device coordinates\n\t\t\t\t// gl_Position is a special variable that holds the position of a vertex\n\t      gl_Position = vec4(normalizeCoords(position), 0.0, 1.0);\n\t\t\t}\n\t\t\t',
            // frag: self.frag,
            // vert: self.vert,
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
                pointWidth: self.regl.prop('pointWidth'),
                stageWidth: self.regl.prop('stageWidth'),
                stageHeight: self.regl.prop('stageHeight'),
                delayByIndex: self.regl.prop('delayByIndex'),
                duration: self.regl.prop('duration'),
                numPoints: self.numPoints, 
                elapsed: function elapsed(_i, _j) {
                    var time = _i.time;
                    var _j$startTime = _j.startTime,
                    startTime = _j$startTime === undefined ? 0 : _j$startTime;
                    return (time - startTime) * 1000;
                }
            }, 
            count: points.length, 
            primitive: 'points'
        });
        return drawPoints;
    }

    //DATA COLORING
    _candidateColors(points, donationsData) {
        //define color scale per data label
        var colorScale = d3.scaleOrdinal()
            .domain(["WARREN", "HARRIS", "BIDEN", "SANDERS", "KLOBUCHAR", "BUTTIGIEG", "OROURKE", "OTHER"])
            .range(d3.range(0, 1, 0.16)
                .concat(1)
                .map(d3.scaleOrdinal(['#386cb0', '#f0027f', '#beaed4', '#7fc97f', '#bf5b17', '#fdc086', '#D8D861', '#666666'])));
        
        //assign colors to our points accordingly
        points.forEach(function (d, i) {
            var rgbArray = d3.rgb(colorScale(donationsData[i].donor_can));
            d.color = [rgbArray.r / 255, rgbArray.g / 255, rgbArray.b / 255];
        });
    }
    
    _wrapColorScale(scale) {
        //convert color values to webgl color scaling since it's not using our standard CSS hex or rgb codes
        var tScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0.4, 1]);
        return function (t) {
            var rgb = d3.rgb(scale(tScale(t)));
            return [rgb.r / 255, rgb.g / 255, rgb.b / 255];
        };
    }

    //SHAPE LAYOUTS
    _fieldSpill(points, width, height, donationsData) {
        var self = this;

        //point size and spacing for this shape
        var pointWidth = width / 800;
        var pointMargin = 1;
        
        //chop up data into buckets of different values in provided column
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
        
        //redraw the dots according to the categorized bins we've generated
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
    
    _chartSpill(points, width, height, donationsData) {
        var self = this;
        
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
        
        self._candidateColors(points, donationsData);
        
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
    
    _mapSpill(points, width, height, donationsData) {
        var self = this;

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
    
            self._candidateColors(points, donationsData);
    }
    
    _zipSpill(points, pointWidth, xOffset, yOffset, donationsData) {
        var self = this;

        if (xOffset === void 0) xOffset = 0;
        if (yOffset === void 0) yOffset = 0;
        self._candidateColors(points, donationsData);
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
    
    _totalsSpill(points, width, height, donationsData) {
        var self = this;

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
        
        self._candidateColors(points, donationsData);
        
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
    
    _areaSpill(points, width, height, donationsData) {
        var self = this;

        self._candidateColors(points, donationsData);
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

    _fadeout(points) {
        points.forEach(function (d, i) {
            d.color = [255, 255, 255];
        });
    };

    //DATA ANIMATION TRIGGERS
    _showField(points) {
        var self = this;
        return self._fieldSpill(points, self.width, self.height, self.donationsData);
    };
        
    _showChart(points) {
        var self = this;
        return self._chartSpill(points, self.width, self.height, self.donationsData);
    };
        
    _showMap(points) {
        var self = this;
        return self._mapSpill(points, self.width, self.height, self.donationsData);
    };
        
    _showZips(points) {
        var self = this;
        return self._zipSpill(points, self.pointWidth, self.width / 2, self.height / 2, self.donationsData);
    };
        
    _showTotals(points) {
        var self = this;
        return self._totalsSpill(points, self.width, self.height, self.donationsData);
    };
        
    _showArea(points) {
        var self = this;
        return self._areaSpill(points, self.width, self.height, self.donationsData);
    };


    //DATA ANIMATION
    _animate(layout, points) {
            var self = this;

            points.forEach(function (d) {
                d.sx = d.tx;
                d.sy = d.ty;
                d.colorStart = d.colorEnd;
            });
            
            layout(points);
            
            var colorScale = self.colorScales[self.currentColorScale];

            points.forEach(function (d, i) {
                d.tx = d.x;
                d.ty = d.y;
                d.colorEnd = d.color;
            });
            
            var drawPoints = self._buildPoints(points);
            
            var startTime = null;
            var frameLoop = self.regl.frame(function (d) {
                var time = d.time;
    
                if (startTime === null) {
                    startTime = time;
                }
                self.regl.clear({
                    color: [255, 255, 255, 1], 
                    depth: 1
                });
    
                drawPoints({
                    pointWidth: self.pointWidth,
                    stageWidth: self.width,
                    stageHeight: self.height,
                    duration: self.duration,
                    delayByIndex: self.delayByIndex,
                    startTime: startTime
                });
                
                var delayAtEnd = 0.1;
                
                if (time - startTime > self.maxDuration / 1000 + delayAtEnd) {
                    frameLoop.cancel();
                    self.currentLayout = (self.currentLayout + 1) % layout.length;
                    self.currentColorScale = (self.currentColorScale + 1) % self.colorScales.length;
                }
            });
    }

    render() {
        var self = this;

        //initialize points
        var points = self.points;

        points.forEach(function (d, i) {
            d.tx = self.width / 2;
            d.ty = self.height / 2;
            d.colorEnd = [0, 0, 0];
        });

       //assign the different layout triggers to an array to more easily call them
       var layouts = [self._showField, self._showChart, self._showMap, self._showZips, self._showTotals, self._showArea, self._fadeout];

       //assign crolling waypoint triggers
       var waypoint0 = new Waypoint({
        element: $('#step0')[0],
        handler: function(direction) {
          self._animate(layouts[0], self.points);
        }
      });

      var waypoint1 = new Waypoint({
        element: $('#step1')[0],
        handler: function(direction) {
          self._animate(layouts[1], self.points);
        }
      });

      var waypoint2 = new Waypoint({
        element: $('#step2')[0],
        handler: function(direction) {
          self._animate(layouts[2], self.points);
        }
      });

      var waypoint3 = new Waypoint({
        element: $('#step3')[0],
        handler: function(direction) {
          self._animate(layouts[3], self.points);
        }
      });

      var waypoint4 = new Waypoint({
        element: $('#step4')[0],
        handler: function(direction) {
          self._animate(layouts[4], self.points);
        }
      });
      
      var waypoint5 = new Waypoint({
        element: $('#step5')[0],
        handler: function(direction) {
          self._animate(layouts[5], self.points);
        }
      });

      var waypoint6 = new Waypoint({
        element: $('#step6')[0],
        handler: function(direction) {
          self._animate(layouts[6], self.points);
        }
      });
    }
}

export {
    Dots as
    default
}