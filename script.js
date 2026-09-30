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

const COMMUNITY_ASSISTANT_URL = 'https://ombmscbaavdsmulbxmxg.supabase.co/functions/v1/community-assistant';
const COMMUNITY_ASSISTANT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGciOiJIUzI1NiIsInJlZiI6Im9tYm1zY2JhYXZkc211bGJ4bXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2OTIwNTAsImV4cCI6MjEwNjI2ODA1MH0.XItxECKcDeLZAeiQistVdMgqrDRiW1U20AKvC48YY-g';
let communityAssistantHistory = [];

function addAssistantMessage(text, sender) {
  const messages = document.getElementById('assistant-messages');
  const message = document.createElement('div');
  const paragraph = document.createElement('p');
  message.className = `assistant-message assistant-message-${sender}`;
  paragraph.textContent = text;
  message.appendChild(paragraph);
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
  return message;
}

function getCommunityHelpReply(question) {
  const normalizedQuestion = question.toLowerCase();

  if (/\b(my reports|my report|where is|find my|how many)\b/.test(normalizedQuestion) && currentUser) {
    const myReports = mockReports.filter(report => report.userEmail === currentUser.email);
    if (myReports.length === 0) return 'You do not have any reports in this session yet. You can submit one from the resident dashboard.';
    return `You have ${myReports.length} report${myReports.length === 1 ? '' : 's'} in this session: ${myReports.map(report => `${report.title} (${report.status})`).join('; ')}.`;
  }
  if (/\b(status(?:es)?|submitted|under review|in progress|resolved|rejected|track|progress)\b/.test(normalizedQuestion)) {
    return 'Submitted means the report has been received. Under Review means the community team is assessing it. In Progress means work is underway. Resolved means it has been addressed, and Rejected means it will not be actioned. Residents can track reports in Your submitted reports.';
  }
  if (/\b(report|submit|raise|file)\b/.test(normalizedQuestion)) {
    return 'To report an issue, log in as a resident and open the Submit a report form. Add a title, category, location, and description; a photo and GPS coordinates are optional.';
  }
  if (/\b(login|log in|account|register|sign up|password)\b/.test(normalizedQuestion)) {
    return 'Use Create an account to register as a resident, or Log in if you already have an account. If you have trouble signing in, check that the selected role matches your account.';
  }
  if (/\b(admin|administrator|dashboard)\b/.test(normalizedQuestion)) {
    return 'The admin dashboard is for administrators. It shows community reports, lets admins filter and update report statuses, and includes the residents directory.';
  }
  return 'I can help with submitting a community report, understanding report statuses, finding your reports, or using the resident and admin dashboards. Which would you like to know about?';
}

