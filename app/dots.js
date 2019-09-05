import 'intersection-observer';
import 'waypoints/lib/noframework.waypoints.min.js';

class Dots {

    //global variable declarations and function binding
    constructor(regl, donationsData) {
        //assign the main tools we need for this: a regl instance and the JSON data
        this.regl = regl;
        this.donationsData = donationsData;

        //dataviz display settings
        this.width = 3000;
        this.height = 1000;
        this.numPoints = donationsData.length;
        this.pointWidth = 10;
        this.points = d3.range(this.numPoints).map(function (d) { return {}; }); //array of points to generate as dataviz sprites
        this.colorScales = [d3.scaleSequential(d3.interpolateViridis), d3.scaleSequential(d3.interpolateMagma), d3.scaleSequential(d3.interpolateInferno), d3
            .scaleSequential(d3.interpolateCool)].map(this._wrapColorScale);

        //dataviz animation settions
        this.duration = 1000;
        this.delayByIndex = 500 / this.numPoints;
        this.maxDuration = this.duration + this.delayByIndex * this.numPoints;
        this.currentLayout = 0;
        this.currentColorScale = 0;

        //scoping 'this' keyword to private methods so sanity can reign
        this._buildPoints = this._buildPoints.bind(this);
        this._candidateColors = this._candidateColors.bind(this);
        this._wrapColorScale = this._wrapColorScale.bind(this);
        this._slide0 = this._slide0.bind(this);
        this._slide1 = this._slide1.bind(this);
        this._slide2 = this._slide2.bind(this);
        this._slide3 = this._slide3.bind(this);
        this._slide4 = this._slide4.bind(this);
        this._slide5 = this._slide5.bind(this);
        this._slide6 = this._slide6.bind(this);
        this._slide7 = this._slide7.bind(this);
        this._slide8 = this._slide8.bind(this);
        this._slide9 = this._slide9.bind(this);
        this._slide10 = this._slide10.bind(this);
        this._slide11 = this._slide11.bind(this);
        this._slide12 = this._slide12.bind(this);
        this._fadeout = this._fadeout.bind(this);
        this._zeroPoint = this._zeroPoint.bind(this);
        this._onePoint = this._onePoint.bind(this);
        this._twoPoint = this._twoPoint.bind(this);
        this._threePoint = this._threePoint.bind(this);
        this._fourPoint = this._fourPoint.bind(this);
        this._fivePoint = this._fivePoint.bind(this);
        this._sixPoint = this._sixPoint.bind(this);
        this._sevenPoint = this._sevenPoint.bind(this);
        this._eightPoint = this._eightPoint.bind(this);
        this._ninePoint = this._ninePoint.bind(this);
        this._tenPoint = this._tenPoint.bind(this);
        this._elevenPoint = this._elevenPoint.bind(this);
        this._twelvePoint = this._twelvePoint.bind(this);
        this._animate = this._animate.bind(this);
    }

