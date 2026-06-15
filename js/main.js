function reportError(e) {
    var msg = (e && e.message) ? e.message : e.toString();
    if (msg.indexOf('Script error') !== -1) return;
    var d = document.getElementById('error-report');
    if (d) { d.style.display = 'block'; d.innerText += "ERR: " + msg.substring(0, 50) + "\n"; }
    var ovl = document.getElementById('overlay-msg');
    if (ovl) ovl.innerText = "ERR";
    console.error(e);
}
window.onerror = function (m, u, l) { reportError(m); return false; };

// 1. GLOBAL NAMESPACE
window.SMA = {};
window.SMA.ID_PREFIX = "sumagura_v432_";
window.SMA.VERSION = "v432";
window.SMA.GRAVITY = 0.40; window.SMA.MAX_FALL_SPEED = 9.0;
window.SMA.FRICTION = 0.82; window.SMA.KB_FRICTION = 0.95;
window.SMA.SPEED = 1.1; window.SMA.JUMP_FORCE = -10.0;
window.SMA.SCREEN_W = 1280; window.SMA.SCREEN_H = 720;
window.SMA.WORLD_W = 1500; window.SMA.WORLD_H = 1600;
window.SMA.BLAST_LEFT = -250; window.SMA.BLAST_RIGHT = 1750; window.SMA.BLAST_TOP = -150; window.SMA.BLAST_BOTTOM = 1800;
window.SMA.gameRunning = false; window.SMA.isOnline = false; window.SMA.isHost = true; window.SMA.isSolo = false;
window.SMA.isInCSS = false; // "In Locked Room State" (SSS or CSS)
window.SMA.myRole = 'host';
window.SMA.netPeer = null; window.SMA.netConn = null; window.SMA.connections = [];
window.SMA.targetPeerId = null;
window.SMA.gameState = 'COUNTDOWN'; window.SMA.countdownTimer = 180;
window.SMA.localPlayerName = "Player";
window.SMA.isGravity = (window.self !== window.top); // iframe内（Gravity環境）か判定
window.SMA.gravityUserInfo = null;
window.SMA.animationFrameId = null;
window.SMA.shake = 0; window.SMA.freezeFrame = 0; window.SMA.hitStop = 0; window.SMA.comets = []; window.SMA.stars = [];
window.SMA.pOne = null; window.SMA.pTwo = null; window.SMA.platforms = []; window.SMA.camera = { x: 0, y: 0, zoom: 1.0 }; window.SMA.particles = [];
window.SMA.projectiles = [];
window.SMA.myKeys = { left: false, right: false, up: false, down: false, shield: false };
window.SMA.remoteKeys = { left: false, right: false, up: false, down: false, shield: false };
window.SMA.remoteLastInputTime = 0; // Anti-freeze
window.SMA.remoteEvents = []; window.SMA.syncEvents = [];
window.SMA.myCharId = 'sword'; window.SMA.p1CharId = 'sword'; window.SMA.p2CharId = 'sword'; window.SMA.p3CharId = 'sword'; window.SMA.p4CharId = 'sword';
window.SMA.amIReady = false; window.SMA.p1IsReady = false; window.SMA.p2IsReady = false; window.SMA.p3IsReady = false; window.SMA.p4IsReady = false;
window.SMA.PLAYER_COLORS = ['#ff7675', '#74b9ff', '#fdcb6e', '#00b894'];
window.SMA.PLAYER_ROLES = ['p1', 'p2', 'p3', 'p4'];
window.SMA.players = []; // Fighter配列（ゲーム中に使用）
window.SMA.playerCount = 2; // 実際の参加プレイヤー数
window.SMA.remoteKeysMap = { p2: {}, p3: {}, p4: {} };
window.SMA.remoteEventsMap = { p2: [], p3: [], p4: [] };
window.SMA.remoteLastInputTimeMap = { p2: 0, p3: 0, p4: 0 };

// Stage Vars
window.SMA.myStageId = 'battlefield';
window.SMA.p1Stage = 'battlefield'; window.SMA.p2Stage = 'battlefield'; window.SMA.p3Stage = 'battlefield'; window.SMA.p4Stage = 'battlefield';
window.SMA.p1StageReady = false; window.SMA.p2StageReady = false; window.SMA.p3StageReady = false; window.SMA.p4StageReady = false;
window.SMA.selectedStage = 'battlefield';

window.SMA.audioCtx = null; window.SMA.soundEnabled = false; window.SMA.audioUnlocked = false; window.SMA.audioUnlockBound = false;
window.SMA.angelChargeVisualDelay = 10;
window.SMA.canvas = null; window.SMA.ctx = null;
window.SMA.isEditingLayout = false;
window.SMA.hasJoined = false;

