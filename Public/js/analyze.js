document.addEventListener('DOMContentLoaded', () => {
    const userEmail = sessionStorage.getItem('userEmail');
    const userType = sessionStorage.getItem('userType');
    const agencyId = sessionStorage.getItem('AGENCY_ID');
    
    if (userEmail) {
        document.getElementById('userEmail').textContent = userEmail;
    }

    // Load years for both modals
    loadYears();
});

// Load available years
async function loadYears() {
    try {
        const agencyId = sessionStorage.getItem('AGENCY_ID');
        const response = await fetch(`/api/years/${agencyId}`);
        const data = await response.json();

        if (data.success) {
            const yearsContainer = document.getElementById('yearsContainer');
            const topYearsContainer = document.getElementById('topYearsContainer');
            yearsContainer.innerHTML = '';
            topYearsContainer.innerHTML = '';

            data.years.forEach(year => {
                yearsContainer.innerHTML += `
                    <div>
                        <input type="radio" id="year_${year}" name="year" value="${year}" class="month-checkbox" onchange="loadMonths()">
                        <label for="year_${year}" class="month-label">${year}</label>
                    </div>
                `;
                
                topYearsContainer.innerHTML += `
                    <div>
                        <input type="radio" id="top_year_${year}" name="top_year" value="${year}" class="month-checkbox" onchange="loadTopMonths()">
                        <label for="top_year_${year}" class="month-label">${year}</label>
                    </div>
                `;
            });
        } else {
            showToast(data.message || 'حدث خطأ في تحميل السنوات', 'error');
        }
    } catch (error) {
        console.error('Error loading years:', error);
        showToast('حدث خطأ في تحميل السنوات', 'error');
    }
}

// Load months for analysis modal
async function loadMonths() {
    const yearInput = document.querySelector('input[name="year"]:checked');
    if (!yearInput) return;
    const year = yearInput.value;

    try {
        const agencyId = sessionStorage.getItem('AGENCY_ID');
        const response = await fetch(`/api/months/${agencyId}/${year}`);
        const data = await response.json();

        if (data.success) {
            const monthsContainer = document.getElementById('monthsContainer');
            monthsContainer.innerHTML = '';

            data.months.forEach(month => {
                monthsContainer.innerHTML += `
                    <div>
                        <input type="checkbox" id="month_${month}" value="${month}" class="month-checkbox">
                        <label for="month_${month}" class="month-label">${month}</label>
                    </div>
                `;
            });

            // تحديث حد الأشهر إلى 12
            const checkboxes = monthsContainer.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    const checked = monthsContainer.querySelectorAll('input[type="checkbox"]:checked');
                    if (checked.length > 12) {
                        checkbox.checked = false;
                        showToast('يمكنك اختيار 12 شهر كحد أقصى', 'error');
                    }
                });
            });
        } else {
            showToast(data.message || 'حدث خطأ في تحميل الأشهر', 'error');
        }
    } catch (error) {
        console.error('Error loading months:', error);
        showToast('حدث خطأ في تحميل الأشهر', 'error');
    }
}

// Load months for top performers modal
async function loadTopMonths() {
    const yearInput = document.querySelector('input[name="top_year"]:checked');
    if (!yearInput) return;
    const year = yearInput.value;

    try {
        const agencyId = sessionStorage.getItem('AGENCY_ID');
        const response = await fetch(`/api/months/${agencyId}/${year}`);
        const data = await response.json();

        if (data.success) {
            const monthsContainer = document.getElementById('topMonthsContainer');
            monthsContainer.innerHTML = '';

            data.months.forEach(month => {
                monthsContainer.innerHTML += `
                    <div>
                        <input type="checkbox" id="top_month_${month}" value="${month}" class="month-checkbox">
                        <label for="top_month_${month}" class="month-label">${month}</label>
                    </div>
                `;
            });

            // Add event listeners to enforce 2-6 months selection
            const checkboxes = monthsContainer.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    const checked = monthsContainer.querySelectorAll('input[type="checkbox"]:checked');
                    if (checked.length > 6) {
                        checkbox.checked = false;
                        showToast('يمكنك اختيار 6 أشهر كحد أقصى', 'error');
                    }
                });
            });
        } else {
            showToast(data.message || 'حدث خطأ في تحميل الأشهر', 'error');
        }
    } catch (error) {
        console.error('Error loading months:', error);
        showToast('حدث خطأ في تحميل الأشهر', 'error');
    }
}

