window.SMA.makeGravityHostPeerId = function (roomId) {
    var rid = String(roomId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!rid) rid = 'room';
    rid = rid.slice(-24);
    return "sma_rt_" + rid;
};

window.SMA.parseGravityRtData = async function (d) {
    try {
        if (typeof Blob !== 'undefined' && d instanceof Blob) {
            if (typeof d.text === 'function') d = await d.text();
            else {
                d = await new Promise(function (resolve, reject) {
                    var fr = new FileReader();
                    fr.onload = function () { resolve(fr.result); };
                    fr.onerror = reject;
                    fr.readAsText(d);
                });
            }
        } else if (typeof ArrayBuffer !== 'undefined' && d instanceof ArrayBuffer) {
            d = new TextDecoder().decode(new Uint8Array(d));
        }
        if (typeof d === 'string') d = JSON.parse(d);
        return (d && typeof d === 'object') ? d : null;
    } catch (e) {
        return null;
    }
};

window.SMA.stopGravityRealtime = function () {
    if (window.SMA.gravityRtConns && window.SMA.gravityRtConns.length) {
        window.SMA.gravityRtConns.forEach(function (c) { try { if (c && c.open) c.close(); } catch (e) { } });
    }
    window.SMA.gravityRtConns = [];
    if (window.SMA.gravityRtConn) { try { if (window.SMA.gravityRtConn.open) window.SMA.gravityRtConn.close(); } catch (e) { } }
    window.SMA.gravityRtConn = null;
    if (window.SMA.gravityRtPeer) { try { window.SMA.gravityRtPeer.destroy(); } catch (e) { } }
    window.SMA.gravityRtPeer = null;
    window.SMA.gravityRtOutbox = [];
};

