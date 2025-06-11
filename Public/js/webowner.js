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
        if (!data.success || data.userType !== 'webowner') {
            window.location.href = '/index.html';
            return;
        }

        // Update user info if element exists
        const userEmailElement = document.querySelector('.user-info span');
        if (userEmailElement) {
            userEmailElement.textContent = data.userEmail;
        }

        // Initialize animations
        initializeAnimations();
        
        // Initialize scroll effects
        initializeScrollEffects();
        
        // Add click animations to buttons
        initializeButtonAnimations();
    } catch (error) {
        console.error('Authentication error:', error);
        window.location.href = '/index.html';
    }
});

// Initialize animations
function initializeAnimations() {
    // Add visible class to elements with animation classes
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve after animation is triggered
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(element => {
        observer.observe(element);
    });

    // Add visible class to dashboard cards with delay
    const cards = document.querySelectorAll('.dashboard-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('visible');
        }, 100 * index);
    });
}

// Initialize scroll effects
function initializeScrollEffects() {
    const nav = document.querySelector('nav');
    const scrollToTopBtn = document.querySelector('.scroll-to-top');
    let lastScrollY = window.scrollY;

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        // Show/hide scroll to top button
        if (window.scrollY > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }

        // Parallax effect for hero section
        const hero = document.querySelector('.hero');
        if (hero) {
            const scrolled = window.scrollY;
            hero.style.backgroundPositionY = `${scrolled * 0.5}px`;
        }

        lastScrollY = window.scrollY;
    });

    // Scroll to top button click handler
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Initialize button animations
function initializeButtonAnimations() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        // Click animation
        button.addEventListener('click', function(e) {
            if (!this.classList.contains('disabled')) {
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 100);
            }
        });

        // Hover animation for icon
        const icon = button.querySelector('i');
        if (icon) {
            button.addEventListener('mouseenter', () => {
                icon.style.transform = 'translateX(5px)';
            });
            
            button.addEventListener('mouseleave', () => {
                icon.style.transform = '';
            });
        }
    });
}

// Add smooth scroll for anchor links
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