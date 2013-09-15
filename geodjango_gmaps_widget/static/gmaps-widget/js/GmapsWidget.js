/***
 @license
 The MIT License (MIT)

 Copyright (c) 2013 Cauê Thenório (cauelt at gmail.com)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.

 */

(function() {
    "use strict";

    window['GmapsWidget'] = function() {
        var self,
            drawingModes = {
                'POINT': 'MARKER'
            },

            /*
             the default options to initialize the google maps,
             these options can be changed with the 'updateDefaultOptions'
             method
             */
            defaultOptions = {
                panControl: false,
                zoomControl: true,
                zoomControlOptions: {
                    style: google.maps.ZoomControlStyle.SMALL
                },
                defaults: {
                    strokeColor: '#990000',
                    fillColor: '#EEFFCC',
                    fillOpacity: 0.6
                }
            };

        /***
         * A private simple dict merge/extend function, like the jQuery.extend
         *
         * The first argument must be a object to be extended with the another
         * arguments objects properties.
         *
         * Borrowed from Maxim Ponomarev in
         * http://stackoverflow.com/questions/12317003/something-like-jquery-extend-but-standalone
         *
         * @param target object to be extended (it will be modified)
         * @param [object1] object with the properties to be copied
         * @param [objectN] object with the properties to be copied
         * @returns {*} the extended target object
         */
        function extend_dict(obj) {
            Array.prototype.slice.call(arguments, 1)
                .forEach(function (source) {
                if (source) {
                    for (var prop in source) {
                        if (source[prop].constructor === Object) {
                            if (!obj[prop] || obj[prop].constructor === Object) {
                                obj[prop] = obj[prop] || {};
                                extend_dict(obj[prop], source[prop]);
                            } else
                                obj[prop] = source[prop];
                        } else
                            obj[prop] = source[prop];
                    }
                }
            });
            return obj;
        }

        /***
         *
         * @param {DOM} valEl
         * @param {DOM} mapEl
         * @param {Object} options
         * @constructor
         */
        function GmapsWidget(valEl, mapEl, options) {

            self = this;
            self.mapEl = mapEl;
            self.valEl = valEl;
            self.geometry = null;
            self.drawingModeName = drawingModes[options.geom_type];
            self.mapSRID = "SRID=4326;";

            self.init(options);
        }

        /***
         *
         * @param options
         * @returns {Object}
         */
        GmapsWidget.setDefaultOptions = function (options) {
            extend_dict(defaultOptions, options || {});
            return defaultOptions;
        };

        GmapsWidget.prototype.init = function(options) {

            var mapStartOptions = self.buildMapOptons(options.map_start);

            self.map = new google.maps.Map(self.mapEl,
                            extend_dict(defaultOptions, mapStartOptions));

            self.createDrawingManager();
            self.readGeomFromField();
            self.addDrawListener();
        };

        GmapsWidget.prototype.buildMapOptons = function (opts) {
            return {
                    zoom: opts.zoom,
                    center: new google.maps.LatLng(opts.lat, opts.lng),
                    mapTypeId: google.maps.MapTypeId[opts.type]
            };
        };

        GmapsWidget.prototype.createDrawingManager = function () {
            self.drawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: google.maps.drawing.OverlayType[self.drawingModeName],
                drawingControl: true,
                drawingControlOptions: {
                    position: google.maps.ControlPosition.TOP_RIGHT,
                    drawingModes: [
                        google.maps.drawing.OverlayType[self.drawingModeName]]
                }
            });
            self.drawingManager.setMap(self.map);
        };

        GmapsWidget.prototype.readGeomFromField = function() {
            var wkt = new Wkt.Wkt();

            try { // Catch any malformed WKT strings
                wkt.read(self.valEl.value
                    .replace('\n', '')
                    .replace('\r', '')
                    .replace('\t', ''));
            } catch (e) {
                return;
            }

            var geom = wkt.toObject({
                    editable: true,
                    strokeColor: '#990000',
                    fillColor: '#EEFFCC',
                    fillOpacity: 0.6,
                    visible: true
                });

            self.addGeometry(geom, true);
            self.map.setCenter(geom.getPosition());
            self.map.setZoom(16);
            self.drawingManager.setDrawingMode(null);

        };

        GmapsWidget.prototype.addDrawListener = function () {
            google.maps.event.addListener(
                self.drawingManager, 'overlaycomplete',
                function (event) {
                    this.setDrawingMode(null);
                    self.addGeometry(event.overlay);
                }
            );
        };

        /***
         * Add or replace a point to the map
         *
         * @param {google.maps.Marker} geom The marker to be added to the map
         */
        GmapsWidget.prototype.addGeometry = function (geom) {
            if (self.geometry)
                self.geometry.setMap(null);

            self.geometry = geom;

            geom.setDraggable(true);
            geom.setMap(self.map);

            google.maps.event.addListener(geom, 'dragend', function () {
                self.updatePosition();
            });
            self.updatePosition();
        };

        GmapsWidget.prototype.removeGeometry = function () {
            if (self.geometry) {
                self.geometry.setMap(null);
                self.geometry = null;
            }
            self.updatePosition();
        };

        /***
         *
         */
        GmapsWidget.prototype.updatePosition = function () {
            var wkt = new Wkt.Wkt(),
                value = '';

            if (self.geometry)
                value = self.mapSRID + wkt.fromObject(self.geometry).write();
            self.valEl.value = value;
        };

        return GmapsWidget;
    }();

})();