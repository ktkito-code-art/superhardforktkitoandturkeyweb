// Add smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Language switcher functionality
const langSwitch = document.getElementById('langSwitch');
const html = document.documentElement;
let currentLang = 'ar';

langSwitch.addEventListener('click', () => {
    if (currentLang === 'ar') {
        html.setAttribute('lang', 'en');
        html.setAttribute('dir', 'ltr');
        currentLang = 'en';
        // Update text content for English
        document.querySelector('.nav-brand span').textContent = 'Code Art';
        document.querySelector('nav ul li:nth-child(1) a').textContent = 'Home';
        document.querySelector('nav ul li:nth-child(2) a').textContent = 'About Us';
        document.querySelector('nav ul li:nth-child(3) a').textContent = 'Contact';
        document.querySelector('.store-text').textContent = 'Data';
        document.querySelector('.store-menu-item:nth-child(1) span').textContent = 'Query Data';
        document.querySelector('.store-menu-item:nth-child(2) span').textContent = 'Analyze Data';
        document.querySelector('.store-menu-item:nth-child(3) span').textContent = 'Export Reports';
        document.querySelector('h1').textContent = 'Welcome Back';
        document.querySelector('input[type="email"]').placeholder = 'Email';
        document.querySelector('input[type="password"]').placeholder = 'Password';
        document.querySelector('.login-btn span').textContent = 'Login';
        document.querySelector('#about h2').textContent = 'About Us';
        document.querySelector('#about .about-text p:first-child').textContent = 'We are a company founded in 2022 in a simple and manual way, and now we are ready to receive many agencies.';
        document.querySelector('#about .about-text p:last-child').textContent = 'Our goal is to organize and make your agency\'s system more stable.';
        document.querySelector('#contact h2').textContent = 'Contact Us';
        document.querySelector('.contact-item.whatsapp span').textContent = 'WhatsApp';
        document.querySelector('.contact-item.discord span').textContent = 'Discord';
    } else {
        html.setAttribute('lang', 'ar');
        html.setAttribute('dir', 'rtl');
        currentLang = 'ar';
        // Update text content for Arabic
        document.querySelector('.nav-brand span').textContent = 'Code Art';
        document.querySelector('nav ul li:nth-child(1) a').textContent = 'الرئيسية';
        document.querySelector('nav ul li:nth-child(2) a').textContent = 'من نحن';
        document.querySelector('nav ul li:nth-child(3) a').textContent = 'تواصل معنا';
        document.querySelector('.store-text').textContent = 'البيانات';
        document.querySelector('.store-menu-item:nth-child(1) span').textContent = 'استعلام عن بيانات';
        document.querySelector('.store-menu-item:nth-child(2) span').textContent = 'تحليل البيانات';
        document.querySelector('.store-menu-item:nth-child(3) span').textContent = 'تصدير التقارير';
        document.querySelector('h1').textContent = 'مرحباً بعودتك';
        document.querySelector('input[type="email"]').placeholder = 'البريد الإلكتروني';
        document.querySelector('input[type="password"]').placeholder = 'كلمة المرور';
        document.querySelector('.login-btn span').textContent = 'تسجيل الدخول';
        document.querySelector('#about h2').textContent = 'من نحن';
        document.querySelector('#about .about-text p:first-child').textContent = 'نحن شركة تأسست عام 2022 بشكل بسيط ويدوي، والآن نحن جاهزون لاستقبال العديد من الوكالات.';
        document.querySelector('#about .about-text p:last-child').textContent = 'هدفنا هو التنظيم وجعل النظام الخاص بوكالتك أكثر استقراراً.';
        document.querySelector('#contact h2').textContent = 'تواصل معنا';
        document.querySelector('.contact-item.whatsapp span').textContent = 'واتساب';
        document.querySelector('.contact-item.discord span').textContent = 'ديسكورد';
    }
});

// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const mobileOverlay = document.querySelector('.mobile-overlay');
const body = document.body;

function toggleMobileMenu() {
    mobileMenuToggle.classList.toggle('active');
    mobileNav.classList.toggle('active');
    mobileOverlay.classList.toggle('active');
    body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
}

mobileMenuToggle.addEventListener('click', toggleMobileMenu);
mobileOverlay.addEventListener('click', toggleMobileMenu);

// Close mobile menu when clicking a link
document.querySelectorAll('.mobile-nav a').forEach(link => {
    link.addEventListener('click', () => {
        if (mobileNav.classList.contains('active')) {
            toggleMobileMenu();
        }
    });
});