window.SMA.handleGravityPeerHostMessage = function (c, d) {
    if (!d || typeof d !== 'object') return;
    if (d.ver && d.ver !== window.SMA.VERSION) {
        try { c.send({ type: 'error', msg: 'VERSION MISMATCH' }); } catch (e) { }
        var ov = document.getElementById('overlay-msg');
        if (ov) ov.innerText = "VERSION MISMATCH\nP2 has diff ver";
        return;
    }

    if (d.type === 'handshake') {
        var existingEntry = null;
        var assignedRole = null;
        if (d.role === 'join') {
            var roles = ['p2', 'p3', 'p4'];
            for (var ri = 0; ri < roles.length; ri++) {
                var entry = window.SMA.connections.find(function (x) { return x.role === roles[ri]; });
                if (entry && entry.name === d.name && (!entry.conn || !entry.conn.open)) {
                    existingEntry = entry;
                    assignedRole = roles[ri];
                    break;
                }
            }
        }

        var isLocked = window.SMA.gameRunning || window.SMA.isInCSS;
        if (isLocked && d.role !== 'spec' && !existingEntry) {
            try { c.send({ type: 'error', msg: 'MATCH_IN_PROGRESS' }); } catch (e) { }
            setTimeout(function () { try { c.close(); } catch (e) { } }, 500);
            return;
        }

        if (existingEntry) {
            existingEntry.conn = c;
            existingEntry.name = d.name;
            c._rtRole = assignedRole;
            try { c.send({ type: 'assign_role', role: assignedRole }); } catch (e) { }
            window.SMA.showNotification(assignedRole.toUpperCase() + "縺悟・謗･邯壹＠縺ｾ縺励◆", 2000);
        } else if (d.role === 'join') {
            var p2 = window.SMA.connections.find(function (x) { return x.role === 'p2'; });
            var p3 = window.SMA.connections.find(function (x) { return x.role === 'p3'; });
            var p4 = window.SMA.connections.find(function (x) { return x.role === 'p4'; });
            var newRole = null;
            if (!p2 || !p2.conn || !p2.conn.open) newRole = 'p2';
            else if (!p3 || !p3.conn || !p3.conn.open) newRole = 'p3';
            else if (!p4 || !p4.conn || !p4.conn.open) newRole = 'p4';

            if (!newRole) {
                try { c.send({ type: 'error', msg: 'ROOM_FULL' }); } catch (e) { }
                setTimeout(function () { try { c.close(); } catch (e) { } }, 500);
                return;
            }
            var existing = window.SMA.connections.find(function (x) { return x.role === newRole; });
            if (existing) {
                existing.conn = c;
                existing.name = d.name;
                existing.icon = d.icon;
            } else {
                window.SMA.connections.push({ conn: c, role: newRole, name: d.name, icon: d.icon });
            }
            c._rtRole = newRole;
            try { c.send({ type: 'assign_role', role: newRole }); } catch (e) { }
            window.SMA.broadcastLobby();
            window.SMA.showNotification(newRole.toUpperCase() + "縺悟・螳､縺励∪縺励◆・・, 2000);
        } else {
            var existingSpec = window.SMA.connections.find(function (x) { return x.role === 'spec' && x.name === d.name; });
            if (existingSpec) {
                existingSpec.conn = c;
                existingSpec.icon = d.icon || existingSpec.icon;
            } else {
                window.SMA.connections.push({ conn: c, role: 'spec', name: d.name, icon: d.icon });
            }
            c._rtRole = 'spec';
            window.SMA.broadcastLobby();
        }
        return;
    }

    if (d.type === 'stage_update') {
        if (d.role === 'p2') window.SMA.p2Stage = d.stageId;
        if (d.role === 'p3') window.SMA.p3Stage = d.stageId;
        if (d.role === 'p4') window.SMA.p4Stage = d.stageId;
        window.SMA.updateSSSUI(); window.SMA.broadcast(d);
        return;
    }
    if (d.type === 'stage_ready') {
        if (d.role === 'p2') window.SMA.p2StageReady = d.ready;
        if (d.role === 'p3') window.SMA.p3StageReady = d.ready;
        if (d.role === 'p4') window.SMA.p4StageReady = d.ready;
        window.SMA.updateSSSUI(); window.SMA.broadcast(d); window.SMA.checkStageAllReady();
        return;
    }
    if (d.type === 'char_update') {
        if (d.role === 'p2') window.SMA.p2CharId = d.charId;
        if (d.role === 'p3') window.SMA.p3CharId = d.charId;
        if (d.role === 'p4') window.SMA.p4CharId = d.charId;
        window.SMA.updateCSSUI(); window.SMA.broadcast(d);
        return;
    }
    if (d.type === 'player_ready') {
        if (d.role === 'p2') window.SMA.p2IsReady = d.ready;
        if (d.role === 'p3') window.SMA.p3IsReady = d.ready;
        if (d.role === 'p4') window.SMA.p4IsReady = d.ready;
        window.SMA.updateCSSUI(); window.SMA.broadcast(d); window.SMA.checkAllReady();
        return;
    }

    if (d.type === 'input' && window.SMA.isHost) {
        var sender = window.SMA.connections.find(function (x) { return x.conn === c; });
        var role = (sender && sender.role) ? sender.role : (c._rtRole || d.role || 'p2');
        if (role === 'p2' || role === 'p3' || role === 'p4') {
            window.SMA.remoteKeysMap[role] = d.keys || {};
            window.SMA.remoteLastInputTimeMap[role] = Date.now();
            var k = d.keys || {};
            if (k.triggerJump || k.triggerStartCharge || k.triggerReleaseAttack || k.triggerGrab) {
                if (!window.SMA.remoteEventsMap[role]) window.SMA.remoteEventsMap[role] = [];
                window.SMA.remoteEventsMap[role].push(k);
            }
        }
        return;
    }

    window.SMA.handleClient(d);
};

window.SMA.startGravityRealtimeHost = function (roomId) {
    if (!window.SMA.isGravity || !window.SMA.gravityUsePeerInMatch) return;
    window.SMA.stopGravityRealtime();
    window.SMA.gravityRtHostPeerId = window.SMA.makeGravityHostPeerId(roomId);
    try {
        window.SMA.gravityRtPeer = new Peer(window.SMA.gravityRtHostPeerId);
        window.SMA.gravityRtPeer.on('connection', function (c) {
            c._rtRole = null;
            c.on('data', async function (d) {
                d = await window.SMA.parseGravityRtData(d);
                if (!d) return;
                if (d.type === 'rt_hello') {
                    c._rtRole = d.role || null;
                    return;
                }
                if (d.type === 'rt_input' && window.SMA.isHost) {
                    var role = d.role || c._rtRole || 'p2';
                    var keys = d.keys || {};
                    window.SMA.remoteKeysMap[role] = keys;
                    window.SMA.remoteLastInputTimeMap[role] = Date.now();
                    if (keys.triggerJump || keys.triggerStartCharge || keys.triggerReleaseAttack || keys.triggerGrab) {
                        if (!window.SMA.remoteEventsMap[role]) window.SMA.remoteEventsMap[role] = [];
                        window.SMA.remoteEventsMap[role].push(keys);
                    }
                    return;
                }
                if (window.SMA.handleGravityPeerHostMessage) window.SMA.handleGravityPeerHostMessage(c, d);
            });
            c.on('close', function () {
                window.SMA.gravityRtConns = window.SMA.gravityRtConns.filter(function (x) { return x !== c; });
                var idx = window.SMA.connections.findIndex(function (x) { return x.conn === c; });
                if (idx !== -1) {
                    if (window.SMA.connections[idx].role === 'spec') {
                        window.SMA.connections.splice(idx, 1);
                        window.SMA.broadcastLobby();
                    } else {
                        window.SMA.showNotification(window.SMA.connections[idx].role.toUpperCase() + "縺悟・譁ｭ縺輔ｌ縺ｾ縺励◆", 2000);
                    }
                }
            });
            c.on('error', function () {
                window.SMA.gravityRtConns = window.SMA.gravityRtConns.filter(function (x) { return x !== c; });
                try { c.close(); } catch (e) { }
            });
            window.SMA.gravityRtConns.push(c);
        });
        window.SMA.gravityRtPeer.on('error', function (e) {
            console.warn("[SMA] gravity host peer error:", e);
        });
    } catch (e) {
        console.warn("[SMA] startGravityRealtimeHost failed:", e);
    }
};

window.SMA.startGravityRealtimeGuest = function (roomId) {
    if (!window.SMA.isGravity || !window.SMA.gravityUsePeerInMatch) return;
    window.SMA.stopGravityRealtime();
    window.SMA.gravityRtHostPeerId = window.SMA.makeGravityHostPeerId(roomId);
    try {
        window.SMA.gravityRtPeer = new Peer();
        window.SMA.gravityRtPeer.on('open', function () {
            try {
                var conn = window.SMA.gravityRtPeer.connect(window.SMA.gravityRtHostPeerId);
                window.SMA.gravityRtConn = conn;
                conn.on('open', function () {
                    try { conn.send({ type: 'rt_hello', role: window.SMA.myRole }); } catch (e) { }
                    if (window.SMA.gravityRtOutbox && window.SMA.gravityRtOutbox.length) {
                        var q = window.SMA.gravityRtOutbox.slice();
                        window.SMA.gravityRtOutbox = [];
                        q.forEach(function (m) { try { conn.send(m); } catch (e) { } });
                    }
                });
                conn.on('data', async function (d) {
                    d = await window.SMA.parseGravityRtData(d);
                    if (!d) return;
                    if (d.type === 'rt_sync' || d.type === 'sync') {
                        window.SMA.lastGravityRtSyncAt = Date.now();
                        window.SMA.applySync(d);
                        return;
                    }
                    window.SMA.handleClient(d);
                });
                conn.on('close', function () { window.SMA.gravityRtConn = null; });
                conn.on('error', function () { window.SMA.gravityRtConn = null; });
            } catch (e) { }
        });
        window.SMA.gravityRtPeer.on('error', function (e) {
            console.warn("[SMA] gravity guest peer error:", e);
        });
    } catch (e) {
        console.warn("[SMA] startGravityRealtimeGuest failed:", e);
    }
};

window.SMA.sendGravityInput = function (keys) {
    if (window.SMA.gravityUsePeerInMatch && window.SMA.gravityRtConn && window.SMA.gravityRtConn.open) {
        try {
            window.SMA.gravityRtConn.send({ type: 'rt_input', role: window.SMA.myRole, keys: keys });
            return true;
        } catch (e) { }
    }
    return false;
};

window.SMA.sendGravitySync = function (pkt) {
    if (!window.SMA.isGravity || !window.SMA.isHost) return;
    if (window.SMA.gravityUsePeerInMatch && window.SMA.gravityRtConns && window.SMA.gravityRtConns.length) {
        var rtPayload = Object.assign({}, pkt, { type: 'rt_sync' });
        window.SMA.gravityRtConns.forEach(function (c) {
            if (!c || !c.open) return;
            try {
                c.send(rtPayload);
            } catch (e) { }
        });
    }
};

window.SMA.callGravitySDK = function (action, params) {
    if (!window.SMA.isGravity) return Promise.reject("Not in Gravity environment");
    return new Promise(function (resolve, reject) {
        var reqId = "req_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        window.SMA.gravityRequests[reqId] = { resolve: resolve, reject: reject };
        window.top.postMessage({
            type: "API",
            action: action,
            requestId: reqId,
            params: params || {}
        }, "*");
    });
};
window.SMA.callGravityRoomSDK = function (action, params) {
    if (!window.SMA.isGravity) return Promise.reject("Not in Gravity environment");
    return new Promise(function (resolve, reject) {
        var reqId = action + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        window.SMA.gravityRoomRequests[reqId] = { resolve: resolve, reject: reject };
        var msg = { action: action, actionId: reqId, actionld: reqId }; // 繝ｭ繝ｼ繝繝ｼ蛛ｴ縺ｮ險倩ｼ峨ヶ繝ｬ(OCR隱､蟄礼ｭ・縺ｫ蟇ｾ蠢・
        if (params) Object.assign(msg, params);
        window.parent.postMessage(msg, "*");
    });
};

// Message Listener for Gravity App / Platform
window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || typeof data !== 'object') return;

    // API Callback handling (Legacy)
    if (data.type === "API_CALLBACK" && data.requestId) {
        var req = window.SMA.gravityRequests[data.requestId];
        if (req) {
            if (data.error) req.reject(data.error);
            else req.resolve(data.payload);
            delete window.SMA.gravityRequests[data.requestId];
        }
    }

    // RoomSDK Bridge Response handling
    var responseId = data.actionId || data.actionld;
    if ((data.type === 'gravityroomresponse' || data.type === 'gravity_room_response') && responseId) {
        var req2 = window.SMA.gravityRoomRequests[responseId];
        if (req2) {
            var resData = data.result || {};
            console.log("[SMA] Response for " + responseId + ":", JSON.stringify(resData));
            // Check for SDK-level errors
            if (resData.errno !== undefined && resData.errno !== 0) {
                req2.reject("SDK Error (errno:" + resData.errno + "): " + (resData.errmsg || "Unknown"));
            } else {
                req2.resolve(resData);
            }
            delete window.SMA.gravityRoomRequests[responseId];
        }
    }

    // RoomSDK Bridge Event handling
    if (data.type === 'gravityroomevent' || data.type === 'gravity_room_event') {
        var payload = data.payload || {};
        console.log("[SMA] Received Event:", JSON.stringify(payload));
        var pType = payload.type;
        if (pType === 'aitools_game_joinroom' || pType === 'aitoolsgamejoinroom') {
            console.log("Joined: ", payload);
            window.SMA.showNotification((payload.data && payload.data.user_name ? payload.data.user_name : "繝励Ξ繧､繝､繝ｼ") + "縺悟・螳､縺励∪縺励◆", 2000);
        } else if (pType === 'aitools_game_exitroom' || pType === 'aitoolsgameexitroom') {
            console.log("Exited: ", payload);
        } else if (pType === 'aitools_game_sendmsg' || pType === 'aitoolsgamesendmsg') {
            try {
                var msgData = payload.data.msg_data;
                var parsed = (typeof msgData === 'string') ? JSON.parse(msgData) : msgData;
                if (typeof parsed === 'string') parsed = JSON.parse(parsed);

                // Route Handshake directly for Host
                if (parsed.type === 'handshake' && window.SMA.isHost) {
                    var mockConn = { open: true, send: function (msg) { window.SMA.broadcast(msg); } };
                    var existingEntry = null;
                    var assignedRole = null;
                    if (parsed.role === 'join') {
                        var roles = ['p2', 'p3', 'p4'];
                        for (var ri = 0; ri < roles.length; ri++) {
                            var entry = window.SMA.connections.find(function (x) { return x.role === roles[ri]; });
                            if (entry && entry.name === parsed.name) {
                                existingEntry = entry; assignedRole = roles[ri]; break;
                            }
                        }
                    }
                    if (existingEntry) {
                        window.SMA.broadcast({ type: 'assign_role', role: assignedRole, alignTo: parsed.name });
                        window.SMA.showNotification(assignedRole.toUpperCase() + "縺悟・謗･邯壹＠縺ｾ縺励◆", 2000);
                    } else if (parsed.role === 'join') {
                        var p2 = window.SMA.connections.find(function (x) { return x.role === 'p2'; });
                        var p3 = window.SMA.connections.find(function (x) { return x.role === 'p3'; });
                        var p4 = window.SMA.connections.find(function (x) { return x.role === 'p4'; });
                        var newRole = null;
                        if (!p2) newRole = 'p2'; else if (!p3) newRole = 'p3'; else if (!p4) newRole = 'p4';

                        if (!newRole) {
                            window.SMA.broadcast({ type: 'error', msg: 'ROOM_FULL', alignTo: parsed.name });
                            return;
                        }
                        window.SMA.connections.push({ conn: mockConn, role: newRole, name: parsed.name, icon: parsed.icon });
                        window.SMA.broadcast({ type: 'assign_role', role: newRole, alignTo: parsed.name });
                        window.SMA.broadcastLobby();
                        window.SMA.showNotification(newRole.toUpperCase() + "縺悟・螳､縺励∪縺励◆・・, 2000);
                    } else if (parsed.role === 'spec') {
                        var existingSpec = window.SMA.connections.find(function (x) { return x.role === 'spec' && x.name === parsed.name; });
                        if (existingSpec) {
                            existingSpec.conn = mockConn;
                            existingSpec.icon = parsed.icon || existingSpec.icon;
                        } else {
                            window.SMA.connections.push({ conn: mockConn, role: 'spec', name: parsed.name, icon: parsed.icon });
                        }
                        window.SMA.broadcastLobby();
                    }
                    return;
                }

                // Host-side input handling
                if (parsed.type === 'input' && window.SMA.isHost) {
                    if (window.SMA.isGravity && window.SMA.gravityUsePeerInMatch && window.SMA.gameRunning) {
                        return;
                    }
                    var role = parsed.senderRole || 'p2';
                    window.SMA.remoteKeysMap[role] = parsed.keys;
                    window.SMA.remoteLastInputTimeMap[role] = Date.now();
                    if (parsed.keys.triggerJump || parsed.keys.triggerStartCharge || parsed.keys.triggerReleaseAttack || parsed.keys.triggerGrab) {
                        if (!window.SMA.remoteEventsMap[role]) window.SMA.remoteEventsMap[role] = [];
                        window.SMA.remoteEventsMap[role].push(parsed.keys);
                    }
                    // Legacy fallback p2
                    if (role === 'p2') {
                        window.SMA.remoteKeys = parsed.keys;
                        window.SMA.remoteLastInputTime = Date.now();
                        if (parsed.keys.triggerJump) window.SMA.remoteEvents.push(parsed.keys);
                    }
                } else {
                    if (parsed.alignTo && parsed.alignTo !== window.SMA.localPlayerName) return;
                    window.SMA.handleClient(parsed);
                }
            } catch (e) { }
        }
    }

    // Room message (Multiplayer Direct Legacy)
    if (data.type === "ROOM_MESSAGE" || data.action === "AgentSDK.room.onMessage") {
        var payloadLegacy = data.payload || data;
        if (payloadLegacy.message && typeof payloadLegacy.message === 'string') {
            try {
                var parsedL = JSON.parse(payloadLegacy.message);
                if (parsedL.type === 'input' && window.SMA.isHost) {
                    if (window.SMA.isGravity && window.SMA.gravityUsePeerInMatch && window.SMA.gameRunning) {
                        return;
                    }
                    var roleL = parsedL.role || 'p2';
                    window.SMA.remoteKeysMap[roleL] = parsedL.keys;
                    window.SMA.remoteLastInputTimeMap[roleL] = Date.now();
                    if (parsedL.keys.triggerJump || parsedL.keys.triggerStartCharge || parsedL.keys.triggerReleaseAttack || parsedL.keys.triggerGrab) {
                        if (!window.SMA.remoteEventsMap[roleL]) window.SMA.remoteEventsMap[roleL] = [];
                        window.SMA.remoteEventsMap[roleL].push(parsedL.keys);
                    }
                    if (roleL === 'p2') {
                        window.SMA.remoteKeys = parsedL.keys;
                        window.SMA.remoteLastInputTime = Date.now();
                        if (parsedL.keys.triggerJump) window.SMA.remoteEvents.push(parsedL.keys);
                    }
                } else {
                    window.SMA.handleClient(parsedL);
                }
            } catch (e) { }
        }
    }
});

