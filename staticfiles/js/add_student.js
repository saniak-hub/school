document.addEventListener('DOMContentLoaded', function() {
    const addStudentBtn = document.getElementById('add-student');
    const studentFields = document.getElementById('student-fields');
    let studentCount = 1;

    addStudentBtn.addEventListener('click', function() {
        studentCount++;
        const newRow = document.createElement('div');
        newRow.className = 'mb-3 student-row';
        newRow.innerHTML = `
            <label for="student_name_${studentCount}" class="form-label">Student Name:</label>
            <div class="input-group">
                <input type="text" name="student_name" id="student_name_${studentCount}" class="form-control" required>
                <button type="button" class="btn btn-outline-danger remove-student">Remove</button>
            </div>
        `;
        studentFields.appendChild(newRow);
    });

    studentFields.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-student')) {
            const row = e.target.closest('.student-row');
            if (document.querySelectorAll('.student-row').length > 1) {
                row.remove();
            } else {
                alert('You need at least one student.');
            }
        }
    });
});
