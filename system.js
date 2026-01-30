// CONFIGURAÇÃO DO BANCO DE DADOS
const SUPABASE_URL = 'https://xiwbehvuppprfemgkooi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cwgR_d3Ncek3D0AqtdE9ow_QUyOMgRQ'; // Substitua pela sua chave pública
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = JSON.parse(localStorage.getItem('user')) || null;

// Inicialização
window.onload = () => {
    if (!currentUser) {
        document.getElementById('authScreen').classList.remove('hidden');
    } else {
        updateUI();
        loadGames();
    }
};

// --- Funções de Interface ---
function togglePanel(show) {
    const panel = document.getElementById('sidePanel');
    panel.style.display = show ? 'block' : 'none';
}

function updateUI() {
    if (!currentUser) return;
    const info = `
        <img src="${currentUser.avatar || 'https://via.placeholder.com/50'}" class="user-img">
        <div>
            <strong>${currentUser.name}</strong>
        </div>
    `;
    document.getElementById('panelUserInfo').innerHTML = info;
    document.getElementById('topUser').innerHTML = info;
}

// --- Lógica de Cadastro/Login ---
document.getElementById('photoPreview').onclick = () => document.getElementById('fileInput').click();

document.getElementById('fileInput').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = () => {
        document.getElementById('imgAvatar').src = reader.result;
        document.getElementById('imgAvatar').classList.remove('hidden');
        document.getElementById('imgPlaceholder').classList.add('hidden');
    };
    reader.readAsDataURL(e.target.files[0]);
};

async function handleRegister() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;
    const avatar = document.getElementById('imgAvatar').src;

    if (name.length > 20 || /[\u1F600-\u1F64F]/.test(pass)) {
        alert("Verifique o nome (máx 20) ou senha (sem emojis)");
        return;
    }

    // No Supabase, você faria um insert na tabela 'profiles'
    const { data, error } = await _supabase
        .from('profiles')
        .insert([{ name, email, password: pass, avatar }])
        .select();

    if (error) {
        alert("Nome ou Email já existem! Tente sugestões como: " + name + Math.floor(Math.random()*99));
    } else {
        currentUser = data[0];
        localStorage.setItem('user', JSON.stringify(currentUser));
        document.getElementById('authScreen').classList.add('hidden');
        updateUI();
    }
}

// --- Sistema de Jogos ---
async function loadGames() {
    const { data: games, error } = await _supabase
        .from('games')
        .select('*')
        .order('likes', { ascending: false });

    const feed = document.getElementById('gameFeed');
    feed.innerHTML = '';

    games.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <img src="${game.cover || 'https://via.placeholder.com/150'}">
            <div class="game-info">
                <strong>${game.title}</strong>
                <p>👍 ${game.likes} | 🎮 ${game.playing}K</p>
            </div>
        `;
        card.onclick = () => openGameDetail(game);
        feed.appendChild(card);
    });
}

let activeGame = null;
function openGameDetail(game) {
    activeGame = game;
    document.getElementById('modalGameTitle').innerText = game.title;
    document.getElementById('modalGameDesc').innerText = game.description;
    document.getElementById('modalGameImg').src = game.cover;
    document.getElementById('gameModal').classList.remove('hidden');
}

function closeGameModal() {
    document.getElementById('gameModal').classList.add('hidden');
}

function playGame() {
    if (!activeGame) return;
    const frame = document.getElementById('gameFrame');
    frame.srcdoc = activeGame.html_script;
    document.getElementById('gamePlayer').style.display = 'block';
    // Atualizar contador de jogadores no banco aqui...
}

function stopGame() {
    document.getElementById('gameFrame').srcdoc = '';
    document.getElementById('gamePlayer').style.display = 'none';
}

function logout() {
    localStorage.clear();
    location.reload();
}