window.SMA.initGravity = async function () {
    if (!window.SMA.isGravity && !new URLSearchParams(window.location.search).has('username')) return;

    // 1. URL繝代Λ繝｡繝ｼ繧ｿ縺九ｉ縺ｮ蜿門ｾ暦ｼ医Ο繝ｼ繝繝ｼ邨檎罰蟇ｾ遲厄ｼ・
    try {
        var urlParams = new URLSearchParams(window.location.search);
        var urlName = urlParams.get('username');
        var rawAvatar = urlParams.get('avatar');
        var rawPortrait = urlParams.get('portrait');
        console.log("[SMA] URL avatar param:", rawAvatar, "portrait param:", rawPortrait);
        var rawIcon = rawPortrait || rawAvatar || urlParams.get('icon') || urlParams.get('head_img') || urlParams.get('headimgurl');
        var urlIcon = rawIcon ? decodeURIComponent(rawIcon) : null;
        var autoRoomId = urlParams.get('room_id') || urlParams.get('roomid');
        if (autoRoomId) window.SMA.gravityAutoJoinRoom = autoRoomId;

        if (urlName) {
            window.SMA.localPlayerName = urlName;
            var nameInput = document.getElementById('username');
            var dispName = document.getElementById('display-username');
            if (nameInput) {
                nameInput.value = urlName;
                nameInput.disabled = true;
            }
            if (dispName) dispName.innerText = urlName;

            if (urlIcon) {
                window.SMA.localPlayerIcon = urlIcon;
                var p1Icon = document.getElementById('p1-icon');
                if (p1Icon) { p1Icon.src = urlIcon; p1Icon.style.display = 'block'; }
                var profImg = document.getElementById('profile-icon-img');
                var profEmoji = document.getElementById('profile-icon-emoji');
                if (profImg && profEmoji) { profImg.src = urlIcon; profImg.style.display = 'block'; profEmoji.style.display = 'none'; }
            }
            if (typeof window.SMA.saveSettings === 'function') window.SMA.saveSettings();
            console.log("[SMA] Gravity User Loaded from URL:", urlName, "rawIcon:", rawIcon, "decodedIcon:", urlIcon, "fullURL:", window.location.href);
            return; // URL縺九ｉ蜿門ｾ励〒縺阪◆蝣ｴ蜷医・SDK蜻ｼ縺ｳ蜃ｺ縺励ｒ繧ｹ繧ｭ繝・・
        }
    } catch (e) { }

    // 2. SDK縺九ｉ縺ｮ蜿門ｾ暦ｼ育峩謗･蝓九ａ霎ｼ縺ｿ遲峨・繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ・・
    try {
        var user = await window.SMA.callGravitySDK("AgentSDK.user.getMyUserInfo");
        console.log("[SMA] getMyUserInfo result:", JSON.stringify(user));
        if (user && (user.name || user.nickname || user.user_name)) {
            window.SMA.gravityUserInfo = user;
            var uName = user.name || user.nickname || user.user_name;
            window.SMA.localPlayerName = uName;
            var dispName = document.getElementById('display-username');
            if (dispName) dispName.innerText = uName;
            // 繧｢繧､繧ｳ繝ｳ縺ｯ隍・焚縺ｮ繝輔ぅ繝ｼ繝ｫ繝牙錐繧定ｩｦ陦・
            var uIcon = user.portrait || user.avatar || user.icon || user.head_img || user.headimgurl || user.profile_image;
            if (uIcon) {
                window.SMA.localPlayerIcon = uIcon;
                var p1Icon = document.getElementById('p1-icon');
                if (p1Icon) { p1Icon.src = uIcon; p1Icon.style.display = 'block'; }
                var profImg = document.getElementById('profile-icon-img');
                var profEmoji = document.getElementById('profile-icon-emoji');
                if (profImg && profEmoji) { profImg.src = uIcon; profImg.style.display = 'block'; profEmoji.style.display = 'none'; }
            }
            var nameInput = document.getElementById('username');
            if (nameInput) {
                nameInput.value = user.name;
                nameInput.disabled = true;
            }
            if (typeof window.SMA.saveSettings === 'function') window.SMA.saveSettings();
            console.log("Gravity User Loaded via SDK:", user.name);
        }
    } catch (e) {
        console.warn("Gravity SDK Error:", e);
    }
};

// 2. VISUAL EFFECTS & AUDIO

// --- Room/peer/network flow ---
window.SMA.enterSoloMode = function () {
    window.SMA.saveSettings();
    window.SMA.myRole = 'host';
    document.getElementById('menu-screen').classList.add('hidden');
    var hub = document.getElementById('battle-hub-screen');
    hub.classList.remove('hidden');
    hub.style.display = 'flex';
    window.SMA.showHubSelectPanel();
    window.SMA.isSolo = true;
    window.SMA.localPlayerName = document.getElementById('username').value || "Player";
    // 繝・ヵ繧ｩ繝ｫ繝磯∈謚槭ｒ螟画焚縺ｫ蜿肴丐
    window.SMA.myStageId = 'battlefield';
    window.SMA.myCharId = 'sword';
};


window.SMA.goToCharSelectSolo = function () {
    document.getElementById('battle-hub-screen').classList.add('hidden');
    document.getElementById('battle-hub-screen').classList.remove('hidden');
    // player-status-bar removed 
    // btn-css-ready removed

};

window.SMA.launchSoloGame = function () {
    window.SMA.startAudioContext();
    window.SMA.p1CharId = window.SMA.myCharId || 'sword';
    window.SMA.startSolo(); // Now calls actual starter
};

window.SMA.showCreateRoom = function () {
    window.SMA.saveSettings();
    window.SMA.myRole = 'host';
    if (window.SMA.netPeer) { try { window.SMA.netPeer.destroy(); } catch (e) { } window.SMA.netPeer = null; } window.SMA.netConn = null; window.SMA.connections = []; window.SMA.localPlayerName = document.getElementById('username').value || "Host"; window.SMA.isHost = true; window.SMA.isOnline = true; document.getElementById('menu-screen').classList.add('hidden'); document.getElementById('online-menu-screen').classList.add('hidden'); var _hub = document.getElementById('battle-hub-screen'); _hub.classList.remove('hidden'); _hub.style.display = 'flex'; window.SMA.showHubRoomPanel(); var rid = Math.floor(1000 + Math.random() * 9000); document.getElementById('room-id-display').innerText = rid;
    // P1繝ｭ繝薙・繧ｫ繝ｼ繝峨ｒ豁｣縺励￥譖ｴ譁ｰ
    var nameEl1 = document.getElementById('lobby-name-p1');
    if (nameEl1) nameEl1.innerText = window.SMA.localPlayerName;
    var iconEl1 = document.getElementById('lobby-icon-p1');
    if (iconEl1 && window.SMA.localPlayerIcon) {
        iconEl1.style.backgroundImage = 'url(' + window.SMA.localPlayerIcon + ')';
        iconEl1.style.backgroundSize = 'cover';
        iconEl1.style.backgroundPosition = 'center';
        iconEl1.innerText = '';
    }
    // 譛螟ｧ莠ｺ謨ｰ縺ｫ蠢懊§縺溘き繝ｼ繝芽｡ｨ遉ｺ
    var maxP = parseInt(document.getElementById('room-capacity').value || 2);
    window.SMA.showPlayerSlots(maxP); try {
        window.SMA.netPeer = new Peer(window.SMA.ID_PREFIX + rid); window.SMA.netPeer.on('connection', function (c) { window.SMA.handleConn(c); }); window.SMA.netPeer.on('error', function (e) {
            if (e.type === 'peer-unavailable') { reportError("Peer Error: " + e); }
            else if (e.type === 'network' || e.message.includes('Lost connection')) {
                window.SMA.showNotification("謗･邯壹お繝ｩ繝ｼ縲ょ・謗･邯壹ｒ隧ｦ縺ｿ縺ｾ縺・..", 2000);
                window.SMA.netPeer.reconnect();
            } else {
                reportError("Peer Error: " + e);
            }
        });
        window.SMA.netPeer.on('disconnected', function () {
            window.SMA.showNotification("繧ｵ繝ｼ繝舌・縺九ｉ蛻・妙縺輔ｌ縺ｾ縺励◆縲ょ・謗･邯壻ｸｭ...", 2000);
            window.SMA.netPeer.reconnect();
        });
    } catch (e) { reportError("Peer Init Error: " + e); }
};

window.SMA.showGravityCreateRoom = async function () {
    window.SMA.saveSettings();
    window.SMA.myRole = 'host';
    window.SMA.connections = [];
    window.SMA.localPlayerName = document.getElementById('username').value || "Host";
    window.SMA.isHost = true; window.SMA.isOnline = true;
    document.getElementById('menu-screen').classList.add('hidden');
    var _oms2 = document.getElementById('online-menu-screen'); _oms2.classList.add('hidden'); _oms2.style.display = 'none';
    var _hub2 = document.getElementById('battle-hub-screen'); _hub2.classList.remove('hidden'); _hub2.style.display = 'flex'; window.SMA.showHubRoomPanel();
    document.getElementById('room-id-display').innerText = "逕滓・荳ｭ...";

    // Fix: properly update the new lobby-card UI without destroying it
    var nameEl = document.getElementById('lobby-name-p1');
    var iconEl = document.getElementById('lobby-icon-p1');
    if (nameEl) nameEl.innerText = window.SMA.localPlayerName;
    if (iconEl && window.SMA.localPlayerIcon) {
        iconEl.style.backgroundImage = 'url(' + window.SMA.localPlayerIcon + ')';
        iconEl.style.backgroundSize = 'cover';
        iconEl.style.backgroundPosition = 'center';
        iconEl.innerText = '';
    }

    try {
        var maxP = parseInt(document.getElementById('room-capacity').value || 4);
        window.SMA.showPlayerSlots(maxP);
        // room_permission: 0=蜈ｬ髢・ 1=髱槫・髢・(繝ｭ繝ｼ繝繝ｼ蛛ｴ縺ｮ繝ｭ繧ｸ繝・け縺ｨ蜷医ｏ縺帙ｋ)
        var createParams = { room_type: 'aitools_game_room', max_players: maxP, maxplayers: maxP, room_permission: 0, permission: 0 };
        console.log("[SMA] create_room params:", JSON.stringify(createParams));
        var res = await window.SMA.callGravityRoomSDK('create_room', createParams);
        console.log("[SMA] create_room success response:", JSON.stringify(res));
        var roomData = res.data || res;
        window.SMA.gravityRoomId = (roomData && (roomData.room_id || roomData.roomId)) || "0000";
        document.getElementById('room-id-display').innerText = window.SMA.gravityRoomId.slice(-5);
        window.SMA.startGravityRealtimeHost(window.SMA.gravityRoomId);
        window.SMA.showNotification("驛ｨ螻九ｒ菴懈・縺励∪縺励◆", 2000);
    } catch (e) {
        console.error("[SMA] Create Error:", e);
        reportError("驛ｨ螻倶ｽ懈・縺ｫ螟ｱ謨励＠縺ｾ縺励◆: " + e);
    }
};