// Handle RTL/LTR menu animations
function updateMenuDirection() {
    const isRTL = document.documentElement.dir === 'rtl';
    const menuItems = document.querySelectorAll('.mobile-nav ul li');
    
    menuItems.forEach(item => {
        item.style.transform = isRTL ? 'translateX(-20px)' : 'translateX(20px)';
    });
}

// Update menu direction on language change
document.getElementById('langSwitch').addEventListener('click', () => {
    setTimeout(updateMenuDirection, 100); // Wait for dir attribute to update
});

// Initial menu direction setup
updateMenuDirection();

// Navbar scroll effect
const nav = document.querySelector('nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// Add hover effect to nav links
const navLinks = document.querySelectorAll('nav ul li a');
navLinks.forEach(link => {
    link.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    
    link.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Add input focus animation
const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});

// Login form handling
const loginForm = document.querySelector('.login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.querySelector('input[type="email"]').value;
        const password = document.querySelector('input[type="password"]').value;
        const loginBtn = document.querySelector('.login-btn');
        const originalBtnText = loginBtn.innerHTML;

        try {
            // Show loading state
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';
            loginBtn.disabled = true;

            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Show success message
                loginBtn.innerHTML = '<i class="fas fa-check"></i> تم تسجيل الدخول';
                loginBtn.style.background = '#25D366';
                
                // Store user info in session storage
                sessionStorage.setItem('userEmail', email);
                sessionStorage.setItem('userRole', data.role);
                if (data.AGENCY_ID) {
                    sessionStorage.setItem('AGENCY_ID', data.AGENCY_ID);
                }
                
                // Redirect based on role
                setTimeout(() => {
                    switch (data.role) {
                        case 'webowner':
                            window.location.href = '/webowner.html';
                            break;
                        case 'owner':
                            window.location.href = '/dashboard.html';
                            break;
                        case 'admin':
                            window.location.href = '/query.html';
                            break;
                        default:
                            window.location.href = '/dashboard.html';
                    }
                }, 1000);
            } else {
                // Show error message
                loginBtn.innerHTML = '<i class="fas fa-times"></i> بيانات غير صحيحة';
                loginBtn.style.background = '#EA4335';
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    loginBtn.innerHTML = originalBtnText;
                    loginBtn.style.background = '';
                    loginBtn.disabled = false;
                }, 2000);
            }
        } catch (error) {
            console.error('Login error:', error);
            // Show error message
            loginBtn.innerHTML = '<i class="fas fa-times"></i> خطأ في الاتصال';
            loginBtn.style.background = '#EA4335';
            
            // Reset button after 2 seconds
            setTimeout(() => {
                loginBtn.innerHTML = originalBtnText;
                loginBtn.style.background = '';
                loginBtn.disabled = false;
            }, 2000);
        }
    });
}

// Dashboard page initialization
const userEmail = document.getElementById('userEmail');
if (userEmail) {
    const storedEmail = sessionStorage.getItem('userEmail');
    if (storedEmail) {
        userEmail.textContent = storedEmail;
    } else {
        // Redirect to login if not authenticated
        window.location.href = '/index.html';
    }
}

// Scroll Progress Bar
const scrollProgress = document.createElement('div');
scrollProgress.className = 'scroll-progress';
document.body.appendChild(scrollProgress);

window.addEventListener('scroll', () => {
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = (window.scrollY / windowHeight) * 100;
    scrollProgress.style.width = `${progress}%`;
});

// Scroll to Top Button
const scrollToTopBtn = document.createElement('div');
scrollToTopBtn.className = 'scroll-to-top';
scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
document.body.appendChild(scrollToTopBtn);

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollToTopBtn.classList.add('visible');
    } else {
        scrollToTopBtn.classList.remove('visible');
    }
});

scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Scroll Animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Add animation classes to elements
document.querySelectorAll('.about-content, .about-text p, .stat-item, .contact-item').forEach(element => {
    element.classList.add('fade-in');
    observer.observe(element);
});

// Add slide animations to sections
document.querySelectorAll('.about-section, .contact-section').forEach(section => {
    section.classList.add('slide-in-left');
    observer.observe(section);
});

// Add scale animation to login box
const loginBox = document.querySelector('.login-box');
if (loginBox) {
    loginBox.classList.add('scale-in');
    observer.observe(loginBox);
}

// Add fade-in animation to nav items
document.querySelectorAll('nav ul li a').forEach(link => {
    link.classList.add('fade-in');
    observer.observe(link);
});

// Add slide-in-right animation to store menu items
document.querySelectorAll('.store-menu-item').forEach(item => {
    item.classList.add('slide-in-right');
    observer.observe(item);
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Initialize animations on page load
document.addEventListener('DOMContentLoaded', () => {
    // Add initial animation classes
    document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in').forEach(element => {
        observer.observe(element);
    });
}); 