// Gravity SDK Bridge Utils
window.SMA.gravityRequests = {};
window.SMA.gravityRoomRequests = {};
window.SMA.gravityUsePeerInMatch = true;
window.SMA.gravityRtPeer = null;
window.SMA.gravityRtConn = null; // guest -> host
window.SMA.gravityRtConns = [];  // host -> guests
window.SMA.gravityRtHostPeerId = null;
window.SMA.lastGravityRtSyncAt = 0;
window.SMA.gravityRtOutbox = [];
window.SMA.pendingHubReady = null;
window.SMA.ONLINE_INPUT_DELAY_FRAMES = 5;
window.SMA.LOCKSTEP_STALL_FILL_MS = 300;
window.SMA.onlineStrictLockstep = true;
window.SMA.lockstepFrame = 0;
window.SMA.lockstepRemoteFrame = 0;
window.SMA.lockstepInputBuffer = {};
window.SMA.lockstepLastInputs = { p1: {}, p2: {}, p3: {}, p4: {} };
window.SMA.lockstepLastInputFrame = { p1: -1, p2: -1, p3: -1, p4: -1 };
window.SMA.lockstepLocalTriggers = {};
window.SMA.lockstepStallStartAt = 0;

window.SMA.emptyInputKeys = function () {
    return { left: false, right: false, up: false, down: false, shield: false, attack: false, jump: false, grab: false };
};

window.SMA.cloneInputKeys = function (keys) {
    keys = keys || {};
    return {
        left: !!keys.left,
        right: !!keys.right,
        up: !!keys.up,
        down: !!keys.down,
        shield: !!keys.shield,
        attack: !!keys.attack,
        jump: !!keys.jump,
        grab: !!keys.grab,
        triggerJump: !!keys.triggerJump,
        triggerStartCharge: !!keys.triggerStartCharge,
        triggerReleaseAttack: !!keys.triggerReleaseAttack,
        triggerGrab: !!keys.triggerGrab,
        attackType: keys.attackType || null
    };
};

window.SMA.stripInputTriggers = function (keys) {
    var out = window.SMA.cloneInputKeys(keys);
    out.triggerJump = false;
    out.triggerStartCharge = false;
    out.triggerReleaseAttack = false;
    out.triggerGrab = false;
    out.attackType = null;
    return out;
};

window.SMA.mergeInputKeys = function (base, incoming) {
    var out = window.SMA.cloneInputKeys(base);
    incoming = incoming || {};
    ['left', 'right', 'up', 'down', 'shield', 'attack', 'jump', 'grab'].forEach(function (key) {
        if (Object.prototype.hasOwnProperty.call(incoming, key)) out[key] = !!incoming[key];
    });
    out.triggerJump = out.triggerJump || !!incoming.triggerJump;
    out.triggerStartCharge = out.triggerStartCharge || !!incoming.triggerStartCharge;
    out.triggerReleaseAttack = out.triggerReleaseAttack || !!incoming.triggerReleaseAttack;
    out.triggerGrab = out.triggerGrab || !!incoming.triggerGrab;
    out.attackType = incoming.attackType || out.attackType;
    return out;
};

window.SMA.getLocalInputTargetFrame = function () {
    var base = window.SMA.isHost ? (window.SMA.lockstepFrame || 0) : (window.SMA.lockstepRemoteFrame || 0);
    return Math.max(0, Math.floor(base + window.SMA.ONLINE_INPUT_DELAY_FRAMES));
};

window.SMA.getLockstepActiveRoles = function () {
    var pc = window.SMA.playerCount || (window.SMA.players && window.SMA.players.length) || 2;
    pc = Math.max(1, Math.min(pc, window.SMA.PLAYER_ROLES.length));
    return window.SMA.PLAYER_ROLES.slice(0, pc);
};

window.SMA.normalizeRemotePlayerRole = function (role) {
    if (role === 'p2' || role === 'p3' || role === 'p4') return role;
    var activeRoles = window.SMA.getLockstepActiveRoles().filter(function (r) { return r !== 'p1'; });
    return activeRoles[0] || 'p2';
};

window.SMA.resetLockstepState = function () {
    window.SMA.lockstepFrame = 0;
    window.SMA.lockstepRemoteFrame = 0;
    window.SMA.lockstepInputBuffer = {};
    window.SMA.lockstepLastInputs = { p1: {}, p2: {}, p3: {}, p4: {} };
    window.SMA.lockstepLastInputFrame = { p1: -1, p2: -1, p3: -1, p4: -1 };
    window.SMA.lockstepLocalTriggers = {};
    window.SMA.lockstepStallStartAt = 0;
    var roles = window.SMA.getLockstepActiveRoles();
    for (var frame = 0; frame < window.SMA.ONLINE_INPUT_DELAY_FRAMES; frame++) {
        window.SMA.lockstepInputBuffer[frame] = {};
        roles.forEach(function (role) {
            window.SMA.lockstepInputBuffer[frame][role] = window.SMA.emptyInputKeys();
        });
    }
};

