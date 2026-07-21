from __future__ import absolute_import, print_function

from .AbletonMcpBridge import AbletonMcpBridge


def create_instance(c_instance):
    return AbletonMcpBridge(c_instance)
