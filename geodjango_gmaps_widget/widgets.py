# coding: utf-8

import json

import django.forms
from django.contrib.gis.forms import widgets as geowidgets

from .utils import dict_update


class GmapsWidget(geowidgets.BaseGeometryWidget):
    template_name = 'gmaps-widget/map-widget.html'

    default_attrs = {
        'gmaps_url': {
            'base': 'http://maps.googleapis.com/maps/api/js?libraries=drawing',
            'sensor': False,
            'key': '',
        },
        'map_size': {
            'width': 600,
            'height': 400,
        },
        'map_start': {
            'zoom': 2,
            'lat': 0,
            'lng': 0,
            'type': 'ROADMAP',
        },
        'behavior': {
            'display_wkt': False,
            'max_zoom': False,
            'min_zoom': False,
            'max_extent': False,
            'modifiable': False,
            'scrollable': False,
            'point_zoom': 12,
            'debug': False
        },
        'address': {
            'field_name': None,
            'geocode': True,
            'reverse_geocode': False,
        },
    }

    @property
    def media(self):
        return django.forms.Media(
            js = (self.gmaps_url,
                  'gmaps-widget/js/wicket.js',
                  'gmaps-widget/js/wicket-gmap3.js',
                  'gmaps-widget/js/GmapsWidget.min.js',))

    def __init__(self, attrs=None, *args, **kwargs):
        super(GmapsWidget, self).__init__(attrs=attrs, *args, **kwargs)
        self.attrs = dict_update(self.default_attrs, self.attrs, attrs)

    def format_attrs(self):
        for key in ['width', 'height']:
            val = self.attrs['map_size'][key]

            if isinstance(val, (long, int)) or val.isdigit():
                self.attrs['map_size'][key] = '{}px'.format(val)

        for key in ['map_start', 'behavior', 'address']:
            self.attrs[key] = json.dumps(self.attrs[key])

    @property
    def gmaps_url(self):
        attrs = self.attrs.get('gmaps_url')
        key = attrs.get('key') and '&key={}'.format(attrs.get('key')) or ''
        sensor = '&sensor={}'.format(str(attrs.get('sensor')).lower())
        return "{}{}{}".format(attrs.get('base'), sensor, key)

    def render(self, name, value, attrs={}):
        self.attrs = dict_update(self.attrs, attrs,
                            {'module': 'gmaps_%s' % name.replace('-','_')})
        self.format_attrs()
        return super(GmapsWidget, self).render(name, value, self.attrs)
