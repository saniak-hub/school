from django.db.models import Avg

def ranking_context(request):
    def get_item(dictionary, key):
        return dictionary.get(key, 0)
    
    return {
        'get_item': get_item,
    }