window.SMA.showRoomList = function () {
    // 邨ｱ蜷医Γ繝九Η繝ｼ蜀・・繝ｫ繝ｼ繝荳隕ｧ繧呈峩譁ｰ
    window.SMA.fetchRoomList();
};

window.SMA.fetchRoomList = async function () {
    var container = document.getElementById('room-list-container');
    container.innerHTML = '<div class="room-list-loading">隱ｭ縺ｿ霎ｼ縺ｿ荳ｭ...</div>';

    if (!window.SMA.isGravity) {
        container.innerHTML = '<div class="room-list-empty">繝悶Λ繧ｦ繧ｶ迚医〒縺ｯ繝ｫ繝ｼ繝荳隕ｧ繧貞叙蠕励〒縺阪∪縺帙ｓ縲・Gravity蟆ら畑)</div>';
        return;
    }

    try {
        var res = await window.SMA.callGravityRoomSDK('get_public_rooms', { room_type: 'aitools_game_room', page_num: 1, page_size: 20 });
        console.log("[SMA] fetchRoomList raw response:", JSON.stringify(res));
        // SDK縺ｮ霑泌唆蠖｢蠑上ｒ隍・焚繝代ち繝ｼ繝ｳ縺ｧ蟇ｾ蠢・
        var rooms = [];
        if (res) {
            if (res.data && res.data.list) rooms = res.data.list;
            else if (res.data && Array.isArray(res.data)) rooms = res.data;
            else if (res.list) rooms = res.list;
            else if (res.rooms) rooms = res.rooms;
            else if (Array.isArray(res)) rooms = res;
        }
        console.log("[SMA] Parsed room list (" + rooms.length + "):", JSON.stringify(rooms));

        // 10蛻・ｻ･蜀・↓菴懊ｉ繧後◆繝ｫ繝ｼ繝縺ｮ縺ｿ陦ｨ遉ｺ
        var now = Date.now();
        var TEN_MIN = 10 * 60 * 1000;
        rooms = rooms.filter(function (room) {
            var ts = room.create_time || room.created_at || room.createTime || room.createdAt;
            if (!ts) return true; // 繧ｿ繧､繝繧ｹ繧ｿ繝ｳ繝励′縺ｪ縺・ｴ蜷医・陦ｨ遉ｺ
            var d = new Date(ts);
            if (d.getFullYear() < 2000) d = new Date(ts * 1000);
            if (isNaN(d.getTime())) return true;
            return (now - d.getTime()) < TEN_MIN;
        });
        console.log("[SMA] Rooms after 10-min filter: " + rooms.length);

        if (rooms.length === 0) {
            container.innerHTML = '<div class="room-list-empty">迴ｾ蝨ｨ蜈ｬ髢倶ｸｭ縺ｮ繝ｫ繝ｼ繝縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・/div>';
            return;
        }

        // 繝ｫ繝ｼ繝繧ｫ繝ｼ繝峨ｒ逕滓・
        container.innerHTML = '';
        rooms.forEach(function (room) {
            var card = document.createElement('div');
            card.className = 'room-card';
            var roomId = String(room.room_id || room.roomId || '');
            var playerCount = room.gamer_num || room.current_players || room.player_count || room.online_users || room.cur_user_count || room.user_count || 0;
            var maxPlayers = room.max_players || room.max_user_count || 4;

            var timeStr = "";
            var ts = room.create_time || room.created_at || room.createTime || room.createdAt;
            if (ts) {
                var d = new Date(ts);
                if (d.getFullYear() < 2000) d = new Date(ts * 1000);
                if (!isNaN(d.getTime())) {
                    timeStr = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + " 菴懈・";
                }
            }

            card.innerHTML = '<div>' +
                '<div class="room-title">驛ｨ螻紀D: ' + roomId.slice(-5) + ' <span style="font-size:0.8rem; color:#aaa; margin-left:10px;">' + timeStr + '</span></div>' +
                '<div class="room-host">' + playerCount + '/' + maxPlayers + '莠ｺ</div>' +
                '</div>' +
                '<div class="room-count">蜈･螳､</div>';
            card.innerHTML = card.innerHTML.replace(/<div class="room-count">.*?<\/div>/, '<div class="room-actions"><button class="room-action-btn join">蜈･螳､</button><button class="room-action-btn spec">隕ｳ謌ｦ</button></div>');
            var btnJoin = card.querySelector('.room-action-btn.join');
            var btnSpec = card.querySelector('.room-action-btn.spec');
            var doJoin = function (rid, role) {
                if (!rid) return;
                var onlineScreen = document.getElementById('online-menu-screen');
                if (onlineScreen) { onlineScreen.classList.add('hidden'); onlineScreen.style.display = 'none'; }
                window.SMA.showGravityJoinRoom(rid, role);
            };
            if (btnJoin) {
                btnJoin.onclick = (function (rid) {
                    return function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        doJoin(rid, 'join');
                    };
                })(roomId);
            }
            if (btnSpec) {
                btnSpec.onclick = (function (rid) {
                    return function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        doJoin(rid, 'spec');
                    };
                })(roomId);
            }
            container.appendChild(card);
        });
    } catch (e) {
        console.error("Room list fetch error:", e);
        container.innerHTML = '<div class="room-list-empty">繝ｫ繝ｼ繝諠・ｱ縺ｮ蜿門ｾ励↓螟ｱ謨励＠縺ｾ縺励◆縲・/div>';
    }
};

window.SMA.showJoinRoom = function () { window.SMA.saveSettings(); document.getElementById('menu-screen').classList.add('hidden'); document.getElementById('online-menu-screen').classList.add('hidden'); document.getElementById('join-room-screen').classList.remove('hidden'); };

