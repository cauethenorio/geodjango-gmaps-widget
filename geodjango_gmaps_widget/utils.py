# coding: utf-8

import collections


def dict_update(target_dict, *update_list):
    for u in update_list:
        if hasattr(u, 'iteritems'):
            for k, v in u.iteritems():
                if isinstance(v, collections.Mapping):
                    r = dict_update(target_dict.get(k, {}), v)
                    target_dict[k] = r
                else:
                    target_dict[k] = u[k]
    return target_dict


def class_to_dict(cls):
    return dict([(k, getattr(cls, k)) for k in dir(cls)
          if not k.startswith('_')])