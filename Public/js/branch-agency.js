// Global variables
let currentBranch = null;
let currentAgencyId = null;
let idToEdit = null;
let idToDelete = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check authentication
        const response = await fetch('/api/check-auth', {
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        
        if (!data.success || data.userType !== 'owner') {
            sessionStorage.clear();
            if (data.userType === 'admin1' || data.userType === 'admin2' || data.userType === 'admin3') {
                window.location.href = '/query.html';
            } else if (data.userType === 'webowner') {
                window.location.href = '/webowner.html';
            } else {
                window.location.href = '/index.html';
            }
            return;
        }

        // Update UI with user info
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = data.userEmail;
        }

        // Store minimal info in sessionStorage
        sessionStorage.setItem('userEmail', data.userEmail);
        sessionStorage.setItem('userType', data.userType);
        if (data.agencyId) {
            sessionStorage.setItem('AGENCY_ID', data.agencyId);
            currentAgencyId = data.agencyId;
        }

        // Load branches
        await loadBranches();
    } catch (error) {
        console.error('Authentication error:', error);
        sessionStorage.clear();
        window.location.href = '/index.html';
    }
});

// Load branches for the current agency
async function loadBranches() {
    try {
        const response = await fetch(`/api/branches/${currentAgencyId}`);
        const data = await response.json();
        
        const branchSelect = document.getElementById('branchSelect');
        branchSelect.innerHTML = '<option value="">-- اختر وكالة فرعية --</option>';

        if (data.branches && data.branches.length > 0) {
            data.branches.forEach(branch => {
                const option = document.createElement('option');
                option.value = branch;
                option.textContent = branch;
                branchSelect.appendChild(option);
            });
        }

        // Add change event listener
        branchSelect.addEventListener('change', handleBranchChange);
    } catch (error) {
        console.error('Error loading branches:', error);
        showToast('حدث خطأ في تحميل بيانات الفروع', 'error');
    }
}

// Handle branch selection change
async function handleBranchChange(event) {
    const branchName = event.target.value;
    if (!branchName) {
        document.getElementById('branchContent').style.display = 'none';
        currentBranch = null;
        return;
    }

    currentBranch = branchName;
    document.getElementById('selectedBranchName').textContent = branchName;
    document.getElementById('branchContent').style.display = 'block';
    
    await loadBranchIds();
}

