document.addEventListener('DOMContentLoaded', async () => {
    if (await checkAuth()) {
        await loadAgents();
    }
});

async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth', {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'غير مصرح به');
        }

        return true;
    } catch (error) {
        console.error('Auth error:', error);
        showError(error.message);
        window.location.href = '/index.html';
        return false;
    }
}

async function loadAgents() {
    try {
        const response = await fetch('/api/get-agents', {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'فشل في تحميل الوكلاء');
        }

        if (!data.success) {
            throw new Error(data.message || 'فشل في تحميل الوكلاء');
        }

        const agentsList = document.getElementById('agents-list');
        agentsList.innerHTML = '';

        for (const [agencyName, agencyData] of Object.entries(data.agencies)) {
            const agentCard = createAgentCard(agencyName, agencyData);
            agentsList.appendChild(agentCard);
        }
    } catch (error) {
        console.error('Error loading agents:', error);
        showError(error.message);
    }
}

function createAgentCard(agencyName, agencyData) {
    const card = document.createElement('div');
    card.className = 'agent-card';
    card.innerHTML = `
        <h3><i class="fas fa-building"></i> ${agencyName}</h3>
        <p><i class="fas fa-envelope"></i> البريد الإلكتروني: ${agencyData.owner.email}</p>
        <div class="agent-actions">
            <button onclick="showDeleteModal('${agencyName}')" class="delete-btn">
                <i class="fas fa-trash-alt"></i>
                حذف الوكيل
            </button>
            <button onclick="showAddMonthModal('${agencyName}')" class="add-btn">
                <i class="fas fa-calendar-plus"></i>
                إضافة شهر
            </button>
            <button onclick="showAddYearModal('${agencyName}')" class="add-btn">
                <i class="fas fa-calendar-plus"></i>
                إضافة سنة
            </button>
            <button onclick="showChangePasswordModal('${agencyName}')" class="edit-btn">
                <i class="fas fa-key"></i>
                تغيير كلمة المرور
            </button>
        </div>
    `;
    return card;
}

async function deleteAgent(agencyName) {
    try {
        const response = await fetch('/api/delete-agent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ agencyName })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'فشل في حذف الوكيل');
        }

        if (!data.success) {
            throw new Error(data.message || 'فشل في حذف الوكيل');
        }

        hideModal('delete-modal');
        showSuccess('تم حذف الوكيل بنجاح');
        await loadAgents();
    } catch (error) {
        console.error('Error deleting agent:', error);
        showError(error.message);
    }
}

async function addMonth(event) {
    event.preventDefault();
    
    try {
        // Get form values
        const agencyName = document.getElementById('add-month-agency-name').value;
        const year = document.getElementById('year').value;
        const month = document.getElementById('month').value;
        const file1 = document.getElementById('file1').files[0];
        const file2 = document.getElementById('file2').files[0];

        // Validate form data
        if (!agencyName || !year || !month || !file1 || !file2) {
            showError('جميع الحقول مطلوبة');
            return;
        }

        // Create FormData object
        const formData = new FormData();
        formData.append('agencyName', agencyName);
        formData.append('year', year);
        formData.append('month', month);
        formData.append('file1', file1, 'salaries.xlsx');
        formData.append('file2', file2, 'salaries_target.xlsx');

        // Send request with proper headers
        const response = await fetch('/api/add-month', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'فشل في إضافة الشهر');
        }

        // Reset form and show success
        document.getElementById('add-month-form').reset();
        hideModal('add-month-modal');
        showSuccess('تم إضافة الشهر بنجاح');
        await loadAgents();
    } catch (error) {
        console.error('Error adding month:', error);
        showError(error.message || 'حدث خطأ في إضافة الشهر');
    }
}

async function addYear(event) {
    event.preventDefault();
    const form = document.getElementById('add-year-form');
    const formData = new FormData(form);

    try {
        const response = await fetch('/api/add-year', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(Object.fromEntries(formData))
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'فشل في إضافة السنة');
        }

        if (!data.success) {
            throw new Error(data.message || 'فشل في إضافة السنة');
        }

        form.reset();
        hideModal('add-year-modal');
        showSuccess('تم إضافة السنة بنجاح');
        await loadAgents();
    } catch (error) {
        console.error('Error adding year:', error);
        showError(error.message);
    }
}

async function changePassword(event) {
    event.preventDefault();
    const form = document.getElementById('change-password-form');
    const formData = new FormData(form);

    try {
        const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(Object.fromEntries(formData))
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'فشل في تغيير كلمة المرور');
        }

        if (!data.success) {
            throw new Error(data.message || 'فشل في تغيير كلمة المرور');
        }

        form.reset();
        hideModal('change-password-modal');
        showSuccess('تم تغيير كلمة المرور بنجاح');
        await loadAgents();
    } catch (error) {
        console.error('Error changing password:', error);
        showError(error.message);
    }
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showDeleteModal(agencyName) {
    document.getElementById('delete-agency-name').value = agencyName;
    showModal('delete-modal');
}

async function loadAvailableYears(agencyName) {
    try {
        const response = await fetch(`/api/years/${agencyName}`);
        const data = await response.json();

        const yearSelect = document.getElementById('year');
        yearSelect.innerHTML = '<option value="">اختر السنة</option>';

        if (data.success && data.years && data.years.length > 0) {
            data.years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading years:', error);
        showError('حدث خطأ في تحميل السنوات');
    }
}

function showAddMonthModal(agencyName) {
    document.getElementById('add-month-agency-name').value = agencyName;
    loadAvailableYears(agencyName);
    showModal('add-month-modal');
}

function showAddYearModal(agencyName) {
    document.getElementById('add-year-agency-name').value = agencyName;
    showModal('add-year-modal');
}

function showChangePasswordModal(agencyName) {
    document.getElementById('change-password-agency-name').value = agencyName;
    showModal('change-password-modal');
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorDiv.style.display = 'block';
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.right = '20px';
    errorDiv.style.zIndex = '9999';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    successDiv.style.display = 'block';
    successDiv.style.position = 'fixed';
    successDiv.style.top = '20px';
    successDiv.style.right = '20px';
    successDiv.style.zIndex = '9999';
    
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 5000);
}

document.getElementById('delete-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const agencyName = document.getElementById('delete-agency-name').value;
    await deleteAgent(agencyName);
});

document.getElementById('add-month-form').addEventListener('submit', addMonth);
document.getElementById('add-year-form').addEventListener('submit', addYear);
document.getElementById('change-password-form').addEventListener('submit', changePassword); 