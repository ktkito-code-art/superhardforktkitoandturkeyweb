// Get user's AGENCY_ID from session storage
const AGENCY_ID = sessionStorage.getItem('AGENCY_ID');
if (!AGENCY_ID) {
    window.location.href = '/index.html';
}

// Language state
let currentLang = localStorage.getItem('language') || 'ar';

// Global variables
let currentPage = 1;
let totalPages = 10;
let allHosts = [];
let filteredHosts = [];

// DOM Elements
const hostForm = document.getElementById('hostForm');
const hostsList = document.getElementById('hostsList');
const refreshHostsBtn = document.getElementById('refreshHostsBtn');
const toast = document.getElementById('toast');
const userEmail = document.getElementById('userEmail');
const searchInput = document.getElementById('searchInput');
const countryFilter = document.getElementById('countryFilter');
const typeFilter = document.getElementById('typeFilter');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const resultsCount = document.getElementById('resultsCount');
const pagination = document.getElementById('pagination');
const addHostBtn = document.getElementById('addHostBtn');
const addHostModal = document.getElementById('addHostModal');
const exportBtn = document.getElementById('exportBtn');
const refreshBtn = document.getElementById('refreshBtn');

// Set user email
userEmail.textContent = sessionStorage.getItem('userEmail') || (currentLang === 'ar' ? 'مستخدم' : 'User');

// Pagination state
const hostsPerPage = 9;
let totalHosts = 0;

// Show toast notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Update language
function updateLanguage(lang) {
    currentLang = lang;
    
    // Update HTML lang and dir attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Update all elements with data attributes
    document.querySelectorAll('[data-ar]').forEach(element => {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            const placeholder = element.getAttribute(`data-${lang}-placeholder`);
            if (placeholder) {
                element.placeholder = placeholder;
            }
        } else {
            const text = element.getAttribute(`data-${lang}`);
            if (text) {
                element.textContent = text;
            }
        }
    });

    // Update select options
    document.querySelectorAll('select option').forEach(option => {
        if (option.hasAttribute('data-ar')) {
            const text = option.getAttribute(`data-${lang}`);
            if (text) {
                option.textContent = text;
            }
        }
    });

    // Update title
    const title = document.querySelector('title');
    if (title) {
        const titleText = title.getAttribute(`data-${lang}`);
        if (titleText) {
            document.title = titleText;
        }
    }

    // Update user email placeholder
    const userEmail = document.getElementById('userEmail');
    if (userEmail) {
        userEmail.textContent = sessionStorage.getItem('userEmail') || (lang === 'ar' ? 'مستخدم' : 'User');
    }

    // Save language preference
    localStorage.setItem('language', lang);

    // Reload hosts to update the display
    loadHosts();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const langSwitch = document.getElementById('langSwitch');
    if (langSwitch) {
        langSwitch.addEventListener('click', () => {
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            updateLanguage(newLang);
        });
    }

    // Initialize language
    updateLanguage(currentLang);
    loadHosts();
    setupEventListeners();
});

function setupEventListeners() {
    // Search and filter events
    searchInput.addEventListener('input', debounce(applyFilters, 300));
    countryFilter.addEventListener('change', applyFilters);
    typeFilter.addEventListener('change', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);

    // Modal events
    addHostBtn.addEventListener('click', () => addHostModal.classList.add('active'));
    addHostModal.querySelector('.close-btn').addEventListener('click', closeModal);
    hostForm.addEventListener('submit', handleFormSubmit);

    // Action buttons
    exportBtn.addEventListener('click', exportData);
    refreshBtn.addEventListener('click', () => loadHosts());

    // WhatsApp number validation
    const hostIdInput = document.getElementById('hostId');
    hostIdInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 15);
    });
}

