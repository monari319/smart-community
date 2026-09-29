// --- Mock Data Store ---
let currentUser = null;
let registeredAccounts = JSON.parse(localStorage.getItem('communityAccounts') || '[]');
const heroSlides = [
  'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=2400&q=85',
  'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=2400&q=85',
  'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=2400&q=85',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=85',
  'https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?auto=format&fit=crop&w=2400&q=85',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2400&q=85',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=2400&q=85'
];
let heroSlideIndex = 0;
let heroSlideshowTimer = null;

let mockUsers = [
  { name: "Brian Monari", email: "bmonari94@gmail.com", phone: "0712345678", status: "Verified" },
  { name: "Rispa Akoko", email: "rispa8477@gmail.com", phone: "0723456789", status: "Verified" },
  { name: "Geofrey Oluoch", email: "geofreyoluoch21@gmail.com", phone: "0734567890", status: "Pending Verification" }
];

let mockReports = [];

// --- Core Navigation ---
function switchView(viewName) {
  if (viewName !== 'auth' && !currentUser) viewName = 'auth';
  if (viewName === 'admin' && currentUser?.role !== 'admin') viewName = 'resident';

  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));

  document.getElementById(`view-${viewName}`).classList.add('active');
  const activeNavButton = document.getElementById(`nav-${viewName}`);
  if (activeNavButton) activeNavButton.classList.add('active');

  document.getElementById('nav-resident').hidden = !currentUser || currentUser.role === 'admin';
  document.getElementById('nav-admin').hidden = currentUser?.role !== 'admin';
  document.getElementById('nav-logout').hidden = !currentUser;

  if (viewName === 'resident') renderResidentDashboard();
  if (viewName === 'admin') renderAdminDashboard();
}

function showAuthForm(formName) {
  const isRegister = formName === 'register';
  stopHeroSlideshow();
  document.getElementById('auth-welcome').hidden = true;
  document.getElementById('auth-forms').hidden = false;
  document.getElementById('register-panel').hidden = !isRegister;
  document.getElementById('login-panel').hidden = isRegister;
}

function showAuthWelcome() {
  document.getElementById('auth-welcome').hidden = false;
  document.getElementById('auth-forms').hidden = true;
  document.getElementById('register-panel').hidden = true;
  document.getElementById('login-panel').hidden = true;
  startHeroSlideshow();
}

