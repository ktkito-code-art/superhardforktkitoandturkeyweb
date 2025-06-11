// Add authentication check at the beginning of the file
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Make an API call to check authentication status
        const response = await fetch('/api/check-auth', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        
        // Check if user is authenticated and has correct type
        if (!data.success || !(data.userType === 'owner' || data.userType.startsWith('admin'))) {
            window.location.href = '/index.html';
            return;
        }

        // Update user info if element exists
        const userEmailElement = document.querySelector('.user-info span');
        if (userEmailElement) {
            userEmailElement.textContent = data.userEmail;
        }

        // Store agency ID for API calls
        window.AGENCY_ID = data.agencyId;

        // Initialize query-specific functionality
        if (typeof loadYears === 'function') {
            loadYears(data.agencyId);
        }

        // Add click animations to buttons
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 100);
            });
        });
    } catch (error) {
        console.error('Authentication error:', error);
        window.location.href = '/index.html';
    }
});

// Get user's AGENCY_ID from session storage
const AGENCY_ID = sessionStorage.getItem('AGENCY_ID');
console.log('Current AGENCY_ID:', AGENCY_ID);

if (!AGENCY_ID) {
    console.error('No AGENCY_ID found in session storage');
    showToast(currentLang === 'ar' ? 'يرجى تسجيل الدخول مرة أخرى' : 'Please login again', 'error');
    setTimeout(() => {
        window.location.href = '/index.html';
    }, 2000);
}

// Language state
let currentLang = localStorage.getItem('language') || 'ar';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const resultCard = document.getElementById('resultCard');
const historyList = document.getElementById('historyList');
const copyButton = document.getElementById('copyButton');
const toast = document.getElementById('toast');
const userEmail = document.getElementById('userEmail');
const yearSelect = document.getElementById('yearSelect');
const monthSelect = document.getElementById('monthSelect');
const safemodeToggle = document.getElementById('safemodeToggle');

// Safemode state
let isSafemodeActive = localStorage.getItem('safemode') === 'true';

// Set user email
userEmail.textContent = sessionStorage.getItem('userEmail') || (currentLang === 'ar' ? 'مستخدم' : 'User');

// Search history
let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');

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
function updateLanguage() {
    const elements = document.querySelectorAll('[data-ar], [data-en]');
    elements.forEach(element => {
        const text = element.getAttribute(`data-${currentLang}`);
        if (text) {
            element.textContent = text;
        }
    });

    // Update placeholders
    const placeholders = document.querySelectorAll('[data-ar-placeholder], [data-en-placeholder]');
    placeholders.forEach(element => {
        const placeholder = element.getAttribute(`data-${currentLang}-placeholder`);
        if (placeholder) {
            element.placeholder = placeholder;
        }
    });

    // Update document direction
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;

    // Update user email placeholder
    userEmail.textContent = sessionStorage.getItem('userEmail') || (currentLang === 'ar' ? 'مستخدم' : 'User');

    // Save language preference
    localStorage.setItem('language', currentLang);
}