// Load hosts data
async function loadHosts(page = 1) {
    try {
        const agencyId = sessionStorage.getItem('AGENCY_ID');
        if (!agencyId) {
            showToast('يرجى تسجيل الدخول أولاً', 'error');
            return;
        }

        const response = await fetch(`/api/get-hosts?agencyId=${agencyId}&page=${page}&limit=10000`);
        const data = await response.json();

        if (data.success) {
            allHosts = data.hosts;
            filteredHosts = [...allHosts];
            applyFilters();
        } else {
            showToast(data.message || 'حدث خطأ في تحميل البيانات', 'error');
        }
    } catch (error) {
        console.error('Error loading hosts:', error);
        showToast('حدث خطأ في تحميل البيانات', 'error');
    }
}

// Apply filters
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCountry = countryFilter.value;
    const selectedType = typeFilter.value;

    filteredHosts = allHosts.filter(host => {
        const matchesSearch = !searchTerm || 
            host.id.toLowerCase().includes(searchTerm) ||
            host.name.toLowerCase().includes(searchTerm);
        
        const matchesCountry = !selectedCountry || host.country === selectedCountry;
        const matchesType = !selectedType || host.type === selectedType;

        return matchesSearch && matchesCountry && matchesType;
    });

    // Reset to first page when filters change
    currentPage = 1;
    displayHosts(filteredHosts);
    updateResultsCount();
}

// Clear all filters
function clearFilters() {
    searchInput.value = '';
    countryFilter.value = '';
    typeFilter.value = '';
    applyFilters();
}

