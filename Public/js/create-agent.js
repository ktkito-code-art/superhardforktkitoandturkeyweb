let currentStep = 1;

function nextStep(step) {
    const currentStepElement = document.getElementById(`step${step}`);
    const nextStepElement = document.getElementById(`step${step + 1}`);
    
    // Validate current step
    if (!validateStep(step)) {
        return;
    }

    currentStepElement.classList.add('hidden');
    nextStepElement.classList.remove('hidden');
    currentStep = step + 1;
}

function prevStep(step) {
    const currentStepElement = document.getElementById(`step${step}`);
    const prevStepElement = document.getElementById(`step${step - 1}`);
    
    currentStepElement.classList.add('hidden');
    prevStepElement.classList.remove('hidden');
    currentStep = step - 1;
}

function validateStep(step) {
    const currentStep = document.getElementById(`step${step}`);
    const inputs = currentStep.querySelectorAll('input[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value) {
            isValid = false;
            input.classList.add('error');
        } else {
            input.classList.remove('error');
        }
    });

    if (!isValid) {
        showError('يرجى ملء جميع الحقول المطلوبة');
    }

    return isValid;
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createAgentForm');
    const loading = document.getElementById('loading');

    // Check authentication
    checkAuth();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            showLoading();
            
            // إنشاء كائن FormData لرفع الملفات
            const formData = new FormData();
            formData.append('agentName', document.getElementById('agentName').value.trim());
            formData.append('email', document.getElementById('email').value.trim());
            formData.append('password', document.getElementById('password').value);
            formData.append('year', document.getElementById('year').value);
            formData.append('month', document.getElementById('month').value);
            
            // التحقق من وجود الملفات
            const file1 = document.getElementById('file1').files[0];
            const file2 = document.getElementById('file2').files[0];
            
            if (!file1 || !file2) {
                throw new Error('يرجى اختيار الملفات المطلوبة');
            }

            // التحقق من نوع الملفات
            if (!file1.name.endsWith('.xlsx') || !file2.name.endsWith('.xlsx')) {
                throw new Error('يجب أن تكون الملفات بصيغة xlsx');
            }

            formData.append('file1', file1);
            formData.append('file2', file2);

            console.log('Sending request to create agent...');
            const response = await fetch('/api/create-agent', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (data.success) {
                showSuccessMessage({
                    name: document.getElementById('agentName').value,
                    email: document.getElementById('email').value,
                    year: document.getElementById('year').value,
                    month: document.getElementById('month').value
                });
            } else {
                throw new Error(data.message || 'حدث خطأ أثناء إنشاء الوكيلة');
            }
        } catch (error) {
            console.error('Error:', error);
            showError(error.message || 'حدث خطأ في الاتصال بالخادم');
        } finally {
            hideLoading();
        }
    });

    // Check if user is authenticated
    const userEmail = sessionStorage.getItem('userEmail');
    const userType = sessionStorage.getItem('userType');

    // Redirect if not authenticated
    if (!userEmail || !userType) {
        window.location.href = '/index.html';
        return;
    }

    // Update user info if element exists
    const userEmailElement = document.querySelector('.user-info span');
    if (userEmailElement) {
        userEmailElement.textContent = userEmail;
    }

    // Initialize the rest of the create agent page
    initializeCreateAgentPage();
});

function showSuccessMessage(agent) {
    // Create success message container
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="success-message">
            <i class="fas fa-check-circle"></i>
            <h2>تم إنشاء الوكيلة بنجاح</h2>
            <div class="agent-details">
                <div class="detail-item">
                    <span class="label">اسم الوكيلة:</span>
                    <span class="value">${agent.name}</span>
                </div>
                <div class="detail-item">
                    <span class="label">البريد الإلكتروني:</span>
                    <span class="value">${agent.email}</span>
                </div>
                <div class="detail-item">
                    <span class="label">السنة:</span>
                    <span class="value">${agent.year}</span>
                </div>
                <div class="detail-item">
                    <span class="label">الشهر:</span>
                    <span class="value">${agent.month}</span>
                </div>
            </div>
            <div class="action-buttons">
                <a href="webowner.html" class="btn">
                    <i class="fas fa-arrow-right"></i>
                    العودة للوحة التحكم
                </a>
                <button onclick="createAnotherAgent()" class="btn btn-secondary">
                    <i class="fas fa-plus"></i>
                    إنشاء وكيلة أخرى
                </button>
            </div>
        </div>
    `;
}

function createAnotherAgent() {
    window.location.reload();
}

function showError(message) {
    const container = document.querySelector('.container');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
        <button onclick="window.location.reload()" class="btn">
            <i class="fas fa-redo"></i>
            المحاولة مرة أخرى
        </button>
    `;
    container.insertBefore(errorDiv, container.firstChild);
}

function showLoading() {
    const loading = document.getElementById('loading');
    loading.classList.remove('hidden');
    document.getElementById('createAgentForm').classList.add('hidden');
}

function hideLoading() {
    const loading = document.getElementById('loading');
    loading.classList.add('hidden');
}

function validateForm() {
    const agentName = document.getElementById('agentName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const year = document.getElementById('year').value;
    const month = document.getElementById('month').value;
    const file1 = document.getElementById('file1').files[0];
    const file2 = document.getElementById('file2').files[0];

    // التحقق من اسم الوكيلة
    if (!agentName) {
        showError('يرجى إدخال اسم الوكيلة');
        return false;
    }
    if (!/^[a-zA-Z0-9]+$/.test(agentName)) {
        showError('اسم الوكيلة يجب أن يحتوي على أحرف وأرقام فقط');
        return false;
    }

    // التحقق من البريد الإلكتروني
    if (!email) {
        showError('يرجى إدخال البريد الإلكتروني');
        return false;
    }
    if (!isValidEmail(email)) {
        showError('يرجى إدخال بريد إلكتروني صحيح');
        return false;
    }

    // التحقق من كلمة المرور
    if (!password) {
        showError('يرجى إدخال كلمة المرور');
        return false;
    }
    if (password.length < 6) {
        showError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return false;
    }

    // التحقق من السنة
    if (!year) {
        showError('يرجى إدخال السنة');
        return false;
    }
    if (year < 2000 || year > 2100) {
        showError('يرجى إدخال سنة صحيحة');
        return false;
    }

    // التحقق من الشهر
    if (!month) {
        showError('يرجى اختيار الشهر');
        return false;
    }

    // التحقق من الملفات
    if (!file1 || !file2) {
        showError('يرجى اختيار الملفات المطلوبة');
        return false;
    }
    if (!file1.name.endsWith('.xlsx') || !file2.name.endsWith('.xlsx')) {
        showError('يجب أن تكون الملفات بصيغة xlsx');
        return false;
    }

    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function checkAuth() {
    try {
        const response = await fetch('http://localhost:3000/api/check-auth', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`خطأ في التحقق من المصادقة: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success || data.userType !== 'webowner') {
            window.location.href = '/index.html';
        }
    } catch (error) {
        console.error('Authentication error:', error);
        if (error.message.includes('Failed to fetch')) {
            showError('لا يمكن الاتصال بالخادم. يرجى التأكد من تشغيل الخادم على المنفذ 3000');
        } else {
            window.location.href = '/index.html';
        }
    }
}

function initializeCreateAgentPage() {
    // Implementation of initializeCreateAgentPage function
} 