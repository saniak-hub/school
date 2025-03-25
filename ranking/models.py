from django.db import models
from django.db.models import Sum, Avg
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    
    def __str__(self):
        return self.user.username

class Subject(models.Model):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name

class Test(models.Model):
    name = models.CharField(max_length=100)
    subjects = models.ManyToManyField(Subject)  
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_anonymous = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.name} (by {'Anonymous' if self.is_anonymous else self.created_by.username})"
    
    def is_expired(self):
        if self.is_anonymous:
            return timezone.now() > self.created_at + timedelta(hours=12)
        return False

class Student(models.Model):
    name = models.CharField(max_length=100)
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    
    def __str__(self):
        return self.name
    
    def total_marks(self):
        # More efficient query using aggregation
        return self.mark_set.aggregate(total=Sum('value'))['total'] or 0
    
    class Meta:
        ordering = ['name']

class Mark(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    value = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.student.name} - {self.subject.name}: {self.value}"
    
    class Meta:
        unique_together = ('student', 'subject')