    //REGL SPRITE CONSTRUCTION
    _buildPoints(points) {
        var self = this;

        //vector math to draw webgl sprites, in this case, a dot. messing this is – unwise – unless you know what you're doing
        var drawPoints = self.regl({
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
    _candidateColors(points, donationsData, index) {
        var colors = [];
        var values = [];

        values[1] = ["OTHER15A","OTHER15B","BENNET","BIDEN","BOOKER","BULLOCK","BUTTIGIEG","CASTRO","DEBLASIO","DELANEY","GABBARD","GILLIBRAND","GRAVEL","HARRIS","HICKENLOOPER","INSLEE","KLOBUCHAR","MOULTON","OROURKE","RYAN","SANDERS","SESTAK","WARREN","WILLIAMSON","YANG","OTHER"];
        colors[1] = ["#A7E6E3","#A7E6E3","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff","#ffffff"];

        values[2] = ["OTHER15A","OTHER15B","BENNET","BIDEN","BOOKER","BULLOCK","BUTTIGIEG","CASTRO","DEBLASIO","DELANEY","GABBARD","GILLIBRAND","GRAVEL","HARRIS","HICKENLOOPER","INSLEE","KLOBUCHAR","MOULTON","OROURKE","RYAN","SANDERS","SESTAK","WARREN","WILLIAMSON","YANG","OTHER"];
        colors[2] = ["#A7E6E3","#A7E6E3","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0"];

        values[3] = ["UNIQUE15","UNIQUE19","ALL","BOB"];
        colors[3] = ["#E07242","#E07242","#ffffff","#ffffff"];

        values[4] = ["KLOBUCHAR","BENNET","BIDEN","BOOKER","BULLOCK","BUTTIGIEG","CASTRO","DEBLASIO","DELANEY","GABBARD","GILLIBRAND","GRAVEL","HARRIS","HICKENLOOPER","INSLEE","MOULTON","OROURKE","RYAN","SANDERS","SESTAK","WARREN","WILLIAMSON","YANG","OTHER","OTHER15A","OTHER15B"];
        colors[4] = ["#5BBF48","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0","#386cb0"];

        values[11] = ["SANDERS","BENNET","BIDEN","BOOKER","BULLOCK","BUTTIGIEG","CASTRO","DEBLASIO","DELANEY","GABBARD","GILLIBRAND","GRAVEL","HARRIS","HICKENLOOPER","INSLEE","MOULTON","OROURKE","RYAN","KLOBUCHAR","SESTAK","WARREN","WILLIAMSON","YANG","OTHER"];
        colors[11] = ["#386cb0","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3","#A7E6E3"];

        var colorScale = d3.scaleOrdinal()
            .domain(values[index])
            .range(colors[index]);

        //assign colors to our points accordingly
        if (index == 1 || index == 2 || index == 4) {
            points.forEach(function (d, i) {
                var rgbArray = d3.rgb(colorScale(donationsData[i].donor_can));
                d.color = [rgbArray.r / 255, rgbArray.g / 255, rgbArray.b / 255];
            });
        }
        else if (index == 3) {
            points.forEach(function (d, i) {
                var rgbArray = d3.rgb(colorScale(donationsData[i].bucket));
                    d.color = [rgbArray.r / 255, rgbArray.g / 255, rgbArray.b / 255];
            });
        }  
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
    _slide0(points, width, height, donationsData, index) {
        console.log(index);

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

            return bin;
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

            var all = "all";
            var bin = bins[all];
            var binWidth = bin.binWidth;
            var binCount = bin.binCount;
            var binStart = bin.binStart;
            var binCols = bin.binCols;
            var row = Math.floor(binCount / binCols);
            var col = binCount % binCols;
            var x = row * increment;
            var y = col * increment;

            bin.binCount += 1;
            return {
                x: x,
                y: y, 
                color: [255 / 255, 255 / 255, 255 / 255]
            }
        });
        
        arrangement.forEach(function (d, i) {
            Object.assign(points[i], d)
        });
    }

    _slide1(points, width, height, donationsData, index) {
        console.log(index);

        var self = this;

        //assign colors to our points
        self._candidateColors(points, donationsData, index);
    }

    _slide2(points, width, height, donationsData, index) {
        console.log(index);

        var self = this;

        //assign colors to our points
        self._candidateColors(points, donationsData, index);  
    }

    _slide3(points, width, height, donationsData, index) {
        console.log(index);

        var self = this;

        //assign colors to our points
        self._candidateColors(points, donationsData, index); 
    }

    _slide4(points, width, height, donationsData, index) {
        console.log("LAUNCH");

        var self = this;

        //point size and spacing for this shape
        var pointWidth = width / 800;
        var pointMargin = 1;

        //chop up data into buckets of different values in provided column
        var bydonor_can = d3.nest()
            .key(function (d) {
                return d.all;
            })
            .entries(donationsData
                .filter(function(d){return d.year != 2015;})
                .sort(function(x, y){
                return d3.ascending(x.donor_can, y.donor_can);
             }));

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

            return bin;
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

            var all = "all";
            var bin = bins[all];
            var binWidth = bin.binWidth;
            var binCount = bin.binCount;
            var binStart = bin.binStart;
            var binCols = bin.binCols;
            var row = Math.floor(binCount / binCols);
            var col = binCount % binCols;
            var x = row * increment;
            var y = col * increment;

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

        self._candidateColors(points, donationsData, index);
    }

    _slide5(points, width, height, donationsData, index) {
        console.log(index);

        var self = this;

        points.forEach(function (d, i) {
            d.color = [255, 255, 255];
        });
    }

    _slide6(points, width, height, donationsData, index) {
        console.log(index);

        //assign colors to our points
        // self._candidateColors(points, donationsData, index);
    }

    _slide7(points, width, height, donationsData, index) {
        console.log(index);
        
        var self = this;

        //assign colors to our points
        // self._candidateColors(points, donationsData, index);
    }

    _slide8(points, width, height, donationsData, index) {
        console.log(index);

        var self = this;

        //assign colors to our points
        self._candidateColors(points, donationsData, index);
    }

    _slide9(points, width, height, donationsData, index) {
        console.log(index);

        var self = this;

        //assign colors to our points
        // self._candidateColors(points, donationsData, index);
    }

    _slide10(points, width, height, donationsData, index) {
        console.log(index);

        var self = this;

        //assign colors to our points
        // self._candidateColors(points, donationsData, index);
    }

    _slide11(points, width, height, donationsData, index) {
        console.log(index);

        var self = this;

        //assign colors to our points
        self._candidateColors(points, donationsData, index);
    }

    _slide12(points, width, height, donationsData, index) {
        console.log(index);

        var self = this;

        //assign colors to our points
        self._candidateColors(points, donationsData, index);
    }

    //fadeout, banish those dots from the realm
    _fadeout(points) {
        points.forEach(function (d, i) {
            d.color = [255, 255, 255];
        });
    };

    //DATA ANIMATION TRIGGERS
    _zeroPoint(points) {
        var self = this;
        return self._slide0(points, self.width, self.height, self.donationsData, 0);
    };
        
    _onePoint(points) {
        var self = this;
        return self._slide1(points, self.width, self.height, self.donationsData, 1);
    };
        
    _twoPoint(points) {
        var self = this;
        return self._slide2(points, self.width, self.height, self.donationsData, 2);
    };
        
    _threePoint(points) {
        var self = this;
        return self._slide3(points, self.width, self.height, self.donationsData, 3);
    };
        
    _fourPoint(points) {
        var self = this;
        return self._slide4(points, self.width, self.height, self.donationsData, 4);
    };
        
    _fivePoint(points) {
        var self = this;
        return self._slide5(points, self.width, self.height, self.donationsData, 5);
    };
        
    _sixPoint(points) {
        var self = this;
        // return self._slide6(points, self.width, self.height, self.donationsData, 6);
    };

    _sevenPoint(points) {
        var self = this;
        // return self._slide7(points, self.width, self.height, self.donationsData, 7);
    };

    _eightPoint(points) {
        var self = this;
        return self._slide8(points, self.width, self.height, self.donationsData, 8);
    };

    _ninePoint(points) {
        var self = this;
        return self._slide9(points, self.width, self.height, self.donationsData, 9);
    };

    _tenPoint(points) {
        var self = this;
        return self._slide10(points, self.width, self.height, self.donationsData, 10);
    };

    _elevenPoint(points) {
        var self = this;
        return self._slide11(points, self.width, self.height, self.donationsData, 11);
    };

    _twelvePoint(points) {
        var self = this;
        return self._slide12(points, self.width, self.height, self.donationsData, 12);
    };

    //DATA ANIMATION
    _animate(layout, points) {
            var self = this;

            //transmuting our points to new positions and colors
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
            
            //animating the change
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
       var layouts = [self._zeroPoint, self._onePoint, self._twoPoint, self._threePoint, self._fourPoint, self._fivePoint, self._sixPoint, self._sevenPoint, self._eightPoint, self._ninePoint, self._tenPoint, self._elevenPoint, self._twelvePoint];

       //initialize grid
    //    self._animate(layouts[0], self.points);

       //assign crolling waypoint triggers
    //    var waypoint0 = new Waypoint({
    //     element: $('#step0')[0],
    //     handler: function(direction) {
    //       self._animate(layouts[0], self.points);
    //     }
    //   });

    //    var waypoint1 = new Waypoint({
    //     element: $('#step1')[0],
    //     handler: function(direction) {
    //       self._animate(layouts[1], self.points);
    //     }
    //   });

    //   var waypoint2 = new Waypoint({
    //     element: $('#step2')[0],
    //     handler: function(direction) {
    //       self._animate(layouts[2], self.points);
    //     }
    //   });

    //   var waypoint3 = new Waypoint({
    //     element: $('#step3')[0],
    //     handler: function(direction) {
    //       self._animate(layouts[3], self.points);
    //     }
    //   });

    //   var waypoint4 = new Waypoint({
    //     element: $('#step4')[0],
    //     handler: function(direction) {
    //       self._animate(layouts[4], self.points);
    //     }
    //   });

    //   var waypoint5 = new Waypoint({
    //     element: $('#step5')[0],
    //     handler: function(direction) {
    //       self._animate(layouts[5], self.points);
    //     }
    //   });
      
    //   var waypoint6 = new Waypoint({
    //     element: $('#step6')[0],
    //     handler: function(direction) {
    //       self._animate(layouts[6], self.points);
    //     }
    //   });

    //   var waypoint7 = new Waypoint({
    //     element: $('#step7')[0],
    //     handler: function(direction) {
    //       self._animate(layouts[7], self.points);
    //       $("canvas").hide();
    //     }
    //   });

    }
}

export {
    Dots as
    default
}