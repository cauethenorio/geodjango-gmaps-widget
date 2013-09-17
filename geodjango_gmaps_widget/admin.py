from django.contrib.admin import ModelAdmin
from django.contrib.gis.db import models

from .widgets import GmapsWidget
from .utils import dict_update

class GmapsGeoModelAdmin(ModelAdmin):

    gmap_attrs = None
    map_widget = GmapsWidget

    def formfield_for_dbfield(self, db_field, **kwargs):
        """
        Overloaded from ModelAdmin so that an OpenLayersWidget is used
        for viewing/editing 2D GeometryFields (OpenLayers 2 does not support
        3D editing).
        """
        if isinstance(db_field, models.PointField) and db_field.dim < 3:
            request = kwargs.pop('request', None)
            # Setting the widget with the newly defined widget.
            kwargs['widget'] = self.get_map_widget(db_field)
            return db_field.formfield(**kwargs)
        else:
            return super(GmapsGeoModelAdmin, self)\
                .formfield_for_dbfield(db_field, **kwargs)

    def get_map_widget(self, db_field):
        """
        Returns a subclass of the OpenLayersWidget (or whatever was specified
        in the `widget` attribute) using the settings from the attributes set
        in this class.
        """
        gmaps_model_admin = self
        class ConfiguredGmapWidget(self.map_widget):

            def __init__(self, *args, **kwargs):
                super(ConfiguredGmapWidget, self).__init__(
                    attrs=gmaps_model_admin.gmap_attrs, *args, **kwargs)

        return ConfiguredGmapWidget