// Display hosts
function displayHosts(hosts) {
    hostsList.innerHTML = '';

    if (hosts.length === 0) {
        hostsList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>لا توجد نتائج</p>
            </div>
        `;
        return;
    }

    // Calculate pagination
    totalPages = Math.ceil(hosts.length / hostsPerPage);
    
    // Ensure current page is valid
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    
    const startIndex = (currentPage - 1) * hostsPerPage;
    const endIndex = startIndex + hostsPerPage;
    const paginatedHosts = hosts.slice(startIndex, endIndex);

    paginatedHosts.forEach(host => {
        const hostCard = document.createElement('div');
        hostCard.className = 'host-card';
        hostCard.innerHTML = `
            <div class="host-header">
                <div class="host-name">${host.name}</div>
                <div class="host-actions">
                    <button class="action-btn edit-btn" onclick="openEditModal('${host.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteHost('${host.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="host-type ${host.type}">
                    ${host.type === 'male' ? '👨' : '👩'}
                    ${host.type === 'male' ? 'ذكر' : 'أنثى'}
                </div>
            </div>
            <div class="host-info">
                <div class="info-item">
                    <i class="fab fa-whatsapp"></i>
                    <span>${host.id}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-globe-asia"></i>
                    <span>${getCountryName(host.country)}</span>
                </div>
                ${host.joinDate ? `
                    <div class="info-item">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${formatDate(host.joinDate)}</span>
                    </div>
                ` : ''}
                ${host.notes ? `
                    <div class="info-item">
                        <i class="fas fa-sticky-note"></i>
                        <span>${host.notes}</span>
                    </div>
                ` : ''}
            </div>
        `;
        hostsList.appendChild(hostCard);
    });

    updatePagination();
}

// Update results count
function updateResultsCount() {
    resultsCount.textContent = filteredHosts.length;
}

// Update pagination
function updatePagination() {
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        prevBtn.onclick = () => {
            currentPage--;
            displayHosts(filteredHosts);
            window.scrollTo(0, 0);
        };
        pagination.appendChild(prevBtn);
    }

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 || 
            i === totalPages || 
            (i >= currentPage - 1 && i <= currentPage + 1)
        ) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => {
                currentPage = i;
                displayHosts(filteredHosts);
                window.scrollTo(0, 0);
            };
            pagination.appendChild(pageBtn);
        } else if (
            i === currentPage - 2 || 
            i === currentPage + 2
        ) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'ellipsis';
            ellipsis.textContent = '...';
            pagination.appendChild(ellipsis);
        }
    }

    // Next button
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        nextBtn.onclick = () => {
            currentPage++;
            displayHosts(filteredHosts);
            window.scrollTo(0, 0);
        };
        pagination.appendChild(nextBtn);
    }
}

// Open edit modal
async function openEditModal(hostId) {
    const host = allHosts.find(h => h.id === hostId);
    if (!host) {
        showToast('المضيف غير موجود', 'error');
        return;
    }

    // Fill form with host data
    document.getElementById('hostId').value = host.id;
    document.getElementById('hostId').readOnly = true; // Prevent WhatsApp number editing
    document.getElementById('hostName').value = host.name;
    document.getElementById('hostType').value = host.type;
    document.getElementById('hostCountry').value = host.country;
    document.getElementById('joinDate').value = host.joinDate || '';
    document.getElementById('notes').value = host.notes || '';

    // Update form for edit mode
    const form = document.getElementById('hostForm');
    form.dataset.mode = 'edit';
    form.dataset.hostId = hostId;

    // Update modal title
    document.querySelector('.modal-header h2').textContent = 'تعديل بيانات المضيف';

    // Show modal
    addHostModal.classList.add('active');
}

// Delete host
async function deleteHost(hostId) {
    // Create and show custom confirmation dialog
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'confirm-dialog';
    confirmDialog.innerHTML = `
        <div class="confirm-content">
            <div class="confirm-header">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>تأكيد الحذف</h3>
            </div>
            <p>هل أنت متأكد من حذف هذا المضيف؟</p>
            <p class="confirm-subtitle">لا يمكن التراجع عن هذا الإجراء</p>
            <div class="confirm-actions">
                <button class="confirm-btn delete" id="confirmDelete">
                    <i class="fas fa-trash"></i>
                    نعم، احذف
                </button>
                <button class="confirm-btn cancel" id="cancelDelete">
                    <i class="fas fa-times"></i>
                    إلغاء
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(confirmDialog);

    // Handle confirmation
    return new Promise((resolve) => {
        document.getElementById('confirmDelete').onclick = async () => {
            confirmDialog.remove();
            try {
                const agencyId = sessionStorage.getItem('AGENCY_ID');
                if (!agencyId) {
                    showToast('يرجى تسجيل الدخول أولاً', 'error');
                    return;
                }

                const response = await fetch('/api/delete-host', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        agencyId,
                        hostId
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showToast('تم حذف المضيف بنجاح');
                    loadHosts();
                } else {
                    showToast(data.message || 'حدث خطأ في حذف المضيف', 'error');
                }
            } catch (error) {
                console.error('Error deleting host:', error);
                showToast('حدث خطأ في حذف المضيف', 'error');
            }
        };

        document.getElementById('cancelDelete').onclick = () => {
            confirmDialog.remove();
        };
    });
}

// Modify handleFormSubmit to handle both add and edit
async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
        id: document.getElementById('hostId').value,
        name: document.getElementById('hostName').value,
        type: document.getElementById('hostType').value,
        country: document.getElementById('hostCountry').value,
        joinDate: document.getElementById('joinDate').value,
        notes: document.getElementById('notes').value
    };

    try {
        const agencyId = sessionStorage.getItem('AGENCY_ID');
        if (!agencyId) {
            showToast('يرجى تسجيل الدخول أولاً', 'error');
            return;
        }

        const isEditMode = this.dataset.mode === 'edit';
        const url = isEditMode ? '/api/edit-host' : '/api/store-host';
        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                agencyId,
                hostId: isEditMode ? this.dataset.hostId : undefined,
                hostData: formData
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast(isEditMode ? 'تم تحديث بيانات المضيف بنجاح' : 'تم إضافة المضيف بنجاح');
            closeModal();
            loadHosts();
        } else {
            showToast(data.message || 'حدث خطأ في حفظ البيانات', 'error');
        }
    } catch (error) {
        console.error('Error saving host:', error);
        showToast('حدث خطأ في حفظ البيانات', 'error');
    }
}