function startHeroSlideshow() {
  if (heroSlideshowTimer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  heroSlideshowTimer = window.setInterval(() => {
    const primaryImage = document.getElementById('hero-image-primary');
    const secondaryImage = document.getElementById('hero-image-secondary');
    const currentImage = primaryImage.classList.contains('is-visible') ? primaryImage : secondaryImage;
    const nextImage = currentImage === primaryImage ? secondaryImage : primaryImage;

    nextImage.onload = () => {
      nextImage.classList.add('is-visible');
      currentImage.classList.remove('is-visible');
    };
    nextImage.src = heroSlides[heroSlideIndex];
    heroSlideIndex = (heroSlideIndex + 1) % heroSlides.length;
  }, 7000);
}

function stopHeroSlideshow() {
  window.clearInterval(heroSlideshowTimer);
  heroSlideshowTimer = null;
}

// --- Resident Logic ---
function handleReportSubmit(e) {
  e.preventDefault();
  const newReport = {
    id: `REP-${Math.floor(100 + Math.random() * 900)}`,
    title: document.getElementById('rep-title').value,
    category: document.getElementById('rep-category').value,
    location: document.getElementById('rep-location').value,
    coords: document.getElementById('rep-coords').value,
    description: document.getElementById('rep-desc').value,
    status: "Submitted",
    userEmail: currentUser.email,
    date: new Date().toISOString().split('T')[0]
  };

  mockReports.unshift(newReport);
  alert("Report successfully created and saved to system database!");
  document.getElementById('report-form').reset();
  renderResidentDashboard();
}

function renderResidentDashboard() {
  const myReports = mockReports.filter(r => r.userEmail === currentUser.email || currentUser.email === "resident@tmu.ac.ke");
  
  // Update Stats
  document.getElementById('res-stat-total').innerText = myReports.length || '';
  document.getElementById('res-stat-pending').innerText = myReports.filter(r => ['Submitted', 'Under Review', 'In Progress'].includes(r.status)).length;
  document.getElementById('res-stat-resolved').innerText = myReports.filter(r => r.status === 'Resolved').length;

  // Render Table
  const tbody = document.getElementById('resident-reports-table');
  tbody.innerHTML = myReports.map(r => `
    <tr>
      <td><strong>${r.title}</strong></td>
      <td>${r.category}</td>
      <td><span class="badge badge-${getBadgeClass(r.status)}">${r.status}</span></td>
      <td>${r.date}</td>
    </tr>
  `).join('') || `<tr><td colspan="4" style="text-align:center;">No reports found.</td></tr>`;
}

// --- Admin Logic ---
function renderAdminDashboard() {
  // Update Admin Statistics
  document.getElementById('admin-stat-total').innerText = mockReports.length;
  document.getElementById('admin-stat-review').innerText = mockReports.filter(r => r.status === 'Under Review').length;
  document.getElementById('admin-stat-progress').innerText = mockReports.filter(r => r.status === 'In Progress').length;
  document.getElementById('admin-stat-resolved').innerText = mockReports.filter(r => r.status === 'Resolved').length;

  renderAdminReports();
  renderResidentsDirectory();
}

function renderAdminReports() {
  const searchQuery = document.getElementById('admin-search').value.toLowerCase();
  const filterStatus = document.getElementById('admin-filter-status').value;

  const filtered = mockReports.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery) || r.description.toLowerCase().includes(searchQuery);
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const tbody = document.getElementById('admin-reports-table');
  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td><small>${r.id}</small></td>
      <td><strong>${r.title}</strong></td>
      <td>${r.category}</td>
      <td>${r.location}</td>
      <td><small>${r.userEmail}</small></td>
      <td><span class="badge badge-${getBadgeClass(r.status)}">${r.status}</span></td>
      <td>
        <select onchange="updateReportStatus('${r.id}', this.value)">
          <option value="Submitted" ${r.status === 'Submitted' ? 'selected' : ''}>Submitted</option>
          <option value="Under Review" ${r.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
          <option value="In Progress" ${r.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Resolved" ${r.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
          <option value="Rejected" ${r.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </td>
      <td>
        <button class="btn-delete" onclick="deleteReport('${r.id}')">Delete</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="8" style="text-align:center;">No matching reports found.</td></tr>`;
}

function renderResidentsDirectory() {
  const tbody = document.getElementById('admin-residents-table');
  tbody.innerHTML = mockUsers.map(u => `
    <tr>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.phone}</td>
      <td><span class="badge ${u.status === 'Verified' ? 'badge-resolved' : 'badge-review'}">${u.status}</span></td>
    </tr>
  `).join('');
}

function updateReportStatus(reportId, newStatus) {
  const report = mockReports.find(r => r.id === reportId);
  if (report) {
    report.status = newStatus;
    renderAdminDashboard();
  }
}

function deleteReport(reportId) {
  if (confirm(`Are you sure you want to delete report ${reportId}?`)) {
    mockReports = mockReports.filter(r => r.id !== reportId);
    renderAdminDashboard();
  }
}

// --- Authentication Handlers ---
function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const phone = document.getElementById('reg-phone').value;
  const password = document.getElementById('reg-pass').value;
  const confirmPassword = document.getElementById('reg-confirm-pass').value;

  if (password !== confirmPassword) {
    alert("Passwords do not match. Please confirm your password.");
    return;
  }

  if (registeredAccounts.some(account => account.email.toLowerCase() === email.toLowerCase())) {
    alert("An account with this email already exists. Please log in instead.");
    return;
  }

  const account = { name, email, phone, password, role: 'resident' };
  registeredAccounts.push(account);
  localStorage.setItem('communityAccounts', JSON.stringify(registeredAccounts));
  mockUsers.push({ name, email, phone, status: "Pending Verification" });
  alert("Registration successful! Please log in with your new account.");
  document.getElementById('register-form').reset();
  document.getElementById('login-email').value = email;
  showAuthForm('login');
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-pass').value;
  const role = document.getElementById('login-role').value;
  const account = registeredAccounts.find(user =>
    user.email.toLowerCase() === email.toLowerCase() && user.password === password
  );

  if (!account || account.role !== role) {
    alert("Email or password is incorrect, or the selected role does not match your account.");
    return;
  }

  currentUser = { name: account.name, email: account.email, role: account.role };
  alert(`Logged in successfully as ${role.toUpperCase()}`);
  
  if (role === 'admin') {
    switchView('admin');
  } else {
    switchView('resident');
  }
}

function handleLogout() {
  currentUser = null;
  showAuthWelcome();
  switchView('auth');
}

// --- Helpers ---
function getBadgeClass(status) {
  switch (status) {
    case 'Submitted': return 'submitted';
    case 'Under Review': return 'review';
    case 'In Progress': return 'progress';
    case 'Resolved': return 'resolved';
    case 'Rejected': return 'rejected';
    default: return 'submitted';
  }
}

// Initialize View on Page Load
document.addEventListener("DOMContentLoaded", () => {
  switchView('auth');
  startHeroSlideshow();
});

// Initialize Supabase Client
const SUPABASE_URL = 'https://ombmscbaavdsmulbxmxg.supabase.com';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tYm1zY2JhYXZkc211bGJ4bXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2OTIwNTAsImV4cCI6MjEwNjI2ODA1MH0.XItxECKcDeLZAeiQistVdMgqrDRiW1U20AKvC48YY-g';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. Resident Registration
async function registerResident(email, password, fullName, phone) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                name: fullName,
                phone: phone,
                role: 'resident'
            }
        }
    });
    return { data, error };
}

// 2. Submit Community Report with Evidence Photo
async function submitReport({ title, description, category, location, lat, lng, imageFile }) {
    const user = supabase.auth.user();
    let imageUrl = null;

    if (imageFile) {
        const filePath = `${user.id}/${Date.now()}_${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('report-images')
            .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase
            .storage
            .from('report-images')
            .getPublicUrl(filePath);
            
        imageUrl = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase
        .from('reports')
        .insert([{
            user_id: user.id,
            title,
            description,
            category,
            location,
            latitude: lat,
            longitude: lng,
            image_url: imageUrl
        }]);

    return { data, error };
}

async function fetchUserReports() {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: reports, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) console.error('Error loading reports:', error);
    else renderResidentDashboard(reports);
}

async function fetchAllReportsForAdmin() {
    const { data: reports, error } = await supabase
        .from('reports')
        .select(`
            *,
            profiles (name, phone)
        `)
        .order('created_at', { ascending: false });

    if (error) console.error('Error fetching admin reports:', error);
    else {
        renderAdminTable(reports);
        plotReportsOnMap(reports); // Pass coordinates (lat, lng) to Leaflet / Mapbox
    }
}

async function updateReportStatus(reportId, newStatus) {
    const { data, error } = await supabase
        .from('reports')
        .update({ status: newStatus, updated_at: new Date() })
        .eq('id', reportId);

    if (error) alert('Failed to update status: ' + error.message);
    else fetchAllReportsForAdmin();
}