window.SMA.showGravityJoinRoom = async function (roomIdParam, joinRole) {
    window.SMA.saveSettings();
    document.getElementById('menu-screen').classList.add('hidden');
    var _oms = document.getElementById('online-menu-screen'); _oms.classList.add('hidden'); _oms.style.display = 'none';
    document.getElementById('join-room-screen').classList.remove('hidden');

    var rid = roomIdParam || document.getElementById('join-input').value;
    if (!rid) return;

    window.SMA.localPlayerName = document.getElementById('username').value || "Guest";
    window.SMA.myRole = joinRole || 'join';
    window.SMA.isHost = false; window.SMA.isOnline = true;
    window.SMA.setJoinLoading(true);

    // ================= SHORT ID SEARCH LOGIC =================
    // 蜈･蜉帙′遏ｭ縺・ｴ蜷医∝・髢九Ν繝ｼ繝荳隕ｧ縺九ｉ譛ｫ蟆ｾ荳閾ｴ縺ｧ讀懃ｴ｢
    if (rid.length > 0 && rid.length <= 10) {
        window.SMA.showNotification("驛ｨ螻九ｒ讀懃ｴ｢荳ｭ...", 2000);
        try {
            var foundFullId = null;
            // 譛螟ｧ3繝壹・繧ｸ讀懃ｴ｢
            for (var p = 1; p <= 3; p++) {
                var resSearch = await window.SMA.callGravityRoomSDK('get_public_rooms', { room_type: 'aitools_game_room', page_num: p, page_size: 20 });
                console.log("[SMA] get_public_rooms page " + p + " raw response:", JSON.stringify(resSearch));

                // SDK縺ｮ霑泌唆蠖｢蠑上ｒ隍・焚繝代ち繝ｼ繝ｳ縺ｧ蟇ｾ蠢・
                var roomsData = [];
                if (resSearch) {
                    if (resSearch.data && resSearch.data.list) roomsData = resSearch.data.list;
                    else if (resSearch.data && Array.isArray(resSearch.data)) roomsData = resSearch.data;
                    else if (resSearch.list) roomsData = resSearch.list;
                    else if (resSearch.rooms) roomsData = resSearch.rooms;
                    else if (Array.isArray(resSearch)) roomsData = resSearch;
                }
                console.log("[SMA] Parsed rooms (" + roomsData.length + "):", JSON.stringify(roomsData));

                for (var ri = 0; ri < roomsData.length; ri++) {
                    var r = roomsData[ri];
                    var idString = String(r.room_id || r.roomId || r.id || "");
                    console.log("[SMA] Checking room: " + idString + " endsWith " + rid + " = " + idString.endsWith(rid));
                    if (idString.endsWith(rid)) {
                        foundFullId = idString;
                        break;
                    }
                }
                if (foundFullId) break;
                if (roomsData.length < 20) break; // 谺｡繝壹・繧ｸ縺ｪ縺・
            }
            if (foundFullId) {
                rid = foundFullId;
                console.log("[SMA] Found full room ID:", rid);
            } else {
                window.SMA.setJoinLoading(false);
                window.SMA.showNotification("謖・ｮ壹＆繧後◆逡ｪ蜿ｷ縺ｮ驛ｨ螻九′隕九▽縺九ｊ縺ｾ縺帙ｓ", 3000);
                return;
            }
        } catch (e) {
            console.error("[SMA] Search Error:", e);
            window.SMA.setJoinLoading(false);
            window.SMA.showNotification("讀懃ｴ｢繧ｨ繝ｩ繝ｼ: " + e, 3000);
            return; // 讀懃ｴ｢螟ｱ謨玲凾縺ｯ遒ｺ螳溘↓蛛懈ｭ｢
        }
    }
    // =========================================================

    // join_room縺ｧ蜈･螳､
    console.log("[SMA] Attempting join_room with room_id:", rid);
    window.SMA.callGravityRoomSDK('join_room', { room_id: rid })
        .then(function (res) {
            console.log("[SMA] join_room success:", JSON.stringify(res));
            window.SMA.gravityRoomId = rid;
            window.SMA.startGravityRealtimeGuest(window.SMA.gravityRoomId);
            window.SMA.setJoinLoading(false);

            // 繝ｭ繝薙・逕ｻ髱｢縺ｸ驕ｷ遘ｻ
            document.getElementById('join-room-screen').classList.add('hidden');
            document.getElementById('battle-hub-screen').classList.remove('hidden');
            document.getElementById('room-id-display').innerText = rid.slice(-5);

            // 繧ｲ繧ｹ繝医・繝ｭ繝薙・陦ｨ遉ｺ隱ｿ謨ｴ
            var sssBtn = document.getElementById('btn-goto-sss');
            if (sssBtn) sssBtn.style.display = 'none';
            var cancelBtn = document.getElementById('btn-create-cancel');
            if (cancelBtn) cancelBtn.innerText = "騾蜃ｺ縺吶ｋ";
            var header = document.querySelector('#battle-hub-screen h2');
            if (header) header.innerText = "繝ｭ繝薙・・医ご繧ｹ繝茨ｼ・;
            var copyBtn = document.getElementById('btn-copy-room-id');
            if (copyBtn) copyBtn.style.display = 'block';

            // 繧ｲ繧ｹ繝郁・霄ｫ繧・P縺ｨ縺励※陦ｨ遉ｺ・域圻螳壹ゅ・繧ｹ繝医°繧瑛obby縺悟ｱ翫￠縺ｰ荳頑嶌縺阪＆繧後ｋ・・
            if (window.SMA.myRole !== 'spec') {
                var nameP2 = document.getElementById('lobby-name-p2');
                if (nameP2) nameP2.innerText = window.SMA.localPlayerName;
            }
            var nameP1 = document.getElementById('lobby-name-p1');
            if (nameP1) nameP1.innerText = "謗･邯壻ｸｭ...";

            // Mock netConn for Gravity guest
            window.SMA.netConn = {
                open: true,
                send: function (msg) {
                    msg.senderRole = window.SMA.myRole;
                    window.SMA.broadcast(msg);
                }
            };
            window.SMA.showNotification("驛ｨ螻九↓蜈･螳､縺励∪縺励◆", 2000);

            // Handshake騾∽ｿ｡・医Μ繝医Λ繧､莉倥″: assign_role繧貞女縺大叙繧九∪縺ｧ郢ｰ繧願ｿ斐☆・・
            var handshakeMsg = { type: 'handshake', role: window.SMA.myRole, name: window.SMA.localPlayerName, icon: window.SMA.localPlayerIcon, ver: window.SMA.VERSION };
            console.log("[SMA] Broadcasting handshake from guest");
            window.SMA.broadcast(handshakeMsg);

            // 繝帙せ繝医°繧峨・蠢懃ｭ斐′縺ｪ縺・ｴ蜷医・繝ｪ繝医Λ繧､・域怙螟ｧ5蝗槭・遘帝俣髫費ｼ・
            var retryCount = 0;
            window.SMA._handshakeRetry = setInterval(function () {
                retryCount++;
                if (window.SMA.myRole !== 'host' && window.SMA.lobbyState && window.SMA.lobbyState.p1) {
                    // 繝ｭ繝薙・諠・ｱ繧貞女菫｡貂医∩竊偵Μ繝医Λ繧､蛛懈ｭ｢
                    console.log("[SMA] Lobby state received, stopping handshake retry");
                    clearInterval(window.SMA._handshakeRetry);
                    return;
                }
                if (retryCount >= 5) {
                    console.log("[SMA] Handshake retry limit reached");
                    clearInterval(window.SMA._handshakeRetry);
                    return;
                }
                console.log("[SMA] Retrying handshake (#" + retryCount + ")");
                window.SMA.broadcast(handshakeMsg);
            }, 2000);
        })
        .catch(function (e) {
            console.error("[SMA] join_room failed:", e);
            window.SMA.showNotification("蜈･螳､繧ｨ繝ｩ繝ｼ: " + e, 3000);
            window.SMA.setJoinLoading(false);
        });
};

window.SMA.joinRoom = function (role) {
    if (window.SMA.netPeer) { try { window.SMA.netPeer.destroy(); } catch (e) { } window.SMA.netPeer = null; }
    window.SMA.myRole = role;
    window.SMA.netConn = null; window.SMA.connections = [];
    var rid = document.getElementById('join-input').value; if (rid.length != 4) return;
    window.SMA.targetPeerId = window.SMA.ID_PREFIX + rid;
    window.SMA.localPlayerName = document.getElementById('username').value || "Guest";
    window.SMA.isHost = false; window.SMA.isOnline = true;
    window.SMA.setJoinLoading(true);

    try {
        window.SMA.netPeer = new Peer();
        window.SMA.netPeer.on('open', function () {
            window.SMA.netConn = window.SMA.netPeer.connect(window.SMA.targetPeerId);
            window.SMA.setupClientConn(window.SMA.netConn, role);
        });
        window.SMA.netPeer.on('error', function (e) {
            if (e.type === 'peer-unavailable') {
                window.SMA.showNotification("驛ｨ螻九′隕九▽縺九ｊ縺ｾ縺帙ｓ", 2000);
                setTimeout(function () { location.reload(); }, 2000);
            }
            else if (e.type === 'network' || e.message.includes('Lost connection')) {
                window.SMA.showNotification("謗･邯壹お繝ｩ繝ｼ縲ょ・謗･邯壹ｒ隧ｦ縺ｿ縺ｾ縺・..", 2000);
                window.SMA.netPeer.reconnect();
                setTimeout(function () {
                    if (!window.SMA.netPeer.disconnected) {
                        if (!window.SMA.netConn || !window.SMA.netConn.open) {
                            console.log("Re-connecting to Host...");
                            var nc = window.SMA.netPeer.connect(window.SMA.targetPeerId);
                            window.SMA.setupClientConn(nc, role);
                            window.SMA.netConn = nc;
                        }
                    }
                }, 2000);
            } else {
                reportError("Peer Error: " + e);
            }
        });
        window.SMA.netPeer.on('disconnected', function () {
            window.SMA.showNotification("繧ｵ繝ｼ繝舌・縺九ｉ蛻・妙縺輔ｌ縺ｾ縺励◆縲ょ・謗･邯壻ｸｭ...", 2000);
            window.SMA.netPeer.reconnect();
        });
    } catch (e) {
        reportError("Peer Init Error: " + e);
        window.SMA.setJoinLoading(false); // UNLOCK
    }
};