// Load IDs for the selected branch
async function loadBranchIds() {
    try {
        const response = await fetch(`/api/branch-ids/${currentAgencyId}/${currentBranch}`);
        const data = await response.json();
        
        const idsList = document.getElementById('idsList');
        idsList.innerHTML = '';

        if (data.ids && data.ids.length > 0) {
            data.ids.forEach(id => {
                const idElement = document.createElement('div');
                idElement.className = 'id-item';
                idElement.innerHTML = `
                    <div class="id-info">
                        <i class="fas fa-id-card"></i>
                        <span>${id}</span>
                    </div>
                    <div class="id-actions">
                        <button class="edit-btn" onclick="openEditIdModal('${id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="openDeleteConfirmModal('${id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                idsList.appendChild(idElement);
            });
        } else {
            idsList.innerHTML = `
                <div class="no-ids">
                    <i class="fas fa-id-card"></i>
                    <p>لا توجد معرفات مسجلة</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading branch IDs:', error);
        showToast('حدث خطأ في تحميل معرفات الفرع', 'error');
    }
}

// Add new ID
async function addNewId() {
    const newIdInput = document.getElementById('newId');
    const newId = newIdInput.value.trim();

    // Validate ID format - any number between 5 and 12 digits
    if (!/^[0-9]{5,12}$/.test(newId)) {
        showToast('يجب أن يكون المعرف رقماً بين 5 و 12 خانة', 'error');
        return;
    }

    try {
        const response = await fetch('/api/add-branch-id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agencyId: currentAgencyId,
                branchName: currentBranch,
                id: newId
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('تم إضافة المعرف بنجاح');
            closeAddIdModal();
            newIdInput.value = '';
            await loadBranchIds();
        } else {
            showToast(data.message || 'حدث خطأ في إضافة المعرف', 'error');
        }
    } catch (error) {
        console.error('Error adding ID:', error);
        showToast('حدث خطأ في إضافة المعرف', 'error');
    }
}

// Update existing ID
async function updateId() {
    const editIdInput = document.getElementById('editId');
    const newId = editIdInput.value.trim();

    // Validate ID format - any number between 5 and 12 digits
    if (!/^[0-9]{5,12}$/.test(newId)) {
        showToast('يجب أن يكون المعرف رقماً بين 5 و 12 خانة', 'error');
        return;
    }

    try {
        const response = await fetch('/api/update-branch-id', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agencyId: currentAgencyId,
                branchName: currentBranch,
                oldId: idToEdit,
                newId: newId
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('تم تحديث المعرف بنجاح');
            closeEditIdModal();
            await loadBranchIds();
        } else {
            showToast(data.message || 'حدث خطأ في تحديث المعرف', 'error');
        }
    } catch (error) {
        console.error('Error updating ID:', error);
        showToast('حدث خطأ في تحديث المعرف', 'error');
    }
}

// Delete ID
async function confirmDeleteId() {
    try {
        const response = await fetch('/api/delete-branch-id', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agencyId: currentAgencyId,
                branchName: currentBranch,
                id: idToDelete
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('تم حذف المعرف بنجاح');
            closeDeleteConfirmModal();
            await loadBranchIds();
        } else {
            showToast(data.message || 'حدث خطأ في حذف المعرف', 'error');
        }
    } catch (error) {
        console.error('Error deleting ID:', error);
        showToast('حدث خطأ في حذف المعرف', 'error');
    }
}

// Modal functions
function openAddIdModal() {
    document.getElementById('addIdModal').style.display = 'block';
}

function closeAddIdModal() {
    document.getElementById('addIdModal').style.display = 'none';
    document.getElementById('newId').value = '';
}

function openEditIdModal(id) {
    idToEdit = id;
    document.getElementById('editId').value = id;
    document.getElementById('editIdModal').style.display = 'block';
}

function closeEditIdModal() {
    document.getElementById('editIdModal').style.display = 'none';
    document.getElementById('editId').value = '';
    idToEdit = null;
}

function openDeleteConfirmModal(id) {
    idToDelete = id;
    document.getElementById('deleteConfirmModal').style.display = 'block';
}

function closeDeleteConfirmModal() {
    document.getElementById('deleteConfirmModal').style.display = 'none';
    idToDelete = null;
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Language switching
function toggleLanguage() {
    const currentLang = document.documentElement.lang;
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.querySelector('.current-lang').textContent = newLang.toUpperCase();
    
    // Update UI text based on language
    updateLanguageUI(newLang);
}

function updateLanguageUI(lang) {
    // Update page title and headers
    document.title = lang === 'ar' ? 'Code Art - إدارة الوكالات الفرعية' : 'Code Art - Branch Agency Management';
    document.querySelector('.branch-agency-header h1').textContent = lang === 'ar' ? 'إدارة الوكالات الفرعية' : 'Branch Agency Management';
    document.querySelector('.branch-agency-header p').textContent = lang === 'ar' ? 'اختر وكالة فرعية لإدارة معرفات الأشخاص' : 'Select a branch agency to manage person IDs';
    
    // Update form labels and placeholders
    document.querySelector('label[for="branchSelect"]').textContent = lang === 'ar' ? 'اختر الوكالة الفرعية' : 'Select Branch Agency';
    document.querySelector('#branchSelect option:first-child').textContent = lang === 'ar' ? '-- اختر وكالة فرعية --' : '-- Select Branch Agency --';
    
    // Update buttons and modals
    document.querySelector('.add-id-btn').innerHTML = lang === 'ar' ? 
        '<i class="fas fa-plus"></i> إضافة معرف جديد' : 
        '<i class="fas fa-plus"></i> Add New ID';
    
    // Update modal texts
    document.querySelector('#addIdModal h2').textContent = lang === 'ar' ? 'إضافة معرف جديد' : 'Add New ID';
    document.querySelector('#editIdModal h2').textContent = lang === 'ar' ? 'تعديل المعرف' : 'Edit ID';
    document.querySelector('#deleteConfirmModal h2').textContent = lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete';
    
    // Update form hints
    document.querySelectorAll('.form-hint').forEach(hint => {
        hint.textContent = lang === 'ar' ? 
            'يجب أن يكون المعرف رقماً بين 10 و 15 خانة، ويمكن أن يبدأ بعلامة +' : 
            'ID must be a number between 10 and 15 digits, and can start with +';
    });
    
    // Update confirmation messages
    document.querySelector('#deleteConfirmModal p').textContent = lang === 'ar' ? 
        'هل أنت متأكد من حذف هذا المعرف؟' : 
        'Are you sure you want to delete this ID?';
    
    // Update buttons
    document.querySelector('#addIdBtn').innerHTML = lang === 'ar' ? 
        '<i class="fas fa-plus"></i> إضافة' : 
        '<i class="fas fa-plus"></i> Add';
    document.querySelector('#editIdBtn').innerHTML = lang === 'ar' ? 
        '<i class="fas fa-save"></i> حفظ التغييرات' : 
        '<i class="fas fa-save"></i> Save Changes';
    document.querySelector('.cancel-btn').innerHTML = lang === 'ar' ? 
        '<i class="fas fa-times"></i> إلغاء' : 
        '<i class="fas fa-times"></i> Cancel';
    document.querySelector('.delete-btn').innerHTML = lang === 'ar' ? 
        '<i class="fas fa-trash"></i> تأكيد الحذف' : 
        '<i class="fas fa-trash"></i> Confirm Delete';
} 