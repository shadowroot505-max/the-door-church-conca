import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navList = document.querySelector('.nav-list');
    
    if (menuBtn && navList) {
        menuBtn.addEventListener('click', () => {
            navList.classList.toggle('active');
            const icon = menuBtn.querySelector('i');
            if(navList.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });

        // Close mobile menu when a link is clicked
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navList.classList.remove('active');
                const icon = menuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

    // Header scroll background
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Active Link Highlight on Scroll
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (sections.length > 0 && navLinks.length > 0) {
        window.addEventListener('scroll', () => {
            let current = '';
            const scrollY = window.pageYOffset;
            
            sections.forEach(section => {
                const sectionHeight = section.offsetHeight;
                const sectionTop = section.offsetTop - 100; // Account for fixed header
                
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add animation classes to elements
    const elementsToAnimate = [
        ...document.querySelectorAll('.service-card'),
        ...document.querySelectorAll('.about-grid > div'),
        ...document.querySelectorAll('.team-member'),
        ...document.querySelectorAll('.sermon-card'),
        ...document.querySelectorAll('.event-card'),
        ...document.querySelectorAll('.contact-form-container'),
        ...document.querySelectorAll('.contact-info-container')
    ];

    if (elementsToAnimate.length > 0) {
        elementsToAnimate.forEach(el => {
            el.classList.add('animate-on-scroll');
            observer.observe(el);
        });
    }

    // Contact Form Submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
            btn.disabled = true;

            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value,
                timestamp: new Date().toISOString()
            };
            
            try {
                // The db instance from initializeFirebase should be used, 
                // but since it's local there, we can get it again.
                const db = getFirestore();
                await addDoc(collection(db, 'messages'), formData);

                btn.innerHTML = '<i class="fa-solid fa-check"></i> Message Sent!';
                btn.classList.add('btn-secondary');
                btn.classList.remove('btn-primary');
                contactForm.reset();
                
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.remove('btn-secondary');
                    btn.classList.add('btn-primary');
                    btn.disabled = false;
                }, 3000);
            } catch (err) {
                console.error("Error sending message:", err);
                btn.innerHTML = 'Error! Try again';
                btn.disabled = false;
                setTimeout(() => {
                    btn.innerHTML = originalText;
                }, 3000);
            }
        });
    }

    // --- Load Site Settings ---
    async function loadSiteSettings(db) {
        try {
            const settingsDoc = await getDoc(doc(db, 'siteSettings', 'general'));
            if (settingsDoc.exists()) {
                const data = settingsDoc.data();

                // Update website name everywhere
                if (data.siteName) {
                    document.title = data.siteName;
                    const logoLink = document.querySelector('.logo');
                    if (logoLink) {
                        const logoImg = logoLink.querySelector('.logo-img');
                        logoLink.textContent = '';
                        if (logoImg) logoLink.prepend(logoImg);
                        logoLink.append(' ' + data.siteName);
                    }
                    const footerBrandH2 = document.querySelector('.footer-brand h2');
                    if (footerBrandH2) footerBrandH2.textContent = data.siteName;
                    const footerBottom = document.querySelector('.footer-bottom p');
                    if (footerBottom) footerBottom.textContent = `© 2026 ${data.siteName}. All rights reserved.`;
                }

                // Update hero
                if (data.heroTitle) {
                    const heroTitle = document.querySelector('.hero-title');
                    if (heroTitle) heroTitle.textContent = data.heroTitle;
                }
                if (data.heroSubtitle) {
                    const heroSubtitle = document.querySelector('.hero-subtitle');
                    if (heroSubtitle) heroSubtitle.textContent = data.heroSubtitle;
                }

                // Update about section
                if (data.aboutText) {
                    const aboutContent = document.querySelector('.about-content');
                    if (aboutContent) {
                        const aboutParagraph = aboutContent.querySelector('p');
                        if (aboutParagraph) aboutParagraph.textContent = data.aboutText;
                    }
                }

                // Update Leadership
                const l1Img = document.getElementById('leader1Img');
                const l1Name = document.getElementById('leader1Name');
                const l1Role = document.getElementById('leader1Role');
                if (data.leader1ImgUrl && l1Img) l1Img.src = data.leader1ImgUrl;
                if (data.leader1Name && l1Name) l1Name.textContent = data.leader1Name;
                if (data.leader1Role && l1Role) l1Role.textContent = data.leader1Role;

                const l2Img = document.getElementById('leader2Img');
                const l2Name = document.getElementById('leader2Name');
                const l2Role = document.getElementById('leader2Role');
                if (data.leader2ImgUrl && l2Img) l2Img.src = data.leader2ImgUrl;
                if (data.leader2Name && l2Name) l2Name.textContent = data.leader2Name;
                if (data.leader2Role && l2Role) l2Role.textContent = data.leader2Role;

                const l3Img = document.getElementById('leader3Img');
                const l3Name = document.getElementById('leader3Name');
                const l3Role = document.getElementById('leader3Role');
                if (data.leader3ImgUrl && l3Img) l3Img.src = data.leader3ImgUrl;
                if (data.leader3Name && l3Name) l3Name.textContent = data.leader3Name;
                if (data.leader3Role && l3Role) l3Role.textContent = data.leader3Role;

                // Update Contact
                const cLoc = document.getElementById('contactLocation');
                const cPhone = document.getElementById('contactPhone');
                const cEmail = document.getElementById('contactEmail');
                const cMap = document.getElementById('contactMap');

                if (data.contactLocation && cLoc) cLoc.innerHTML = data.contactLocation;
                if (data.contactPhone && cPhone) cPhone.textContent = data.contactPhone;
                if (data.contactEmail && cEmail) cEmail.textContent = data.contactEmail;
                if (data.contactMapUrl && cMap) cMap.src = data.contactMapUrl;
            }
        } catch (err) {
            console.error('Error loading site settings:', err);
        }
    }

    // --- Dynamic Data Fetching ---
    async function loadDynamicContent(db) {
        try {
            const eventsSnapshot = await getDocs(collection(db, 'events'));
            const events = eventsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            
            const sermonsSnapshot = await getDocs(collection(db, 'sermons'));
            const sermons = sermonsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            
            const eventsContainer = document.getElementById('eventsContainer');
            if (eventsContainer) {
                eventsContainer.innerHTML = events.map(e => `
                    <div class="event-card">
                        <div class="event-date">
                            <span class="month">${e.month}</span>
                            <span class="day">${e.day}</span>
                        </div>
                        <div class="event-details">
                            <h3>${e.title}</h3>
                            <p class="event-time"><i class="fa-regular fa-clock"></i> ${e.time || ''}</p>
                            <p>${e.description || ''}</p>
                        </div>
                    </div>
                `).join('');
            }

            const sermonsContainer = document.getElementById('sermonsContainer');
            if (sermonsContainer) {
                sermonsContainer.innerHTML = sermons.map((s, idx) => `
                    <div class="sermon-card ${idx === 0 ? 'featured' : ''}">
                        <div class="sermon-video">
                            <iframe src="${s.video_url}" title="Sermon" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                        <div class="sermon-info">
                            <span class="sermon-date">${s.date || ''}</span>
                            <h3>${s.title || ''}</h3>
                            <p>${s.preacher || ''}</p>
                        </div>
                    </div>
                `).join('');
            }
        } catch(err) {
            console.error('Error fetching dynamic content:', err);
        }
    }

    // --- Firebase Auth & DB Init ---
    async function initializeFirebase() {
        try {
            const response = await fetch('/api/firebase-config');
            if (!response.ok) throw new Error(`Server returned ${response.status}`);
            const firebaseConfig = await response.json();
            
            const app = initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const db = getFirestore(app);
            const provider = new GoogleAuthProvider();

            const signInBtn = document.getElementById('googleSignInBtn');
            const userProfile = document.getElementById('userProfile');
            const userAvatar = document.getElementById('userAvatar');
            const userName = document.getElementById('userName');
            const signOutBtn = document.getElementById('signOutBtn');
            const adminDashboardLink = document.getElementById('adminDashboardLink');

            const ADMIN_EMAIL = 'shadowroot505@gmail.com';

            if (signInBtn) {
                signInBtn.addEventListener('click', () => {
                    signInWithPopup(auth, provider).catch(error => {
                        console.error("Error signing in with Google: ", error);
                        alert("Authentication failed. Please try again.");
                    });
                });
            }

            if (signOutBtn) {
                signOutBtn.addEventListener('click', () => {
                    signOut(auth).catch((error) => {
                        console.error("Error signing out: ", error);
                    });
                });
            }

            onAuthStateChanged(auth, (user) => {
                if (user) {
                    if (signInBtn) signInBtn.style.display = 'none';
                    if (userProfile) {
                        userProfile.style.display = 'flex';
                        userName.textContent = user.displayName;
                        userAvatar.src = user.photoURL;
                        
                        // Show dashboard link for admin
                        if (user.email === ADMIN_EMAIL && adminDashboardLink) {
                            adminDashboardLink.style.display = 'block';
                        } else if (adminDashboardLink) {
                            adminDashboardLink.style.display = 'none';
                        }
                    }
                } else {
                    if (signInBtn) signInBtn.style.display = 'block';
                    if (userProfile) userProfile.style.display = 'none';
                }
            });

            loadSiteSettings(db);
            loadDynamicContent(db);
        } catch (error) {
            console.error("Error initializing Firebase:", error);
        }
    }
    
    initializeFirebase();
});