window.SMA.setupClientConn = function (conn, role) {
    conn.on('open', function () {
        conn.send({ type: 'handshake', role: role, name: window.SMA.localPlayerName, icon: window.SMA.localPlayerIcon, ver: window.SMA.VERSION });
    });
    conn.on('data', function (d) {
        if (d.type === 'error' && d.msg === 'MATCH_IN_PROGRESS') {
            window.SMA.isExpectedClose = true;
            window.SMA.showNotification("隧ｦ蜷井ｸｭ縺ｮ縺溘ａ蜈･螳､縺ｧ縺阪∪縺帙ｓ", 3000);
            setTimeout(function () { location.reload(); }, 3000);
            return;
        }
        if (d.type === 'error' && d.msg === 'ROOM_FULL') {
            window.SMA.isExpectedClose = true;
            window.SMA.showNotification("蟇ｾ謌ｦ逶ｸ謇九′蝓九∪縺｣縺ｦ縺・∪縺・, 3000);
            setTimeout(function () { location.reload(); }, 3000);
            return;
        }
        window.SMA.handleClient(d);
    });
    conn.on('error', function (e) {
        if (window.SMA.isExpectedClose) return;
        window.SMA.showNotification("謗･邯壹お繝ｩ繝ｼ: " + e, 2000);
    });
    conn.on('close', function () {
        if (window.SMA.isExpectedClose) return;
        if (window.SMA.gameState === 'GAMEOVER') return;

        window.SMA.showNotification("繝帙せ繝医→縺ｮ謗･邯壹′蛻・ｌ縺ｾ縺励◆縲ょ・謗･邯壹ｒ隧ｦ縺ｿ縺ｾ縺・..", 3000);
        setTimeout(function () {
            if (!window.SMA.netPeer.disconnected) {
                var nc = window.SMA.netPeer.connect(window.SMA.targetPeerId);
                window.SMA.setupClientConn(nc, role);
                window.SMA.netConn = nc;
            }
        }, 1000);
    });
};

// --- BATTLE HUB LOGIC ---
window.SMA.myStageId = null;
window.SMA.myCharId = null;
window.SMA.amIReady = false;

window.SMA.selectStage = function (id) {
    if (window.SMA.myRole === 'spec' || window.SMA.amIReady) return;
    window.SMA.myStageId = id;
    document.querySelectorAll('.stage-card').forEach(c => c.classList.remove('selected'));
    var card = document.getElementById('stage-' + id);
    if (card) card.classList.add('selected');
};

window.SMA.selectChar = function (id) {
    if (window.SMA.myRole === 'spec' || window.SMA.amIReady) return;
    window.SMA.myCharId = id;
    document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
    var card = document.getElementById('card-' + id);
    if (card) card.classList.add('selected');
};

window.SMA.toggleHubReady = function (isForceReady) {
    if (window.SMA.myRole === 'spec') return;

    var wantsReady = typeof isForceReady === 'boolean' ? isForceReady : !window.SMA.amIReady;

    if (wantsReady && (!window.SMA.myStageId || !window.SMA.myCharId)) {
        window.SMA.showNotification("繧ｹ繝・・繧ｸ縺ｨ繧ｭ繝｣繝ｩ繧ｯ繧ｿ繝ｼ繧帝∈繧薙〒縺上□縺輔＞", 2000);
        return;
    }
    window.SMA.amIReady = wantsReady;

    var btn = document.getElementById('btn-hub-ready');
    if (btn) {
        btn.innerText = window.SMA.amIReady ? "繧ｭ繝｣繝ｳ繧ｻ繝ｫ" : "貅門ｙ螳御ｺ・ｼ・;
        btn.style.background = window.SMA.amIReady ? "#636e72" : "";
        btn.style.borderColor = window.SMA.amIReady ? "#b2bec3" : "";
    }

    if (window.SMA.isOnline) {
        // 繝帙せ繝医・role縺ｯ'host'縺縺後”ubData縺ｧ縺ｯ'p1'縺ｨ縺励※謇ｱ縺・
        var hubRole = (window.SMA.myRole === 'host') ? 'p1' : window.SMA.myRole;
        var msg = {
            type: 'hub_ready',
            role: hubRole,
            ready: window.SMA.amIReady,
            stageId: window.SMA.myStageId,
            charId: window.SMA.myCharId
        };
        if (window.SMA.isHost) {
            window.SMA.updateHubState(msg);
            window.SMA.broadcast(msg);
        } else {
            if (window.SMA.isGravity && window.SMA.gravityUsePeerInMatch) window.SMA.broadcast(msg);
            else if (window.SMA.netConn) window.SMA.netConn.send(msg);
        }
    } else {
        // 繧ｽ繝ｭ繝｢繝ｼ繝・ READY縺ｫ縺励※UI繧よ峩譁ｰ縺励※縺九ｉ繧ｲ繝ｼ繝髢句ｧ・
        var btn2 = document.getElementById('btn-hub-ready');
        if (btn2) {
            btn2.innerText = window.SMA.amIReady ? "繧ｭ繝｣繝ｳ繧ｻ繝ｫ" : "貅門ｙ螳御ｺ・ｼ・;
            btn2.style.background = window.SMA.amIReady ? "#636e72" : "";
            btn2.style.borderColor = window.SMA.amIReady ? "#b2bec3" : "";
        }
        if (window.SMA.amIReady) {
            window.SMA.p1CharId = window.SMA.myCharId;
            window.SMA.selectedStage = window.SMA.myStageId;
            window.SMA.startSoloGame();
        }
    }
};

window.SMA.hubData = { p1: {}, p2: {}, p3: {}, p4: {} };

window.SMA.updateHubState = function (d) {
    if (!window.SMA.hubData[d.role]) window.SMA.hubData[d.role] = {};
    window.SMA.hubData[d.role].ready = d.ready;
    window.SMA.hubData[d.role].stageId = d.stageId;
    window.SMA.hubData[d.role].charId = d.charId;
    window.SMA.refreshHubUI();

    if (window.SMA.isHost) {
        window.SMA.checkHubAllReady();
    }
};

window.SMA.refreshHubUI = function () {
    var roles = ['p1', 'p2', 'p3', 'p4'];
    roles.forEach(function (r) {
        var slot = document.getElementById('slot-' + r.replace('p', 'p'));
        if (!slot) return;
        var data = window.SMA.hubData[r] || {};
        var statusEl = slot.querySelector('.lobby-player-status');
        if (!statusEl) return;

        slot.classList.remove('ready', 'active', 'selecting');
        if (data.ready) {
            slot.classList.add('ready');
            statusEl.style.display = 'block';
            statusEl.style.background = '#00e676';
            statusEl.style.color = '#fff';
            statusEl.innerText = 'READY';
        } else {
            var nameEl = document.getElementById('lobby-name-' + r);
            if (nameEl && nameEl.innerText !== "蠕・ｩ滉ｸｭ...") {
                slot.classList.add('active', 'selecting');
                statusEl.style.display = 'block';
                statusEl.style.background = '#00d2ff';
                statusEl.style.color = '#000';
                statusEl.innerText = 'CHOOSING';
            } else {
                statusEl.style.display = 'none';
            }
        }
    });
};

window.SMA.checkHubAllReady = function () {
    if (!window.SMA.isHost) return;
    var activeRoles = ['p1'];
    if (window.SMA.connections.find(c => c.role === 'p2')) activeRoles.push('p2');
    if (window.SMA.connections.find(c => c.role === 'p3')) activeRoles.push('p3');
    if (window.SMA.connections.find(c => c.role === 'p4')) activeRoles.push('p4');

    var allReady = activeRoles.every(r => window.SMA.hubData[r] && window.SMA.hubData[r].ready);
    var btnStart = document.getElementById('hub-start-overlay');
    console.log("[SMA] checkHubAllReady:", "roles=" + JSON.stringify(activeRoles), "allReady=" + allReady, "overlay=" + !!btnStart, "hubData=" + JSON.stringify(window.SMA.hubData));
    if (allReady) {
        if (btnStart) btnStart.style.display = 'flex';
    } else {
        if (btnStart) btnStart.style.display = 'none';
    }
};

window.SMA.executeHubFinalStart = function (activeRoles) {
    var stages = [];
    activeRoles.forEach(r => {
        var sid = window.SMA.hubData[r].stageId;
        if (sid) stages.push(sid);
    });
    var finalStage = stages.length > 0 ? stages[Math.floor(Math.random() * stages.length)] : 'battlefield';

    window.SMA.selectedStage = finalStage;
    window.SMA.playerCount = activeRoles.length;

    var startMsg = {
        type: 'start_match',
        stage: finalStage,
        playerCount: window.SMA.playerCount,
        p1Char: window.SMA.hubData['p1']?.charId || 'sword',
        p2Char: window.SMA.hubData['p2']?.charId || 'sword',
        p3Char: window.SMA.hubData['p3']?.charId || 'sword',
        p4Char: window.SMA.hubData['p4']?.charId || 'sword'
    };

    window.SMA.p1CharId = startMsg.p1Char;
    window.SMA.p2CharId = startMsg.p2Char;
    window.SMA.p3CharId = startMsg.p3Char;
    window.SMA.p4CharId = startMsg.p4Char;

    window.SMA.broadcast(startMsg);
    window.SMA.startGameMulti();
};

// 蜀肴姶蜃ｦ逅・ 繝励Ξ繧､繝､繝ｼ謗･邯壹ｒ邯ｭ謖√＠縺溘∪縺ｾ繧ｭ繝｣繝ｩ/繧ｹ繝・・繧ｸ驕ｸ謚槭↓謌ｻ繧・
window.SMA.rematch = function () {
    // 繧ｲ繝ｼ繝繧ｪ繝ｼ繝舌・逕ｻ髱｢繧帝哩縺倥ｋ
    document.getElementById('game-over-screen').classList.add('hidden');
    // HUD繝ｻ繧ｳ繝ｳ繝医Ο繝ｼ繝ｩ繝ｼ繧帝撼陦ｨ遉ｺ
    document.getElementById('hud-layer').style.display = 'none';
    document.getElementById('controller-area').style.display = 'none';
    // 繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ繝輔Ξ繝ｼ繝繧貞●豁｢
    if (window.SMA.animationFrameId) { cancelAnimationFrame(window.SMA.animationFrameId); window.SMA.animationFrameId = null; }
    window.SMA.gameRunning = false;
    // 繝舌ヨ繝ｫ繝上ヶ逕ｻ髱｢繧貞・陦ｨ遉ｺ
    var hub = document.getElementById('battle-hub-screen');
    hub.classList.remove('hidden'); hub.style.display = 'flex';
    // 繧ｭ繝｣繝ｩ/繧ｹ繝・・繧ｸ驕ｸ謚槭ヱ繝阪Ν縺ｸ
    window.SMA.showHubSelectPanel();
    // 繧ｲ繧ｹ繝医↓rematch騾夂衍繧帝√ｋ
    if (window.SMA.isHost) {
        window.SMA.broadcast({ type: 'rematch' });
    }
};

window.SMA.showHubSelectPanel = function () {
    var roomPanel = document.getElementById('hub-room-panel');
    if (roomPanel) { roomPanel.classList.remove('active'); roomPanel.style.display = 'none'; }
    var selectPanel = document.getElementById('hub-select-panel');
    if (selectPanel) { selectPanel.classList.add('active'); selectPanel.style.display = 'flex'; }
    var actionBar = document.getElementById('hub-action-bar');
    if (actionBar) actionBar.style.display = 'flex';
    // 繝舌げ5: 縲後せ繝・・繧ｸ驕ｸ謚槭∈騾ｲ繧縲阪・繧ｿ繝ｳ繧帝撼陦ｨ遉ｺ縺ｫ縺吶ｋ
    var gotoBtn = document.getElementById('btn-goto-sss');
    if (gotoBtn) gotoBtn.style.display = 'none';

    window.SMA.amIReady = false;
    window.SMA.hubData = { p1: {}, p2: {}, p3: {}, p4: {} };
    window.SMA.refreshHubUI();

    // 繝・ヵ繧ｩ繝ｫ繝磯∈謚樒憾諷九ｒ螟画焚縺ｫ險ｭ螳夲ｼ・attlefield縺ｨsword縺悟・譛殱elected・・
    window.SMA.myStageId = 'battlefield';
    window.SMA.myCharId = 'sword';
    // 蛻晄悄驕ｸ謚槭・繧ｫ繝ｼ繝峨↓selected繧ｯ繝ｩ繧ｹ繧剃ｻ倥￠繧・
    document.querySelectorAll('.stage-card, .char-card').forEach(function (c) { c.classList.remove('selected'); });
    var defStage = document.getElementById('stage-battlefield');
    var defChar = document.getElementById('card-sword');
    if (defStage) defStage.classList.add('selected');
    if (defChar) defChar.classList.add('selected');
    var btn = document.getElementById('btn-hub-ready');
    if (btn) { btn.innerText = "貅門ｙ螳御ｺ・ｼ・; btn.style.background = ""; btn.style.borderColor = ""; }
    var btnSt = document.getElementById('hub-start-overlay');
    if (btnSt) btnSt.style.display = 'none';
};

window.SMA.startSoloGame = function () {
    if (window.SMA.netPeer) { try { window.SMA.netPeer.destroy(); } catch (e) { } window.SMA.netPeer = null; }
    window.SMA.netConn = null; window.SMA.connections = [];
    window.SMA.isHost = true; window.SMA.isOnline = false;
    document.getElementById('battle-hub-screen').classList.add('hidden');
    document.getElementById('controller-area').style.display = 'block';
    document.getElementById('hud-layer').style.display = 'flex';
    window.SMA.initCanvas();
    try { window.SMA.bootGame(); } catch (e) { console.error("Init Error: " + e); }
};

window.SMA.startGameMulti = function () {
    document.getElementById('battle-hub-screen').classList.add('hidden');
    document.getElementById('controller-area').style.display = (window.SMA.myRole === 'spec') ? 'none' : 'block';
    document.getElementById('hud-layer').style.display = 'flex';
    window.SMA.renderSpectatorStrip([]);

    var s = window.SMA.lobbyState || {};
    var el1 = document.getElementById('p1-name'); if (el1) el1.innerText = s.p1 || "1P";
    var el2 = document.getElementById('p2-name'); if (el2) el2.innerText = s.p2 || "2P";
    var el3 = document.getElementById('p3-name'); if (el3) el3.innerText = s.p3 || "3P";
    var el4 = document.getElementById('p4-name'); if (el4) el4.innerText = s.p4 || "4P";


    window.SMA.bootGame();
};

window.SMA.broadcastLobby = function () {
    window.SMA.connections = window.SMA.connections.filter(function (x) { return x.conn.open || x.role === 'p2' || x.role === 'p3' || x.role === 'p4'; });

    var p2 = window.SMA.connections.find(function (x) { return x.role === 'p2'; });
    var p3 = window.SMA.connections.find(function (x) { return x.role === 'p3'; });
    var p4 = window.SMA.connections.find(function (x) { return x.role === 'p4'; });
    var specs = window.SMA.connections
        .filter(function (x) { return x.role === 'spec'; })
        .map(function (x) { return { name: x.name || '', icon: x.icon || null }; });

    window.SMA.lobbyState = {
        p1: window.SMA.localPlayerName, p1Icon: window.SMA.localPlayerIcon,
        p2: p2 ? p2.name : null, p2Icon: p2 ? p2.icon : null,
        p3: p3 ? p3.name : null, p3Icon: p3 ? p3.icon : null,
        p4: p4 ? p4.name : null, p4Icon: p4 ? p4.icon : null
    };

    var updateSlot = function (id, pName, pIcon) {
        var nameEl = document.getElementById('lobby-name-p' + id);
        var iconEl = document.getElementById('lobby-icon-p' + id);
        var cardEl = document.getElementById('slot-p' + id);
        if (cardEl) {
            if (pName) {
                cardEl.classList.remove('waiting');
                if (nameEl) nameEl.innerText = pName;
                if (iconEl) {
                    if (pIcon) {
                        // Reset to avoid empty src bugs
                        if (iconEl.tagName.toLowerCase() === 'img') { iconEl.src = pIcon; iconEl.style.display = 'inline-block'; }
                        else { iconEl.innerText = ''; iconEl.style.backgroundImage = 'url(' + pIcon + ')'; iconEl.style.backgroundSize = 'cover'; }
                    }
                    else { if (iconEl.tagName.toLowerCase() !== 'img') iconEl.innerText = '側'; }
                }
            } else {
                cardEl.classList.add('waiting');
                if (nameEl) nameEl.innerText = "蠕・ｩ滉ｸｭ...";
                if (iconEl && iconEl.tagName.toLowerCase() !== 'img') { iconEl.innerText = '側'; iconEl.style.backgroundImage = 'none'; }
            }
        }
    };

    updateSlot(2, p2 ? p2.name : null, p2 ? p2.icon : null);
    updateSlot(3, p3 ? p3.name : null, p3 ? p3.icon : null);
    updateSlot(4, p4 ? p4.name : null, p4 ? p4.icon : null);
    window.SMA.renderSpectatorStrip(specs);

    var specListEl = document.getElementById('spec-list');
    var specCountEl = document.getElementById('spec-count');
    if (specListEl) specListEl.innerText = specs.join(', ') || "縺ｪ縺・;
    if (specCountEl) specCountEl.innerText = specs.length;

    var gotoSssBtn = document.getElementById('btn-goto-sss');
    if (gotoSssBtn) {
        if (p2) gotoSssBtn.classList.remove('disabled'); else gotoSssBtn.classList.add('disabled');
    }

    var maxP = parseInt(document.getElementById('room-capacity') ? document.getElementById('room-capacity').value : 2) || 2;
    var lobbyMsg = {
        type: 'lobby',
        maxPlayers: maxP,
        p1: window.SMA.localPlayerName, p1Icon: window.SMA.localPlayerIcon,
        p2: p2 ? p2.name : null, p2Icon: p2 ? p2.icon : null,
        p3: p3 ? p3.name : null, p3Icon: p3 ? p3.icon : null,
        p4: p4 ? p4.name : null, p4Icon: p4 ? p4.icon : null,
        specs: specs, ver: window.SMA.VERSION
    };

    if (window.SMA.isGravity && window.SMA.isHost) {
        window.SMA.broadcast(lobbyMsg);
    }

    window.SMA.connections.forEach(function (c) {
        if (c.conn.open && !window.SMA.isGravity) c.conn.send(lobbyMsg);
    });
    window.SMA.refreshHubUI();
};

window.SMA.broadcast = function (msg) {
    window.SMA.connections.forEach(function (c) { if (c.conn.open && c.conn.send && !window.SMA.isGravity) c.conn.send(msg); });
    if (window.SMA.isGravity) {
        if (window.SMA.isHost) {
            window.SMA.gravityRtConns.forEach(function (c) {
                if (!c || !c.open) return;
                try { c.send(msg); } catch (e) { }
            });
        } else {
            if (window.SMA.gravityRtConn && window.SMA.gravityRtConn.open) {
                try { window.SMA.gravityRtConn.send(msg); } catch (e) { }
            } else {
                window.SMA.gravityRtOutbox.push(msg);
            }
        }
    }
};

window.SMA.handleClient = async function (d) {
    if (typeof Blob !== 'undefined' && d instanceof Blob) {
        try {
            if (typeof d.text === 'function') { d = await d.text(); }
            else { d = await new Promise(function (resolve, reject) { var reader = new FileReader(); reader.onload = function () { resolve(reader.result); }; reader.onerror = reject; reader.readAsText(d); }); }
        } catch (e) { }
    }
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { return; } }
    if (d.ver && d.ver !== window.SMA.VERSION) { document.getElementById('overlay-msg').innerText = "VERSION MISMATCH\nPLEASE RELOAD"; return; }
    if (d.type === 'lobby') {
        console.log("[SMA] handleClient: received lobby update, p1=" + d.p1);
        window.SMA.lobbyState = {
            p1: d.p1, p1Icon: d.p1Icon,
            p2: d.p2, p2Icon: d.p2Icon,
            p3: d.p3, p3Icon: d.p3Icon,
            p4: d.p4, p4Icon: d.p4Icon
        };

        var updateSlot = function (id, pName, pIcon) {
            var nameEl = document.getElementById('lobby-name-p' + id);
            var iconEl = document.getElementById('lobby-icon-p' + id);
            var cardEl = document.getElementById('slot-p' + id);
            if (cardEl) {
                if (pName) {
                    cardEl.classList.remove('waiting');
                    if (nameEl) nameEl.innerText = pName;
                    if (iconEl) {
                        if (pIcon) {
                            if (iconEl.tagName.toLowerCase() === 'img') { iconEl.src = pIcon; iconEl.style.display = 'inline-block'; }
                            else { iconEl.innerText = ''; iconEl.style.backgroundImage = 'url(' + pIcon + ')'; iconEl.style.backgroundSize = 'cover'; }
                        }
                        else { if (iconEl.tagName.toLowerCase() !== 'img') { iconEl.innerText = '側'; iconEl.style.backgroundImage = 'none'; } }
                    }
                } else {
                    cardEl.classList.add('waiting');
                    if (nameEl) nameEl.innerText = "蠕・ｩ滉ｸｭ...";
                    if (iconEl && iconEl.tagName.toLowerCase() !== 'img') { iconEl.innerText = '側'; iconEl.style.backgroundImage = 'none'; }
                }
            }
        };
        // 譛螟ｧ莠ｺ謨ｰ縺ｫ蠢懊§縺溘せ繝ｭ繝・ヨ陦ｨ遉ｺ・医ご繧ｹ繝亥・・・
        if (d.maxPlayers) window.SMA.showPlayerSlots(d.maxPlayers);

        updateSlot(1, d.p1, d.p1Icon);
        updateSlot(2, d.p2, d.p2Icon);
        updateSlot(3, d.p3, d.p3Icon);
        updateSlot(4, d.p4, d.p4Icon);
        window.SMA.renderSpectatorStrip(d.specs || []);

        var specListEl = document.getElementById('spec-list');
        var specCountEl = document.getElementById('spec-count');
        if (specListEl) specListEl.innerText = (d.specs && d.specs.length > 0) ? d.specs.join(', ') : "縺ｪ縺・;
        if (specCountEl) specCountEl.innerText = (d.specs && d.specs.length) || 0;

        window.SMA.refreshHubUI();

        if (!window.SMA.hasJoined) {
            window.SMA.hasJoined = true;
            window.SMA.showNotification("蜈･螳､縺励∪縺励◆・・, 2000);
        }
    }
    if (d.type === 'assign_role') {
        window.SMA.myRole = d.role;
    }
    if (d.type === 'goto_hub_select') {
        console.log("[SMA] handleClient: received goto_hub_select");
        window.SMA.showHubSelectPanel();
    }
    if (d.type === 'hub_ready') {
        window.SMA.updateHubState(d);
        if (window.SMA.isHost) {
            window.SMA.broadcast(d);
            window.SMA.checkHubAllReady();
        }
    }
    if (d.type === 'start_match') {
        window.SMA.p1CharId = d.p1Char; window.SMA.p2CharId = d.p2Char;
        window.SMA.p3CharId = d.p3Char; window.SMA.p4CharId = d.p4Char;
        window.SMA.selectedStage = d.stage; window.SMA.playerCount = d.playerCount || 2;
        window.SMA.startGameMulti();
    }
    if (d.type === 'sync') {
        // Gravity隧ｦ蜷井ｸｭ縺ｯP2P蜷梧悄縺ｮ縺ｿ繧剃ｽｿ逕ｨ・・DK sync縺ｯ辟｡隕厄ｼ・
        if (window.SMA.isGravity && !window.SMA.isHost && window.SMA.gravityUsePeerInMatch) return;
        if (!window.SMA.gameRunning) { window.SMA.selectedStage = d.stg || 'battlefield'; window.SMA.bootGame(); }
        window.SMA.applySync(d);
    }
};
window.SMA.handleConn = function (c) {
    c.on('data', function (d) {
        if (d.ver && d.ver !== window.SMA.VERSION) { if (window.SMA.isHost) c.send({ type: 'error', msg: 'VERSION MISMATCH' }); document.getElementById('overlay-msg').innerText = "VERSION MISMATCH\nP2 has diff ver"; return; }
        if (d.type === 'handshake') {
            // 繝励Ξ繧､繝､繝ｼ繝ｭ繝ｼ繝ｫ縺ｮ讀懃ｴ｢・亥・謗･邯壹メ繧ｧ繝・け蜷ｫ繧・・
            var existingEntry = null;
            var assignedRole = null;

            if (d.role === 'join') {
                // 縺ｾ縺壽里蟄倥・繝励Ξ繧､繝､繝ｼ繧呈､懃ｴ｢・亥・謗･邯壼愛螳夲ｼ・
                var roles = ['p2', 'p3', 'p4'];
                for (var ri = 0; ri < roles.length; ri++) {
                    var entry = window.SMA.connections.find(function (x) { return x.role === roles[ri]; });
                    if (entry && entry.name === d.name && !entry.conn.open) {
                        existingEntry = entry;
                        assignedRole = roles[ri];
                        break;
                    }
                }
            }

            var isLocked = window.SMA.gameRunning || window.SMA.isInCSS;

            // 繝ｭ繝・け荳ｭ縺ｯ繧ｹ繝壹け繝・う繧ｿ繝ｼ縺ｮ縺ｿ險ｱ蜿ｯ・亥・謗･邯壹・髯､螟厄ｼ・
            if (isLocked && d.role !== 'spec') {
                if (!existingEntry) {
                    c.send({ type: 'error', msg: 'MATCH_IN_PROGRESS' });
                    setTimeout(function () { c.close(); }, 500);
                    return;
                }
            }

            // 蜀肴磁邯壼・逅・
            if (existingEntry) {
                existingEntry.conn = c;
                existingEntry.name = d.name;
                c.send({ type: 'assign_role', role: assignedRole });
                window.SMA.showNotification(assignedRole.toUpperCase() + "縺悟・謗･邯壹＠縺ｾ縺励◆", 2000);
                if (window.SMA.gameRunning) {
                    // 繧ｲ繝ｼ繝荳ｭ縺ｮ蜀肴磁邯壼酔譛溘・譌｢蟄倥・sync縺ｧ陦後ｏ繧後ｋ
                }
            } else if (d.role === 'join') {
                // 譁ｰ隕上・繝ｬ繧､繝､繝ｼ縺ｮ繝ｭ繝ｼ繝ｫ蜑ｲ繧雁ｽ薙※・・2竊恥3竊恥4縺ｮ鬆・ｼ・
                var p2 = window.SMA.connections.find(function (x) { return x.role === 'p2'; });
                var p3 = window.SMA.connections.find(function (x) { return x.role === 'p3'; });
                var p4 = window.SMA.connections.find(function (x) { return x.role === 'p4'; });

                var newRole = null;
                if (!p2 || !p2.conn.open) newRole = 'p2';
                else if (!p3 || !p3.conn.open) newRole = 'p3';
                else if (!p4 || !p4.conn.open) newRole = 'p4';

                if (!newRole) {
                    // 4莠ｺ蝓九∪縺｣縺ｦ縺・ｋ竊呈ｺ螳､
                    c.send({ type: 'error', msg: 'ROOM_FULL' });
                    setTimeout(function () { c.close(); }, 500);
                    return;
                }

                // 譌｢蟄倥・disconnected entry縺後≠繧句ｴ蜷医・荳頑嶌縺・
                var existing = window.SMA.connections.find(function (x) { return x.role === newRole; });
                if (existing) {
                    existing.conn = c;
                    existing.name = d.name;
                } else {
                    window.SMA.connections.push({ conn: c, role: newRole, name: d.name, icon: d.icon });
                }
                c.send({ type: 'assign_role', role: newRole });
                window.SMA.broadcastLobby();
                window.SMA.showNotification(newRole.toUpperCase() + "縺悟・螳､縺励∪縺励◆・・, 2000);
            } else {
                // 隕ｳ謌ｦ閠・
                var existingSpec = window.SMA.connections.find(function (x) { return x.role === 'spec' && x.name === d.name; });
                if (existingSpec) {
                    existingSpec.conn = c;
                    existingSpec.icon = d.icon || existingSpec.icon;
                } else {
                    window.SMA.connections.push({ conn: c, role: 'spec', name: d.name, icon: d.icon });
                }
                window.SMA.broadcastLobby();

                // 驕・ｻｶ蜿ょ刈縺ｮ蜷梧悄
                if (window.SMA.gameRunning) {
                    // 繧ｲ繝ｼ繝荳ｭ縺ｮ繧ｹ繝壹け繝・う繧ｿ繝ｼ蜷梧悄縺ｯsync繝ｫ繝ｼ繝励〒陦後ｏ繧後ｋ
                } else if (!document.getElementById('battle-hub-screen').classList.contains('hidden')) {
                    c.send({ type: 'goto_css' });
                    c.send({ type: 'char_update', role: 'p1', charId: window.SMA.p1CharId });
                    c.send({ type: 'char_update', role: 'p2', charId: window.SMA.p2CharId });
                    c.send({ type: 'char_update', role: 'p3', charId: window.SMA.p3CharId });
                    c.send({ type: 'char_update', role: 'p4', charId: window.SMA.p4CharId });
                    c.send({ type: 'player_ready', role: 'p1', ready: window.SMA.p1IsReady });
                    c.send({ type: 'player_ready', role: 'p2', ready: window.SMA.p2IsReady });
                    c.send({ type: 'player_ready', role: 'p3', ready: window.SMA.p3IsReady });
                    c.send({ type: 'player_ready', role: 'p4', ready: window.SMA.p4IsReady });
                } else if (!document.getElementById('battle-hub-screen').classList.contains('hidden')) {
                    c.send({ type: 'goto_sss' });
                    c.send({ type: 'stage_update', role: 'p1', stageId: window.SMA.p1Stage });
                    c.send({ type: 'stage_update', role: 'p2', stageId: window.SMA.p2Stage });
                    c.send({ type: 'stage_update', role: 'p3', stageId: window.SMA.p3Stage });
                    c.send({ type: 'stage_update', role: 'p4', stageId: window.SMA.p4Stage });
                    c.send({ type: 'stage_ready', role: 'p1', ready: window.SMA.p1StageReady });
                    c.send({ type: 'stage_ready', role: 'p2', ready: window.SMA.p2StageReady });
                    c.send({ type: 'stage_ready', role: 'p3', ready: window.SMA.p3StageReady });
                    c.send({ type: 'stage_ready', role: 'p4', ready: window.SMA.p4StageReady });
                }
            }
        }
        // 繧ｹ繝・・繧ｸ繝ｻ繧ｭ繝｣繝ｩ繝ｻ貅門ｙ迥ｶ諷九・譖ｴ譁ｰ・亥・繝ｭ繝ｼ繝ｫ蟇ｾ蠢懶ｼ・
        if (d.type === 'stage_update') {
            if (d.role === 'p2') window.SMA.p2Stage = d.stageId;
            if (d.role === 'p3') window.SMA.p3Stage = d.stageId;
            if (d.role === 'p4') window.SMA.p4Stage = d.stageId;
            window.SMA.updateSSSUI(); window.SMA.broadcast(d);
        }
        if (d.type === 'stage_ready') {
            if (d.role === 'p2') window.SMA.p2StageReady = d.ready;
            if (d.role === 'p3') window.SMA.p3StageReady = d.ready;
            if (d.role === 'p4') window.SMA.p4StageReady = d.ready;
            window.SMA.updateSSSUI(); window.SMA.broadcast(d); window.SMA.checkStageAllReady();
        }
        if (d.type === 'char_update') {
            if (d.role === 'p2') window.SMA.p2CharId = d.charId;
            if (d.role === 'p3') window.SMA.p3CharId = d.charId;
            if (d.role === 'p4') window.SMA.p4CharId = d.charId;
            window.SMA.updateCSSUI(); window.SMA.broadcast(d);
        }
        if (d.type === 'player_ready') {
            if (d.role === 'p2') window.SMA.p2IsReady = d.ready;
            if (d.role === 'p3') window.SMA.p3IsReady = d.ready;
            if (d.role === 'p4') window.SMA.p4IsReady = d.ready;
            window.SMA.updateCSSUI(); window.SMA.broadcast(d); window.SMA.checkAllReady();
        }
        if (d.type === 'input' && window.SMA.isHost) {
            var sender = window.SMA.connections.find(function (x) { return x.conn === c; });
            if (sender && (sender.role === 'p2' || sender.role === 'p3' || sender.role === 'p4')) {
                var role = sender.role;
                window.SMA.remoteKeysMap[role] = d.keys;
                window.SMA.remoteLastInputTimeMap[role] = Date.now();
                if (d.keys.triggerJump || d.keys.triggerStartCharge || d.keys.triggerReleaseAttack || d.keys.triggerGrab) {
                    if (!window.SMA.remoteEventsMap[role]) window.SMA.remoteEventsMap[role] = [];
                    window.SMA.remoteEventsMap[role].push(d.keys);
                }
                // 蠕梧婿莠呈鋤: p2縺ｮ蜈･蜉帙・remoteKeys縺ｫ繧ょ・繧後ｋ
                if (role === 'p2') {
                    window.SMA.remoteKeys = d.keys;
                    window.SMA.remoteLastInputTime = Date.now();
                    if (d.keys.triggerJump || d.keys.triggerStartCharge || d.keys.triggerReleaseAttack || d.keys.triggerGrab) window.SMA.remoteEvents.push(d.keys);
                }
            }
        }
    });

    // 蛻・妙譎ゅ・蜃ｦ逅・
    c.on('close', function () {
        var idx = window.SMA.connections.findIndex(function (x) { return x.conn === c; });
        if (idx !== -1) {
            if (window.SMA.connections[idx].role === 'spec') {
                window.SMA.connections.splice(idx, 1);
                window.SMA.broadcastLobby();
            } else {
                // 繝励Ξ繧､繝､繝ｼ縺悟・譁ｭ縺輔ｌ縺・
                var role = window.SMA.connections[idx].role;
                window.SMA.showNotification(role.toUpperCase() + "縺悟・譁ｭ縺輔ｌ縺ｾ縺励◆", 2000);
            }
        }
    });
};

