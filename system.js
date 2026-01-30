// CONFIGURAÇÃO DO BANCO DE DADOS
const SUPABASE_URL = 'https://xiwbehvuppprfemgkooi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cwgR_d3Ncek3D0AqtdE9ow_QUyOMgRQ'; // Eu sei que você já tem a sua, mantenha-a!
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = JSON.parse(localStorage.getItem('user')) || null;

// Inicialização Garantida
document.addEventListener('DOMContentLoaded', () => {
    if (!currentUser) {
        showAuthVisuals();
    } else {
        updateUI();
        loadGames();
    }
});

// --- Sistema de Visibilidade de Telas ---
function showAuthVisuals() {
    document.getElementById('authScreen').classList.remove('hidden');
    // Garante que comece no modo Cadastro se não houver conta
    document.getElementById('registerForm').classList.remove('hidden');
}

// --- Cadastro com Verificação de Duplicados ---
async function handleRegister() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value;
    const avatar = document.getElementById('imgAvatar').src;

    if (!name || !email || !pass) return alert("Preencha tudo!");
    if (name.length > 20) return alert("Nome muito longo!");
    if (/[\u1F600-\u1F64F]/.test(pass)) return alert("Emojis não são permitidos na senha!");

    // Tenta inserir no Supabase
    const { data, error } = await _supabase
        .from('profiles')
        .insert([{ 
            name: name, 
            email: email, 
            password: pass, 
            avatar: avatar 
        }])
        .select();

    if (error) {
        // Se der erro de duplicata (error.code 23505), gera sugestão
        const suggestion = name + Math.floor(Math.random() * 999);
        alert(`Este nome ou email já existe! Sugestão: ${suggestion}`);
        console.error("Erro Supabase:", error.message);
    } else {
        currentUser = data[0];
        saveAndEnter();
    }
}

// --- Sistema de Login (O que estava faltando) ---
async function handleLogin() {
    const identifier = document.getElementById('loginUser').value; // Nome ou Email
    const pass = document.getElementById('loginPass').value;

    const { data, error } = await _supabase
        .from('profiles')
        .select('*')
        .or(`name.eq.${identifier},email.eq.${identifier}`)
        .eq('password', pass)
        .single();

    if (data) {
        alert(`Bem-vindo de volta ${data.name}!`);
        currentUser = data;
        saveAndEnter();
    } else {
        alert("Usuário ou senha incorretos!");
    }
}

function saveAndEnter() {
    localStorage.setItem('user', JSON.stringify(currentUser));
    document.getElementById('authScreen').classList.add('hidden');
    updateUI();
    loadGames();
    location.reload(); // Recarrega para limpar estados antigos
}

// --- Carregar Jogos e Feed ---
async function loadGames() {
    const { data: games, error } = await _supabase
        .from('games')
        .select('*')
        .order('likes', { ascending: false });

    if (error) return console.error("Erro ao carregar jogos:", error);

    const feed = document.getElementById('gameFeed');
    feed.innerHTML = '';

    games.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <img src="${game.cover || 'https://via.placeholder.com/150'}">
            <div class="game-info">
                <strong>${game.title}</strong>
                <p>🎮 ${game.playing >= 1000 ? (game.playing/1000).toFixed(1) + 'K' : game.playing}</p>
            </div>
        `;
        card.onclick = () => openGameDetail(game);
        feed.appendChild(card);
    });
}

// --- Funções de Interface Base ---
function togglePanel(show) {
    const panel = document.getElementById('sidePanel');
    panel.style.display = show ? 'block' : 'none';
}

function updateUI() {
    if (!currentUser) return;
    const userInfoHTML = `
        <img src="${currentUser.avatar || 'https://via.placeholder.com/50'}" class="user-img" style="border-radius:50%">
        <div>
            <strong>${currentUser.name}</strong>
            <p style="font-size:10px; color:gray;">Online</p>
        </div>
    `;
    document.getElementById('panelUserInfo').innerHTML = userInfoHTML;
}
