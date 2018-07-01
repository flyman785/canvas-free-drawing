'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (global, factory) {
  (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : global.CanvasFreeDrawing = factory();
})(undefined, function () {
  'use strict';

  var CanvasFreeDrawing = function () {
    function CanvasFreeDrawing() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      _classCallCheck(this, CanvasFreeDrawing);

      var _params$elementId = params.elementId,
          elementId = _params$elementId === undefined ? this.requiredParam('elementId') : _params$elementId,
          _params$width = params.width,
          width = _params$width === undefined ? this.requiredParam('width') : _params$width,
          _params$height = params.height,
          height = _params$height === undefined ? this.requiredParam('height') : _params$height,
          lineWidth = params.lineWidth,
          strokeColor = params.strokeColor,
          disabled = params.disabled;


      this.elementId = elementId;
      this.canvas = document.getElementById(this.elementId);
      this.context = this.canvas.getContext('2d', { alpha: false });
      this.width = width;
      this.height = height;

      this.isDrawing = false;
      this.lineWidth = lineWidth || 5;
      this.bucketToolTolerance = 0;
      this.lastPath = null;
      this.imageRestored = false;
      this.positions = [];
      this.leftCanvasDrawing = false; // to check if user left the canvas drawing, on mouseover resume drawing
      this.selectedBucket = false;
      this.allowedEvents = ['redraw', 'mouseup', 'mousedown', 'mouseenter', 'mouseleave'];
      this.isCursorHidden = false;
      this.strokeColor = this.validateColor(strokeColor, true);
      this.bucketToolColor = this.validateColor(strokeColor, true);

      // initialize events
      this.redrawEvent = new Event('cfd_redraw');
      this.mouseUpEvent = new Event('cfd_mouseup');
      this.mouseDownEvent = new Event('cfd_mousedown');
      this.mouseEnterEvent = new Event('cfd_mouseenter');
      this.mouseLeaveEvent = new Event('cfd_mouseleave');

      // these are needed to remove the listener
      this.mouseDown = this.mouseDown.bind(this);
      this.mouseMove = this.mouseMove.bind(this);
      this.mouseLeave = this.mouseLeave.bind(this);
      this.mouseUp = this.mouseUp.bind(this);
      this.mouseUpDocument = this.mouseUpDocument.bind(this);

      this.setDimensions();
      this.setBackground([255, 255, 255]);

      if (!disabled) {
        this.enableDrawing();
      }
    }

    _createClass(CanvasFreeDrawing, [{
      key: 'requiredParam',
      value: function requiredParam(param) {
        throw new Error(param + ' is required');
      }
    }, {
      key: 'addListeners',
      value: function addListeners() {
        this.canvas.addEventListener('mousedown', this.mouseDown);
        this.canvas.addEventListener('mousemove', this.mouseMove);
        this.canvas.addEventListener('mouseleave', this.mouseLeave);
        this.canvas.addEventListener('mouseup', this.mouseUp);
        document.addEventListener('mouseup', this.mouseUpDocument);
      }
    }, {
      key: 'removeListeners',
      value: function removeListeners() {
        this.canvas.removeEventListener('mousedown', this.mouseDown);
        this.canvas.removeEventListener('mouseMove', this.mouseMove);
        this.canvas.removeEventListener('mouseLeave', this.mouseLeave);
        this.canvas.removeEventListener('mouseUp', this.mouseUp);
        document.removeEventListener('mouseUp', this.mouseUpDocument);
      }
    }, {
      key: 'enableDrawing',
      value: function enableDrawing() {
        this.addListeners();
        this.toggleCursor();
      }
    }, {
      key: 'disableDrawing',
      value: function disableDrawing() {
        this.removeListeners();
        this.toggleCursor();
      }
    }, {
      key: 'mouseDown',
      value: function mouseDown() {
        if (event.button !== 0) return;
        var x = event.pageX - this.canvas.offsetLeft;
        var y = event.pageY - this.canvas.offsetTop;
        if (this.selectedBucket) {
          this.fill(x, y, this.bucketToolColor, this.bucketToolTolerance);
          return;
        }
        this.isDrawing = true;
        var lenght = this.storeDrawing(x, y, false);
        this.lastPath = lenght - 1; // index last new path

        this.canvas.dispatchEvent(this.mouseDownEvent);

        this.redraw();
      }
    }, {
      key: 'mouseMove',
      value: function mouseMove() {
        if (this.leftCanvasDrawing) {
          this.leftCanvasDrawing = false;
          this.mouseDown(event);
        }
        if (this.isDrawing) {
          var x = event.pageX - this.canvas.offsetLeft;
          var y = event.pageY - this.canvas.offsetTop;
          this.storeDrawing(x, y, true);
          this.redraw();
        }
      }
    }, {
      key: 'mouseUp',
      value: function mouseUp() {
        this.isDrawing = false;
        this.canvas.dispatchEvent(this.mouseUpEvent);
      }
    }, {
      key: 'mouseUpDocument',
      value: function mouseUpDocument() {
        this.leftCanvasDrawing = false;
      }
    }, {
      key: 'mouseLeave',
      value: function mouseLeave() {
        if (this.isDrawing) this.leftCanvasDrawing = true;
        this.isDrawing = false;
        this.canvas.dispatchEvent(this.mouseLeaveEvent);
      }
    }, {
      key: 'mouseEnter',
      value: function mouseEnter() {
        this.canvas.dispatchEvent(this.mouseEnterEvent);
      }
    }, {
      key: 'toggleCursor',
      value: function toggleCursor() {
        if (this.canvas.style.cursor === 'crosshair') {
          this.canvas.style.cursor = 'auto';
        } else {
          this.canvas.style.cursor = 'crosshair';
        }
      }
    }, {
      key: 'storeDrawing',
      value: function storeDrawing(x, y, moving) {
        return this.positions.push({ x: x, y: y, moving: moving });
      }
    }, {
      key: 'redraw',
      value: function redraw(all) {
        var _this = this;

        this.context.strokeStyle = this.rgbaFromArray(this.strokeColor);
        this.context.lineJoin = 'round';
        this.context.lineWidth = this.lineWidth;

        var position = [];

        if (all) {
          position = this.positions;
        } else {
          position = this.positions.slice(this.lastPath);
        }

        position.forEach(function (_ref, i) {
          var x = _ref.x,
              y = _ref.y,
              moving = _ref.moving;

          _this.context.beginPath();
          if (moving && i) {
            _this.context.moveTo(position[i - 1]['x'], position[i - 1]['y']);
          } else {
            _this.context.moveTo(x - 1, y);
          }
          _this.context.lineTo(x, y);
          _this.context.closePath();
          _this.context.stroke();
        });

        this.canvas.dispatchEvent(this.redrawEvent);
      }

      // https://en.wikipedia.org/wiki/Flood_fill

    }, {
      key: 'fill',
      value: function fill(x, y, newColor, tolerance) {
        if (this.positions.length === 0 && !this.imageRestored) {
          this.setBackground(newColor, false);
          return;
        }
        if ((typeof newColor === 'undefined' ? 'undefined' : _typeof(newColor)) != 'object') throw new Error('New color must be an array like: [255, 255, 255, 255]');
        var imageData = this.context.getImageData(0, 0, this.width, this.height);
        var data = imageData.data;
        var nodeColor = this.getNodeColor(x, y, data);
        var targetColor = this.getNodeColor(x, y, data);
        if (this.isNodeColorEqual(targetColor, newColor, tolerance)) return;
        if (!this.isNodeColorEqual(nodeColor, targetColor)) return;
        var queue = [];
        queue.push([x, y]);

        while (queue.length) {
          if (queue.length > this.width * this.height) break;
          var n = queue.pop();
          var w = n;
          var e = n;

          while (this.isNodeColorEqual(this.getNodeColor(w[0] - 1, w[1], data), targetColor, tolerance)) {
            w = [w[0] - 1, w[1]];
          }

          while (this.isNodeColorEqual(this.getNodeColor(e[0] + 1, e[1], data), targetColor, tolerance)) {
            e = [e[0] + 1, e[1]];
          }

          var firstNode = w[0];
          var lastNode = e[0];

          for (var i = firstNode; i <= lastNode; i++) {
            this.setNodeColor(i, w[1], newColor, data);

            if (this.isNodeColorEqual(this.getNodeColor(i, w[1] + 1, data), targetColor, tolerance)) {
              queue.push([i, w[1] + 1]);
            }

            if (this.isNodeColorEqual(this.getNodeColor(i, w[1] - 1, data), targetColor, tolerance)) {
              queue.push([i, w[1] - 1]);
            }
          }
        }

        this.context.putImageData(imageData, 0, 0);
        this.canvas.dispatchEvent(this.redrawEvent);
      }

      // i = color 1; j = color 2; t = tolerance

    }, {
      key: 'isNodeColorEqual',
      value: function isNodeColorEqual(i, j, t) {
        if (t) {
          // prettier-ignore
          return Math.abs(j[0] - i[0]) <= t && Math.abs(j[1] - i[1]) <= t && Math.abs(j[2] - i[2]) <= t;
        }
        return i[0] === j[0] && i[1] === j[1] && i[2] === j[2] && i[3] === j[3];
      }
    }, {
      key: 'getNodeColor',
      value: function getNodeColor(x, y, data) {
        var i = (x + y * this.width) * 4;
        return [data[i], data[i + 1], data[i + 2], data[i + 3]];
      }
    }, {
      key: 'setNodeColor',
      value: function setNodeColor(x, y, color, data) {
        var i = (x + y * this.width) * 4;
        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
        data[i + 3] = color[3];
      }
    }, {
      key: 'rgbaFromArray',
      value: function rgbaFromArray(a) {
        return 'rgba(' + a[0] + ',' + a[1] + ',' + a[2] + ',' + a[3] + ')';
      }
    }, {
      key: 'rgbFromArray',
      value: function rgbFromArray(a) {
        return 'rgb(' + a[0] + ',' + a[1] + ',' + a[2] + ')';
      }
    }, {
      key: 'setDimensions',
      value: function setDimensions() {
        this.canvas.height = this.height;
        this.canvas.width = this.width;
      }
    }, {
      key: 'validateColor',
      value: function validateColor(color, placeholder) {
        if ((typeof color === 'undefined' ? 'undefined' : _typeof(color)) === 'object' && color.length === 4) color.pop();
        if ((typeof color === 'undefined' ? 'undefined' : _typeof(color)) === 'object' && color.length === 3) {
          var validColor = [].concat(_toConsumableArray(color));
          validColor.push(255);
          return validColor;
        } else if (placeholder) {
          return [0, 0, 0, 255];
        }
        console.warn('Color was not valid!');
        return null;
      }

      // Public APIs

    }, {
      key: 'on',
      value: function on(event, callback) {
        if (this.allowedEvents.includes(event)) {
          this.canvas.addEventListener('cfd_' + event, function () {
            return callback();
          });
        }
      }
    }, {
      key: 'setLineWidth',
      value: function setLineWidth(px) {
        this.lineWidth = px;
      }
    }, {
      key: 'setBackground',
      value: function setBackground(color) {
        var save = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

        var validColor = this.validateColor(color);
        if (validColor) {
          if (save) this.backgroundColor = validColor;
          this.context.fillStyle = this.rgbaFromArray(validColor);
          this.context.fillRect(0, 0, this.width, this.height);
        }
      }
    }, {
      key: 'setDrawingColor',
      value: function setDrawingColor(color) {
        this.setBucketTool({ color: color });
        this.setStrokeColor(color);
      }
    }, {
      key: 'setStrokeColor',
      value: function setStrokeColor(color) {
        this.strokeColor = this.validateColor(color, true);
      }
    }, {
      key: 'setBucketTool',
      value: function setBucketTool(params) {
        var _params$color = params.color,
            color = _params$color === undefined ? null : _params$color,
            _params$tolerance = params.tolerance,
            tolerance = _params$tolerance === undefined ? null : _params$tolerance;

        if (color) this.bucketToolColor = this.validateColor(color);
        if (tolerance && tolerance > 0) this.bucketToolTolerance = tolerance;
      }
    }, {
      key: 'toggleBucket',
      value: function toggleBucket() {
        return this.selectedBucket = !this.selectedBucket;
      }
    }, {
      key: 'isBucketActive',
      value: function isBucketActive() {
        return this.selectedBucket;
      }
    }, {
      key: 'clear',
      value: function clear() {
        this.context.clearRect(0, 0, this.width, this.height);
        this.lastPath = null;
        this.positions = [];
        this.isDrawing = false;
        this.setBackground(this.backgroundColor);
      }
    }, {
      key: 'save',
      value: function save() {
        return this.canvas.toDataURL();
      }
    }, {
      key: 'restore',
      value: function restore(backup) {
        var _this2 = this;

        var image = new Image();
        image.src = backup;
        image.onload = function () {
          _this2.imageRestored = true;
          _this2.context.drawImage(image, 0, 0);
        };
      }
    }]);

    return CanvasFreeDrawing;
  }();

  return CanvasFreeDrawing;
});
