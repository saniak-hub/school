document.addEventListener('DOMContentLoaded', function() {
    const marksForm = document.getElementById('marks-form');
    const addStudentBtn = document.getElementById('add-student');
    const modal = new bootstrap.Modal(document.getElementById('addStudentModal'));
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    // Calculate totals when marks change
    function updateTotals() {/* {{{ */
        document.querySelectorAll('tbody tr[data-student-id]').forEach(row => {
            const inputs = row.querySelectorAll('.mark-input');
            let total = 0;
            
            inputs.forEach(input => {
                const value = parseFloat(input.value) || 0;
                total += value;
            });
            
            row.querySelector('.total-cell').textContent = total.toFixed(2);
        });
        
        updateAverages();
    }
    
    // Calculate and update subject averages
    function updateAverages() {
        const subjects = Array.from(document.querySelectorAll('thead th')).slice(2, -2); // Skip rank and name columns
        
        subjects.forEach((th, index) => {
            const subjectId = th.dataset.subjectId;
            if (!subjectId) return;
            
            const inputs = document.querySelectorAll(`.mark-input[data-subject-id="${subjectId}"]`);
            let sum = 0;
            let count = 0;
            
            inputs.forEach(input => {
                const value = parseFloat(input.value) || 0;
                sum += value;
                count++;
            });
            
            const avg = count > 0 ? (sum / count).toFixed(2) : '0.00';
            const avgCell = document.querySelector(`.average-cell[data-subject-id="${subjectId}"]`);
            if (avgCell) {
                avgCell.textContent = avg;
                avgCell.innerHTML = `<strong>${avg}</strong>`;
            }
        });
        
        // Update overall average
        const totals = Array.from(document.querySelectorAll('.total-cell')).slice(0, -1); // Exclude footer
        const totalSum = totals.reduce((sum, cell) => sum + parseFloat(cell.textContent || 0), 0);
        const totalAvg = totals.length > 0 ? (totalSum / totals.length).toFixed(2) : '0.00';
        const totalAvgCell = document.querySelector('.table-footer td:last-child');
        if (totalAvgCell) {
            totalAvgCell.innerHTML = `<strong>${totalAvg}</strong>`;
        }
    } /*}}} */
    
    // Add student button
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', function() {
            modal.show();
        });
    }
    
    // Save new student
    const saveNewStudentBtn = document.getElementById('saveNewStudent');
    if (saveNewStudentBtn) {
        saveNewStudentBtn.addEventListener('click', function() {
            const studentName = document.getElementById('newStudentName').value.trim();
            alert("saveNewStudent created")
            if (studentName) {
                addNewStudent(studentName);
                modal.hide();
                document.getElementById('newStudentName').value = '';
            } else {
                alert('Please enter a student name');
            }
        });
    }
    
    // Add new student via AJAX
function addNewStudent(name) {
    const testId = window.location.pathname.split('/').filter(Boolean).pop();
    
    fetch(`${API_URLS.add_student}${testId}/`, {  
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({ name: name })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                addStudentToTable(data.student);
                window.location.reload();
            } else {
                alert(data.error || 'Error adding student');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error adding student');
        });
    }
    
    // Add student to the table
    function addStudentToTable(studentData) {
        const tbody = document.querySelector('tbody');
        const subjects = Array.from(document.querySelectorAll('thead th')).slice(2, -2);
        const rowClass = tbody.children.length % 2 === 0 ? 'table-row-light' : 'table-row-lighter';
        
        const row = document.createElement('tr');
        row.className = rowClass;
        row.dataset.studentId = studentData.id;
        
        let html = `
            <td>${tbody.children.length}</td>
            <td>${studentData.name}</td>
        `;
        
        subjects.forEach(subject => {
            const subjectId = subject.dataset.subjectId;
            html += `
                <td>
                    <input type="number" step="0.01" min="0" 
                           class="form-control mark-input" 
                           data-subject-id="${subjectId}"
                           value="0">
                </td>
            `;
        });
        
        html += `
            <td class="total-cell">0.00</td>
            <td>
                <button type="button" class="btn btn-danger btn-sm delete-student" 
                        data-student-id="${studentData.id}">
                    Delete
                </button>
            </td>
        `;
        
        row.innerHTML = html;
        tbody.insertBefore(row, tbody.lastElementChild); // Insert before the averages row
        
        // Add event listeners to new inputs
        row.querySelectorAll('.mark-input').forEach(input => {
            input.addEventListener('change', updateTotals);
            input.addEventListener('input', updateTotals);
        });
        
        // Add event listener to delete button
        row.querySelector('.delete-student').addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this student?')) {
                deleteStudent(this.dataset.studentId);
            }
        });
        
        updateTotals();
    }
    
    // Delete student
    function deleteStudent(studentId) {
        if (!confirm('Are you sure you want to delete this student?')) return;
        
        fetch(`${API_URLS.delete_student}${studentId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.querySelector(`tr[data-student-id="${studentId}"]`).remove();
                // Renumber ranks
                document.querySelectorAll('tbody tr[data-student-id]').forEach((row, index) => {
                    row.cells[0].textContent = index + 1;
                });
                updateTotals();
            } else {
                alert(data.error || 'Error deleting student');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting student');
        });
    }
    
    // Form submission handler
    if (marksForm) {
        marksForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveMarks();
        });
    }
    
    // Save all marks
    function saveMarks() {
        const marksData = {};
        const rows = document.querySelectorAll('tbody tr[data-student-id]');
        
        rows.forEach(row => {
            const studentId = row.dataset.studentId;
            const inputs = row.querySelectorAll('.mark-input');
            
            marksData[studentId] = {};
            inputs.forEach(input => {
                const subjectId = input.dataset.subjectId;
                marksData[studentId][subjectId] = input.value;
            });
        });

        const testId = window.location.pathname.split('/').filter(Boolean).pop();
    
        fetch(`${API_URLS.save_marks}${testId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({ marks_data: marksData })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showAlert('Marks saved successfully!', 'success');
            } else {
                showAlert('Error saving marks: ' + (data.error || ''), 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Error saving marks', 'danger');
        });
    }
    
    // Show alert message
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const container = document.querySelector('.container.mt-4');
        if (container) {
            container.prepend(alertDiv);
            
            // Auto-dismiss after 3 seconds
            setTimeout(() => {
                const bsAlert = new bootstrap.Alert(alertDiv);
                bsAlert.close();
            }, 3000);
        }
    }
    
    // Initialize event listeners for existing elements
    document.querySelectorAll('.mark-input').forEach(input => {
        input.addEventListener('change', updateTotals);
        input.addEventListener('input', updateTotals);
    });
    
    document.querySelectorAll('.delete-student').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteStudent(this.dataset.studentId);
        });
    });
    
    // Initial calculations
    updateTotals();
});
