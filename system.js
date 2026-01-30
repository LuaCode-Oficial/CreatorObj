// --- CONFIGURAÇÃO DO BANCO DE DADOS (Coloque sua chave aqui) ---
const SUPABASE_URL = 'https://xiwbehvuppprfemgkooi.supabase.co';
const SUPABASE_KEY = 'SUA_ANON_KEY_AQUI'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = JSON.parse(localStorage.getItem('user')) || null;

// --- 1. CONSTRUÇÃO DA INTERFACE VIA JS ---
const injectCSS = () => {
    const style = document.createElement('style');
    style.textContent = `
        :root { --primary: #6366f1; --dark: #0f172a; --light: #f8fafc; }
        body { font-family: 'Segoe UI', sans-serif; margin: 0; background: var(--dark); color: white; overflow-x: hidden; }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .navbar { display: flex; justify-content: space-between; padding: 20px; background: #1e293b; align-items: center; }
        .menu-btn { font-size: 30px; cursor: pointer; border: none; background: none; color: white; }
        #sidePanel { position: fixed; left: 0; top: 0; width: 300px; height: 100%; background: #1e293b; z-index: 100; display: none; box-shadow: 5px 0 15px rgba(0,0,0,0.5); }
        .panel-content { padding: 20px; animation: slideIn 0.3s ease-out; }
        .user-info { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .user-img { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary); }
        .auth-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 200; }
        .auth-card { background: #1e293b; padding: 30px; border-radius: 15px; width: 90%; max-width: 400px; text-align: center; }
        .hidden { display: none !important; }
        .game-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; padding: 20px; }
        .game-card { background: #334155; border-radius: 10px; overflow: hidden; cursor: pointer; transition: 0.3s; }
        .game-card:hover { transform: scale(1.05); }
        .game-card img { width: 100%; height: 120px; object-fit: cover; }
        input, textarea, button { width: 100%; padding: 12px; margin: 8px 0; border-radius: 8px; border: none; box-sizing: border-box; }
        button { background: var(--primary); color: white; font-weight: bold; cursor: pointer; }
        .close-btn { background: #ef4444; margin-bottom: 20px; }
        #gamePlayer { position: fixed; inset: 0; background: black; z-index: 300; display: none; }
        iframe { width: 100%; height: 100%; border: none; }
    `;
    document.head.appendChild(style);
};

const buildHTML = () => {
    document.body.innerHTML = `
        <div class="navbar">
            <button class="menu-btn" onclick="togglePanel(true)">|||</button>
            <h2>Nexus Games</h2>
            <div id="topUser"></div>
        </div>

        <div id="sidePanel">
            <div class="panel-content">
                <button class="close-btn" onclick="togglePanel(false)">X Fechar</button>
                <div id="panelUserInfo"></div>
                <button onclick="logout()">Trocar Conta</button>
                <hr>
                <button onclick="alert('Sistema de criação vindo na próxima versão!')">➕ Criar Jogo</button>
            </div>
        </div>

        <div id="homeScreen">
            <h3 style="padding: 20px;">Populares agora</h3>
            <div class="game-grid" id="gameFeed"></div>
        </div>

        <div id="authScreen" class="auth-overlay hidden">
            <div class="auth-card" id="authContainer">
                </div>
        </div>

        <div id="gamePlayer">
            <button onclick="stopGame()" style="position:fixed; top:10px; right:10px; z-index:400; width: 80px;">X Sair</button>
            <iframe id="gameFrame"></iframe>
        </div>
    `;
};