// Update UI with monthly details
function updateMonthlyDetails(monthlyData) {
    const monthlyDetailsGrid = document.getElementById('monthlyDetailsGrid');
    monthlyDetailsGrid.innerHTML = '';

    Object.entries(monthlyData).forEach(([month, data]) => {
        const monthCard = document.createElement('div');
        monthCard.className = 'monthly-card';
        monthCard.innerHTML = `
            <h3>${month}</h3>
            <div class="monthly-stats">
                <div class="monthly-stat">
                    <div>
                        <i class="fas fa-gem"></i>
                        <span>الجواهر</span>
                    </div>
                    <span>${data.gems.toLocaleString()}</span>
                </div>
                <div class="monthly-stat">
                    <div>
                        <i class="fas fa-money-bill-wave"></i>
                        <span>الرواتب</span>
                    </div>
                    <span>${data.salaries.toLocaleString()}</span>
                </div>
                <div class="monthly-stat">
                    <div>
                        <i class="fas fa-users"></i>
                        <span>المضيفين</span>
                    </div>
                    <span>${data.hosts.toLocaleString()}</span>
                </div>
            </div>
        `;
        monthlyDetailsGrid.appendChild(monthCard);
    });
}

// Analyze data for selected months
async function performAnalysis() {
    try {
        console.log('Starting analysis...');
        const yearInput = document.querySelector('input[name="year"]:checked');
        if (!yearInput) {
            showToast('يرجى اختيار السنة', 'error');
            return;
        }
        const year = yearInput.value;
        console.log('Selected year:', year);
        
        const selectedMonths = Array.from(document.querySelectorAll('#monthsContainer input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);
        console.log('Selected months:', selectedMonths);

        if (selectedMonths.length < 2) {
            showToast('يرجى اختيار شهرين على الأقل', 'error');
            return;
        }

        if (selectedMonths.length > 12) {
            showToast('يمكنك اختيار 12 شهر كحد أقصى', 'error');
            return;
        }

        const agencyId = sessionStorage.getItem('AGENCY_ID');
        console.log('Agency ID:', agencyId);
        
        if (!agencyId) {
            showToast('خطأ: لم يتم العثور على معرف الوكالة', 'error');
            return;
        }

        // Show loading state
        document.getElementById('analysisResults').style.display = 'none';
        showToast('جاري تحليل البيانات...', 'info');

        let totalGems = 0;
        let totalSalaries = 0;
        let totalHosts = 0;
        const monthlyData = {};

        // Process each month
        for (const month of selectedMonths) {
            console.log(`Processing month: ${month}`);
            const files = ['salaries.xlsx', 'salaries_target.xlsx'];
            let monthGems = 0;
            let monthSalaries = 0;
            let monthHosts = new Set();

            for (const file of files) {
                try {
                    console.log(`Fetching data for file: ${file}`);
                    const response = await fetch(`/api/file-data/${agencyId}/${year}/${month}/${file}`);
                    console.log('Response status:', response.status);
                    const data = await response.json();
                    console.log('Response data:', data);

                    if (!data.success) {
                        console.log(`File ${file} not found or error:`, data.message);
                        continue;
                    }

                    if (!data.rows || !Array.isArray(data.rows)) {
                        console.log(`Invalid data format for ${file}:`, data);
                        continue;
                    }

                    data.rows.forEach(row => {
                        const gems = parseInt(row['عدد الماسات المجمعة'] || 0);
                        const salary = parseInt(row['الراتب'] || 0);
                        console.log(`Processing row - Gems: ${gems}, Salary: ${salary}`);
                        
                        monthGems += gems;
                        monthSalaries += salary;
                        if (row.ID) monthHosts.add(row.ID);
                    });
                } catch (error) {
                    console.error(`Error processing ${file} for ${month}:`, error);
                    showToast(`خطأ في معالجة ملف ${file} للشهر ${month}`, 'error');
                }
            }

            console.log(`Month ${month} totals - Gems: ${monthGems}, Salaries: ${monthSalaries}, Hosts: ${monthHosts.size}`);
            totalGems += monthGems;
            totalSalaries += monthSalaries;
            totalHosts = Math.max(totalHosts, monthHosts.size);

            monthlyData[month] = {
                gems: monthGems,
                salaries: monthSalaries,
                hosts: monthHosts.size
            };
        }

        console.log('Final totals:', { totalGems, totalSalaries, totalHosts });
        
        // Check if we have data to display
        if (Object.keys(monthlyData).length === 0) {
            showToast('لم يتم العثور على بيانات للتحليل', 'error');
            return;
        }

        // Update UI with results
        document.getElementById('totalGems').textContent = totalGems.toLocaleString();
        document.getElementById('totalSalaries').textContent = totalSalaries.toLocaleString();
        document.getElementById('totalHosts').textContent = totalHosts.toLocaleString();

        // Update monthly details
        updateMonthlyDetails(monthlyData);

        // Make sure the canvas exists
        const canvas = document.getElementById('analysisChart');
        if (!canvas) {
            console.error('Chart canvas not found');
            showToast('خطأ في تحميل الرسم البياني', 'error');
            return;
        }

        // Update chart
        console.log('Updating chart with data:', monthlyData);
        try {
            updateChart(monthlyData);
        } catch (chartError) {
            console.error('Error updating chart:', chartError);
            showToast('خطأ في تحديث الرسم البياني', 'error');
            return;
        }

        // Show results section
        document.getElementById('analysisResults').style.display = 'block';
        document.querySelector('#analysisResults .selected-period').textContent = 
            `${year} - ${selectedMonths.join(', ')}`;

        // Close modal
        closeAnalysisModal();
        
        showToast('تم تحليل البيانات بنجاح', 'success');
        console.log('Analysis completed successfully');
    } catch (error) {
        console.error('Error in performAnalysis:', error);
        showToast(`خطأ في التحليل: ${error.message}`, 'error');
    }
}

// Find top performers
async function findTopPerformers() {
    const yearInput = document.querySelector('input[name="top_year"]:checked');
    if (!yearInput) {
        showToast('يرجى اختيار السنة', 'error');
        return;
    }
    const year = yearInput.value;
    
    const selectedMonths = Array.from(document.querySelectorAll('#topMonthsContainer input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);

    if (selectedMonths.length < 2) {
        showToast('يرجى اختيار شهرين على الأقل', 'error');
        return;
    }

    if (selectedMonths.length > 6) {
        showToast('يمكنك اختيار 6 أشهر كحد أقصى', 'error');
        return;
    }

    try {
        const agencyId = sessionStorage.getItem('AGENCY_ID');
        const performersData = {};

        // Process each month
        for (const month of selectedMonths) {
            const files = ['salaries.xlsx', 'salaries_target.xlsx'];

            for (const file of files) {
                try {
                    const response = await fetch(`/api/file-data/${agencyId}/${year}/${month}/${file}`);
                    const data = await response.json();

                    if (data.success) {
                        data.rows.forEach(row => {
                            const id = row.ID;
                            if (!id) return;

                            if (!performersData[id]) {
                                performersData[id] = {
                                    name: row['مضيف لمدة ساعتين'] || row['مضيف التارجت'] ||'غير معروف',
                                    gems: 0,
                                    salary: 0
                                };
                            }

                            performersData[id].gems += parseInt(row['عدد الماسات المجمعة'] || 0);
                            performersData[id].salary += parseInt(row['الراتب'] || 0);
                        });
                    }
                } catch (error) {
                    console.error(`Error processing ${file} for ${month}:`, error);
                }
            }
        }

        // Sort performers by gems and salary
        const sortedByGems = Object.entries(performersData)
            .sort((a, b) => b[1].gems - a[1].gems)
            .slice(0, 3);

        const sortedBySalary = Object.entries(performersData)
            .sort((a, b) => b[1].salary - a[1].salary)
            .slice(0, 3);

        // Update UI
        updateTopPerformersUI(sortedByGems, sortedBySalary);

        // Show results section
        document.getElementById('topPerformersResults').style.display = 'block';
        document.querySelector('#topPerformersResults .selected-period').textContent = 
            `${year} - ${selectedMonths.join(', ')}`;

        // Close modal
        closeTopPerformersModal();
    } catch (error) {
        console.error('Error finding top performers:', error);
        showToast('حدث خطأ في البحث عن أفضل المضيفين', 'error');
    }
}

// Update chart with monthly data
function updateChart(monthlyData) {
    const ctx = document.getElementById('analysisChart').getContext('2d');
    const months = Object.keys(monthlyData);
    
    if (window.analysisChart && typeof window.analysisChart.destroy === 'function') {
        window.analysisChart.destroy();
    }

    // تحسين ألوان وتنسيق الرسم البياني
    window.analysisChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'الجواهر',
                    data: months.map(month => monthlyData[month].gems),
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    borderRadius: 5,
                    barThickness: 20,
                    maxBarThickness: 30
                },
                {
                    label: 'الرواتب',
                    data: months.map(month => monthlyData[month].salaries),
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    borderRadius: 5,
                    barThickness: 20,
                    maxBarThickness: 30
                },
                {
                    label: 'المضيفين',
                    data: months.map(month => monthlyData[month].hosts),
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    borderRadius: 5,
                    barThickness: 20,
                    maxBarThickness: 30
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: true
                    },
                    ticks: {
                        color: '#e0e0e0',
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: true
                    },
                    ticks: {
                        color: '#e0e0e0',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#e0e0e0',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toLocaleString();
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Update top performers UI
function updateTopPerformersUI(topGems, topSalary) {
    const gemsContainer = document.getElementById('topGemsPerformers');
    const salaryContainer = document.getElementById('topSalaryPerformers');

    gemsContainer.innerHTML = '';
    salaryContainer.innerHTML = '';

    topGems.forEach((performer, index) => {
        gemsContainer.innerHTML += `
            <div class="performer-card">
                <div class="performer-info">
                    <span class="performer-name">${performer[1].name}</span>
                    <span class="performer-value">${performer[1].gems.toLocaleString()} جوهرة</span>
                </div>
                <div class="performer-rank">المركز ${index + 1}</div>
            </div>
        `;
    });

    topSalary.forEach((performer, index) => {
        salaryContainer.innerHTML += `
            <div class="performer-card">
                <div class="performer-info">
                    <span class="performer-name">${performer[1].name}</span>
                    <span class="performer-value">${performer[1].salary.toLocaleString()} دولار</span>
                </div>
                <div class="performer-rank">المركز ${index + 1}</div>
            </div>
        `;
    });
}

// Modal functions
function openAnalysisModal() {
    document.getElementById('analysisModal').style.display = 'block';
}

function closeAnalysisModal() {
    document.getElementById('analysisModal').style.display = 'none';
}

function openTopPerformersModal() {
    document.getElementById('topPerformersModal').style.display = 'block';
}

function closeTopPerformersModal() {
    document.getElementById('topPerformersModal').style.display = 'none';
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
} 