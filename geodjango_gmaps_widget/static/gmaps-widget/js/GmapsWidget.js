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

(function($) {
    "use strict";

    window['GmapsWidget'] = function() {
        var self,
            drawingModes = {
                'Point': 'MARKER'
            },

            /*
             the default options to initialize the google maps,
             use the 'updateDefaultOptions' method to change it
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

        function getByName(name) {
            return $('[name=' + name + ']');
        }

        /***
         *
         * @param {DOM} valEl
         * @param {DOM} mapEl
         * @param {Object} options
         * @constructor
         */
        function GmapsWidget(valEl, mapEl, featureType, options) {

            self = this;
            self.mapEl = mapEl;
            self.valEl = valEl;
            self.feature = null;
            self.drawingModeName = drawingModes[featureType];
            self.mapSRID = "SRID=4326;";
            self.modifiable = options.modifiable;

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
            var mapStartOptions = self.buildMapOptons(options);

            self.map = new google.maps.Map(self.mapEl,
                            extend_dict(defaultOptions, mapStartOptions));

            if (options.modifiable) {
                self.addAddressFieldListener(options);
                self.createDrawingManager();
                self.addDrawListener();
            }
            self.loadFeatureFromWKTField();
        };

        GmapsWidget.prototype.buildMapOptons = function (opts) {
            return {
                zoom: opts.default_zoom,
                center: new google.maps.LatLng(
                    opts.default_lat,
                    opts.default_lng),
                mapTypeId: google.maps.MapTypeId[opts.default_type]
            };
        };

        GmapsWidget.prototype.createDrawingManager = function () {
            self.drawingManager = new google.maps.drawing.DrawingManager({
                drawingMode:
                    google.maps.drawing.OverlayType[self.drawingModeName],
                drawingControl: true,
                drawingControlOptions: {
                    position: google.maps.ControlPosition.TOP_RIGHT,
                    drawingModes: [
                        google.maps.drawing.OverlayType[self.drawingModeName]]
                }
            });
            self.drawingManager.setMap(self.map);
        };

        GmapsWidget.prototype.loadFeatureFromWKTField = function() {
            if (!self.valEl.value) return;
            var wkt = new Wkt.Wkt();

            try {
                wkt.read(self.valEl.value.replace(/(\n|\t|\r)/g, ''));
            } catch (e) {return;}

            var feature = wkt.toObject(
                extend_dict({}, defaultOptions.defaults,
                            {'editable': true, 'visible': true})
            );

            self.addFeature(feature, true);
            self.map.setCenter(feature.getPosition());
            self.map.setZoom(16);
            if (self.drawingManager)
                self.drawingManager.setDrawingMode(null);

        };

        GmapsWidget.prototype.addDrawListener = function () {
            google.maps.event.addListener(
                self.drawingManager, 'overlaycomplete',
                function (event) {
                    this.setDrawingMode(null);
                    self.addFeature(event.overlay);
                }
            );
        };

        GmapsWidget.prototype._getZoomForType = function(type, zoom) {
            var zoomLevels = {
                    16: ['street_address', 'route', 'intersection', 'premise',
                        'subpremise', 'postal_code'],
                    14: ['sublocality', 'neighborhood'],
                    13: ['political', 'airport', 'park'],
                    10: ['administrative_area_level_3', 'locality'],
                    5: ['country', 'administrative_area_level_1',
                        'administrative_area_level_2', 'natural_feature']
                };

            for (var z in zoomLevels)
                if (zoomLevels[z].indexOf(type) !== -1) {
                    zoom = z;
                    break;
                }
            return parseInt(zoom);
        };

        GmapsWidget.prototype.geocodeAddress = function (address) {

            if (address)
                self.geocoder.geocode({
                        'address': address,
                        'componentRestrictions': self.geocoder_restrictions},
                    function (results, status) {
                        if (status === google.maps.GeocoderStatus.OK) {
                            self.addFeature(
                                new google.maps.Marker({
                                    position: results[0].geometry.location})
                            );
                            self.map.setCenter(results[0].geometry.location);
                            self.map.setZoom(
                                self._getZoomForType(
                                    results[0].types[0], self.map.getZoom()));
                            if (self.drawingManager)
                                self.drawingManager.setDrawingMode(null);
                        }
                    }
                );
        };

        GmapsWidget.prototype.addAddressFieldListener = function(opts) {
            var addressEl = getByName(opts.address_field);

            if (opts.address_field && addressEl.length
                && (opts.address_update || opts.address_geocode)) {

                self.geocoder = new google.maps.Geocoder();
                self.geocoder_restrictions = opts.address_geocoder_restrictions;

                if (opts.address_geocode) {
                    addressEl.on('keydown keypress cut past', function($e) {
                        if (self.geocoder_timer)
                            clearTimeout(self.geocoder_timer);

                        self.geocoder_timer = setTimeout(function() {
                            self.geocodeAddress(addressEl.val());
                        }, 1000);

                    });
                }
            }
        };

        /***
         * Add or replace a point to the map
         *
         * @param {google.maps.Marker} feature The marker to be added to the map
         */
        GmapsWidget.prototype.addFeature = function (feature) {
            if (self.feature)
                self.feature.setMap(null);

            self.feature = feature;
            feature.setMap(self.map);

            if (self.modifiable) {
                feature.setDraggable(true);

                google.maps.event.addListener(feature, 'dragend', function () {
                    self.updatePosition();
                });
            }
            self.updatePosition();
        };

        GmapsWidget.prototype.removeFeature = function () {
            if (self.feature) {
                self.feature.setMap(null);
                self.feature = null;
            }
            self.updatePosition();
        };

        /***
         *
         */
        GmapsWidget.prototype.updatePosition = function () {
            var wkt = new Wkt.Wkt(),
                value = '';

            if (self.feature)
                value = self.mapSRID + wkt.fromObject(self.feature).write();
            self.valEl.value = value;
        };

        return GmapsWidget;
    }();

})($ || jQuery || (django && django.jQuery));