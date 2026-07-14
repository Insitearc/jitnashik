// Script to dynamically load header and footer
document.addEventListener('DOMContentLoaded', function () {
    // Load header
    loadComponent('header', 'header.html');
    // Load footer
    loadComponent('footer', 'footer.html');
    // Load Enquiry Modal
    loadEnquiryModal();
    // Initialize Stat Counters
    initStatCounters();
});

function initStatCounters() {
    const counters = document.querySelectorAll('.stat-counter');
    const speed = 200; // The lower the slower

    const startCounting = (counter) => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText;
        const increment = target / speed;

        if (count < target) {
            counter.innerText = Math.ceil(count + increment);
            setTimeout(() => startCounting(counter), 10);
        } else {
            // Smart Suffixes based on data-target values
            if (target === 15 || target === 250 || target === 5000 || target === 14 || target === 500) {
                counter.innerText = target + '+';
            } else if (target === 92 || target === 100) {
                counter.innerText = target + '%';
            } else if (target === 12) {
                counter.innerText = target + ' LPA';
            } else {
                counter.innerText = target;
            }
        }
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startCounting(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

function loadComponent(id, filePath) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${filePath}`);
            }
            return response.text();
        })
        .then(html => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = html;
                // Execute any scripts in the loaded HTML
                const scripts = element.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    if (oldScript.src) {
                        newScript.src = oldScript.src;
                    } else {
                        newScript.textContent = oldScript.textContent;
                    }
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });

                // Highlight active nav link based on current page
                if (id === 'header') {
                    highlightActiveNav();
                    attachEnquiryListeners();
                }
            }
        })
        .catch(error => {
            console.error(`Error loading ${filePath}:`, error);
        });
}

function loadEnquiryModal() {
    fetch('enquiry-modal.html')
        .then(res => res.text())
        .then(html => {
            const div = document.createElement('div');
            div.innerHTML = html;
            document.body.appendChild(div);

            // Auto-trigger on index page
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            if (currentPage === 'index.html') {
                setTimeout(() => {
                    toggleEnquiryModal(true);
                }, 1500); // 1.5s delay for impact
            }

            // Attach Form Submission Handler
            const enquiryForm = document.getElementById('enquiryForm');
            if (enquiryForm) {
                enquiryForm.addEventListener('submit', function (e) {
                    e.preventDefault();
                    const submitBtn = document.getElementById('enquirySubmitBtn');
                    const originalText = submitBtn.innerText;

                    submitBtn.disabled = true;
                    submitBtn.innerText = 'Submitting...';

                    const formData = new FormData(this);
                    fetch('submit_form.php', {
                        method: 'POST',
                        body: formData
                    })
                        .then(res => res.json())
                        .then(data => {
                            if (data.status === 'success') {
                                submitBtn.innerText = 'Success!';
                                setTimeout(() => {
                                    toggleEnquiryModal(false);
                                    this.reset();
                                    submitBtn.disabled = false;
                                    submitBtn.innerText = originalText;
                                    alert('Thank you! Your enquiry has been received.');
                                }, 1000);
                            } else {
                                alert('Error: ' + data.message);
                                submitBtn.disabled = false;
                                submitBtn.innerText = originalText;
                            }
                        })
                        .catch(err => {
                            console.error('Submission error:', err);
                            alert('Something went wrong. Please try again.');
                            submitBtn.disabled = false;
                            submitBtn.innerText = originalText;
                        });
                });
            }
        });
}

function checkStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'success') {
        alert('Your application has been submitted successfully!');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('status') === 'error') {
        alert('There was an error submitting your application. Please try again.');
    }
}

// Run status check
checkStatus();

function toggleEnquiryModal(show) {
    const modal = document.getElementById('enquiryModal');
    const container = document.getElementById('modalContainer');
    if (!modal) return;

    if (show) {
        modal.classList.remove('invisible', 'opacity-0');
        container.classList.remove('scale-95');
        document.body.style.overflow = 'hidden';
    } else {
        modal.classList.add('invisible', 'opacity-0');
        container.classList.add('scale-95');
        document.body.style.overflow = '';
    }
}

function attachEnquiryListeners() {
    // Select all buttons that should trigger the enquiry modal
    const enquiryBtns = document.querySelectorAll('a[href="admissionform.html"]');
    enquiryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleEnquiryModal(true);
        });
    });
}

function highlightActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        // Remove active styles (reset to white text on maroon)
        link.classList.remove('bg-white', 'text-[#7a0000]', 'shadow-inner');
        link.classList.add('text-white');

        // Add active styles to matching link (White background, Maroon text)
        if (href === currentPage ||
            (currentPage.includes('academics') && href === 'academics2.html') ||
            (currentPage.includes('electrical') && href === 'electrical.html') ||
            (currentPage.includes('computer') && href === 'computerengg.html') ||
            (currentPage.includes('civil') && href === 'civil.html') ||
            (currentPage.includes('mechanical') && href === 'mechanical.html') ||
            (currentPage.includes('entc') && href === 'entcengg.html') ||
            (currentPage.includes('itengg') && href === 'itengg.html') ||
            (currentPage.includes('aids') && href === 'aids.html') ||
            (currentPage.includes('index') && href === 'index.html') ||
            (currentPage.includes('admission') && href === 'admission.html') ||
            (currentPage.includes('placement') && href === 'placement.html') ||
            (currentPage.includes('campus') && href === 'campuslife.html') ||
            (currentPage.includes('about') && href === 'about-jit.html') ||
            (currentPage.includes('commitee') && href === 'commitee.html')
        ) {
            link.classList.remove('text-white');
            link.classList.add('bg-white', 'text-[#7a0000]', 'shadow-inner');
        }
    });
}