// Update history display
function updateHistoryDisplay() {
    historyList.innerHTML = '';
    const agencyHistory = searchHistory.filter(item => item.agencyId === AGENCY_ID);
    
    agencyHistory.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="history-item">
                <i class="fas fa-id-card"></i>
                <span>${item.employeeId}</span>
            </div>
            <div class="history-type">
                <i class="fas fa-file-alt"></i>
                <span>${item.fileType}</span>
            </div>
        `;
        li.onclick = () => {
            searchInput.value = item.employeeId;
            searchEmployee();
        };
        historyList.appendChild(li);
    });
}

// Add to history
function addToHistory(employeeId, fileType) {
    const historyItem = {
        employeeId,
        agencyId: AGENCY_ID,
        fileType,
        timestamp: new Date().toISOString()
    };
    
    searchHistory = [historyItem, ...searchHistory.filter(item => 
        item.employeeId !== employeeId || item.agencyId !== AGENCY_ID
    )].slice(0, 10);
    
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    updateHistoryDisplay();
}

// Update safemode button state
function updateSafemodeState() {
    if (isSafemodeActive) {
        safemodeToggle.classList.add('active');
        yearSelect.disabled = true;
        monthSelect.disabled = true;
    } else {
        safemodeToggle.classList.remove('active');
        yearSelect.disabled = false;
        monthSelect.disabled = !yearSelect.value;
    }
}

// Toggle safemode
safemodeToggle.addEventListener('click', () => {
    isSafemodeActive = !isSafemodeActive;
    localStorage.setItem('safemode', isSafemodeActive);
    updateSafemodeState();
    
    if (isSafemodeActive) {
        selectLatestYearAndMonth();
    }
});

// Select latest year and month
async function selectLatestYearAndMonth() {
    try {
        // Get all available years from the data directory
        const response = await fetch(`/api/years/${AGENCY_ID}`);
        const data = await response.json();

        if (data.success && data.years && data.years.length > 0) {
            // Get the highest year number
            const latestYear = Math.max(...data.years.map(y => parseInt(y)));
            yearSelect.value = latestYear;

            // Get months for the latest year
            const monthsResponse = await fetch(`/api/months/${AGENCY_ID}/${latestYear}`);
            const monthsData = await monthsResponse.json();

            if (monthsData.success && monthsData.months && monthsData.months.length > 0) {
                // Get the highest month number (1-12)
                const latestMonth = Math.max(...monthsData.months.map(m => parseInt(m)));
                
                // Update months dropdown
                monthSelect.innerHTML = '';
                monthsData.months.forEach(month => {
                    const option = document.createElement('option');
                    option.value = month;
                    option.textContent = month;
                    monthSelect.appendChild(option);
                });

                // Enable month select
                monthSelect.disabled = false;

                // Force month selection after a small delay to ensure DOM is updated
                setTimeout(() => {
                    monthSelect.value = latestMonth;
                }, 100);

                showToast(currentLang === 'ar' ? 
                    `تم اختيار السنة ${latestYear} والشهر ${latestMonth}` : 
                    `Selected year ${latestYear} and month ${latestMonth}`, 'success');
            }
        }
    } catch (error) {
        console.error('Error selecting latest year and month:', error);
        showToast(currentLang === 'ar' ? 'حدث خطأ في تحديد أحدث السنة والشهر' : 'Error selecting latest year and month', 'error');
    }
}

// Modify loadYears function to handle safemode
async function loadYears(agencyId) {
    try {
        console.log('Loading years for agency:', agencyId);
        const response = await fetch(`/api/years/${agencyId}`);
        const data = await response.json();
        console.log('Years response:', data);

        if (data.success && data.years && data.years.length > 0) {
            yearSelect.innerHTML = `<option value="" data-ar="اختر السنة" data-en="Select Year">${currentLang === 'ar' ? 'اختر السنة' : 'Select Year'}</option>`;
            data.years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            });

            // If safemode is active, select latest year and month
            if (isSafemodeActive) {
                await selectLatestYearAndMonth();
            }
        } else {
            console.error('No years found or invalid response:', data);
            showToast(currentLang === 'ar' ? 'لا توجد سنوات متاحة' : 'No years available', 'error');
        }
    } catch (error) {
        console.error('Error loading years:', error);
        showToast(currentLang === 'ar' ? 'حدث خطأ في تحميل السنوات' : 'Error loading years', 'error');
    }
}

// Load available months for selected year
async function loadMonths(year) {
    try {
        console.log('Loading months for year:', year);
        monthSelect.innerHTML = `<option value="" data-ar="اختر الشهر" data-en="Select Month">${currentLang === 'ar' ? 'اختر الشهر' : 'Select Month'}</option>`;
        monthSelect.disabled = true;

        if (!year) return;

        const response = await fetch(`/api/months/${AGENCY_ID}/${year}`);
        const data = await response.json();
        console.log('Months response:', data);

        if (data.success && data.months && data.months.length > 0) {
            data.months.forEach(month => {
                const option = document.createElement('option');
                option.value = month;
                option.textContent = month;
                monthSelect.appendChild(option);
            });
            monthSelect.disabled = false;
        } else {
            console.error('No months found or invalid response:', data);
            showToast(currentLang === 'ar' ? 'لا توجد شهور متاحة' : 'No months available', 'error');
        }
    } catch (error) {
        console.error('Error loading months:', error);
        showToast(currentLang === 'ar' ? 'حدث خطأ في تحميل الشهور' : 'Error loading months', 'error');
    }
}

// Event listener for year selection
yearSelect.addEventListener('change', (e) => {
    loadMonths(e.target.value);
});

// Update search function to include year and month
async function searchEmployee() {
    const employeeId = searchInput.value.trim();
    const year = yearSelect.value;
    const month = monthSelect.value;

    if (!employeeId || !year || !month) {
        showToast(currentLang === 'ar' ? 'يرجى إدخال جميع البيانات المطلوبة' : 'Please enter all required data', 'error');
        return;
    }

    try {
        searchButton.disabled = true;
        searchButton.innerHTML = '<div class="loading-spinner"></div>';

        const response = await fetch(`/api/search?employeeId=${employeeId}&agencyId=${AGENCY_ID}&year=${year}&month=${month}`);
        const data = await response.json();

        if (data.success) {
            resultCard.style.display = 'block';
            document.getElementById('employeeId').textContent = employeeId;
            document.getElementById('targetDate').textContent = data.targetDate || (currentLang === 'ar' ? 'غير متوفر' : 'Not available');
            document.getElementById('gemsCount').textContent = data.gemsCount || '0';
            document.getElementById('salary').textContent = data.salary || '0';
            document.getElementById('fileType').textContent = data.fileType;
            
            const labelElement = document.querySelector('.result-item .label');
            if (data.fileType === 'تارجت') {
                labelElement.innerHTML = `<i class="fas fa-calendar-alt"></i> ${currentLang === 'ar' ? 'مضيف تارجت:' : 'Target Host:'}`;
            } else {
                labelElement.innerHTML = `<i class="fas fa-calendar-alt"></i> ${currentLang === 'ar' ? 'المضيف لمدة ساعتين:' : 'Host for 2 hours:'}`;
            }
            
            addToHistory(employeeId, data.fileType);
            showToast(currentLang === 'ar' ? 'تم العثور على بيانات الموظف بنجاح' : 'Employee data found successfully');
        } else {
            showToast(data.message || (currentLang === 'ar' ? 'لم يتم العثور على بيانات الموظف' : 'Employee data not found'), 'error');
            resultCard.style.display = 'none';
        }
    } catch (error) {
        console.error('Search error:', error);
        showToast(currentLang === 'ar' ? 'حدث خطأ أثناء البحث' : 'An error occurred while searching', 'error');
        resultCard.style.display = 'none';
    } finally {
        searchButton.disabled = false;
        searchButton.innerHTML = `<i class="fas fa-search"></i> ${currentLang === 'ar' ? 'بحث' : 'Search'}`;
    }
}

// Copy data
function copyData() {
    const data = {
        employeeId: document.getElementById('employeeId').textContent,
        targetDate: document.getElementById('targetDate').textContent,
        gemsCount: document.getElementById('gemsCount').textContent,
        salary: document.getElementById('salary').textContent,
        fileType: document.getElementById('fileType').textContent
    };

    const labels = {
        employeeId: currentLang === 'ar' ? 'رقم الموظف' : 'Employee ID',
        date: currentLang === 'ar' ? 'التاريخ' : 'Date',
        gems: currentLang === 'ar' ? 'عدد الماسات' : 'Gems Count',
        salary: currentLang === 'ar' ? 'الراتب' : 'Salary',
        fileType: currentLang === 'ar' ? 'نوع الملف' : 'File Type'
    };

    const text = `${labels.employeeId}: ${data.employeeId}\n${labels.date}: ${data.targetDate}\n${labels.gems}: ${data.gemsCount}\n${labels.salary}: ${data.salary}\n${labels.fileType}: ${data.fileType}`;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast(currentLang === 'ar' ? 'تم نسخ البيانات بنجاح' : 'Data copied successfully');
    }).catch(() => {
        showToast(currentLang === 'ar' ? 'فشل نسخ البيانات' : 'Failed to copy data', 'error');
    });
}

// Event Listeners
searchButton.addEventListener('click', searchEmployee);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchEmployee();
});
copyButton.addEventListener('click', copyData);

// Language switch
document.getElementById('langSwitch').addEventListener('click', () => {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    updateLanguage();
});

// Calculator functionality
const calculatorButton = document.getElementById('calculatorButton');
const calculatorModal = document.getElementById('calculatorModal');
const closeCalculatorBtn = document.getElementById('closeCalculator');
const calculatorInputs = document.querySelector('.calculator-inputs');
const addEmployeeBtn = document.getElementById('addEmployeeBtn');
const resultValue = document.getElementById('resultValue');
const copyResultBtn = document.getElementById('copyResultBtn');
const typeButtons = document.querySelectorAll('.type-btn');
const exampleCalculations = document.querySelectorAll('.calculator-examples p');

let currentType = 'salary';
let employeeValues = [];

// Calculator DOM Elements
const calcYearSelect = document.getElementById('calcYearSelect');
const calcMonthSelect = document.getElementById('calcMonthSelect');

// Open calculator and load years
calculatorButton.addEventListener('click', async () => {
    try {
        calculatorModal.classList.add('active');
        // Reset calculator state
        resetCalculator();
        // Load years for the current agency
        await loadCalcYears();
        // Set initial type button
        typeButtons[0].click();
    } catch (error) {
        console.error('Error opening calculator:', error);
        showToast(currentLang === 'ar' ? 'حدث خطأ في فتح الحاسبة' : 'Error opening calculator', 'error');
    }
});

// Load years for calculator
async function loadCalcYears() {
    try {
        console.log('Loading calculator years for agency:', AGENCY_ID);
        const response = await fetch(`/api/years/${AGENCY_ID}`);
        const data = await response.json();

        if (data.success && data.years && data.years.length > 0) {
            calcYearSelect.innerHTML = `<option value="" data-ar="اختر السنة" data-en="Select Year">${currentLang === 'ar' ? 'اختر السنة' : 'Select Year'}</option>`;
            data.years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                calcYearSelect.appendChild(option);
            });
            // Enable year select
            calcYearSelect.disabled = false;
        } else {
            console.error('No years found or invalid response:', data);
            showToast(currentLang === 'ar' ? 'لا توجد سنوات متاحة' : 'No years available', 'error');
            calcYearSelect.disabled = true;
        }
    } catch (error) {
        console.error('Error loading calculator years:', error);
        showToast(currentLang === 'ar' ? 'حدث خطأ في تحميل السنوات' : 'Error loading years', 'error');
        calcYearSelect.disabled = true;
    }
}

// Load months for calculator
async function loadCalcMonths(year) {
    try {
        calcMonthSelect.innerHTML = `<option value="" data-ar="اختر الشهر" data-en="Select Month">${currentLang === 'ar' ? 'اختر الشهر' : 'Select Month'}</option>`;
        calcMonthSelect.disabled = true;

        if (!year) return;

        const response = await fetch(`/api/months/${AGENCY_ID}/${year}`);
        const data = await response.json();

        if (data.success && data.months.length > 0) {
            data.months.forEach(month => {
                const option = document.createElement('option');
                option.value = month;
                option.textContent = month;
                calcMonthSelect.appendChild(option);
            });
            calcMonthSelect.disabled = false;
        } else {
            showToast(currentLang === 'ar' ? 'لا توجد شهور متاحة' : 'No months available', 'error');
        }
    } catch (error) {
        console.error('Error loading calculator months:', error);
        showToast(currentLang === 'ar' ? 'حدث خطأ في تحميل الشهور' : 'Error loading months', 'error');
    }
}

// Event listener for calculator year selection
calcYearSelect.addEventListener('change', (e) => {
    loadCalcMonths(e.target.value);
});

// Close calculator modal
closeCalculatorBtn.addEventListener('click', () => {
    calculatorModal.classList.remove('active');
    resetCalculator();
});

// Close calculator when clicking outside
calculatorModal.addEventListener('click', (e) => {
    if (e.target === calculatorModal) {
        calculatorModal.classList.remove('active');
        resetCalculator();
    }
});

// Handle calculation type selection
typeButtons.forEach(button => {
    button.addEventListener('click', () => {
        typeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentType = button.getAttribute('data-type');
        // Recalculate when type changes
        const inputs = document.querySelectorAll('.employee-input');
        inputs.forEach(input => {
            if (input.value) {
                const event = new Event('input');
                input.dispatchEvent(event);
            }
        });
    });
});

// Add new employee input
addEmployeeBtn.addEventListener('click', () => {
    const year = calcYearSelect.value;
    const month = calcMonthSelect.value;

    if (!year || !month) {
        showToast(currentLang === 'ar' ? 'يرجى اختيار السنة والشهر أولاً' : 'Please select year and month first', 'error');
        return;
    }

    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    inputGroup.innerHTML = `
        <input type="text" class="employee-input" data-ar-placeholder="أدخل رقم الموظف" data-en-placeholder="Enter employee ID" placeholder="أدخل رقم الموظف" dir="ltr">
        <button class="remove-input">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    calculatorInputs.appendChild(inputGroup);
    setupInputListeners(inputGroup);
    updateRemoveButtons();
});

