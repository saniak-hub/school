document.addEventListener('DOMContentLoaded', function() {
    const subjectCountInput = document.querySelector('input[name="subject_count"]');
    const subjectFieldsContainer = document.getElementById('subject-fields');
    const form = document.querySelector('form');
    
    // Initial setup based on current subject count
    let currentSubjectCount = subjectCountInput ? parseInt(subjectCountInput.value) : 1;
    
    // Function to add a subject field
    function addSubjectField(index, value = '') {
        const div = document.createElement('div');
        div.className = 'mb-3 subject-field';
        div.innerHTML = `
            <label for="subject_name_${index}" class="form-label">Subject ${index} Name:</label>
            <div class="input-group">
                <input type="text" name="subject_name" id="subject_name_${index}" 
                       class="form-control" value="${value}" required>
                ${index > 1 ? '<button type="button" class="btn btn-outline-danger remove-subject">Remove</button>' : ''}
            </div>
        `;
        subjectFieldsContainer.appendChild(div);
    }
    
    // Function to update subject count and fields
    function updateSubjectFields(newCount) {
        // Remove extra fields if decreasing count
        while (subjectFieldsContainer.children.length > newCount) {
            subjectFieldsContainer.lastChild.remove();
        }
        
        // Add new fields if increasing count
        for (let i = subjectFieldsContainer.children.length + 1; i <= newCount; i++) {
            addSubjectField(i);
        }
        
        currentSubjectCount = newCount;
    }
    
    // Event listener for subject count changes
    if (subjectCountInput) {
        subjectCountInput.addEventListener('change', function() {
            const newCount = parseInt(this.value);
            if (newCount > 0 && newCount !== currentSubjectCount) {
                updateSubjectFields(newCount);
            }
        });
    }
    
    // Event delegation for remove buttons
    subjectFieldsContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-subject')) {
            const field = e.target.closest('.subject-field');
            if (subjectFieldsContainer.children.length > 1) {
                field.remove();
                // Update the count input if it exists
                if (subjectCountInput) {
                    subjectCountInput.value = subjectFieldsContainer.children.length;
                    currentSubjectCount = subjectCountInput.value;
                }
                // Renumber remaining fields
                Array.from(subjectFieldsContainer.children).forEach((div, index) => {
                    const label = div.querySelector('label');
                    const input = div.querySelector('input');
                    if (label && input) {
                        const newNum = index + 1;
                        label.htmlFor = `subject_name_${newNum}`;
                        label.textContent = `Subject ${newNum} Name:`;
                        input.id = `subject_name_${newNum}`;
                        // Show remove button only if not the first field
                        const removeBtn = div.querySelector('.remove-subject');
                        if (removeBtn) {
                            removeBtn.style.display = newNum > 1 ? 'block' : 'none';
                        }
                    }
                });
            } else {
                alert('You need at least one subject.');
            }
        }
    });
    
    // Initialize with the correct number of fields
    if (subjectCountInput) {
        updateSubjectFields(currentSubjectCount);
    }
});
