from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import Test, Subject, Student, Mark

class RegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']

class TestForm(forms.ModelForm):
    subject_count = forms.IntegerField(min_value=1, initial=1, label="Number of Subjects")
    
    class Meta:
        model = Test
        fields = ['name']

class SubjectForm(forms.ModelForm):
    class Meta:
        model = Subject
        fields = ['name']

class StudentForm(forms.ModelForm):
    class Meta:
        model = Student
        fields = ['name']

class MarkForm(forms.ModelForm):
    class Meta:
        model = Mark
        fields = ['value']