// Update remove buttons visibility
function updateRemoveButtons() {
    const removeButtons = document.querySelectorAll('.remove-input');
    removeButtons.forEach(btn => {
        btn.style.display = removeButtons.length > 1 ? 'flex' : 'none';
    });
}

// Calculate total
function calculateTotal() {
    const inputs = document.querySelectorAll('.employee-input');
    const type = document.querySelector('.type-btn.active').dataset.type;
    let total = 0;

    inputs.forEach(input => {
        const value = parseFloat(input.dataset.value || '0');
        if (!isNaN(value)) {
            total += value;
        }
    });

    resultValue.textContent = total.toFixed(2);
}

// Reset calculator
function resetCalculator() {
    calculatorInputs.innerHTML = `
        <div class="input-group">
            <input type="text" class="employee-input" data-ar-placeholder="أدخل رقم الموظف" data-en-placeholder="Enter employee ID" placeholder="أدخل رقم الموظف" dir="ltr">
            <button class="remove-input" style="display: none;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    resultValue.textContent = '0.00';
    calcYearSelect.value = '';
    calcMonthSelect.innerHTML = `<option value="" data-ar="اختر الشهر" data-en="Select Month">${currentLang === 'ar' ? 'اختر الشهر' : 'Select Month'}</option>`;
    calcMonthSelect.disabled = true;
    setupInputListeners(calculatorInputs.firstElementChild);
    updateRemoveButtons();
}

// Modify setupInputListeners to include year and month validation
function setupInputListeners(inputGroup) {
    const input = inputGroup.querySelector('.employee-input');
    const removeBtn = inputGroup.querySelector('.remove-input');

    input.addEventListener('input', async function() {
        const value = this.value.trim();
        if (value) {
            try {
                const year = calcYearSelect.value;
                const month = calcMonthSelect.value;

                if (!year || !month) {
                    showToast(currentLang === 'ar' ? 'يرجى اختيار السنة والشهر أولاً' : 'Please select year and month first', 'error');
                    this.value = '';
                    return;
                }

                const response = await fetch(`/api/search?employeeId=${value}&agencyId=${AGENCY_ID}&year=${year}&month=${month}`);
                const data = await response.json();
                
                if (data.success) {
                    const type = document.querySelector('.type-btn.active').dataset.type;
                    const displayValue = type === 'salary' ? data.salary : data.gemsCount;
                    this.value = `${value} (${displayValue})`;
                    this.dataset.value = displayValue;
                    calculateTotal(); // Recalculate total after successful fetch
                } else {
                    this.value = value;
                    this.dataset.value = '0';
                    showToast(currentLang === 'ar' ? `لم يتم العثور على بيانات للموظف ${value}` : `No data found for employee ${value}`, 'error');
                    calculateTotal(); // Recalculate total even if fetch fails
                }
            } catch (error) {
                console.error('Error fetching employee data:', error);
                this.value = value;
                this.dataset.value = '0';
                showToast(currentLang === 'ar' ? 'حدث خطأ أثناء البحث' : 'An error occurred while searching', 'error');
                calculateTotal(); // Recalculate total on error
            }
        } else {
            this.dataset.value = '0';
            calculateTotal(); // Recalculate total when input is cleared
        }
    });

    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            inputGroup.remove();
            updateRemoveButtons();
            calculateTotal(); // Recalculate total after removing input
        });
    }
}

// Handle example calculations
exampleCalculations.forEach(example => {
    example.addEventListener('click', async () => {
        const year = calcYearSelect.value;
        const month = calcMonthSelect.value;

        if (!year || !month) {
            showToast(currentLang === 'ar' ? 'يرجى اختيار السنة والشهر أولاً' : 'Please select year and month first', 'error');
            return;
        }

        const employeeIds = example.textContent.split(' + ');
        resetCalculator();
        
        for (const id of employeeIds) {
            const trimmedId = id.trim();
            if (trimmedId) {
                if (document.querySelectorAll('.input-group').length > 1) {
                    addEmployeeBtn.click();
                }
                const inputs = document.querySelectorAll('.employee-input');
                const lastInput = inputs[inputs.length - 1];
                lastInput.value = trimmedId;
                lastInput.dispatchEvent(new Event('input'));
            }
        }
    });
});

// Remove show results functionality
const showResultsBtn = document.getElementById('showResultsBtn');
if (showResultsBtn) {
    showResultsBtn.remove();
}

// History buttons functionality
const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const confirmationModal = document.getElementById('confirmationModal');
const closeConfirmationBtn = document.querySelector('.close-confirmation');
const confirmClearBtn = document.querySelector('.confirm-btn');
const cancelClearBtn = document.querySelector('.cancel-btn');

let isHistoryVisible = true;

toggleHistoryBtn.addEventListener('click', () => {
    isHistoryVisible = !isHistoryVisible;
    historyList.style.display = isHistoryVisible ? 'block' : 'none';
    toggleHistoryBtn.classList.toggle('hidden');
    
    // Update button text
    const buttonText = toggleHistoryBtn.querySelector('span');
    if (isHistoryVisible) {
        buttonText.setAttribute('data-ar', 'إخفاء السجل');
        buttonText.setAttribute('data-en', 'Hide History');
        buttonText.textContent = currentLang === 'ar' ? 'إخفاء السجل' : 'Hide History';
    } else {
        buttonText.setAttribute('data-ar', 'إظهار السجل');
        buttonText.setAttribute('data-en', 'Show History');
        buttonText.textContent = currentLang === 'ar' ? 'إظهار السجل' : 'Show History';
    }
});

// Show confirmation modal
clearHistoryBtn.addEventListener('click', () => {
    confirmationModal.classList.add('active');
});

// Close confirmation modal
closeConfirmationBtn.addEventListener('click', () => {
    confirmationModal.classList.remove('active');
});

// Cancel clearing history
cancelClearBtn.addEventListener('click', () => {
    confirmationModal.classList.remove('active');
});

// Confirm clearing history
confirmClearBtn.addEventListener('click', () => {
    localStorage.removeItem('searchHistory');
    historyList.innerHTML = '';
    confirmationModal.classList.remove('active');
    showToast(currentLang === 'ar' ? 'تم مسح سجل البحث' : 'Search history cleared', 'success');
});

// Close modal when clicking outside
confirmationModal.addEventListener('click', (e) => {
    if (e.target === confirmationModal) {
        confirmationModal.classList.remove('active');
    }
});

// Load years when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadYears(AGENCY_ID);
    updateSafemodeState();
    if (isSafemodeActive) {
        selectLatestYearAndMonth();
    }
});

// Initialize
updateLanguage();
updateHistoryDisplay();

// Copy calculator result
copyResultBtn.addEventListener('click', () => {
    const type = document.querySelector('.type-btn.active').dataset.type;
    const typeLabel = type === 'salary' ? 
        (currentLang === 'ar' ? 'مجموع الرواتب' : 'Total Salaries') : 
        (currentLang === 'ar' ? 'مجموع الماسات' : 'Total Gems');
    
    const text = `${typeLabel}: ${resultValue.textContent}`;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast(currentLang === 'ar' ? 'تم نسخ النتيجة بنجاح' : 'Result copied successfully');
        
        // Add visual feedback
        copyResultBtn.style.background = 'var(--primary-color)';
        copyResultBtn.style.color = 'var(--text-white)';
        setTimeout(() => {
            copyResultBtn.style.background = '';
            copyResultBtn.style.color = '';
        }, 200);
    }).catch(() => {
        showToast(currentLang === 'ar' ? 'فشل نسخ النتيجة' : 'Failed to copy result', 'error');
    });
});

// Branch Agency Functionality
const branchSelect = document.getElementById('branchSelect');
const branchData = document.getElementById('branchData');
const branchName = document.getElementById('branchName');
const branchDate = document.getElementById('branchDate');
const branchEmployeesList = document.getElementById('branchEmployeesList');
const searchBranchBtn = document.getElementById('searchBranchBtn');

// Load branch agencies
async function loadBranchAgencies() {
    try {
        const response = await fetch(`/api/branches/${AGENCY_ID}`);
        const data = await response.json();

        if (data.success && data.branches && data.branches.length > 0) {
            branchSelect.innerHTML = `<option value="" data-ar="-- اختر وكالة فرعية --" data-en="-- Select Branch Agency --">${currentLang === 'ar' ? '-- اختر وكالة فرعية --' : '-- Select Branch Agency --'}</option>`;
            
            data.branches.forEach(branch => {
                const option = document.createElement('option');
                option.value = branch;
                option.textContent = branch;
                branchSelect.appendChild(option);
            });
        } else {
            showToast(currentLang === 'ar' ? 'لا توجد وكالات فرعية متاحة' : 'No branch agencies available', 'error');
        }
    } catch (error) {
        console.error('Error loading branch agencies:', error);
        showToast(currentLang === 'ar' ? 'حدث خطأ في تحميل الوكالات الفرعية' : 'Error loading branch agencies', 'error');
    }
}

// Load branch data
async function loadBranchData(branchName) {
    try {
        const response = await fetch(`/api/branch-data/${AGENCY_ID}/${branchName}`);
        const data = await response.json();

        if (data.success) {
            branchData.style.display = 'block';
            document.getElementById('branchName').textContent = data.branchName;
            document.getElementById('branchDate').textContent = new Date(data.createdAt).toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US');
            
            // Show export button if there's data
            exportBranchData.style.display = data.data && data.data.length > 0 ? 'flex' : 'none';
            
            // Display employee IDs
            branchEmployeesList.innerHTML = '';
            if (data.data && data.data.length > 0) {
                data.data.forEach(employeeId => {
                    const card = document.createElement('div');
                    card.className = 'employee-card';
                    card.innerHTML = `
                        <i class="fas fa-user"></i>
                        <span>${employeeId}</span>
                    `;
                    card.onclick = () => {
                        searchInput.value = employeeId;
                        searchEmployee();
                    };
                    branchEmployeesList.appendChild(card);
                });
            } else {
                branchEmployeesList.innerHTML = `
                    <div class="no-data-message">
                        <i class="fas fa-info-circle"></i>
                        <span>${currentLang === 'ar' ? 'لا توجد معرفات مسجلة' : 'No IDs registered'}</span>
                    </div>
                `;
            }
        } else {
            showToast(data.message || (currentLang === 'ar' ? 'لم يتم العثور على بيانات الوكالة الفرعية' : 'Branch agency data not found'), 'error');
            branchData.style.display = 'none';
            exportBranchData.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading branch data:', error);
        showToast(currentLang === 'ar' ? 'حدث خطأ في تحميل بيانات الوكالة الفرعية' : 'Error loading branch agency data', 'error');
        branchData.style.display = 'none';
        exportBranchData.style.display = 'none';
    }
}

// Event Listeners
branchSelect.addEventListener('change', (e) => {
    const selectedBranch = e.target.value;
    if (selectedBranch) {
        loadBranchData(selectedBranch);
    } else {
        branchData.style.display = 'none';
    }
});

searchBranchBtn.addEventListener('click', () => {
    const selectedBranch = branchSelect.value;
    if (selectedBranch) {
        loadBranchData(selectedBranch);
    } else {
        showToast(currentLang === 'ar' ? 'يرجى اختيار وكالة فرعية أولاً' : 'Please select a branch agency first', 'error');
    }
});

// Load branch agencies when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadBranchAgencies();
    // ... existing code ...
});

// Branch Agency Toggle and Export
const toggleBranchSection = document.getElementById('toggleBranchSection');
const branchAgencyContent = document.getElementById('branchAgencyContent');
const exportBranchData = document.getElementById('exportBranchData');
let isBranchSectionVisible = true;

// Toggle branch section visibility
toggleBranchSection.addEventListener('click', () => {
    isBranchSectionVisible = !isBranchSectionVisible;
    branchAgencyContent.style.display = isBranchSectionVisible ? 'block' : 'none';
    toggleBranchSection.classList.toggle('hidden');
    
    // Update button text
    const buttonText = toggleBranchSection.querySelector('span');
    if (isBranchSectionVisible) {
        buttonText.setAttribute('data-ar', 'إخفاء');
        buttonText.setAttribute('data-en', 'Hide');
        buttonText.textContent = currentLang === 'ar' ? 'إخفاء' : 'Hide';
    } else {
        buttonText.setAttribute('data-ar', 'إظهار');
        buttonText.setAttribute('data-en', 'Show');
        buttonText.textContent = currentLang === 'ar' ? 'إظهار' : 'Show';
    }
});

// Export branch data to Excel
exportBranchData.addEventListener('click', async () => {
    try {
        const selectedBranch = branchSelect.value;
        if (!selectedBranch) {
            showToast(currentLang === 'ar' ? 'يرجى اختيار وكالة فرعية أولاً' : 'Please select a branch agency first', 'error');
            return;
        }

        // Show loading state
        exportBranchData.disabled = true;
        exportBranchData.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <span data-ar="جاري التصدير..." data-en="Exporting...">جاري التصدير...</span>
        `;

        // Get branch data
        const response = await fetch(`/api/branch-data/${AGENCY_ID}/${selectedBranch}`);
        const data = await response.json();
        console.log('Branch data:', data);

        if (data.success && data.data && data.data.length > 0) {
            // Create workbook
            const wb = XLSX.utils.book_new();
            
            // Create worksheet data with headers
            const wsData = [
                // Header row
                [
                    currentLang === 'ar' ? 'معرف الموظف' : 'Employee ID',
                    currentLang === 'ar' ? 'تاريخ الاستضافة' : 'Host Date',
                    currentLang === 'ar' ? 'عدد الماسات' : 'Gems Count',
                    currentLang === 'ar' ? 'الراتب' : 'Salary',
                    currentLang === 'ar' ? 'نوع الملف' : 'File Type'
                ]
            ];

            // Get current year and month
            const yearSelect = document.getElementById('yearSelect');
            const monthSelect = document.getElementById('monthSelect');
            const year = yearSelect.value;
            const month = monthSelect.value;

            console.log('Searching for year:', year, 'month:', month);

            // Process each employee ID
            for (const employeeId of data.data) {
                try {
                    console.log('Searching for employee:', employeeId);
                    
                    // Use the correct search endpoint
                    const searchResponse = await fetch(`/api/search?employeeId=${employeeId}&agencyId=${AGENCY_ID}&year=${year}&month=${month}`);
                    const searchData = await searchResponse.json();
                    console.log('Search result for', employeeId, ':', searchData);

                    if (searchData.success) {
                        // Add employee data to worksheet
                        wsData.push([
                            employeeId,
                            searchData.targetDate || '',
                            searchData.gemsCount || '0',
                            searchData.salary || '0',
                            searchData.fileType || ''
                        ]);
                    } else {
                        console.log('No data found for employee:', employeeId);
                        // Add row with just the ID if no data found
                        wsData.push([
                            employeeId,
                            'لا توجد بيانات',
                            '0',
                            '0',
                            'لا يوجد'
                        ]);
                    }
                } catch (error) {
                    console.error(`Error fetching data for employee ${employeeId}:`, error);
                    // Add row with error message
                    wsData.push([
                        employeeId,
                        'خطأ في جلب البيانات',
                        '0',
                        '0',
                        'خطأ'
                    ]);
                }
            }

            console.log('Final worksheet data:', wsData);

            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Set column widths
            const colWidths = [
                { wch: 15 }, // Employee ID
                { wch: 20 }, // Host Date
                { wch: 15 }, // Gems Count
                { wch: 15 }, // Salary
                { wch: 15 }  // File Type
            ];
            ws['!cols'] = colWidths;

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, data.branchName);

            // Generate Excel file
            const fileName = `${data.branchName}_${year}_${month}.xlsx`;
            XLSX.writeFile(wb, fileName);

            showToast(currentLang === 'ar' ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully');
        } else {
            console.log('No branch data found:', data);
            showToast(data.message || (currentLang === 'ar' ? 'لم يتم العثور على بيانات الوكالة الفرعية' : 'Branch agency data not found'), 'error');
        }
    } catch (error) {
        console.error('Error exporting branch data:', error);
        showToast(currentLang === 'ar' ? 'حدث خطأ في تصدير البيانات' : 'Error exporting data', 'error');
    } finally {
        // Reset button state
        exportBranchData.disabled = false;
        exportBranchData.innerHTML = `
            <i class="fas fa-file-excel"></i>
            <span data-ar="تصدير إلى Excel" data-en="Export to Excel">تصدير إلى Excel</span>
        `;
    }
}); 