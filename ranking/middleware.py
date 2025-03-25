from django.utils import timezone
from datetime import timedelta
from .models import Test

class AnonymousSessionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Clean up expired anonymous tests
        if not request.user.is_authenticated:
            expired_tests = Test.objects.filter(
                is_anonymous=True,
                created_at__lt=timezone.now() - timedelta(hours=12)
            )
            expired_tests.delete()
        
        return response