// Modify closeModal to reset form mode
function closeModal() {
    addHostModal.classList.remove('active');
    hostForm.reset();
    hostForm.dataset.mode = 'add';
    delete hostForm.dataset.hostId;
    document.getElementById('hostId').readOnly = false;
    document.querySelector('.modal-header h2').textContent = 'إضافة مضيف جديد';
}

// Export data
async function exportData() {
    if (filteredHosts.length === 0) {
        showToast('لا توجد بيانات للتصدير', 'error');
        return;
    }

    try {
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Prepare data for Excel
        const excelData = filteredHosts.map(host => ({
            'رقم الواتساب': host.id,
            'الاسم': host.name,
            'النوع': host.type === 'male' ? 'ذكر' : 'أنثى',
            'الدولة': getCountryName(host.country),
            'تاريخ الانضمام': host.joinDate ? formatDate(host.joinDate) : '-',
            'ملاحظات': host.notes || '-'
        }));

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(excelData, { origin: 'A4' });

        // Add header information
        ws['A1'] = { v: 'Code Art - إدارة المضيفين', t: 's' };
        ws['A2'] = { v: `تاريخ التصدير: ${formatDate(new Date())}`, t: 's' };
        ws['A3'] = { v: `عدد المضيفين: ${filteredHosts.length}`, t: 's' };

        // Set column widths
        const colWidths = [
            { wch: 15 }, // رقم الواتساب
            { wch: 20 }, // الاسم
            { wch: 10 }, // النوع
            { wch: 15 }, // الدولة
            { wch: 15 }, // تاريخ الانضمام
            { wch: 30 }  // ملاحظات
        ];
        ws['!cols'] = colWidths;

        // Add footer
        const lastRow = filteredHosts.length + 6;
        ws[`A${lastRow + 1}`] = { v: 'تم إنشاء هذا الملف بواسطة', t: 's' };
        ws[`A${lastRow + 2}`] = { v: 'Code Art', t: 's' };
        ws[`A${lastRow + 3}`] = { v: 'جميع الحقوق محفوظة © 2024', t: 's' };

        // Add styles
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Title merge
            { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Date merge
            { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }, // Count merge
            { s: { r: lastRow + 1, c: 0 }, e: { r: lastRow + 1, c: 5 } }, // Footer 1 merge
            { s: { r: lastRow + 2, c: 0 }, e: { r: lastRow + 2, c: 5 } }, // Footer 2 merge
            { s: { r: lastRow + 3, c: 0 }, e: { r: lastRow + 3, c: 5 } }  // Footer 3 merge
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'المضيفين');

        // Generate Excel file
        const fileName = `hosts_${formatDate(new Date())}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showToast('تم تصدير البيانات بنجاح');
    } catch (error) {
        console.error('Error exporting Excel:', error);
        showToast('حدث خطأ أثناء تصدير البيانات', 'error');
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

function getCountryName(code) {
    const countries = {
        'SA': 'السعودية',
        'AE': 'الإمارات',
        'QA': 'قطر',
        'KW': 'الكويت',
        'BH': 'البحرين',
        'OM': 'عمان',
        'EG': 'مصر',
        'IQ': 'العراق',
        'SY': 'سوريا',
        'LB': 'لبنان',
        'JO': 'الأردن',
        'PS': 'فلسطين',
        'YE': 'اليمن',
        'SD': 'السودان',
        'LY': 'ليبيا',
        'TN': 'تونس',
        'DZ': 'الجزائر',
        'MA': 'المغرب',
        'MR': 'موريتانيا'
    };
    return countries[code] || code;
}

// Toggle hosts list visibility
document.getElementById('toggleHostsBtn').addEventListener('click', function() {
    const hostsList = document.getElementById('hostsList');
    const icon = this.querySelector('i');
    hostsList.classList.toggle('hidden');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
    this.querySelector('span').textContent = hostsList.classList.contains('hidden') ? 'إظهار السجلات' : 'إخفاء السجلات';
});

// Initialize
loadHosts(); 