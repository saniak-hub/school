from django import template

register = template.Library()

@register.filter(name='get_item')
def get_item(dictionary, key):
    """Template filter to access dictionary items by key"""
    return dictionary.get(key)
