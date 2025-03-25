from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    
    path('create-test/', views.create_test, name='create_test'),
    path('add-subjects/<int:test_id>/<int:subject_count>/', views.add_subjects, name='add_subjects'),
    path('add-students/<int:test_id>/', views.add_students, name='add_students'),
    path('edit-marks/<int:test_id>/', views.edit_marks, name='edit_marks'),
    path('delete-test/<int:test_id>/', views.delete_test, name='delete_test'),
    path('delete-student/<int:student_id>/', views.delete_student, name='delete_student'),

# Api urls 

    path('api/add_student/<int:test_id>/', views.api_add_student, name='api_add_student'),
    path('api/delete_student/<int:student_id>/', views.api_delete_student, name='api_delete_student'),
    path('api/save_marks/<int:test_id>/', views.api_save_marks, name='api_save_marks'),
]
