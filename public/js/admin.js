import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

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

    // Video Source Toggle
    window.toggleVideoSource = (source) => {
        const youtubeInput = document.getElementById('youtubeInput');
        const fileInputArea = document.getElementById('fileInputArea');
        if (source === 'youtube') {
            youtubeInput.style.display = 'block';
            fileInputArea.style.display = 'none';
        } else {
            youtubeInput.style.display = 'none';
            fileInputArea.style.display = 'block';
        }
    };

    // Messages element
    const messagesList = document.getElementById('messagesList');

    // Settings form elements
    const settingsForm = document.getElementById('settingsForm');
    const settingsStatus = document.getElementById('settingsStatus');

    // About Media form elements
    const aboutMediaForm = document.getElementById('aboutMediaForm');
    const aboutMediaStatus = document.getElementById('aboutMediaStatus');
    const aboutMediaUrlInputArea = document.getElementById('aboutMediaUrlInputArea');
    const aboutMediaFileInputArea = document.getElementById('aboutMediaFileInputArea');
    const aboutMediaUrlLabel = document.getElementById('aboutMediaUrlLabel');
    const aboutMediaUrlHint = document.getElementById('aboutMediaUrlHint');
    const aboutMediaUrlField = document.getElementById('aboutMediaUrl');
    const aboutMediaFileInput = document.getElementById('aboutMediaFileInput');
    const aboutMediaEnabledField = document.getElementById('aboutMediaEnabled');
    const aboutMediaTypeRadios = document.getElementsByName('aboutMediaType');

    // Toggle about media inputs based on type
    const updateAboutMediaUI = (type) => {
        if (type === 'file') {
            aboutMediaUrlInputArea.style.display = 'none';
            aboutMediaFileInputArea.style.display = 'block';
        } else {
            aboutMediaUrlInputArea.style.display = 'block';
            aboutMediaFileInputArea.style.display = 'none';
            if (type === 'youtube') {
                aboutMediaUrlLabel.textContent = 'YouTube Embed URL';
                aboutMediaUrlHint.innerHTML = 'Make sure it\'s an <strong>embed</strong> link for YouTube.';
                aboutMediaUrlField.placeholder = 'https://www.youtube.com/embed/...';
            } else {
                aboutMediaUrlLabel.textContent = 'Image URL';
                aboutMediaUrlHint.textContent = 'Provide a direct link to the image.';
                aboutMediaUrlField.placeholder = 'https://example.com/image.jpg';
            }
        }
    };

    aboutMediaTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => updateAboutMediaUI(e.target.value));
    });

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
        await fetchAboutMedia();
        await fetchEvents();
        await fetchSermons();
        await fetchMessages();
    }

    // =============================================
    // SITE SETTINGS
    // =============================================
    async function fetchAboutMedia() {
        try {
            const aboutMediaDoc = await getDoc(doc(db, 'siteSettings', 'aboutMedia'));
            if (aboutMediaDoc.exists()) {
                const data = aboutMediaDoc.data();
                aboutMediaEnabledField.checked = data.enabled || false;
                aboutMediaUrlField.value = data.url || '';
                
                const type = data.type || 'youtube';
                const radio = document.querySelector(`input[name="aboutMediaType"][value="${type}"]`);
                if (radio) radio.checked = true;
                
                updateAboutMediaUI(type);
            }
        } catch (err) {
            console.error('Error loading about media settings:', err);
        }
    }

    async function fetchSettings() {
        try {
            const settingsDoc = await getDoc(doc(db, 'siteSettings', 'general'));
            if (settingsDoc.exists()) {
                const data = settingsDoc.data();
                document.getElementById('siteName').value = data.siteName || '';
                document.getElementById('heroTitle').value = data.heroTitle || '';
                document.getElementById('heroSubtitle').value = data.heroSubtitle || '';
                document.getElementById('aboutText').value = data.aboutText || '';

                // Leadership
                document.getElementById('leader1ImgUrl').value = data.leader1ImgUrl || '';
                document.getElementById('leader1NameVal').value = data.leader1Name || '';
                document.getElementById('leader1RoleVal').value = data.leader1Role || '';
                document.getElementById('leader2ImgUrl').value = data.leader2ImgUrl || '';
                document.getElementById('leader2NameVal').value = data.leader2Name || '';
                document.getElementById('leader2RoleVal').value = data.leader2Role || '';
                document.getElementById('leader3ImgUrl').value = data.leader3ImgUrl || '';
                document.getElementById('leader3NameVal').value = data.leader3Name || '';
                document.getElementById('leader3RoleVal').value = data.leader3Role || '';

                // Contact
                document.getElementById('contactLocationVal').value = data.contactLocation || '';
                document.getElementById('contactPhoneVal').value = data.contactPhone || '';
                document.getElementById('contactEmailVal').value = data.contactEmail || '';
                document.getElementById('contactMapUrl').value = data.contactMapUrl || '';
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

    const contactSettingsForm = document.getElementById('contactSettingsForm');
    const contactStatus = document.getElementById('contactStatus');
    if (contactSettingsForm) {
        contactSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                leader1ImgUrl: document.getElementById('leader1ImgUrl').value,
                leader1Name: document.getElementById('leader1NameVal').value,
                leader1Role: document.getElementById('leader1RoleVal').value,
                leader2ImgUrl: document.getElementById('leader2ImgUrl').value,
                leader2Name: document.getElementById('leader2NameVal').value,
                leader2Role: document.getElementById('leader2RoleVal').value,
                leader3ImgUrl: document.getElementById('leader3ImgUrl').value,
                leader3Name: document.getElementById('leader3NameVal').value,
                leader3Role: document.getElementById('leader3RoleVal').value,
                contactLocation: document.getElementById('contactLocationVal').value,
                contactPhone: document.getElementById('contactPhoneVal').value,
                contactEmail: document.getElementById('contactEmailVal').value,
                contactMapUrl: document.getElementById('contactMapUrl').value
            };
            try {
                await setDoc(doc(db, 'siteSettings', 'general'), payload, { merge: true });
                contactStatus.textContent = '✓ Contact & Leadership saved!';
                setTimeout(() => { contactStatus.textContent = ''; }, 3000);
            } catch (err) {
                alert('Error saving settings: ' + err.message);
            }
        });
    }

    if (aboutMediaForm) {
        aboutMediaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('saveAboutMediaBtn');
            const typeValue = document.querySelector('input[name="aboutMediaType"]:checked').value;
            const isEnabled = aboutMediaEnabledField.checked;
            let finalUrl = aboutMediaUrlField.value;
            const mediaFile = aboutMediaFileInput.files[0];

            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            try {
                if (typeValue === 'file' && mediaFile) {
                    const storage = getStorage(app);
                    const storageRef = ref(storage, `aboutMedia/${Date.now()}_${mediaFile.name}`);
                    const uploadTask = uploadBytesResumable(storageRef, mediaFile);

                    const progressContainer = document.getElementById('aboutMediaUploadProgressContainer');
                    const progressBar = document.getElementById('aboutMediaUploadProgressBar');
                    const statusText = document.getElementById('aboutMediaUploadStatusText');

                    progressContainer.style.display = 'block';

                    finalUrl = await new Promise((resolve, reject) => {
                        uploadTask.on('state_changed',
                            (snapshot) => {
                                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                progressBar.style.width = progress + '%';
                                statusText.textContent = `Upload is ${Math.round(progress)}% done`;
                            },
                            (error) => reject(error),
                            () => {
                                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                                    resolve(downloadURL);
                                });
                            }
                        );
                    });
                } else if (typeValue === 'youtube') {
                    finalUrl = formatYoutubeUrl(finalUrl);
                }

                const payload = { type: typeValue, url: finalUrl, enabled: isEnabled };
                await setDoc(doc(db, 'siteSettings', 'aboutMedia'), payload);

                aboutMediaStatus.textContent = '✓ Our Story Media saved!';
                document.getElementById('aboutMediaUploadProgressContainer').style.display = 'none';
                setTimeout(() => { aboutMediaStatus.textContent = ''; }, 3000);
            } catch (err) {
                alert('Error saving about media: ' + err.message);
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Our Story Media';
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
        document.getElementById('uploadProgressContainer').style.display = 'none'; // Hide progress bar
        document.getElementById('uploadProgressBar').style.width = '0%';
        document.getElementById('uploadStatusText').textContent = '';
        document.getElementById('videoSourceYoutube').checked = true; // Default to YouTube
        toggleVideoSource('youtube'); // Reset UI to YouTube input
    }

    if (addSermonForm) {
        addSermonForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = sermonIdField.value;
            const title = document.getElementById('sermonTitle').value;
            const date = document.getElementById('sermonDate').value;
            const preacher = document.getElementById('sermonPreacher').value;
            const videoSource = document.querySelector('input[name="videoSource"]:checked').value;
            
            let url = document.getElementById('sermonUrl').value;
            const videoFile = document.getElementById('sermonFile').files[0];

            // If file upload is selected
            if (videoSource === 'file' && videoFile) {
                try {
                    sermonSubmitBtn.disabled = true;
                    sermonSubmitBtn.textContent = 'Uploading...';
                    
                    const storage = getStorage(app);
                    const storageRef = ref(storage, `sermons/${Date.now()}_${videoFile.name}`);
                    const uploadTask = uploadBytesResumable(storageRef, videoFile);

                    const progressContainer = document.getElementById('uploadProgressContainer');
                    const progressBar = document.getElementById('uploadProgressBar');
                    const statusText = document.getElementById('uploadStatusText');
                    
                    progressContainer.style.display = 'block';

                    url = await new Promise((resolve, reject) => {
                        uploadTask.on('state_changed', 
                            (snapshot) => {
                                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                progressBar.style.width = progress + '%';
                                statusText.textContent = `Upload is ${Math.round(progress)}% done`;
                            }, 
                            (error) => reject(error), 
                            () => {
                                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                                    resolve(downloadURL);
                                });
                            }
                        );
                    });
                } catch (err) {
                    console.error('Upload error details:', err);
                    alert('Upload failed: ' + err.message + '\n\nPlease check if you have enabled Firebase Storage in your console and configured CORS if testing locally.');
                    sermonSubmitBtn.disabled = false;
                    sermonSubmitBtn.textContent = 'Save Sermon';
                    return;
                }
            } else if (videoSource === 'youtube') {
                url = formatYoutubeUrl(url); // Format YouTube URL
            }

            const sermonData = { title, date, preacher, url, type: videoSource };

            try {
                if (id) {
                    await updateDoc(doc(db, 'sermons', id), sermonData);
                } else {
                    await addDoc(collection(db, 'sermons'), sermonData);
                }
                resetSermonForm();
                sermonSubmitBtn.disabled = false;
                sermonSubmitBtn.textContent = 'Save Sermon';
                fetchSermons();
            } catch (err) {
                console.error('Error saving sermon:', err);
                alert('Error saving sermon: ' + err.message);
                sermonSubmitBtn.disabled = false;
                sermonSubmitBtn.textContent = 'Save Sermon';
            }
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