window.SMA.storeLockstepInput = function (role, keys, frame) {
    if (role === 'host') role = 'p1';
    if (role !== 'p1') role = window.SMA.normalizeRemotePlayerRole(role);
    if (window.SMA.PLAYER_ROLES.indexOf(role) === -1) return false;
    var targetFrame = parseInt(frame, 10);
    if (!isFinite(targetFrame)) targetFrame = window.SMA.getLocalInputTargetFrame();
    if (window.SMA.isHost && targetFrame < window.SMA.lockstepFrame) targetFrame = window.SMA.lockstepFrame;
    if (window.SMA.isHost && role !== 'p1') {
        var lastFrame = window.SMA.lockstepLastInputFrame[role];
        if (!isFinite(lastFrame)) lastFrame = -1;
        var fillStart = Math.max(window.SMA.lockstepFrame || 0, lastFrame + 1);
        var holdKeys = window.SMA.stripInputTriggers(keys);
        for (var fillFrame = fillStart; fillFrame < targetFrame; fillFrame++) {
            if (!window.SMA.lockstepInputBuffer[fillFrame]) window.SMA.lockstepInputBuffer[fillFrame] = {};
            if (!window.SMA.lockstepInputBuffer[fillFrame][role]) {
                window.SMA.lockstepInputBuffer[fillFrame][role] = window.SMA.mergeInputKeys(window.SMA.lockstepLastInputs[role], holdKeys);
            }
        }
        if (targetFrame > lastFrame) window.SMA.lockstepLastInputFrame[role] = targetFrame;
    }
    if (!window.SMA.lockstepInputBuffer[targetFrame]) window.SMA.lockstepInputBuffer[targetFrame] = {};
    window.SMA.lockstepInputBuffer[targetFrame][role] = window.SMA.mergeInputKeys(window.SMA.lockstepInputBuffer[targetFrame][role], keys);
    return true;
};

window.SMA.receiveRemoteInput = function (role, keys, frame) {
    role = window.SMA.normalizeRemotePlayerRole(role);
    if (window.SMA.onlineStrictLockstep && window.SMA.isHost && window.SMA.isOnline && window.SMA.gameRunning) {
        return window.SMA.storeLockstepInput(role, keys, frame);
    }
    window.SMA.remoteKeysMap[role] = keys || {};
    window.SMA.remoteLastInputTimeMap[role] = Date.now();
    if (keys && (keys.triggerJump || keys.triggerStartCharge || keys.triggerReleaseAttack || keys.triggerGrab)) {
        if (!window.SMA.remoteEventsMap[role]) window.SMA.remoteEventsMap[role] = [];
        window.SMA.remoteEventsMap[role].push(keys);
    }
    if (role === 'p2') {
        window.SMA.remoteKeys = keys || {};
        window.SMA.remoteLastInputTime = Date.now();
        if (keys && (keys.triggerJump || keys.triggerStartCharge || keys.triggerReleaseAttack || keys.triggerGrab)) window.SMA.remoteEvents.push(keys);
    }
    return true;
};

window.SMA.queueLocalInputEvent = function (keys) {
    window.SMA.lockstepLocalTriggers = window.SMA.mergeInputKeys(window.SMA.lockstepLocalTriggers, keys);
};

window.SMA.captureLocalLockstepInput = function () {
    var keys = window.SMA.mergeInputKeys(window.SMA.myKeys, window.SMA.lockstepLocalTriggers);
    window.SMA.lockstepLocalTriggers = {};
    return keys;
};

window.SMA.prepareHostLockstepInputs = function () {
    if (!window.SMA.onlineStrictLockstep || !window.SMA.isHost || !window.SMA.isOnline || !window.SMA.gameRunning || window.SMA.gameState !== 'PLAYING') return null;
    var frame = window.SMA.lockstepFrame || 0;
    window.SMA.storeLockstepInput('p1', window.SMA.captureLocalLockstepInput(), frame + window.SMA.ONLINE_INPUT_DELAY_FRAMES);
    var bucket = window.SMA.lockstepInputBuffer[frame] || {};
    window.SMA.lockstepInputBuffer[frame] = bucket;
    var roles = window.SMA.getLockstepActiveRoles();
    var missingRoles = [];
    for (var i = 0; i < roles.length; i++) {
        if (!bucket[roles[i]]) missingRoles.push(roles[i]);
    }
    if (missingRoles.length > 0) {
        if (!window.SMA.lockstepStallStartAt) window.SMA.lockstepStallStartAt = Date.now();
        if ((Date.now() - window.SMA.lockstepStallStartAt) < window.SMA.LOCKSTEP_STALL_FILL_MS) return false;
        missingRoles.forEach(function (role) {
            bucket[role] = window.SMA.stripInputTriggers(window.SMA.lockstepLastInputs[role] || window.SMA.emptyInputKeys());
        });
    }
    window.SMA.lockstepStallStartAt = 0;
    var inputs = {};
    roles.forEach(function (role) {
        inputs[role] = window.SMA.cloneInputKeys(bucket[role]);
        window.SMA.lockstepLastInputs[role] = inputs[role];
    });
    Object.keys(window.SMA.lockstepInputBuffer).forEach(function (k) {
        if (parseInt(k, 10) < frame - 30) delete window.SMA.lockstepInputBuffer[k];
    });
    return inputs;
};

window.SMA.advanceLockstepFrame = function () {
    window.SMA.lockstepFrame = (window.SMA.lockstepFrame || 0) + 1;
};
