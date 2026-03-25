import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const loginArea = document.getElementById('loginArea');
    const dashboardArea = document.getElementById('dashboardArea');
    const logoutSection = document.getElementById('logoutSection');
    const loginError = document.getElementById('loginError');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Event form elements
    const addEventForm = document.getElementById('addEventForm');
    const eventsList = document.getElementById('eventsList');
    const eventFormTitle = document.getElementById('eventFormTitle');
    const eventIdField = document.getElementById('eventId');
    const eventSubmitBtn = document.getElementById('eventSubmitBtn');
    const eventCancelBtn = document.getElementById('eventCancelBtn');

    // Sermon form elements
    const addSermonForm = document.getElementById('addSermonForm');
    const sermonsList = document.getElementById('sermonsList');
    const sermonFormTitle = document.getElementById('sermonFormTitle');
    const sermonIdField = document.getElementById('sermonId');
    const sermonSubmitBtn = document.getElementById('sermonSubmitBtn');
    const sermonCancelBtn = document.getElementById('sermonCancelBtn');

    // Messages element
    const messagesList = document.getElementById('messagesList');

    // Settings form elements
    const settingsForm = document.getElementById('settingsForm');
    const settingsStatus = document.getElementById('settingsStatus');

    const ADMIN_EMAIL = 'shadowroot505@gmail.com';

    let firebaseConfig;
    try {
        const response = await fetch('/api/firebase-config');
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        firebaseConfig = await response.json();
    } catch (err) {
        console.error('Failed to load Firebase config:', err);
        loginError.textContent = 'Failed to connect to server. Please try again later.';
        loginError.classList.remove('hidden');
        return;
    }
    
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const provider = new GoogleAuthProvider();

    // --- Auth ---
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', () => {
            signInWithPopup(auth, provider).catch(error => {
                console.error("Error signing in with Google: ", error);
            });
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth);
        });
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (user.email === ADMIN_EMAIL) {
                loginError.classList.add('hidden');
                showDashboard();
                loadDashboardData();
            } else {
                loginError.textContent = "Unauthorized: You are not an admin.";
                loginError.classList.remove('hidden');
                signOut(auth);
            }
        } else {
            showLogin();
        }
    });

    function showDashboard() {
        loginArea.classList.add('hidden');
        dashboardArea.classList.remove('hidden');
        logoutSection.classList.remove('hidden');
    }

    function showLogin() {
        dashboardArea.classList.add('hidden');
        logoutSection.classList.add('hidden');
        loginArea.classList.remove('hidden');
    }

    async function loadDashboardData() {
        await fetchSettings();
        await fetchEvents();
        await fetchSermons();
        await fetchMessages();
    }

    // =============================================
    // SITE SETTINGS
    // =============================================
    async function fetchSettings() {
        try {
            const settingsDoc = await getDoc(doc(db, 'siteSettings', 'general'));
            if (settingsDoc.exists()) {
                const data = settingsDoc.data();
                document.getElementById('siteName').value = data.siteName || '';
                document.getElementById('heroTitle').value = data.heroTitle || '';
                document.getElementById('heroSubtitle').value = data.heroSubtitle || '';
                document.getElementById('aboutText').value = data.aboutText || '';
            }
        } catch (err) {
            console.error('Error loading settings:', err);
        }
    }

    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                siteName: document.getElementById('siteName').value,
                heroTitle: document.getElementById('heroTitle').value,
                heroSubtitle: document.getElementById('heroSubtitle').value,
                aboutText: document.getElementById('aboutText').value
            };
            try {
                await setDoc(doc(db, 'siteSettings', 'general'), payload, { merge: true });
                settingsStatus.textContent = '✓ Settings saved!';
                setTimeout(() => { settingsStatus.textContent = ''; }, 3000);
            } catch (err) {
                alert('Error saving settings: ' + err.message);
            }
        });
    }

    // =============================================
    // EVENTS - CRUD
    // =============================================
    async function fetchEvents() {
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        const events = eventsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        eventsList.innerHTML = events.map(e => `
            <div class="card">
                <div class="card-details">
                    <h4>${e.title} (${e.month} ${e.day})</h4>
                    <p>${e.time || 'N/A'} | ${(e.description || '').substring(0, 60)}...</p>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary edit-event-btn" data-id="${e.id}"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                    <button class="btn btn-danger delete-btn" data-type="events" data-id="${e.id}"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            </div>
        `).join('');
        attachDeleteListeners();
        attachEditEventListeners(events);
    }

    function attachEditEventListeners(events) {
        document.querySelectorAll('.edit-event-btn').forEach(btn => {
            btn.onclick = function() {
                const id = this.getAttribute('data-id');
                const event = events.find(e => e.id === id);
                if (!event) return;

                eventIdField.value = event.id;
                document.getElementById('eventTitle').value = event.title;
                document.getElementById('eventMonth').value = event.month;
                document.getElementById('eventDay').value = event.day;
                document.getElementById('eventTime').value = event.time;
                document.getElementById('eventDesc').value = event.description;

                eventFormTitle.textContent = 'Edit Event';
                eventSubmitBtn.textContent = 'Update Event';
                eventCancelBtn.classList.remove('hidden');
                addEventForm.scrollIntoView({ behavior: 'smooth' });
            };
        });
    }

    if (eventCancelBtn) {
        eventCancelBtn.addEventListener('click', () => {
            resetEventForm();
        });
    }

    function resetEventForm() {
        addEventForm.reset();
        eventIdField.value = '';
        eventFormTitle.textContent = 'Add New Event';
        eventSubmitBtn.textContent = 'Save Event';
        eventCancelBtn.classList.add('hidden');
    }

    if (addEventForm) {
        addEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                title: document.getElementById('eventTitle').value,
                month: document.getElementById('eventMonth').value.toUpperCase(),
                day: document.getElementById('eventDay').value,
                time: document.getElementById('eventTime').value,
                description: document.getElementById('eventDesc').value
            };

            const editingId = eventIdField.value;

            try {
                if (editingId) {
                    // Update existing
                    await updateDoc(doc(db, 'events', editingId), payload);
                } else {
                    // Add new
                    await addDoc(collection(db, 'events'), payload);
                }
                resetEventForm();
                fetchEvents();
            } catch (err) { alert(err.message); }
        });
    }

    function formatYoutubeUrl(url) {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
        return url;
    }

    // =============================================
    // SERMONS - CRUD
    // =============================================
    async function fetchSermons() {
        const sermonsSnapshot = await getDocs(collection(db, 'sermons'));
        const sermons = sermonsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        sermonsList.innerHTML = sermons.map(s => `
            <div class="card">
                <div class="card-details">
                    <h4>${s.title}</h4>
                    <p>${s.date} | ${s.preacher}</p>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary edit-sermon-btn" data-id="${s.id}"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                    <button class="btn btn-danger delete-btn" data-type="sermons" data-id="${s.id}"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            </div>
        `).join('');
        attachDeleteListeners();
        attachEditSermonListeners(sermons);
    }

    function attachEditSermonListeners(sermons) {
        document.querySelectorAll('.edit-sermon-btn').forEach(btn => {
            btn.onclick = function() {
                const id = this.getAttribute('data-id');
                const sermon = sermons.find(s => s.id === id);
                if (!sermon) return;

                sermonIdField.value = sermon.id;
                document.getElementById('sermonTitle').value = sermon.title;
                document.getElementById('sermonDate').value = sermon.date;
                document.getElementById('sermonPreacher').value = sermon.preacher;
                document.getElementById('sermonUrl').value = sermon.video_url;

                sermonFormTitle.textContent = 'Edit Sermon';
                sermonSubmitBtn.textContent = 'Update Sermon';
                sermonCancelBtn.classList.remove('hidden');
                addSermonForm.scrollIntoView({ behavior: 'smooth' });
            };
        });
    }

    if (sermonCancelBtn) {
        sermonCancelBtn.addEventListener('click', () => {
            resetSermonForm();
        });
    }

    function resetSermonForm() {
        addSermonForm.reset();
        sermonIdField.value = '';
        sermonFormTitle.textContent = 'Add New Sermon';
        sermonSubmitBtn.textContent = 'Save Sermon';
        sermonCancelBtn.classList.add('hidden');
    }

    if (addSermonForm) {
        addSermonForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                title: document.getElementById('sermonTitle').value,
                date: document.getElementById('sermonDate').value,
                preacher: document.getElementById('sermonPreacher').value,
                video_url: formatYoutubeUrl(document.getElementById('sermonUrl').value)
            };

            const editingId = sermonIdField.value;

            try {
                if (editingId) {
                    await updateDoc(doc(db, 'sermons', editingId), payload);
                } else {
                    await addDoc(collection(db, 'sermons'), payload);
                }
                resetSermonForm();
                fetchSermons();
            } catch (err) { alert(err.message); }
        });
    }

    // =============================================
    // MESSAGES - Display and Delete
    // =============================================
    async function fetchMessages() {
        if (!messagesList) return;
        try {
            const messagesSnapshot = await getDocs(collection(db, 'messages'));
            const messages = messagesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            
            // Sort by timestamp if available (newest first)
            messages.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

            if (messages.length === 0) {
                messagesList.innerHTML = '<p>No messages yet.</p>';
            } else {
                messagesList.innerHTML = messages.map(m => `
                    <div class="card" style="display:flex; flex-direction:column; align-items:flex-start; gap:10px;">
                        <div class="card-details" style="width:100%;">
                            <h4 style="margin:0;">From: ${m.name} (${m.email})</h4>
                            <p style="color: #444; font-size: 1.1rem; margin: 10px 0; background: #f9f9f9; padding: 10px; border-radius: 4px; border-left: 4px solid var(--primary-color);">${m.message}</p>
                            <p style="font-size: 0.8rem; margin:0; color: #888;">Received: ${new Date(m.timestamp).toLocaleString()}</p>
                        </div>
                        <div class="card-actions" style="align-self: flex-end;">
                            <button class="btn btn-danger delete-btn" data-type="messages" data-id="${m.id}"><i class="fa-solid fa-trash"></i> Delete Message</button>
                        </div>
                    </div>
                `).join('');
                attachDeleteListeners();
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
            messagesList.innerHTML = '<p>Error loading messages.</p>';
        }
    }

    // =============================================
    // DELETE (shared)
    // =============================================
    function attachDeleteListeners() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = async function() {
                if (!confirm('Are you sure you want to delete this item?')) return;
                const type = this.getAttribute('data-type');
                const id = this.getAttribute('data-id');
                try {
                    await deleteDoc(doc(db, type, id));
                    if (type === 'events') fetchEvents();
                    if (type === 'sermons') fetchSermons();
                    if (type === 'messages') fetchMessages();
                } catch(e) { alert(e.message); }
            }
        });
    }
});
