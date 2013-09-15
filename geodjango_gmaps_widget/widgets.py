# coding: utf-8

import json
import collections

from django.contrib.gis.forms import widgets as geowidgets


def dict_update(target_dict, *update_list):
    for u in update_list:
        for k, v in u.iteritems():
            if isinstance(v, collections.Mapping):
                r = dict_update(target_dict.get(k, {}), v)
                target_dict[k] = r
            else:
                target_dict[k] = u[k]
    return target_dict


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
            'zoom': 8,
            'lat': -23,
            'lng': -46,
            'type': 'ROADMAP',
        },
        'address':{
            'field': None,
            'update_on_drag': False,
        },
    }

    class Media:
        extend = False
        js = ('gmaps-widget/js/wicket.js',
              'gmaps-widget/js/wicket-gmap3.js',
              'gmaps-widget/js/GmapsWidget.min.js',)

    def __init__(self, attrs=None, *args, **kwargs):
        super(GmapsWidget, self).__init__(attrs=attrs, *args, **kwargs)
        self.attrs = dict_update(self.default_attrs, self.attrs, attrs)
        self.update_media_gmaps_js()

    def format_attrs(self):
        for key in ['width', 'height']:
            val = self.attrs['map_size'][key]

            if isinstance(val, (long, int)) or val.isdigit():
                self.attrs['map_size'][key] = '{}px'.format(val)

        for key in ['map_start', 'address']:
            self.attrs[key] = json.dumps(self.attrs[key])

    def update_media_gmaps_js(self):
        self.Media.js = (self.gmaps_url,) + self.Media.js

    @property
    def gmaps_url(self):
        attrs = self.attrs.get('gmaps_url')
        key = attrs.get('key') and '&key={}'.format(attrs.get('key')) or ''
        sensor = '&sensor={}'.format(str(attrs.get('sensor')).lower())

        return "{}{}{}".format(attrs.get('base'), sensor, key)

    def render(self, name, value, attrs={}):
        self.attrs = dict_update(self.attrs, attrs,
                            {'module': 'gmapsy_%s' % name.replace('-','_')})
        self.format_attrs()

        return super(GmapsWidget, self).render(name, value, self.attrs)
