/* ==========================================================================
   STUDENT MANAGEMENT SYSTEM - STUDENT CRUD & DIRECTORY CONTROLLER (js/students.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Detect page elements
    const addStudentForm = document.getElementById('studentForm');
    const editStudentForm = document.getElementById('editStudentForm');
    const studentTableBody = document.getElementById('studentTable');

    const isAddPage = addStudentForm !== null;
    const isEditPage = editStudentForm !== null;
    const isListPage = studentTableBody !== null;

    if (!isAddPage && !isEditPage && !isListPage) return;

    // --- Validation Rules & States --- ONLY Name and Roll Number are compulsory
    const validators = {
        name: val => val.length >= 2,
        roll: val => /^[a-zA-Z0-9-]{3,20}$/.test(val),
        age: val => val === '' || (!isNaN(val) && parseInt(val) >= 15 && parseInt(val) <= 100),
        dob: val => true,
        department: val => true,
        email: val => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        phone: val => val === '' || /^\+?[0-9\s-]{9,15}$/.test(val),
        gender: val => true,
        address: val => true,
        password: val => true
    };

    function validateField(inputEl, errorEl, validatorFn, errorMsg) {
        if (!inputEl) return true;
        const value = inputEl.value.trim();
        const isValid = validatorFn(value);
        const formGroup = inputEl.closest('.form-group') || inputEl.closest('.floating-group');
        
        if (!isValid) {
            if (formGroup) formGroup.classList.add('has-error');
            if (errorEl) errorEl.textContent = errorMsg;
            return false;
        } else {
            if (formGroup) formGroup.classList.remove('has-error');
            if (errorEl) errorEl.textContent = '';
            return true;
        }
    }

    // Avatar bubble builder (prefixes photo path with ../ relative to /html/ folder)
    function getAvatarHTML(student) {
        if (student.photo) {
            return `<div class="avatar-sm"><img src="../${student.photo}" alt="${student.name}"></div>`;
        } else {
            const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            return `<div class="avatar-sm">${initials}</div>`;
        }
    }

    // --- CASE 1: ADD / REGISTER STUDENT SCREEN ---
    if (isAddPage) {
        const photoInput = document.getElementById('photo');
        const addPhotoPreview = document.getElementById('add-photo-preview');
        const idDocInput = document.getElementById('id_doc');
        const addDocUploadTitle = document.getElementById('add-doc-upload-title');
        const addDocUploadSize = document.getElementById('add-doc-upload-size');

        const stepTab1 = document.getElementById('step-tab-1');
        const stepTab2 = document.getElementById('step-tab-2');
        const formStep1 = document.getElementById('form-step-1');
        const formStep2 = document.getElementById('form-step-2');
        const btnStepNext = document.getElementById('btn-step-next');
        const btnStepPrev = document.getElementById('btn-step-prev');
        const resetFormBtn1 = document.getElementById('reset-form-btn-1');
        const resetFormBtn2 = document.getElementById('reset-form-btn-2');

        // Image upload preview listener
        if (photoInput && addPhotoPreview) {
            photoInput.addEventListener('change', function () {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        addPhotoPreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    };
                    reader.readAsDataURL(file);
                } else {
                    addPhotoPreview.innerHTML = `<span class="preview-placeholder">No photo</span>`;
                }
            });
        }

        // ID Document file picker listener
        if (idDocInput && addDocUploadTitle && addDocUploadSize) {
            idDocInput.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    addDocUploadTitle.textContent = file.name;
                    addDocUploadSize.textContent = `File Selected. Size: ${(file.size / 1024).toFixed(1)} KB`;
                } else {
                    addDocUploadTitle.textContent = 'No Document Selected';
                    addDocUploadSize.textContent = 'Aadhar / Passport scan copy. Format: PDF, PNG, JPG.';
                }
            });
        }

        // Mandatory & Optional Form Fields Setup
        const mandatoryAddInputs = {
            name: { input: document.getElementById('name'), error: document.getElementById('name-error'), msg: 'Full Name is required.' },
            roll: { input: document.getElementById('roll'), error: document.getElementById('roll-error'), msg: 'Roll / Reg Number is required.' }
        };

        const optionalAddInputs = {
            email: { input: document.getElementById('email'), error: document.getElementById('email-error'), msg: 'Enter a valid email address.' },
            phone: { input: document.getElementById('phone'), error: document.getElementById('phone-error'), msg: 'Enter a valid phone number.' },
            age: { input: document.getElementById('age'), error: document.getElementById('age-error'), msg: 'Age must be between 15 and 100.' }
        };

        const allAddInputs = { ...mandatoryAddInputs, ...optionalAddInputs };

        Object.keys(allAddInputs).forEach(key => {
            const item = allAddInputs[key];
            if (item.input) {
                item.input.addEventListener('input', () => {
                    validateField(item.input, item.error, validators[key], item.msg);
                });
                if (item.input.tagName === 'SELECT') {
                    item.input.addEventListener('change', () => {
                        validateField(item.input, item.error, validators[key], item.msg);
                    });
                }
            }
        });

        const resetBtn = document.getElementById('reset-form-btn-1') || document.getElementById('reset-form-btn-2');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                addStudentForm.reset();
                if (addPhotoPreview) addPhotoPreview.innerHTML = `<span class="preview-placeholder">No photo</span>`;
                showToast('Form cleared.', 'info');
            });
        }

        // Handle form submission
        addStudentForm.addEventListener('submit', function (e) {
            e.preventDefault();

            let isFormValid = true;
            Object.keys(mandatoryAddInputs).forEach(key => {
                const item = mandatoryAddInputs[key];
                if (item.input) {
                    const res = validateField(item.input, item.error, validators[key], item.msg);
                    if (!res) isFormValid = false;
                }
            });

            if (!isFormValid) {
                showToast('Name and Roll Number (Reg No) are compulsory.', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('name', document.getElementById('name').value.trim());
            formData.append('roll', document.getElementById('roll').value.trim());
            formData.append('age', document.getElementById('age').value);
            formData.append('dob', document.getElementById('dob').value);
            formData.append('department', document.getElementById('department').value);
            formData.append('email', document.getElementById('email').value.trim());
            formData.append('phone', document.getElementById('phone').value.trim());
            formData.append('gender', document.getElementById('gender').value);
            formData.append('password', document.getElementById('password').value);

            // Step 2 Parent & Address fields
            formData.append('father_name', (document.getElementById('father_name') ? document.getElementById('father_name').value.trim() : ''));
            formData.append('mother_name', (document.getElementById('mother_name') ? document.getElementById('mother_name').value.trim() : ''));
            formData.append('parent_contact', (document.getElementById('parent_contact') ? document.getElementById('parent_contact').value.trim() : ''));
            formData.append('address', document.getElementById('address').value.trim());
            formData.append('id_type', (document.getElementById('id_type') ? document.getElementById('id_type').value : ''));
            formData.append('id_number', (document.getElementById('id_number') ? document.getElementById('id_number').value.trim() : ''));

            if (photoInput && photoInput.files[0]) {
                formData.append('photo', photoInput.files[0]);
            }
            if (idDocInput && idDocInput.files[0]) {
                formData.append('id_doc', idDocInput.files[0]);
            }

            showLoading("Registering complete student profile...");
            fetch('../php/add_student.php', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                hideLoading();
                if (data.status === 'success') {
                    showToast(`Successfully registered student: ${data.student.name}`);
                    addStudentForm.reset();
                    if (addPhotoPreview) addPhotoPreview.innerHTML = `<span class="preview-placeholder">No photo</span>`;
                    if (addDocUploadTitle) addDocUploadTitle.textContent = 'No Document Selected';
                    if (addDocUploadSize) addDocUploadSize.textContent = 'Aadhar / Passport scan copy. Format: PDF, PNG, JPG.';
                    
                    setTimeout(() => {
                        window.location.href = 'view-students.html';
                    }, 1000);
                } else {
                    showToast(data.message, 'error');
                    if (data.message.includes('roll') || data.message.includes('Roll')) {
                        goToStep(1);
                        setErrorField('roll', data.message);
                    } else if (data.message.includes('email') || data.message.includes('Email')) {
                        goToStep(1);
                        setErrorField('email', data.message);
                    }
                }
            })
            .catch(err => {
                hideLoading();
                showToast("Connection to server failed.", "error");
                console.error(err);
            });
        });

        function setErrorField(key, msg) {
            const item = allAddInputs[key];
            if (item) {
                const group = item.input.closest('.form-group') || item.input.closest('.floating-group');
                if (group) group.classList.add('has-error');
                if (item.error) item.error.textContent = msg;
            }
        }

        function resetAllForm() {
            addStudentForm.reset();
            if (addPhotoPreview) addPhotoPreview.innerHTML = `<span class="preview-placeholder">No photo</span>`;
            if (addDocUploadTitle) addDocUploadTitle.textContent = 'No Document Selected';
            if (addDocUploadSize) addDocUploadSize.textContent = 'Aadhar / Passport scan copy. Format: PDF, PNG, JPG.';
            Object.values(allAddInputs).forEach(item => {
                if (item.input) {
                    const group = item.input.closest('.form-group') || item.input.closest('.floating-group');
                    if (group) group.classList.remove('has-error');
                    if (item.error) item.error.textContent = '';
                }
            });
            goToStep(1);
        }

        if (resetFormBtn1) resetFormBtn1.addEventListener('click', resetAllForm);
        if (resetFormBtn2) resetFormBtn2.addEventListener('click', resetAllForm);
    }

    // --- CASE 2: DIRECTORY CATALOG TABLE ---
    if (isListPage) {
        const viewTableSearch = document.getElementById('view-table-search');
        const viewDeptFilter = document.getElementById('view-dept-filter');
        const viewYearFilter = document.getElementById('view-year-filter');
        const viewEmptyState = document.getElementById('view-empty-state');
        const emptyStateAddBtn = document.getElementById('empty-state-add-btn');

        // Sorting parameters
        let sortField = null;
        let sortOrder = null;

        // Pagination parameters
        let currentPage = 1;
        const pageSize = 10;
        let studentsData = [];

        window.fetchStudentsList = function() {
            const query = viewTableSearch ? viewTableSearch.value.trim() : '';
            const selectedDept = viewDeptFilter ? viewDeptFilter.value : 'ALL';
            const selectedYear = viewYearFilter ? viewYearFilter.value : 'ALL';

            showLoading("Filtering student directory...");
            fetch(`../php/get_students.php?search=${encodeURIComponent(query)}&department=${encodeURIComponent(selectedDept)}&year=${encodeURIComponent(selectedYear)}`)
                .then(res => res.json())
                .then(data => {
                    hideLoading();
                    if (data.status === 'success') {
                        studentsData = data.students || [];
                        currentPage = 1;
                        renderPaginatedTable();
                    }
                })
                .catch(err => {
                    hideLoading();
                    console.error(err);
                });
        };

        // Initialize directory query
        fetchStudentsList();

        if (viewTableSearch) {
            let searchTimeout;
            viewTableSearch.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(fetchStudentsList, 300);
            });
        }

        if (viewDeptFilter) {
            viewDeptFilter.addEventListener('change', fetchStudentsList);
        }

        if (viewYearFilter) {
            viewYearFilter.addEventListener('change', fetchStudentsList);
        }

        if (emptyStateAddBtn) {
            emptyStateAddBtn.addEventListener('click', () => {
                window.location.href = 'add-student.html';
            });
        }

        // Click-to-sort headers
        const sortNameHeader = document.getElementById('sort-name');
        const sortDeptHeader = document.getElementById('sort-dept');

        if (sortNameHeader) {
            sortNameHeader.addEventListener('click', () => toggleSort('name'));
        }
        if (sortDeptHeader) {
            sortDeptHeader.addEventListener('click', () => toggleSort('department'));
        }

        function toggleSort(field) {
            if (sortField === field) {
                sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                sortField = field;
                sortOrder = 'asc';
            }
            updateSortIcons();
            renderPaginatedTable();
        }

        function updateSortIcons() {
            if (!sortNameHeader || !sortDeptHeader) return;
            const nameIcon = sortNameHeader.querySelector('i');
            const deptIcon = sortDeptHeader.querySelector('i');
            
            if (nameIcon) nameIcon.className = 'fa-solid fa-sort';
            if (deptIcon) deptIcon.className = 'fa-solid fa-sort';
            
            if (sortField === 'name' && nameIcon) {
                nameIcon.className = sortOrder === 'asc' ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';
            } else if (sortField === 'department' && deptIcon) {
                deptIcon.className = sortOrder === 'asc' ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';
            }
        }

        function renderPaginatedTable() {
            studentTableBody.innerHTML = '';

            // Apply sort if defined
            if (sortField) {
                studentsData.sort((a, b) => {
                    let valA = a[sortField] ? a[sortField].toString().toLowerCase() : '';
                    let valB = b[sortField] ? b[sortField].toString().toLowerCase() : '';
                    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                    return 0;
                });
            }

            if (studentsData.length === 0) {
                if (viewEmptyState) viewEmptyState.classList.remove('hidden');
                document.getElementById('student-pagination').classList.add('hidden');
                return;
            }

            if (viewEmptyState) viewEmptyState.classList.add('hidden');
            document.getElementById('student-pagination').classList.remove('hidden');

            const startIdx = (currentPage - 1) * pageSize;
            const endIdx = Math.min(startIdx + pageSize, studentsData.length);
            const pageItems = studentsData.slice(startIdx, endIdx);

            pageItems.forEach(student => {
                const tr = document.createElement('tr');
                
                // Get ordinals for Year
                const yearNum = parseInt(student.year) || 1;
                let yearText = '1st Yr';
                if (yearNum === 2) yearText = '2nd Yr';
                else if (yearNum === 3) yearText = '3rd Yr';
                else if (yearNum === 4) yearText = '4th Yr';

                // Combined Parent name (Father or Mother)
                const parentNameText = student.father_name || student.mother_name || '-';

                // Attendance rate class indicator
                const attendancePct = parseFloat(student.attendance_percentage || 100);
                let attendanceColor = 'var(--success)';
                if (attendancePct < 75) {
                    attendanceColor = 'var(--danger)';
                } else if (attendancePct < 85) {
                    attendanceColor = 'var(--warning)';
                }

                const isStudentRole = window.currentUser && window.currentUser.role === 'student';
                let actionsHTML = `<button class="btn-action btn-view" data-id="${student.id}" data-roll="${student.roll}" style="background-color: var(--accent-light); color: var(--accent-color);"><i class="fa-solid fa-eye"></i> View</button>`;

                if (!isStudentRole) {
                    actionsHTML += `
                        <button class="btn-action btn-edit" data-id="${student.id}" data-roll="${student.roll}"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                        <button class="btn-action btn-delete" data-id="${student.id}" data-roll="${student.roll}"><i class="fa-solid fa-trash"></i> Delete</button>
                    `;
                }

                tr.innerHTML = `
                    <td style="font-weight: 700; color: var(--accent-color);">#${student.id}</td>
                    <td>
                        <div class="avatar-cell-wrapper">
                            ${getAvatarHTML(student)}
                        </div>
                    </td>
                    <td style="font-weight: 600;">${student.name}</td>
                    <td>${student.roll}</td>
                    <td><span class="dept-badge badge-${student.department}">${student.department}</span></td>
                    <td>${yearText}</td>
                    <td>${student.gender}</td>
                    <td>${student.phone || '-'}</td>
                    <td>${student.email}</td>
                    <td>${student.dob}</td>
                    <td>${parentNameText}</td>
                    <td style="font-weight: 700; color: ${attendanceColor};">${attendancePct.toFixed(1)}%</td>
                    <td><span class="status-badge badge-${(student.status || 'Active').toLowerCase()}">${student.status || 'Active'}</span></td>
                    <td>
                        <div class="action-cell">
                            ${actionsHTML}
                        </div>
                    </td>
                `;
                studentTableBody.appendChild(tr);
            });

            const infoText = document.getElementById('pagination-info-text');
            if (infoText) {
                infoText.textContent = `Showing ${studentsData.length === 0 ? 0 : startIdx + 1} to ${endIdx} of ${studentsData.length} entries`;
            }

            renderPaginationControls();
        }

        function renderPaginationControls() {
            const pageNumbersContainer = document.getElementById('page-numbers-container');
            const btnPrev = document.getElementById('btn-prev-page');
            const btnNext = document.getElementById('btn-next-page');
            if (!pageNumbersContainer) return;

            pageNumbersContainer.innerHTML = '';
            const totalPages = Math.ceil(studentsData.length / pageSize);

            btnPrev.disabled = currentPage === 1;
            btnNext.disabled = currentPage === totalPages || totalPages === 0;

            for (let i = 1; i <= totalPages; i++) {
                const btn = document.createElement('button');
                btn.className = `btn-page ${i === currentPage ? 'active' : ''}`;
                btn.textContent = i;
                btn.addEventListener('click', () => {
                    currentPage = i;
                    renderPaginatedTable();
                });
                pageNumbersContainer.appendChild(btn);
            }
        }

        const btnPrev = document.getElementById('btn-prev-page');
        const btnNext = document.getElementById('btn-next-page');
        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderPaginatedTable();
                }
            });
        }
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                const totalPages = Math.ceil(studentsData.length / pageSize);
                if (currentPage < totalPages) {
                    currentPage++;
                    renderPaginatedTable();
                }
            });
        }

        // Action button triggers (View, Edit, Delete)
        studentTableBody.addEventListener('click', (e) => {
            const btnView = e.target.closest('.btn-view');
            const btnEdit = e.target.closest('.btn-edit');
            const btnDelete = e.target.closest('.btn-delete');

            if (btnView) {
                const id = btnView.getAttribute('data-id');
                const roll = btnView.getAttribute('data-roll');
                openViewModal(id, roll);
            }

            if (btnEdit) {
                const id = btnEdit.getAttribute('data-id');
                window.location.href = `edit-student.html?id=${encodeURIComponent(id)}`;
            }

            if (btnDelete) {
                const roll = btnDelete.getAttribute('data-roll');
                openConfirmDelete(roll);
            }
        });

        // --- View Student Profile Modal ---
        const viewProfileModal = document.getElementById('view-profile-modal');
        const modalCloseBtn = document.getElementById('modal-close-btn');

        function openViewModal(id, roll) {
            showLoading("Loading student profile...");
            fetch(`../php/get_students.php?id=${encodeURIComponent(id)}`)
                .then(res => res.json())
                .then(data => {
                    hideLoading();
                    if (data.status === 'success') {
                        const student = data.student;
                        
                        // Populate Photo
                        const photoEl = document.getElementById('profile-modal-photo');
                        if (student.photo) {
                            photoEl.innerHTML = `<img src="../${student.photo}" alt="${student.name}">`;
                        } else {
                            const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                            photoEl.innerHTML = initials;
                        }
                        
                        document.getElementById('profile-modal-name').textContent = student.name;
                        document.getElementById('profile-modal-roll').textContent = `#${student.roll}`;
                        
                        // Dept badge
                        const deptEl = document.getElementById('profile-modal-dept');
                        deptEl.textContent = student.department;
                        deptEl.className = `dept-badge badge-${student.department}`;
                        
                        // Dept full text
                        document.getElementById('profile-modal-dept-full').textContent = `${student.department} Department`;
                        
                        // Status badge
                        const statusEl = document.getElementById('profile-modal-status');
                        statusEl.textContent = student.status || 'Active';
                        statusEl.className = `status-badge badge-${(student.status || 'Active').toLowerCase()}`;
                        
                        // Personal Information
                        document.getElementById('profile-modal-age').textContent = student.age;
                        document.getElementById('profile-modal-dob').textContent = student.dob;
                        document.getElementById('profile-modal-gender').textContent = student.gender;
                        
                        // Academic Information
                        const yearNum = parseInt(student.year) || 1;
                        let yearText = '1st Year';
                        if (yearNum === 2) yearText = '2nd Year';
                        else if (yearNum === 3) yearText = '3rd Year';
                        else if (yearNum === 4) yearText = '4th Year';
                        document.getElementById('profile-modal-year').textContent = yearText;
                        
                        document.getElementById('profile-modal-attendance').textContent = `${parseFloat(student.attendance_percentage || 100).toFixed(1)}%`;
                        
                        // Contact Information
                        document.getElementById('profile-modal-email').textContent = student.email;
                        document.getElementById('profile-modal-phone').textContent = student.phone || '-';
                        
                        // Parent Information
                        document.getElementById('profile-modal-father').textContent = student.father_name || '-';
                        document.getElementById('profile-modal-mother').textContent = student.mother_name || '-';
                        document.getElementById('profile-modal-parent-contact').textContent = student.parent_contact || '-';
                        
                        // Address Information
                        document.getElementById('profile-modal-address').textContent = student.address || '-';
                        
                        // ID Proof Information
                        document.getElementById('profile-modal-id-type').textContent = student.id_type || '-';
                        document.getElementById('profile-modal-id-number').textContent = student.id_number || '-';
                        
                        const docLinkEl = document.getElementById('profile-modal-doc-link');
                        if (student.id_doc) {
                            docLinkEl.innerHTML = `<a href="../${student.id_doc}" target="_blank" class="doc-download-link"><i class="fa-solid fa-file-arrow-down"></i> View Document</a>`;
                        } else {
                            docLinkEl.textContent = 'No document uploaded';
                        }
                        
                        // Show modal
                        if (viewProfileModal) viewProfileModal.classList.remove('hidden');
                    } else {
                        showToast(data.message, 'error');
                    }
                })
                .catch(err => {
                    hideLoading();
                    showToast("Failed to load student profile.", "error");
                    console.error(err);
                });
        }

        function closeViewModal() {
            if (viewProfileModal) viewProfileModal.classList.add('hidden');
        }

        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', closeViewModal);
        }

        if (viewProfileModal) {
            viewProfileModal.addEventListener('click', (e) => {
                if (e.target === viewProfileModal) closeViewModal();
            });
        }

        // --- Delete Confirmation Overlay ---
        const confirmModal = document.getElementById('confirm-modal');
        const confirmCancel = document.getElementById('confirm-cancel-btn');
        const confirmYes = document.getElementById('confirm-yes-btn');
        let deleteTargetRoll = null;

        function openConfirmDelete(roll) {
            deleteTargetRoll = roll;
            if (confirmModal) confirmModal.classList.remove('hidden');
        }

        function closeConfirmDelete() {
            if (confirmModal) confirmModal.classList.add('hidden');
            deleteTargetRoll = null;
        }

        if (confirmCancel) confirmCancel.addEventListener('click', closeConfirmDelete);

        if (confirmYes) {
            confirmYes.addEventListener('click', () => {
                if (!deleteTargetRoll) return;
                showLoading("Removing student record...");
                fetch('../php/delete_student.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roll: deleteTargetRoll })
                })
                .then(res => res.json())
                .then(data => {
                    hideLoading();
                    closeConfirmDelete();
                    if (data.status === 'success') {
                        showToast(`Permanently deleted student record: ${data.student_name}`, 'warning');
                        fetchStudentsList();
                    } else {
                        showToast(data.message, 'error');
                    }
                })
                .catch(err => {
                    hideLoading();
                    closeConfirmDelete();
                    showToast("Failed to connect to deletion server.", "error");
                    console.error(err);
                });
            });
        }
    }

    // --- CASE 3: EDIT STUDENT DETAILS FORM ---
    if (isEditPage) {
        const editPhotoInput = document.getElementById('edit-photo');
        const editPhotoPreview = document.getElementById('edit-photo-preview');
        const editDocInput = document.getElementById('edit-id-doc');
        const docUploadTitle = document.getElementById('doc-upload-title');
        const docUploadSize = document.getElementById('doc-upload-size');
        const studentHeaderName = document.getElementById('student-header-name');
        const cancelBtn = document.getElementById('btn-cancel-edit');

        // Extract Roll or ID from URL query
        const urlParams = new URLSearchParams(window.location.search);
        const editRoll = urlParams.get('roll');
        const editId = urlParams.get('id');

        if (!editRoll && !editId) {
            showToast("No student identifier specified to edit.", "error");
            setTimeout(() => window.location.href = 'view-students.html', 1500);
            return;
        }

        // Live Validations edit inputs config - ONLY Name and Roll Number mandatory
        const mandatoryEditInputs = {
            name: { input: document.getElementById('edit-name'), error: document.getElementById('edit-name-error'), msg: 'Name is required.' },
            roll: { input: document.getElementById('edit-roll'), error: document.getElementById('edit-roll-error'), msg: 'Roll/Reg Number is required.' }
        };

        const optionalEditInputs = {
            email: { input: document.getElementById('edit-email'), error: document.getElementById('edit-email-error'), msg: 'Enter a valid email address.' },
            phone: { input: document.getElementById('edit-phone'), error: document.getElementById('edit-phone-error'), msg: 'Enter a valid phone number.' },
            age: { input: document.getElementById('edit-age'), error: document.getElementById('edit-age-error'), msg: 'Age must be between 15 and 100.' }
        };

        const allEditInputs = { ...mandatoryEditInputs, ...optionalEditInputs };

        Object.keys(allEditInputs).forEach(key => {
            const item = allEditInputs[key];
            if (item.input) {
                item.input.addEventListener('input', () => {
                    validateField(item.input, item.error, validators[key], item.msg);
                });
                if (item.input.tagName === 'SELECT') {
                    item.input.addEventListener('change', () => {
                        validateField(item.input, item.error, validators[key], item.msg);
                    });
                }
            }
        });

        // Photo Upload Preview listener
        if (editPhotoInput && editPhotoPreview) {
            editPhotoInput.addEventListener('change', function () {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        editPhotoPreview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Document File picker listener
        if (editDocInput && docUploadTitle && docUploadSize) {
            editDocInput.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    docUploadTitle.textContent = file.name;
                    docUploadSize.textContent = `File Selected. Size: ${(file.size / 1024).toFixed(1)} KB`;
                } else {
                    docUploadTitle.textContent = 'No Document Selected';
                    docUploadSize.textContent = 'Aadhar / Passport scan copies. Format: PDF, PNG, JPG.';
                }
            });
        }

        // Fetch Student detail values
        showLoading("Fetching student details...");
        const queryParam = editId ? `id=${encodeURIComponent(editId)}` : `roll=${encodeURIComponent(editRoll)}`;
        fetch(`../php/get_students.php?${queryParam}`)
            .then(res => res.json())
            .then(data => {
                hideLoading();
                if (data.status === 'success') {
                    const student = data.student;
                    
                    document.getElementById('edit-original-roll').value = student.roll;
                    document.getElementById('edit-name').value = student.name;
                    document.getElementById('edit-dob').value = student.dob;
                    document.getElementById('edit-age').value = student.age;
                    document.getElementById('edit-gender').value = student.gender;
                    document.getElementById('edit-roll').value = student.roll;
                    document.getElementById('edit-department').value = student.department;
                    document.getElementById('edit-email').value = student.email;
                    document.getElementById('edit-phone').value = student.phone;
                    document.getElementById('edit-address').value = student.address;

                    // Parent details
                    document.getElementById('edit-father-name').value = student.father_name || '';
                    document.getElementById('edit-mother-name').value = student.mother_name || '';
                    document.getElementById('edit-parent-contact').value = student.parent_contact || '';

                    // Document fields
                    document.getElementById('edit-id-type').value = student.id_type || '';
                    document.getElementById('edit-id-number').value = student.id_number || '';

                    if (student.photo) {
                        editPhotoPreview.innerHTML = `<img src="../${student.photo}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                    }
                    if (studentHeaderName) {
                        studentHeaderName.textContent = student.name;
                    }
                    if (window.syncFloatingLabels) {
                        window.syncFloatingLabels();
                    }
                } else {
                    showToast(data.message, 'error');
                    setTimeout(() => window.location.href = 'view-students.html', 1500);
                }
            })
            .catch(err => {
                hideLoading();
                showToast("Failed to query student profile.", "error");
                console.error(err);
            });

        // Submit form handler
        editStudentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let formValid = true;

            Object.keys(mandatoryEditInputs).forEach(key => {
                const item = mandatoryEditInputs[key];
                if (item.input) {
                    const res = validateField(item.input, item.error, validators[key], item.msg);
                    if (!res) formValid = false;
                }
            });

            if (!formValid) {
                showToast('Name and Roll Number (Reg No) are compulsory.', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('original_roll', document.getElementById('edit-original-roll').value);
            formData.append('name', document.getElementById('edit-name').value.trim());
            formData.append('roll', document.getElementById('edit-roll').value.trim());
            formData.append('age', document.getElementById('edit-age').value);
            formData.append('dob', document.getElementById('edit-dob').value);
            formData.append('department', document.getElementById('edit-department').value);
            formData.append('email', document.getElementById('edit-email').value.trim());
            formData.append('phone', document.getElementById('edit-phone').value.trim());
            formData.append('gender', document.getElementById('edit-gender').value);
            formData.append('address', document.getElementById('edit-address').value.trim());

            // Parents details
            formData.append('father_name', document.getElementById('edit-father-name').value.trim());
            formData.append('mother_name', document.getElementById('edit-mother-name').value.trim());
            formData.append('parent_contact', document.getElementById('edit-parent-contact').value.trim());

            // Documents details
            formData.append('id_type', document.getElementById('edit-id-type').value);
            formData.append('id_number', document.getElementById('edit-id-number').value.trim());

            if (editPhotoInput.files[0]) {
                formData.append('photo', editPhotoInput.files[0]);
            }
            if (editDocInput.files[0]) {
                formData.append('id_doc', editDocInput.files[0]);
            }

            showLoading("Saving student profile changes...");
            fetch('../php/update_student.php', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                hideLoading();
                if (data.status === 'success') {
                    showToast(`Successfully updated student profile: ${data.student.name}`);
                    setTimeout(() => window.location.href = 'view-students.html', 1000);
                } else {
                    showToast(data.message, 'error');
                }
            })
            .catch(err => {
                hideLoading();
                showToast("Failed to connect to backend update server.", "error");
                console.error(err);
            });
        });

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                window.location.href = 'view-students.html';
            });
        }
    }
});
