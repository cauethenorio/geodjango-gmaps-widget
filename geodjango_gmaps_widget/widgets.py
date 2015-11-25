# coding: utf-8

import six
import json

import django.forms
from django.contrib.gis.forms import widgets as geowidgets

from .utils import dict_update


class GmapsWidget(geowidgets.BaseGeometryWidget):

    template_name = 'gmaps-widget/map-widget.html'

    # These are the Gmap widget default properties, which can be overriden by:
    #    - __init__ method 'attrs' parameter
    #    - render method 'attrs' parameter
    gmaps_base_url = 'http://maps.googleapis.com/maps/api/js?libraries=drawing'
    use_gmaps_sensor = False
    gmaps_key = ''

    width = 600
    height = 400

    default_zoom = 2
    default_lat = 0
    default_lng = 0
    default_type = 'ROADMAP'

    display_wkt = False
    max_zoom = False
    min_zoom = False
    max_extent = False
    modifiable = True
    scrollable = True
    point_zoom = 12
    debug = False

    address_field = None
    address_geocode = True
    address_geocoder_restrictions = None
    address_update = False


    # all class attributes which will be in render context
    public_attrs = ['gmaps_url', 'width', 'height', 'default_zoom',
                    'default_lat', 'default_lng', 'default_type',
                    'display_wkt', 'max_zoom', 'min_zoom', 'max_extent',
                    'modifiable', 'scrollable', 'point_zoom', 'debug',
                    'address_field', 'address_geocode', 'address_update',
                    'address_geocoder_restrictions']

    needs_unit_sanitize = ['width', 'height']
    not_used_in_widget_js = ['gmaps_url', 'width', 'height']

    def __init__(self, attrs=None, *args, **kwargs):
        super(GmapsWidget, self).__init__(attrs=attrs, *args, **kwargs)
        self.update_attrs_from_dict(attrs or {})

    @property
    def media(self):
        return django.forms.Media(
            js = (self.gmaps_url,
                  'gmaps-widget/js/wicket.js',
                  'gmaps-widget/js/wicket-gmap3.js',
                  'gmaps-widget/js/GmapsWidget.js',))

    def update_attrs_from_dict(self, dict_attrs):
        [setattr(self, k, v) for k, v in dict_attrs.items()
         if k in self.public_attrs and not k.startswith('_')]

    def format_attrs_for_template(self, aditional_keys={}):
        template_dict = {}
        widget_args_dict = {}

        for attr in self.public_attrs:
            if attr in self.needs_unit_sanitize:
                setattr(self, attr, self.sanitize_unit(getattr(self, attr)))

            if attr in self.not_used_in_widget_js:
                template_dict[attr] = getattr(self, attr)
            else:
                widget_args_dict[attr] = getattr(self, attr)

        template_dict.update({
                'widget_args': json.dumps(widget_args_dict),
                'modifiable': widget_args_dict['modifiable'],
            }, **aditional_keys)
        return template_dict

    def sanitize_unit(self, val):
        if isinstance(val, six.integer_types) or val.isdigit():
            return '{}px'.format(val)
        return val

    @property
    def gmaps_url(self):
        key = getattr(self, 'gmaps_key') and '&key={}'.format(self.gmaps_key) or ''
        sensor = '&sensor={}'.format(str(self.use_gmaps_sensor).lower())
        return "{}{}{}".format(self.gmaps_base_url, sensor, key)

    def render(self, name, value, attrs={}):
        attrs['module'] = 'gmaps_%s' % name.replace('-', '_')
        prepared_attrs = self.format_attrs_for_template(attrs)
        return super(GmapsWidget, self).render(name, value, prepared_attrs)
