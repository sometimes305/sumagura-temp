window.SMA.startAudioContext = function () {
    if (!window.SMA.audioCtx) {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) window.SMA.audioCtx = new AudioContext();
    }
    if (window.SMA.audioCtx && window.SMA.audioCtx.state === 'suspended') {
        window.SMA.audioCtx.resume().catch(function () { });
    }
    if (window.SMA.audioCtx && window.SMA.audioCtx.state !== 'suspended') {
        window.SMA.audioUnlocked = true;
    }
};
window.SMA.initSound = window.SMA.startAudioContext;
window.SMA.bindAudioUnlock = function () {
    if (window.SMA.audioUnlockBound) return;
    window.SMA.audioUnlockBound = true;
    var done = false;
    var opts = { capture: true, passive: true };
    var events = ['touchstart', 'pointerdown', 'mousedown', 'keydown'];
    var off = function () {
        events.forEach(function (ev) { document.removeEventListener(ev, unlock, opts); });
        done = true;
    };
    var unlock = function () {
        if (done) return;
        window.SMA.startAudioContext();
        if (window.SMA.audioCtx && window.SMA.audioCtx.state !== 'suspended') off();
    };
    events.forEach(function (ev) { document.addEventListener(ev, unlock, opts); });
};
window.SMA.playSound = function (type) { if (!window.SMA.soundEnabled) return; if (window.SMA.isHost && window.SMA.isOnline && window.SMA.gameRunning) window.SMA.syncEvents.push({ type: 'snd', key: type }); if (!window.SMA.audioCtx || window.SMA.audioCtx.state === 'suspended') window.SMA.startAudioContext(); if (!window.SMA.audioCtx) return; if (window.SMA.audioCtx.state === 'suspended') window.SMA.audioCtx.resume().catch(function () { }); var osc = window.SMA.audioCtx.createOscillator(); var gain = window.SMA.audioCtx.createGain(); osc.connect(gain); gain.connect(window.SMA.audioCtx.destination); var now = window.SMA.audioCtx.currentTime; if (type === 'magic') { osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); } else if (type === 'fire') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(50, now + 0.4); gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4); osc.start(now); osc.stop(now + 0.4); } else if (type === 'spin') { osc.type = 'triangle'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(400, now + 0.2); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.2); osc.start(now); osc.stop(now + 0.2); } else if (type === 'hit') { osc.type = 'square'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(40, now + 0.1); gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); } else if (type === 'jump') { osc.type = 'sine'; osc.frequency.setValueAtTime(300, now); osc.frequency.linearRampToValueAtTime(500, now + 0.1); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.15); osc.start(now); osc.stop(now + 0.15); } else if (type === 'sword') { osc.type = 'triangle'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); } else if (type === 'shot') { osc.type = 'square'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(200, now + 0.2); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.2); osc.start(now); osc.stop(now + 0.2); } else if (type === 'special') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(800, now + 0.5); gain.gain.setValueAtTime(0.3, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.5); osc.start(now); osc.stop(now + 0.5); } else if (type === 'win') { osc.type = 'square'; osc.frequency.setValueAtTime(440, now); osc.frequency.setValueAtTime(554, now + 0.1); osc.frequency.setValueAtTime(659, now + 0.2); gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 1.0); osc.start(now); osc.stop(now + 1.0); } };

// 3. UI & MENU FUNCTIONS
window.SMA.setJoinLoading = function (loading) {
    var b1 = document.getElementById('btn-join-action');
    var b2 = document.getElementById('btn-spec-action');
    if (loading) {
        if (b1) { b1.disabled = true; b1.classList.add('disabled'); b1.innerText = "接続中..."; }
        if (b2) { b2.disabled = true; b2.classList.add('disabled'); }
    } else {
        if (b1) { b1.disabled = false; b1.classList.remove('disabled'); b1.innerText = "対戦に参加"; }
        if (b2) { b2.disabled = false; b2.classList.remove('disabled'); }
    }
};


// --- 最大人数に応じてプレイヤーカードスロットを表示 ---
window.SMA.showPlayerSlots = function (maxPlayers) {
    var s3 = document.getElementById('slot-p3');
    var s4 = document.getElementById('slot-p4');
    if (s3) s3.style.display = (maxPlayers >= 3) ? 'flex' : 'none';
    if (s4) s4.style.display = (maxPlayers >= 4) ? 'flex' : 'none';
};

window.SMA.renderSpectatorStrip = function (specs) {
    var wrap = document.getElementById('spectator-strip-wrap');
    var strip = document.getElementById('spectator-strip');
    if (!wrap || !strip) return;

    strip.innerHTML = '';
    if (!Array.isArray(specs) || specs.length === 0) {
        wrap.style.display = 'none';
        return;
    }

    specs.forEach(function (sp) {
        var name = '';
        var icon = null;
        if (typeof sp === 'string') {
            name = sp;
        } else if (sp && typeof sp === 'object') {
            name = sp.name || '';
            icon = sp.icon || null;
        }
        var el = document.createElement('div');
        el.className = 'spectator-icon';
        el.title = name || '観戦者';
        if (icon) {
            el.style.backgroundImage = 'url(' + icon + ')';
            el.textContent = '';
        } else {
            el.style.backgroundImage = 'none';
            el.textContent = '?';
        }
        strip.appendChild(el);
    });

    wrap.style.display = 'flex';
};

window.SMA.showHelp = function () { document.getElementById('menu-screen').classList.add('hidden'); document.getElementById('help-screen').classList.remove('hidden'); };
window.SMA.hideHelp = function () { document.getElementById('help-screen').classList.add('hidden'); document.getElementById('menu-screen').classList.remove('hidden'); };

// --- バトルハブ パネル切り替え ---
window.SMA.showHubSelectPanel = function () {
    var rp = document.getElementById('hub-room-panel');
    var sp = document.getElementById('hub-select-panel');
    var ab = document.getElementById('hub-action-bar');
    if (rp) { rp.classList.remove('active'); rp.style.display = 'none'; }
    if (sp) { sp.classList.add('active'); sp.style.display = 'flex'; }
    if (ab) { ab.style.display = 'flex'; }
    // バグ5: ステージ選択画面に入ったら「ステージ選択へ進む」ボタンを非表示
    var gotoBtn = document.getElementById('btn-goto-sss');
    if (gotoBtn) gotoBtn.style.display = 'none';
};
window.SMA.showHubRoomPanel = function () {
    var rp = document.getElementById('hub-room-panel');
    var sp = document.getElementById('hub-select-panel');
    var ab = document.getElementById('hub-action-bar');
    if (sp) { sp.classList.remove('active'); sp.style.display = 'none'; }
    if (rp) { rp.classList.add('active'); rp.style.display = 'flex'; }
    if (ab) { ab.style.display = 'none'; }
};

// --- ソロモード ---
