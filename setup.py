#!/usr/bin/env python
# coding: utf-8

import os
from setuptools import setup

from geodjango_gmaps_widget import VERSION

REQUIREMENTS = [
    'django',
]

README = os.path.join(os.path.dirname(__file__), 'README.md')
LONG_DESCRIPTION = open(README, 'r').read()

CLASSIFIERS = [
    "Development Status :: 3 - Alpha",
    "Environment :: Web Environment",
    "Framework :: Django",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: BSD License",
    "Operating System :: OS Independent",
    "Programming Language :: Python",
    "Topic :: Software Development",
    "Topic :: Software Development :: Libraries :: Application Frameworks",
]

setup(
    name="geodjango-gmaps-widget",
    version=VERSION,
    author="Cauê Thenório",
    author_email="cauelt@gmail.com",
    description="Google Maps v3 drop in replacement for the default " \
                "Geodjango admin OpenLayers widget",
    long_description=LONG_DESCRIPTION,
    url="https://github.com/cauethenorio/geodjango-gmaps-widget",
    packages=("geodjango_gmaps_widget",),
    include_package_data=True,
    install_requires=REQUIREMENTS,
    classifiers=CLASSIFIERS,
    zip_safe=False,
)