async function askCommunityAssistant(question) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(COMMUNITY_ASSISTANT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COMMUNITY_ASSISTANT_ANON_KEY}`,
        'apikey': COMMUNITY_ASSISTANT_ANON_KEY
      },
      body: JSON.stringify({
        messages: communityAssistantHistory.slice(-12)
      }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error('Assistant service is unavailable');
    const result = await response.json();
    const reply = result.reply || result.message || result.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply.trim()) throw new Error('Assistant returned no reply');
    return reply.trim();
  } catch {
    return `${getCommunityHelpReply(question)}\n\nThe AI service is not connected right now, so this is a built-in portal help response.`;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function setAssistantOpen(isOpen) {
  document.getElementById('assistant-panel').hidden = !isOpen;
  document.getElementById('assistant-toggle').setAttribute('aria-expanded', String(isOpen));
  if (isOpen) document.getElementById('assistant-input').focus();
}

async function handleAssistantSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('assistant-input');
  const sendButton = document.getElementById('assistant-send');
  const question = input.value.trim();
  if (!question || sendButton.disabled) return;

  addAssistantMessage(question, 'user');
  communityAssistantHistory.push({ role: 'user', content: question });
  input.value = '';
  sendButton.disabled = true;
  const pendingMessage = addAssistantMessage('Thinking...', 'bot assistant-message-pending');
  const reply = await askCommunityAssistant(question);
  pendingMessage.remove();
  addAssistantMessage(reply, 'bot');
  communityAssistantHistory.push({ role: 'assistant', content: reply });
  sendButton.disabled = false;
  input.focus();
}

document.addEventListener('DOMContentLoaded', () => {
  const assistantForm = document.getElementById('assistant-form');
  const assistantToggle = document.getElementById('assistant-toggle');
  const assistantClose = document.getElementById('assistant-close');

  assistantForm.addEventListener('submit', handleAssistantSubmit);
  assistantToggle.addEventListener('click', () => setAssistantOpen(true));
  assistantClose.addEventListener('click', () => {
    setAssistantOpen(false);
    assistantToggle.focus();
  });
  document.querySelectorAll('[data-assistant-prompt]').forEach(button => {
    button.addEventListener('click', () => {
      document.getElementById('assistant-input').value = button.dataset.assistantPrompt;
      assistantForm.requestSubmit();
    });
  });
});

// Initialize View on Page Load
document.addEventListener("DOMContentLoaded", () => {
  switchView('auth');
  startHeroSlideshow();
});

/*

// Initialize Supabase Client
const SUPABASE_URL = 'https://ombmscbaavdsmulbxmxg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tYm1zY2JhYXZkc211bGJ4bXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2OTIwNTAsImV4cCI6MjEwNjI2ODA1MH0.XItxECKcDeLZAeiQistVdMgqrDRiW1U20AKvC48YY-g';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. Resident Registration
async function registerResident(email, password, fullName, phone) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,

      const COMMUNITY_ASSISTANT_URL = 'https://ombmscbaavdsmulbxmxg.supabase.co/functions/v1/community-assistant';
      const COMMUNITY_ASSISTANT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGciOiJIUzI1NiIsInJlZiI6Im9tYm1zY2JhYXZkc211bGJ4bXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2OTIwNTAsImV4cCI6MjEwNjI2ODA1MH0.XItxECKcDeLZAeiQistVdMgqrDRiW1U20AKvC48YY-g';

      function addAssistantMessage(text, sender) {
        const messages = document.getElementById('assistant-messages');
        const message = document.createElement('div');
        const paragraph = document.createElement('p');
        message.className = `assistant-message assistant-message-${sender}`;
        paragraph.textContent = text;
        message.appendChild(paragraph);
        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
        return message;
      }

      function getCommunityHelpReply(question) {
        const normalizedQuestion = question.toLowerCase();

        if (/\b(report|submit|raise|file)\b/.test(normalizedQuestion)) {
          return 'To report an issue, log in as a resident and open the Submit a report form. Add a short title, category, location, and description; a photo and GPS coordinates are optional. Select Submit Report when you are ready.';
        }

        if (/\b(status|submitted|under review|in progress|resolved|rejected|track|progress)\b/.test(normalizedQuestion)) {
          return 'Submitted means the report has been received. Under Review means the community team is assessing it. In Progress means work is underway. Resolved means it has been addressed, and Rejected means it will not be actioned. Residents can track reports in Your submitted reports.';
        }

        if (/\b(my reports|my report|where is|find my|how many)\b/.test(normalizedQuestion) && currentUser) {
          const myReports = mockReports.filter(report => report.userEmail === currentUser.email);
          if (myReports.length === 0) return 'You do not have any reports in this session yet. You can submit one from the resident dashboard.';
          return `You have ${myReports.length} report${myReports.length === 1 ? '' : 's'} in this session: ${myReports.map(report => `${report.title} (${report.status})`).join('; ')}.`;
        }

        if (/\b(login|log in|account|register|sign up|password)\b/.test(normalizedQuestion)) {
          return 'Use Create an account to register as a resident, or Log in if you already have an account. If you have trouble signing in, check that the selected role matches your account.';
        }

        if (/\b(admin|administrator|dashboard)\b/.test(normalizedQuestion)) {
          return 'The admin dashboard is for administrators. It shows community reports, lets admins filter and update report statuses, and includes the residents directory.';
        }

        return 'I can help with submitting a community report, understanding report statuses, finding your reports, or using the resident and admin dashboards. Which would you like to know about?';
      }

      async function askCommunityAssistant(question) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 12000);

        try {
          const response = await fetch(COMMUNITY_ASSISTANT_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${COMMUNITY_ASSISTANT_ANON_KEY}`,
              'apikey': COMMUNITY_ASSISTANT_ANON_KEY
            },
            body: JSON.stringify({
              messages: [{ role: 'user', content: question }],
              context: 'You are the helpful assistant for a community issue reporting portal. Give concise, practical answers about community reporting and portal navigation.'
            }),
            signal: controller.signal
          });

          if (!response.ok) throw new Error('Assistant service is unavailable');
          const result = await response.json();
          const reply = result.reply || result.message || result.choices?.[0]?.message?.content;
          if (typeof reply !== 'string' || !reply.trim()) throw new Error('Assistant returned no reply');
          return reply.trim();
        } catch {
          return `${getCommunityHelpReply(question)}\n\nThe AI service is not connected right now, so this is a built-in portal help response.`;
        } finally {
          window.clearTimeout(timeoutId);
        }
      }

      function setAssistantOpen(isOpen) {
        document.getElementById('assistant-panel').hidden = !isOpen;
        document.getElementById('assistant-toggle').setAttribute('aria-expanded', String(isOpen));
        if (isOpen) document.getElementById('assistant-input').focus();
      }

      async function handleAssistantSubmit(event) {
        event.preventDefault();
        const input = document.getElementById('assistant-input');
        const sendButton = document.getElementById('assistant-send');
        const question = input.value.trim();
        if (!question || sendButton.disabled) return;

        addAssistantMessage(question, 'user');
        input.value = '';
        sendButton.disabled = true;
        const pendingMessage = addAssistantMessage('Thinking...', 'bot assistant-message-pending');

        const reply = await askCommunityAssistant(question);
        pendingMessage.remove();
        addAssistantMessage(reply, 'bot');
        sendButton.disabled = false;
        input.focus();
      }

      document.addEventListener('DOMContentLoaded', () => {
        const assistantForm = document.getElementById('assistant-form');
        const assistantToggle = document.getElementById('assistant-toggle');
        const assistantClose = document.getElementById('assistant-close');

        assistantForm.addEventListener('submit', handleAssistantSubmit);
        assistantToggle.addEventListener('click', () => setAssistantOpen(true));
        assistantClose.addEventListener('click', () => assistantToggle.focus() || setAssistantOpen(false));
        document.querySelectorAll('[data-assistant-prompt]').forEach(button => {
          button.addEventListener('click', () => {
            document.getElementById('assistant-input').value = button.dataset.assistantPrompt;
            assistantForm.requestSubmit();
          });
        });
      });
        options: {
            data: {
                name: fullName,
                phone: phone,
                role: 'resident'
            }
*/