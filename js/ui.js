window.onload = function () {
    var g = function (id) { return document.getElementById(id); };
    g('overlay-msg').innerText = "READY";
    window.SMA.applyTopExclusionLayout();

    // Helper function defined FIRST
    window.SMA.saveSettings = function () {
        try {
            localStorage.setItem('sma_name', document.getElementById('username').value);
            localStorage.setItem('sma_sound', window.SMA.soundEnabled);
        } catch (e) { }
    };
    window.SMA.loadSettings = function () {
        try {
            var n = localStorage.getItem('sma_name');
            if (n) {
                document.getElementById('username').value = n; window.SMA.localPlayerName = n;
                var dn = document.getElementById('display-username'); if (dn) dn.innerText = n;
            }
            var icon = localStorage.getItem('sma_icon');
            if (icon) {
                window.SMA.localPlayerIcon = icon;
                var profImg = document.getElementById('profile-icon-img');
                var profEmoji = document.getElementById('profile-icon-emoji');
                if (profImg && profEmoji) { profImg.src = icon; profImg.style.display = 'block'; profEmoji.style.display = 'none'; }
            }
            var s = localStorage.getItem('sma_sound');
            if (s !== null) {
                window.SMA.soundEnabled = (s === 'true');
                var btn = g('btn-sound');
                if (btn) {
                    btn.innerText = "サウンド: " + (window.SMA.soundEnabled ? "ON" : "OFF");
                    if (window.SMA.soundEnabled) btn.classList.remove('sound-off'); else btn.classList.add('sound-off');
                }
            }
        } catch (e) { }
    };
    window.SMA.loadSettings();
    window.SMA.bindAudioUnlock();

    // Gravity環境の場合はユーザー情報取得を開始
    window.SMA.initGravity();

    var bindBtn = function (id, func) {
        var btn = g(id);
        if (btn) {
            var press = function () { btn.classList.add('pressed'); };
            var release = function () { btn.classList.remove('pressed'); };

            btn.addEventListener('touchstart', press, { passive: true });
            btn.addEventListener('touchend', release, { passive: true });
            btn.addEventListener('mousedown', press);
            btn.addEventListener('mouseup', release);
            btn.addEventListener('mouseleave', release);

            var action = function (e) {
                console.log('Button clicked:', id);
                e.preventDefault(); e.stopPropagation();
                if (btn.classList.contains('disabled') || btn.disabled) return;
                setTimeout(function () {
                    try { func.apply(this); } catch (err) { console.error("Menu Error: ", err); reportError("Menu: " + err); }
                }, 80);
            };
            btn.addEventListener('touchstart', action, { passive: false });
            btn.addEventListener('click', action);
        }
    };

    var loadLayout = function () {
        var s = localStorage.getItem('sumagura_layout');
        if (s) {
            try {
                var layout = JSON.parse(s);
                for (var id in layout) {
                    var el = g(id);
                    if (el && layout[id] && layout[id].left) { // Check if valid
                        el.style.left = layout[id].left;
                        el.style.top = layout[id].top;
                        el.style.bottom = 'auto'; el.style.right = 'auto';
                    }
                }
            } catch (e) { }
        }
    };
    try { loadLayout(); } catch (e) { }

    // Draggable Logic
    var dragItem = null; var dragOffset = { x: 0, y: 0 };
    var onDragStart = function (e) {
        if (!window.SMA.isEditingLayout) return;
        var t = e.changedTouches ? e.changedTouches[0] : e;
        dragItem = e.currentTarget;
        var rect = dragItem.getBoundingClientRect();
        dragOffset.x = t.clientX - rect.left;
        dragOffset.y = t.clientY - rect.top;
        dragItem.classList.add('editing');
        e.preventDefault();
    };
    var onDragMove = function (e) {
        if (!dragItem) return;
        var t = e.changedTouches ? e.changedTouches[0] : e;
        var x = t.clientX - dragOffset.x;
        var y = t.clientY - dragOffset.y;
        dragItem.style.left = x + 'px';
        dragItem.style.top = y + 'px';
        dragItem.style.bottom = 'auto'; dragItem.style.right = 'auto';
        e.preventDefault();
    };
    var onDragEnd = function (e) {
        if (dragItem) dragItem.classList.remove('editing');
        dragItem = null;
    };
    var makeDraggable = function (id) {
        var el = g(id);
        if (!el) return;
        el.addEventListener('touchstart', onDragStart, { passive: false });
        el.addEventListener('touchmove', onDragMove, { passive: false });
        el.addEventListener('touchend', onDragEnd, { passive: false });
        el.addEventListener('mousedown', onDragStart);
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
    };
    ['btn-attack', 'btn-jump', 'btn-grab', 'btn-shield', 'joystick-area'].forEach(makeDraggable);

    var startConfig = function () {
        window.SMA.isEditingLayout = true;
        g('menu-screen').classList.add('hidden');
        g('controller-area').style.display = 'block';
        // Add editing-mode class to container
        g('game-container').classList.add('editing-mode');
        g('config-overlay').classList.remove('hidden');
        var btns = document.querySelectorAll('.btn');
        btns.forEach(function (b) { b.classList.add('editing'); });
        g('joystick-area').classList.add('editing');
    };
    var saveConfig = function () {
        window.SMA.isEditingLayout = false;
        var layout = {};
        ['btn-attack', 'btn-jump', 'btn-grab', 'btn-shield', 'joystick-area'].forEach(function (id) {
            var el = g(id);
            layout[id] = { left: el.style.left, top: el.style.top };
            el.classList.remove('editing');
        });
        try { localStorage.setItem('sumagura_layout', JSON.stringify(layout)); } catch (e) { }
        g('game-container').classList.remove('editing-mode');
        g('config-overlay').classList.add('hidden');
        g('controller-area').style.display = 'none';
        g('menu-screen').classList.remove('hidden');
    };
    var resetLayout = function () {
        try { localStorage.removeItem('sumagura_layout'); } catch (e) { }
        location.reload();
    };

    bindBtn('btn-config', startConfig);
    bindBtn('btn-save-layout', saveConfig);
    bindBtn('btn-reset-layout', resetLayout);

    bindBtn('btn-solo', window.SMA.enterSoloMode);
    bindBtn('btn-online', function () {
        window.SMA.startAudioContext();
        document.getElementById('menu-screen').classList.add('hidden');
        var onlineScreen = document.getElementById('online-menu-screen');
        onlineScreen.classList.remove('hidden');
        onlineScreen.style.display = 'flex';
        if (window.SMA.isGravity && window.SMA.gravityAutoJoinRoom) {
            window.SMA.showGravityJoinRoom(window.SMA.gravityAutoJoinRoom);
        } else {
            window.SMA.fetchRoomList();
        }
    });
    bindBtn('btn-online-back', function () {
        var onlineScreen = document.getElementById('online-menu-screen');
        onlineScreen.classList.add('hidden');
        onlineScreen.style.display = 'none';
        document.getElementById('menu-screen').classList.remove('hidden');
    });
    bindBtn('btn-refresh-rooms', function () { window.SMA.startAudioContext(); window.SMA.fetchRoomList(); });

    // Add copy Room ID button logic
    var btnCopy = document.getElementById('btn-copy-room-id');
    if (btnCopy) {
        btnCopy.addEventListener('click', function () {
            var rid = window.SMA.gravityRoomId;
            if (rid && navigator.clipboard) {
                navigator.clipboard.writeText(rid).then(() => {
                    window.SMA.showNotification("部屋IDをコピーしました！", 2000);
                }).catch(err => {
                    console.error("Copy failed", err);
                });
            } else if (rid) {
                // Fallback for older browsers
                var textArea = document.createElement("textarea");
                textArea.value = rid;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    window.SMA.showNotification("部屋IDをコピーしました！", 2000);
                } catch (err) { }
                document.body.removeChild(textArea);
            }
        });
    }

    bindBtn('btn-create', function () { window.SMA.startAudioContext(); if (window.SMA.isGravity) window.SMA.showGravityCreateRoom(); else window.SMA.showCreateRoom(); });
    bindBtn('btn-join', function () { window.SMA.startAudioContext(); window.SMA.showJoinRoom(); });
    bindBtn('btn-join-action', function () { if (window.SMA.isGravity) window.SMA.showGravityJoinRoom(); else window.SMA.joinRoom('join'); });
    bindBtn('btn-spec-action', function () {
        if (window.SMA.isGravity) window.SMA.showGravityJoinRoom(null, 'spec');
        else window.SMA.joinRoom('spec');
    });
    bindBtn('btn-join-cancel', function () { location.reload(); });
    bindBtn('btn-rematch', function () { window.SMA.rematch(); });
    bindBtn('btn-title', function () { location.reload(); });
    bindBtn('btn-goto-sss', function () { window.SMA.broadcast({ type: 'goto_hub_select' }); window.SMA.showHubSelectPanel(); });
    bindBtn('btn-create-cancel', function () { location.reload(); });

    // STAGE SELECT
    var bindStage = function (id, stageId) {
        var card = g(id);
        if (card) {
            var act = function (e) {
                e.preventDefault(); e.stopPropagation();
                window.SMA.selectStage(stageId);
            };
            card.addEventListener('touchstart', act, { passive: false });
            card.addEventListener('click', act);
        }
    };
    bindStage('stage-battlefield', 'battlefield');
    bindStage('stage-final', 'final');

    // CHAR SELECT BINDINGS
    var bindChar = function (id, charId) {
        var card = g(id);
        if (card) {
            var act = function (e) {
                e.preventDefault(); e.stopPropagation();
                window.SMA.selectChar(charId);
            };
            card.addEventListener('touchstart', act, { passive: false });
            card.addEventListener('click', act);
        }
    };
    bindChar('card-sword', 'sword');
    bindChar('card-mage', 'mage');
    bindChar('card-brawler', 'brawler');
    bindChar('card-spear', 'spear');
    bindChar('card-hammer', 'hammer');
    bindChar('card-mirror', 'mirror');
    bindChar('card-angel', 'angel');

    // BATTLE HUB BUTTONS
    bindBtn('btn-hub-start', function () {
        if (!window.SMA.isHost) return;
        var activeRoles = ['p1'];
        if (window.SMA.connections.find(c => c.role === 'p2')) activeRoles.push('p2');
        if (window.SMA.connections.find(c => c.role === 'p3')) activeRoles.push('p3');
        if (window.SMA.connections.find(c => c.role === 'p4')) activeRoles.push('p4');
        window.SMA.executeHubFinalStart(activeRoles);
    });
    bindBtn('btn-hub-ready', function () { window.SMA.toggleHubReady(); });
    bindBtn('btn-hub-cancel-ready', function () {
        console.log("[SMA] Cancel ready clicked");
        var overlay = document.getElementById('hub-start-overlay');
        if (overlay) overlay.style.display = 'none';
        window.SMA.amIReady = false;
        var btnReady = document.getElementById('btn-hub-ready');
        if (btnReady) { btnReady.innerText = "準備完了！"; btnReady.style.background = ""; btnReady.style.borderColor = ""; }
        if (window.SMA.isOnline) {
            var hubRole = (window.SMA.myRole === 'host') ? 'p1' : window.SMA.myRole;
            var msg = { type: 'hub_ready', role: hubRole, ready: false, stageId: window.SMA.myStageId, charId: window.SMA.myCharId };
            if (window.SMA.isHost) { window.SMA.updateHubState(msg); window.SMA.broadcast(msg); }
            else { if (window.SMA.isGravity && window.SMA.gravityUsePeerInMatch) window.SMA.broadcast(msg); else if (window.SMA.netConn) window.SMA.netConn.send(msg); }
        }
    });
    bindBtn('btn-hub-back', function () { location.reload(); });

    if (g('btn-sound')) {
        var sndAction = function (e) {
            e.preventDefault(); e.stopPropagation();
            window.SMA.soundEnabled = !window.SMA.soundEnabled;
            this.innerText = "サウンド: " + (window.SMA.soundEnabled ? "ON" : "OFF");
            if (window.SMA.soundEnabled) { this.classList.remove('sound-off'); window.SMA.startAudioContext(); } else { this.classList.add('sound-off'); }
            window.SMA.saveSettings();
        };
        g('btn-sound').addEventListener('touchstart', sndAction, { passive: false });
        g('btn-sound').addEventListener('click', sndAction);
        // Also add visual press logic to sound button manually or via bindBtn? 
        // bindBtn is generic helper. Sound logic is custom.
        // Let's attach the visual helpers to sound button too.
        var btn = g('btn-sound');
        var press = function () { btn.classList.add('pressed'); };
        var release = function () { btn.classList.remove('pressed'); };
        btn.addEventListener('touchstart', press, { passive: true });
        btn.addEventListener('touchend', release, { passive: true });
        btn.addEventListener('mousedown', press);
        btn.addEventListener('mouseup', release);
        btn.addEventListener('mouseleave', release);
    }
    bindBtn('btn-help', function () { window.SMA.showHelp(); });
    bindBtn('btn-close-help', function () { window.SMA.hideHelp(); });

    // RESTORED JOYSTICK LOGIC
    var joy = g('joystick-area');
    var knob = g('joystick-knob');
    var joyTouchId = null;
    var moveJoy = function (cx, cy) {
        var rect = joy.getBoundingClientRect();
        var cnt = { x: rect.left + 80, y: rect.top + 80 };
        var dx = cx - cnt.x; var dy = cy - cnt.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        var r = 40; var f = d > r ? r / d : 1;
        knob.style.transform = "translate(calc(-50% + " + (dx * f) + "px), calc(-50% + " + (dy * f) + "px))";
        window.SMA.myKeys.right = dx > 15; window.SMA.myKeys.left = dx < -15; window.SMA.myKeys.down = dy > 38; window.SMA.myKeys.up = dy < -38;
    };
    var endJoy = function () { joyTouchId = null; knob.style.transform = "translate(-50%,-50%)"; window.SMA.myKeys.left = window.SMA.myKeys.right = window.SMA.myKeys.up = window.SMA.myKeys.down = false; };
    var onTouch = function (e) {
        if (window.SMA.isEditingLayout || window.SMA.myRole === 'spec') return; // FIX FOR JOYSTICK IN GAME
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; if (e.type === 'touchstart') { if (joyTouchId === null) { joyTouchId = t.identifier; moveJoy(t.clientX, t.clientY); } } else if (e.type === 'touchmove') { if (joyTouchId === t.identifier) { moveJoy(t.clientX, t.clientY); } } else if (e.type === 'touchend' || e.type === 'touchcancel') { if (joyTouchId === t.identifier) { endJoy(); } } }
    };
    joy.addEventListener('touchstart', onTouch, { passive: false });
    joy.addEventListener('touchmove', onTouch, { passive: false });
    joy.addEventListener('touchend', onTouch, { passive: false });
    joy.addEventListener('touchcancel', onTouch, { passive: false });
    var isMouseDown = false;
    joy.addEventListener('mousedown', function (e) {
        if (window.SMA.isEditingLayout || window.SMA.myRole === 'spec') return; // FIX MOUSE
        isMouseDown = true; moveJoy(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', function (e) { if (isMouseDown) moveJoy(e.clientX, e.clientY); });
    window.addEventListener('mouseup', function (e) { if (isMouseDown) { isMouseDown = false; endJoy(); } });

    var pressControl = function (k, e) {
        if (window.SMA.isEditingLayout || window.SMA.myRole === 'spec') return;
        try { if (e && e.cancelable) e.preventDefault(); } catch (err) { }
        window.SMA.myKeys[k] = true;
        if (window.SMA.gameRunning) {
            if (window.SMA.isHost && window.SMA.pOne) {
                if (k === 'jump') window.SMA.pOne.triggerJump(window.SMA.myKeys);
                if (k === 'attack') window.SMA.pOne.startCharge();
                if (k === 'grab') {
                    var target = null; var minDist = Infinity;
                    window.SMA.players.forEach(function (p) {
                        if (p === window.SMA.pOne || p.stocks <= 0) return;
                        var d = Math.abs(p.x - window.SMA.pOne.x);
                        if (d < minDist) { minDist = d; target = p; }
                    });
                    window.SMA.pOne.tryGrab(target);
                }
            }
        }
        if (window.SMA.isGravity && window.SMA.gravityUsePeerInMatch) {
            if (k === 'jump') window.SMA.sendGravityInput({ ...window.SMA.myKeys, triggerJump: true });
            if (k === 'attack') window.SMA.sendGravityInput({ ...window.SMA.myKeys, triggerStartCharge: true });
            if (k === 'grab') window.SMA.sendGravityInput({ ...window.SMA.myKeys, triggerGrab: true });
        } else if (window.SMA.netConn && window.SMA.netConn.open) {
            if (k === 'jump') window.SMA.netConn.send({ type: 'input', keys: { ...window.SMA.myKeys, triggerJump: true } });
            if (k === 'attack') window.SMA.netConn.send({ type: 'input', keys: { ...window.SMA.myKeys, triggerStartCharge: true } });
            if (k === 'grab') window.SMA.netConn.send({ type: 'input', keys: { ...window.SMA.myKeys, triggerGrab: true } });
        }
    };
    var releaseControl = function (k, e) {
        if (window.SMA.isEditingLayout || window.SMA.myRole === 'spec') return;
        try { if (e && e.cancelable) e.preventDefault(); } catch (err) { }
        window.SMA.myKeys[k] = false;
        var type = 'NEUTRAL';
        if (window.SMA.myKeys.up) type = 'UP';
        else if (window.SMA.myKeys.down) type = 'DOWN';
        else if (window.SMA.myKeys.left || window.SMA.myKeys.right) type = 'SIDE';
        if (window.SMA.gameRunning && window.SMA.isHost && window.SMA.pOne) {
            if (k === 'attack') window.SMA.pOne.releaseAttack(type);
        }
        if (k === 'attack') {
            if (window.SMA.isGravity && window.SMA.gravityUsePeerInMatch) window.SMA.sendGravityInput({ ...window.SMA.myKeys, triggerReleaseAttack: true, attackType: type });
            else if (window.SMA.netConn && window.SMA.netConn.open) window.SMA.netConn.send({ type: 'input', keys: { ...window.SMA.myKeys, triggerReleaseAttack: true, attackType: type } });
        }
    };
    var bind = function (id, k) {
        var el = g(id);
        var d = function (e) {
            if (window.SMA.isEditingLayout || window.SMA.myRole === 'spec') return;
            pressControl(k, e);
        };
        var u = function (e) {
            if (window.SMA.isEditingLayout || window.SMA.myRole === 'spec') return;
            releaseControl(k, e);
        };
        try { el.addEventListener('touchstart', d, { passive: false }); } catch (e) { el.addEventListener('touchstart', d); }
        try { el.addEventListener('touchend', u, { passive: false }); } catch (e) { el.addEventListener('touchend', u); }
        try { el.addEventListener('touchcancel', u, { passive: false }); } catch (e) { el.addEventListener('touchcancel', u); }
        el.addEventListener('mousedown', d); el.addEventListener('mouseup', u); el.addEventListener('mouseleave', u);
    };
    bind('btn-jump', 'jump'); bind('btn-attack', 'attack'); bind('btn-grab', 'grab'); bind('btn-shield', 'shield');
    var keyDirMap = { KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down' };
    var keyButtonMap = { Space: 'jump' };
    var getAttackType = function () {
        if (window.SMA.myKeys.up) return 'UP';
        if (window.SMA.myKeys.down) return 'DOWN';
        if (window.SMA.myKeys.left || window.SMA.myKeys.right) return 'SIDE';
        return 'NEUTRAL';
    };
    var releaseStuckControls = function () {
        var attackWasHeld = !!window.SMA.myKeys.attack;
        var type = getAttackType();
        if (attackWasHeld && window.SMA.gameRunning && window.SMA.isHost && window.SMA.pOne) {
            window.SMA.pOne.releaseAttack(type);
        }
        window.SMA.myKeys.left = false;
        window.SMA.myKeys.right = false;
        window.SMA.myKeys.up = false;
        window.SMA.myKeys.down = false;
        window.SMA.myKeys.attack = false;
        window.SMA.myKeys.jump = false;
        window.SMA.myKeys.grab = false;
        window.SMA.myKeys.shield = false;
    };
    var getKeyButton = function (e) {
        if (keyButtonMap[e.code]) return keyButtonMap[e.code];
        if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Space') return 'jump';
        return null;
    };
    var shouldUseGameKeys = function (e) {
        if (window.SMA.isEditingLayout || window.SMA.myRole === 'spec') return false;
        var t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return false;
        return !!(keyDirMap[e.code] || getKeyButton(e));
    };
    window.addEventListener('keydown', function (e) {
        if (!shouldUseGameKeys(e)) return;
        if (keyDirMap[e.code]) window.SMA.myKeys[keyDirMap[e.code]] = true;
        else {
            var keyButton = getKeyButton(e);
            if (keyButton && !e.repeat) pressControl(keyButton, e);
        }
        e.preventDefault();
    });
    window.addEventListener('keyup', function (e) {
        if (!shouldUseGameKeys(e)) return;
        if (keyDirMap[e.code]) window.SMA.myKeys[keyDirMap[e.code]] = false;
        else {
            var keyButton = getKeyButton(e);
            if (keyButton) releaseControl(keyButton, e);
        }
        e.preventDefault();
    });
    window.addEventListener('blur', releaseStuckControls);
    window.addEventListener('pagehide', releaseStuckControls);
    window.addEventListener('resize', function () {
        window.SMA.applyTopExclusionLayout();
        window.SMA.initCanvas();
    });
};

