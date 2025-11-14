/* Rizz — script simples (dados locais + UI) */
(() => {
  // Dados de exemplo (servidores, canais, mensagens)
  const example = {
    servers: [
      { id: 's1', name: 'Rizz Hub', short: 'RH', color: '#6ee7b7' },
      { id: 's2', name: 'Estudo', short: 'ES', color: '#9ad3f5' },
      { id: 's3', name: 'Lazer', short: 'LZ', color: '#f6c179' }
    ],
    channels: {
      s1: [
        { id: 'c1', name: 'geral', topic: 'Bate-papo geral' },
        { id: 'c2', name: 'anuncios', topic: 'Novidades e avisos' },
        { id: 'c3', name: 'projetos', topic: 'Projetos em andamento' }
      ],
      s2: [
        { id: 'c4', name: 'aulas', topic: 'Aulas e materiais' },
        { id: 'c5', name: 'duvidas', topic: 'Tira-dúvidas' }
      ],
      s3: [
        { id: 'c6', name: 'música', topic: 'Compartilhe músicas' },
        { id: 'c7', name: 'memes', topic: 'Memes e diversão' }
      ]
    },
    messages: {
      c1: [
        { id: 'm1', user: 'Lia', avatar: 'L', text: 'Bem-vind@s ao canal geral do Rizz!' },
        { id: 'm2', user: 'Bruno', avatar: 'B', text: 'Olá pessoal — testando o chat.' }
      ],
      c2: [
        { id: 'm3', user: 'Admin', avatar: 'A', text: 'Lançamos a versão 1.0 do Rizz.' }
      ],
      c4: [
        { id: 'm4', user: 'Profª Ana', avatar: 'A', text: 'A aula começa às 19h.' }
      ]
    }
  };

  // Estado
  let state = {
    currentServer: 's1',
    currentChannel: 'c1',
    data: {}
  };

  // DOM references
  const serverList = document.getElementById('serverList');
  const channelList = document.getElementById('channelList');
  const messagesEl = document.getElementById('messages');
  const chatTitle = document.querySelector('.chat-title');
  const chatSub = document.querySelector('.chat-sub');
  const messageForm = document.getElementById('messageForm');
  const messageInput = document.getElementById('messageInput');
  const addServerBtn = document.getElementById('addServerBtn');

  // Local storage keys
  const STORAGE_KEY = 'rizz_state_v1';

  // load initial data: from localStorage or example
  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        state.data = JSON.parse(raw);
      } catch(e) {
        state.data = example;
      }
    } else {
      state.data = example;
    }

    // ensure messages for channels exist
    for (const s of state.data.servers) {
      const chans = state.data.channels[s.id] || [];
      for (const c of chans) {
        state.data.messages[c.id] = state.data.messages[c.id] || [];
      }
    }

    renderServers();
    renderChannels();
    renderMessages();
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  }

  // Render servers
  function renderServers() {
    serverList.innerHTML = '';
    state.data.servers.forEach(s => {
      const el = document.createElement('div');
      el.className = 'server' + (s.id === state.currentServer ? ' active' : '');
      el.textContent = s.short || s.name[0];
      el.title = s.name;
      el.style.color = s.color || '';
      el.onclick = () => {
        state.currentServer = s.id;
        // pick first channel of server
        const first = (state.data.channels[s.id] && state.data.channels[s.id][0]);
        state.currentChannel = first ? first.id : null;
        renderServers(); renderChannels(); renderMessages();
      };
      serverList.appendChild(el);
    });
  }

  // Render channels
  function renderChannels() {
    channelList.innerHTML = '';
    const channels = state.data.channels[state.currentServer] || [];
    channels.forEach(ch => {
      const li = document.createElement('li');
      li.className = 'channel' + (ch.id === state.currentChannel ? ' active' : '');
      li.setAttribute('role','button');
      li.innerHTML = `<span class="hash">#</span><span class="cname">${ch.name}</span>`;
      li.onclick = () => {
        state.currentChannel = ch.id;
        renderChannels(); renderMessages();
      };
      channelList.appendChild(li);
    });

    // update header info
    const current = channels.find(c => c.id === state.currentChannel) || channels[0] || {name:'Sem canal', topic:''};
    chatTitle.textContent = '#' + current.name;
    chatSub.textContent = current.topic || '';
  }

  // Render messages
  function renderMessages() {
    messagesEl.innerHTML = '';
    const msgs = state.data.messages[state.currentChannel] || [];
    if (!msgs || msgs.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.style.opacity = 0.7;
      empty.textContent = 'Nenhuma mensagem ainda — seja o primeiro a escrever.';
      messagesEl.appendChild(empty);
      return;
    }

    msgs.forEach(m => {
      const div = document.createElement('div');
      div.className = 'message';
      const avatar = document.createElement('div');
      avatar.className = 'msg-avatar';
      avatar.textContent = m.avatar || m.user[0] || 'U';
      const body = document.createElement('div');
      body.className = 'msg-body';
      body.innerHTML = `<div class="msg-meta"><div class="msg-user">${escapeHtml(m.user)}</div><div class="msg-time">${formatTime(m.created)}</div></div>
                        <div class="msg-text">${escapeHtml(m.text)}</div>`;
      div.appendChild(avatar); div.appendChild(body);
      messagesEl.appendChild(div);
    });

    // scroll to bottom
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // send message
  messageForm.addEventListener('submit', function(e){
    e.preventDefault();
    const txt = messageInput.value.trim();
    if(!txt || !state.currentChannel) return;
    const newMsg = {
      id: 'm' + Date.now(),
      user: 'Você',
      avatar: 'V',
      text: txt,
      created: new Date().toISOString()
    };
    state.data.messages[state.currentChannel] = state.data.messages[state.currentChannel] || [];
    state.data.messages[state.currentChannel].push(newMsg);
    messageInput.value = '';
    save();
    renderMessages();
    messageInput.focus();
  });

  // Add server button (simple prompt)
  addServerBtn.addEventListener('click', function(){
    const name = prompt('Nome do novo servidor (ex: Meu Grupo)');
    if(!name) return;
    const id = 's' + Date.now();
    const short = name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
    const color = randomAccent();
    state.data.servers.push({id,name,short,color});
    // create default channel
    state.data.channels[id] = [{id: 'c' + Date.now(), name: 'geral', topic: 'Canal geral'}];
    state.currentServer = id;
    state.currentChannel = state.data.channels[id][0].id;
    save();
    renderServers(); renderChannels(); renderMessages();
  });

  // Helpers
  function randomAccent(){
    const arr = ['#6ee7b7','#9ad3f5','#f6c179','#d6b3ff','#f7a6b2'];
    return arr[Math.floor(Math.random()*arr.length)];
  }
  function formatTime(iso){
    if(!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // keyboard shortcut: enter sends, shift+enter newline (handled by form submit)
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      messageForm.requestSubmit();
    }
  });

  // Initialize
  load();
})();
