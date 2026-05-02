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
window.SMA.ID_PREFIX = "sumagura_v431_";
window.SMA.VERSION = "v431";
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

