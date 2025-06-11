// Check if user is owner
const userRole = sessionStorage.getItem('userRole');
const agencyId = sessionStorage.getItem('AGENCY_ID');

if (userRole !== 'owner') {
    window.location.href = '/dashboard.html';
}

// DOM Elements
const adminForm = document.getElementById('adminForm');
const adminEmail = document.getElementById('adminEmail');
const adminPassword = document.getElementById('adminPassword');
const submitBtn = document.getElementById('submitBtn');
const toast = document.getElementById('toast');

// Show toast notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Handle admin form submission
if (adminForm) {
    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            agencyId: agencyId,
            adminEmail: adminEmail.value,
            adminPassword: adminPassword.value
        };

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإضافة...';

            const response = await fetch('/api/add-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                showToast('تم إضافة المشرف بنجاح');
                adminForm.reset();
            } else {
                showToast(data.message || 'حدث خطأ في إضافة المشرف', 'error');
            }
        } catch (error) {
            console.error('Error adding admin:', error);
            showToast('حدث خطأ في إضافة المشرف', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'إضافة مشرف';
        }
    });
} 