from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.utils import timezone
from django.db.models import Sum,Avg
from datetime import timedelta
from .models import *
from .forms import *
import json
from django.http import JsonResponse

def register(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            Teacher.objects.create(user=user)
            login(request, user)
            return redirect('dashboard')
    else:
        form = RegistrationForm()
    return render(request, 'ranking/register.html', {'form': form})

def user_login(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
        
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            next_url = request.GET.get('next', 'dashboard')
            return redirect(next_url)
        else:
            messages.error(request, 'Invalid username or password.')
    
    return render(request, 'ranking/login.html')


def api_add_student(request, test_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            test = get_object_or_404(Test, id=test_id)
            student = Student.objects.create(name=data['name'], test=test)
            
            # Create marks for all subjects
            for subject in test.subjects.all():
                Mark.objects.create(student=student, subject=subject, value=0)
            
            return JsonResponse({
                'success': True,
                'student': {
                    'id': student.id,
                    'name': student.name
                }
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid method'})

def api_delete_student(request, student_id):
    if request.method == 'POST':
        try:
            student = get_object_or_404(Student, id=student_id)
            student.delete()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid method'})

def api_save_marks(request, test_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            marks_data = data.get('marks_data', {})
            
            for student_id, subject_marks in marks_data.items():
                student = get_object_or_404(Student, id=student_id)
                for subject_id, mark_value in subject_marks.items():
                    mark = get_object_or_404(Mark, student=student, subject_id=subject_id)
                    mark.value = float(mark_value) if mark_value else 0
                    mark.save()
            
            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'error': str(e)})
    return JsonResponse({'status': 'error', 'error': 'Invalid method'})

@login_required
def user_logout(request):
    logout(request)
    return redirect('login')

@login_required
def dashboard(request):
    tests = Test.objects.filter(created_by=request.user, is_anonymous=False)
    latest_test = tests.order_by('-created_at').first()
    
    # Check if user is anonymous (not logged in)
    if not request.user.is_authenticated:
        anonymous_tests = Test.objects.filter(created_by=None, is_anonymous=True)
        latest_test = anonymous_tests.order_by('-created_at').first()
    
    ranked_students = []
    subject_averages = {}
    total_average = 0
    
    if latest_test:
        # Get students with their total marks
        students = Student.objects.filter(test=latest_test).annotate(
            total_marks=Sum('mark__value')
        ).order_by('-total_marks')
        
        # Prepare ranked student data
        ranked_students = []
        for rank, student in enumerate(students, start=1):
            marks = {mark.subject.id: mark.value for mark in student.mark_set.all()}
            ranked_students.append({
                'rank': rank,
                'name': student.name,
                'marks': marks,
                'total': student.total_marks
            })
        
        # Calculate subject averages
        subjects = latest_test.subjects.all()
        for subject in subjects:
            avg = Mark.objects.filter(
                subject=subject, 
                student__test=latest_test
            ).aggregate(avg=Avg('value'))['avg'] or 0
            subject_averages[subject.id] = avg
        
        # Calculate overall average
        if students.exists():
            total_average = sum(s.total_marks for s in students) / students.count()
    
    context = {
        'latest_test': latest_test,
        'tests': tests if request.user.is_authenticated else [],
        'ranked_students': ranked_students,
        'subject_averages': subject_averages,
        'total_average': total_average,
    }
    
    if request.GET.get('test_id'):
        selected_test = get_object_or_404(Test, id=request.GET['test_id'])
        if (request.user.is_authenticated and selected_test.created_by == request.user) or \
           (not request.user.is_authenticated and selected_test.is_anonymous):
            context['latest_test'] = selected_test
    
    return render(request, 'ranking/dashboard.html', context)
@login_required
def create_test(request):
    if request.method == 'POST':
        test_form = TestForm(request.POST)
        if test_form.is_valid():
            test = test_form.save(commit=False)
            test.created_by = request.user if request.user.is_authenticated else None
            test.is_anonymous = not request.user.is_authenticated
            test.save()
            
            subject_count = int(request.POST.get('subject_count', 1))
            return redirect('add_subjects', test_id=test.id, subject_count=subject_count)
    else:
        test_form = TestForm()
    return render(request, 'ranking/create_test.html', {'form': test_form})

def add_subjects(request, test_id, subject_count):
    test = get_object_or_404(Test, id=test_id)
    
    if request.method == 'POST':
        subject_names = request.POST.getlist('subject_name')
        for name in subject_names:
            if name.strip():
                subject, created = Subject.objects.get_or_create(name=name.strip())
                test.subjects.add(subject)  # This is the correct way to add to ManyToMany
        return redirect('add_students', test_id=test.id)
    
    return render(request, 'ranking/add_subjects.html', {
        'test': test,
        'subject_count': range(int(subject_count)),
    })

def add_students(request, test_id):
    test = get_object_or_404(Test, id=test_id)
    subjects = test.subject_set.all()
    
    # Authorization check
    if (request.user.is_authenticated and test.created_by != request.user) or \
       (not request.user.is_authenticated and not test.is_anonymous):
        return redirect('dashboard')
    
    if request.method == 'POST':
        student_names = request.POST.getlist('student_name')
        for name in student_names:
            if name.strip():
                student = Student.objects.create(name=name.strip(), test=test)
                for subject in subjects:
                    Mark.objects.create(student=student, subject=subject, value=0)
        return redirect('edit_marks', test_id=test.id)
    
    return render(request, 'ranking/add_students.html', {
        'test': test,
        'subjects': subjects,
    })

def edit_marks(request, test_id):
    test = get_object_or_404(Test, id=test_id)
    subjects = test.subjects.all()
    
    # Get students with their total marks, ordered by total (descending)
    students = Student.objects.filter(test=test).annotate(
        total_marks=Sum('mark__value')
    ).order_by('-total_marks')
    
    # Authorization check
    if (request.user.is_authenticated and test.created_by != request.user) or \
       (not request.user.is_authenticated and not test.is_anonymous):
        return redirect('dashboard')
    
    if request.method == 'POST':
        marks_data = json.loads(request.POST.get('marks_data', '{}'))
        for student_id, subject_marks in marks_data.items():
            student = Student.objects.get(id=student_id)
            for subject_id, mark_value in subject_marks.items():
                mark = Mark.objects.get(student=student, subject_id=subject_id)
                mark.value = float(mark_value) if mark_value else 0
                mark.save()
        return JsonResponse({'status': 'success'})
    
    # Prepare mark data for each student
    mark_data = []
    for rank, student in enumerate(students, start=1):
        marks = {mark.subject.id: mark.value for mark in student.mark_set.all()}
        mark_data.append({
            'rank': rank,
            'student': student,
            'marks': marks,
            'total': student.total_marks
        })
    
    # Calculate averages
    subject_averages = {}
    for subject in subjects:
        subject_marks = [m['marks'].get(subject.id, 0) for m in mark_data]
        subject_averages[subject.id] = sum(subject_marks) / len(subject_marks) if subject_marks else 0
    
    total_average = sum(s['total'] for s in mark_data) / len(mark_data) if mark_data else 0
    
    return render(request, 'ranking/edit_marks.html', {
        'test': test,
        'mark_data': mark_data,
        'subjects': subjects,
        'subject_averages': subject_averages,
        'total_average': total_average,
    })

@login_required
def delete_test(request, test_id):
    test = get_object_or_404(Test, id=test_id, created_by=request.user)
    if request.method == 'POST':
        test.delete()
        messages.success(request, 'Test deleted successfully.')
        return redirect('dashboard')
    return render(request, 'ranking/delete_test.html', {'test': test})

def delete_student(request, student_id):
    student = get_object_or_404(Student, id=student_id)
    test = student.test
    
    # Authorization check
    if (request.user.is_authenticated and test.created_by != request.user) or \
       (not request.user.is_authenticated and not test.is_anonymous):
        return redirect('dashboard')
    
    if request.method == 'POST':
        student.delete()
        messages.success(request, 'Student deleted successfully.')
        return redirect('edit_marks', test_id=test.id)
    return render(request, 'ranking/delete_student.html', {'student': student})