// --- 2. LÓGICA DE LOGIN E CADASTRO ---
const showRegister = () => {
    const container = document.getElementById('authContainer');
    container.innerHTML = `
        <h3>Criar Conta</h3>
        <div id="photoPreview" style="width:100px; height:100px; border-radius:50%; background:#475569; margin: 0 auto; cursor:pointer; overflow:hidden; display:flex; align-items:center; justify-content:center;">
            <img id="imgAvatar" src="" class="hidden" style="width:100%; height:100%; object-fit:cover;">
            <span id="imgPlaceholder">Foto</span>
        </div>
        <input type="file" id="fileInput" accept="image/*" style="display:none">
        <input type="text" id="regName" placeholder="Nome (máx 20)" maxlength="20">
        <input type="email" id="regEmail" placeholder="E-mail">
        <input type="password" id="regPass" placeholder="Senha (sem emojis)">
        <button onclick="handleRegister()">Criar Conta</button>
        <p style="cursor:pointer" onclick="showLogin()">Já tem conta? Entrar</p>
    `;
    setupPhotoUpload();
};

const showLogin = () => {
    const container = document.getElementById('authContainer');
    container.innerHTML = `
        <h3>Bem-vindo de volta</h3>
        <div id="loginWelcome" class="hidden">
            <img id="loginAvatar" class="user-img" style="margin: 0 auto 10px auto; display:block;">
            <p id="welcomeMsg"></p>
        </div>
        <input type="text" id="loginUser" placeholder="Nome ou E-mail">
        <input type="password" id="loginPass" placeholder="Sua Senha">
        <button onclick="handleLogin()">Entrar</button>
        <p style="cursor:pointer" onclick="showRegister()">Não tem conta? Cadastrar</p>
    `;
};

async function handleRegister() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;
    const avatar = document.getElementById('imgAvatar').src;

    if(!name || !email || !pass) return alert("Preencha todos os campos!");
    if(/[\u1F600-\u1F64F]/.test(pass)) return alert("Emojis não permitidos na senha!");

    const { data, error } = await _supabase.from('profiles').insert([{ name, email, password: pass, avatar }]).select();

    if (error) {
        alert("Erro! Tente outro nome ou email. Sugestão: " + name + Math.floor(Math.random()*99));
    } else {
        loginSuccess(data[0]);
    }
}

async function handleLogin() {
    const userRef = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;

    const { data, error } = await _supabase
        .from('profiles')
        .select('*')
        .or(`name.eq."${userRef}",email.eq."${userRef}"`)
        .eq('password', pass)
        .single();

    if (data) {
        document.getElementById('loginWelcome').classList.remove('hidden');
        document.getElementById('loginAvatar').src = data.avatar;
        document.getElementById('welcomeMsg').innerText = "Bem-vindo de volta, " + data.name;
        setTimeout(() => loginSuccess(data), 1500);
    } else {
        alert("Dados incorretos!");
    }
}

// --- 3. UTILITÁRIOS ---
function setupPhotoUpload() {
    const preview = document.getElementById('photoPreview');
    const input = document.getElementById('fileInput');
    preview.onclick = () => input.click();
    input.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = () => {
            document.getElementById('imgAvatar').src = reader.result;
            document.getElementById('imgAvatar').classList.remove('hidden');
            document.getElementById('imgPlaceholder').classList.add('hidden');
        };
        reader.readAsDataURL(e.target.files[0]);
    };
}

function loginSuccess(user) {
    localStorage.setItem('user', JSON.stringify(user));
    location.reload();
}

function logout() {
    localStorage.clear();
    location.reload();
}

function togglePanel(show) {
    document.getElementById('sidePanel').style.display = show ? 'block' : 'none';
}

function updateUI() {
    if (!currentUser) return;
    const info = `
        <img src="${currentUser.avatar || ''}" class="user-img">
        <div><strong>${currentUser.name}</strong></div>
    `;
    document.getElementById('panelUserInfo').innerHTML = info;
    document.getElementById('topUser').innerHTML = info;
}

// --- INICIALIZAÇÃO ---
window.onload = () => {
    injectCSS();
    buildHTML();
    if (!currentUser) {
        document.getElementById('authScreen').classList.remove('hidden');
        showRegister();
    } else {
        updateUI();
        // Aqui você chamaria loadGames() se a tabela já existir
    }
};
