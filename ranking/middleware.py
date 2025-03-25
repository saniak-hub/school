from django.utils import timezone
from datetime import timedelta
from django.db import connection
from django.core.exceptions import ObjectDoesNotExist
from .models import Test

class AnonymousSessionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Only process if tables exist
        if self._test_table_exists():
            if not request.user.is_authenticated:
                # Delete tests older than 12 hours
                expiration_time = timezone.now() - timedelta(hours=12)
                Test.objects.filter(
                    is_anonymous=True,
                    created_at__lt=expiration_time
                ).delete()
        
        return response

    def _test_table_exists(self):
        """Check if the Test model table exists in the database"""
        return 'ranking_test' in connection.introspection.table_names()
