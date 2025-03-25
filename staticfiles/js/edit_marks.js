document.addEventListener('DOMContentLoaded', function() {
    const marksForm = document.getElementById('marks-form');
    const addStudentBtn = document.getElementById('add-student');
    const modal = new bootstrap.Modal(document.getElementById('addStudentModal'));
    
    // Calculate totals when marks change
    document.querySelectorAll('.mark-input').forEach(input => {
        input.addEventListener('change', updateTotals);
        input.addEventListener('input', updateTotals);
    });
    
    // Add student button
    addStudentBtn.addEventListener('click', function() {
        modal.show();
    });
    
    // Save new student
    document.getElementById('save-new-student').addEventListener('click', function() {
        const studentName = document.getElementById('new-student-name').value.trim();
        if (studentName) {
            addNewStudent(studentName);
            modal.hide();
            document.getElementById('new-student-name').value = '';
        }
    });
    
    // Delete student
    document.querySelectorAll('.delete-student').forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this student?')) {
                deleteStudent(this.dataset.studentId);
            }
        });
    });
    
    // Form submission
    marksForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveMarks();
    });
    
    function updateTotals() {
        const rows = document.querySelectorAll('tbody tr[data-student-id]');
        
        rows.forEach(row => {
            const inputs = row.querySelectorAll('.mark-input');
            let total = 0;
            
            inputs.forEach(input => {
                const value = parseFloat(input.value) || 0;
                total += value;
            });
            
            row.querySelector('.total-cell').textContent = total.toFixed(2);
        });
        
        // Update averages
        updateAverages();
    }
    
    function updateAverages() {
        const subjects = Array.from(document.querySelectorAll('th')).slice(1, -2); // Skip name and total columns
        
        subjects.forEach((th, index) => {
            const subjectId = th.dataset.subjectId;
            const inputs = document.querySelectorAll(`.mark-input[data-subject-id="${subjectId}"]`);
            let sum = 0;
            let count = 0;
            
            inputs.forEach(input => {
                const value = parseFloat(input.value) || 0;
                sum += value;
                count++;
            });
            
            const avg = count > 0 ? sum / count : 0;
            document.querySelector(`.average-cell[data-subject-id="${subjectId}"]`).textContent = avg.toFixed(2);
        });
    }
    
    function addNewStudent(name) {
        // In a real app, this would be an AJAX call to the server
        const tbody = document.querySelector('tbody');
        const subjects = Array.from(document.querySelectorAll('th')).slice(1, -2);
        const studentId = 'new-' + Date.now(); // Temporary ID for new students
        
        const row = document.createElement('tr');
        row.className = (tbody.children.length % 2 === 0) ? 'table-row-light' : 'table-row-lighter';
        row.dataset.studentId = studentId;
        
        let html = `<td>${name}</td>`;
        
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
                        data-student-id="${studentId}">
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
    }
    
    function deleteStudent(studentId) {
        // In a real app, this would be an AJAX call to the server
        const row = document.querySelector(`tr[data-student-id="${studentId}"]`);
        if (row) {
            row.remove();
            updateAverages();
        }
    }
    
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
        
        // In a real app, this would be an AJAX call to the server
        fetch(window.location.href, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            },
            body: JSON.stringify({
                marks_data: marksData
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Marks saved successfully!');
            } else {
                alert('Error saving marks.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error saving marks.');
        });
    }
});
