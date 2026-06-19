// --- Shared fx/draw helpers used by gameplay ---
window.SMA.showNotification = function (text, duration) {
    var ovl = document.getElementById('notification-overlay');
    var msg = document.getElementById('notification-text');
    if (ovl && msg) {
        msg.innerText = text;
        ovl.classList.add('active');
        setTimeout(function () { ovl.classList.remove('active'); }, duration || 2000);
    }
};
window.SMA.triggerComet = function (x, y, dir, col) { if (window.SMA.isHost && window.SMA.isOnline) window.SMA.syncEvents.push({ type: 'comet', x: x, y: y, dir: dir, c: col }); window.SMA.comets.push({ x: x, y: y, vx: (Math.random() - 0.5) * 10, vy: -(Math.random() * 10 + 10), color: col, l: 60 }); };
window.SMA.drawComets = function (ctx) { for (var i = window.SMA.comets.length - 1; i >= 0; i--) { var c = window.SMA.comets[i]; ctx.fillStyle = c.color; ctx.save(); ctx.shadowBlur = 20; ctx.shadowColor = c.color; ctx.beginPath(); ctx.arc(c.x, c.y, 20, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.strokeStyle = c.color; ctx.lineWidth = 10; ctx.moveTo(c.x, c.y); ctx.lineTo(c.x - c.vx * 4, c.y - c.vy * 4); ctx.stroke(); ctx.restore(); } };
window.SMA.koBlastTrails = window.SMA.koBlastTrails || [];
window.SMA.getKoBlastVector = function (dir, vx, vy) {
    var mag = Math.sqrt((vx || 0) * (vx || 0) + (vy || 0) * (vy || 0));
    if (mag > 0.2) return { x: vx / mag, y: vy / mag };
    if (dir === 'left') return { x: -1, y: 0 };
    if (dir === 'right') return { x: 1, y: 0 };
    if (dir === 'up') return { x: 0, y: -1 };
    if (dir === 'down') return { x: 0, y: 1 };
    return { x: 0, y: -1 };
};
window.SMA.getKoBlastPoint = function (x, y, dir) {
    var b = window.SMA.getActiveBlastBounds ? window.SMA.getActiveBlastBounds() : { left: window.SMA.BLAST_LEFT, right: window.SMA.BLAST_RIGHT, top: window.SMA.BLAST_TOP, bottom: window.SMA.BLAST_BOTTOM };
    var px = Math.max(b.left + 120, Math.min(b.right - 120, x));
    var py = Math.max(b.top + 90, Math.min(b.bottom - 90, y));
    if (dir === 'left') px = b.left + 70;
    else if (dir === 'right') px = b.right - 70;
    else if (dir === 'up') py = b.top + 70;
    else if (dir === 'down') py = b.bottom - 70;
    return { x: px, y: py };
};
window.SMA.getKoPlayerColor = function (fighter) {
    var idx = window.SMA.players ? window.SMA.players.indexOf(fighter) : -1;
    if (idx >= 0 && window.SMA.PLAYER_COLORS && window.SMA.PLAYER_COLORS[idx]) return window.SMA.PLAYER_COLORS[idx];
    return fighter && fighter.color ? fighter.color : '#ffffff';
};
window.SMA.colorToRgb = function (color) {
    var c = String(color || '#ffffff').trim();
    if (c.charAt(0) === '#') {
        if (c.length === 4) c = '#' + c.charAt(1) + c.charAt(1) + c.charAt(2) + c.charAt(2) + c.charAt(3) + c.charAt(3);
        var n = parseInt(c.slice(1), 16);
        if (!isNaN(n)) return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }
    return { r: 255, g: 255, b: 255 };
};
window.SMA.darkenKoColor = function (color, amount) {
    var rgb = window.SMA.colorToRgb(color);
    var m = amount == null ? 0.72 : amount;
    return 'rgb(' + Math.floor(rgb.r * m) + ',' + Math.floor(rgb.g * m) + ',' + Math.floor(rgb.b * m) + ')';
};
window.SMA.triggerKoBlastFx = function (x, y, dir, col, vx, vy) {
    if (window.SMA.isHost && window.SMA.isOnline) window.SMA.syncEvents.push({ type: 'ko_fx', x: x, y: y, dir: dir, c: col, vx: vx || 0, vy: vy || 0 });
    var v = window.SMA.getKoBlastVector(dir, vx, vy);
    var p = window.SMA.getKoBlastPoint(x, y, dir);
    var perpX = -v.y;
    var perpY = v.x;
    var color = window.SMA.darkenKoColor(col || '#ffffff', 0.62);
    for (var i = 0; i < 19; i++) {
        var offset = (i - 9) * 17 + (Math.random() - 0.5) * 16;
        var length = 560 + Math.random() * 420;
        var speed = 7 + Math.random() * 5;
        window.SMA.koBlastTrails.push({
            x: p.x + perpX * offset - v.x * (20 + Math.random() * 50),
            y: p.y + perpY * offset - v.y * (20 + Math.random() * 50),
            vx: v.x * speed,
            vy: v.y * speed,
            dirX: v.x,
            dirY: v.y,
            len: length,
            width: 1.4 + Math.random() * 1.8,
            color: color,
            life: 44 + Math.floor(Math.random() * 14),
            maxLife: 58
        });
    }
};
window.SMA.updateKoBlastFx = function () {
    for (var i = window.SMA.koBlastTrails.length - 1; i >= 0; i--) { var t = window.SMA.koBlastTrails[i]; t.x += t.vx; t.y += t.vy; t.life--; if (t.life <= 0) window.SMA.koBlastTrails.splice(i, 1); }
};
window.SMA.drawKoBlastFx = function (ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (var i = 0; i < window.SMA.koBlastTrails.length; i++) {
        var t = window.SMA.koBlastTrails[i];
        var a = Math.max(0, Math.min(1, t.life / t.maxLife));
        var tailX = t.x - t.dirX * t.len;
        var tailY = t.y - t.dirY * t.len;
        var rgb = window.SMA.colorToRgb(t.color);
        var grad = ctx.createLinearGradient(tailX, tailY, t.x, t.y);
        grad.addColorStop(0, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0)');
        grad.addColorStop(0.32, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (0.86 * a) + ')');
        grad.addColorStop(1, t.color);
        ctx.globalAlpha = a;
        ctx.shadowBlur = 18;
        ctx.shadowColor = t.color;
        ctx.strokeStyle = grad;
        ctx.lineWidth = t.width;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
    }
    ctx.restore();
};
window.SMA.createParticles = function (x, y, n, c) { if (window.SMA.isHost && window.SMA.isOnline) window.SMA.syncEvents.push({ type: 'part', x: x, y: y, n: n, c: c }); for (var i = 0; i < n; i++) window.SMA.particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, color: c, l: 20 }); };
window.SMA.updateParticles = function (ctx) { for (var i = window.SMA.particles.length - 1; i >= 0; i--) { var p = window.SMA.particles[i]; ctx.fillStyle = p.color; ctx.globalAlpha = p.life / 30; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; } };
window.SMA.debugHitboxes = window.SMA.debugHitboxes || false;
window.SMA.drawDebugHitboxes = function (ctx) {
    if (!window.SMA.debugHitboxes || !ctx) return;
    ctx.save();
    ctx.lineWidth = 2;
    ctx.font = '12px sans-serif';
    var players = window.SMA.players || [];
    for (var i = 0; i < players.length; i++) {
        var f = players[i];
        if (!f || f.stocks <= 0) continue;
        var isStunned = f.actionState === 'STUN';
        ctx.strokeStyle = isStunned ? 'rgba(210, 70, 255, 0.95)' : 'rgba(80, 170, 255, 0.9)';
        ctx.fillStyle = isStunned ? 'rgba(210, 70, 255, 0.16)' : 'rgba(80, 170, 255, 0.08)';
        ctx.strokeRect(f.x, f.y, f.w, f.h);
        ctx.fillRect(f.x, f.y, f.w, f.h);
        if (f.hitbox && f.hitbox.active) {
            var hb = f.hitbox;
            ctx.strokeStyle = 'rgba(255, 35, 35, 0.95)';
            ctx.fillStyle = 'rgba(255, 35, 35, 0.25)';
            ctx.fillRect(hb.x, hb.y, hb.w, hb.h);
            ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            var label = (f.charId || '') + ' ' + (f.currentAttackType || '') + ' f' + (f.stateTimer || 0) + ' ' + Math.round(hb.w) + 'x' + Math.round(hb.h);
            ctx.fillText(label, hb.x, hb.y - 5);
        }
    }
    var projectiles = window.SMA.projectiles || [];
    for (var j = 0; j < projectiles.length; j++) {
        var p = projectiles[j];
        if (!p) continue;
        var hitW = p.hitW || p.w;
        var hitH = p.hitH || p.h || p.w;
        var hitCx = p.x + (p.hitOffsetX || 0);
        var hitCy = p.y + (p.hitOffsetY || 0);
        ctx.strokeStyle = 'rgba(255, 230, 80, 0.95)';
        ctx.fillStyle = 'rgba(255, 230, 80, 0.18)';
        ctx.fillRect(hitCx - hitW / 2, hitCy - hitH / 2, hitW, hitH);
        ctx.strokeRect(hitCx - hitW / 2, hitCy - hitH / 2, hitW, hitH);
    }
    ctx.restore();
};
window.SMA.mageVfx = window.SMA.mageVfx || [];
window.SMA.LEDGE_INPUT_LOCK_FRAMES = 45;
window.SMA.LEDGE_MAX_INVINCIBLE_FRAMES = 150;
window.SMA.getLedgeInvincibleFrames = function (airborneFrames) {
    var airborneSeconds = Math.max(0, airborneFrames || 0) / 60;
    return Math.min(window.SMA.LEDGE_MAX_INVINCIBLE_FRAMES, Math.floor(airborneSeconds * 0.75 * 60));
};
window.SMA.MATCH_TIME_FRAMES = 21600;
window.SMA.SUDDEN_DEATH_ZOOM_FRAMES = 900;
window.SMA.getStageCenter = function () {
    var main = (window.SMA.platforms || []).find(function (p) { return p && p.type === 'main'; });
    if (main) return { x: main.x + main.w / 2, y: main.y - 200 };
    return { x: window.SMA.WORLD_W / 2, y: window.SMA.WORLD_H * 0.7 - 200 };
};
window.SMA.getSuddenDeathProgress = function () {
    if ((window.SMA.matchTimer || 0) > 0) return 0;
    return Math.max(0, Math.min(1, ((window.SMA.suddenDeathTimer || 0) - 30) / window.SMA.SUDDEN_DEATH_ZOOM_FRAMES));
};
window.SMA.getSuddenDeathFinalZoom = function () {
    return Math.min(2.0, Math.max(1.45, window.SMA.SCREEN_W / 750));
};
window.SMA.formatMatchTimer = function () {
    var frames = Math.max(0, window.SMA.matchTimer || 0);
    var totalSeconds = Math.ceil(frames / 60);
    var mins = Math.floor(totalSeconds / 60);
    var secs = totalSeconds % 60;
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
};
window.SMA.getActiveBlastBounds = function () {
    var p = window.SMA.getSuddenDeathProgress();
    if (p <= 0) return { left: window.SMA.BLAST_LEFT, right: window.SMA.BLAST_RIGHT, top: window.SMA.BLAST_TOP, bottom: window.SMA.BLAST_BOTTOM };
    var center = window.SMA.getStageCenter();
    var finalZoom = window.SMA.getSuddenDeathFinalZoom();
    var currentZoom = 0.32 + (finalZoom - 0.32) * p;
    var activeW = (window.SMA.SCREEN_W / currentZoom) * 1.08;
    var activeH = (window.SMA.SCREEN_H / currentZoom) * 1.08;
    return { left: center.x - activeW / 2, right: center.x + activeW / 2, top: center.y - activeH / 2, bottom: center.y + activeH / 2 };
};
window.SMA.SPEAR_WEAPON_ASSET = {
    key: 'spear_weapon_v4',
    src: 'assets/characters/spear/spear_weapon.png?v=4',
    drawW: 110,
    thicknessScale: 1.3,
    gripXRatio: 0.18,
    gripYRatio: 0.52
};
window.SMA.drawVectorTrident = function (ctx, x, y, angleDeg, color, tipColor) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angleDeg * Math.PI / 180); ctx.fillStyle = color; ctx.fillRect(-20, -3, 80, 6); ctx.fillRect(55, -12, 6, 24); if (tipColor) ctx.fillStyle = tipColor; ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(90, 0); ctx.lineTo(85, 4); ctx.lineTo(85, -4); ctx.fill();
    // Side prongs (curved)
    ctx.beginPath();
    ctx.moveTo(60, -10); ctx.quadraticCurveTo(70, -15, 80, -15); ctx.lineTo(80, -12); ctx.quadraticCurveTo(70, -12, 60, -8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(60, 10); ctx.quadraticCurveTo(70, 15, 80, 15); ctx.lineTo(80, 12); ctx.quadraticCurveTo(70, 12, 60, 8);
    ctx.fill();
    ctx.restore();
};
window.SMA.drawTrident = function (ctx, x, y, angleDeg, color, tipColor) {
    var asset = window.SMA.SPEAR_WEAPON_ASSET;
    var img = asset && window.SMA.getSpriteAsset ? window.SMA.getSpriteAsset(asset.key, asset.src) : null;
    if (!img || !img.complete || !img.naturalWidth) {
        window.SMA.drawVectorTrident(ctx, x, y, angleDeg, color, tipColor);
        return;
    }

    var drawW = asset.drawW || 132;
    var drawH = drawW * img.naturalHeight / img.naturalWidth * (asset.thicknessScale || 1);
    var gripX = drawW * (asset.gripXRatio || 0.18);
    var gripY = drawH * (asset.gripYRatio || 0.5);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angleDeg * Math.PI / 180);
    ctx.imageSmoothingEnabled = true;
    if (tipColor) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = tipColor;
    }
    ctx.drawImage(img, -gripX, -gripY, drawW, drawH);
    ctx.restore();
};
window.SMA.SPEAR_GROUND_SHOCKWAVE_ASSET = {
    key: 'spear_ground_shockwave_powerwave_black_v1',
    src: 'assets/characters/spear/spear_down_shockwave_powerwave_black_sheet.png?v=1',
    frames: 4,
    frameW: 543,
    frameH: 724,
    cropY: 190,
    cropH: 365,
    drawW: 120,
    drawH: 82,
    frameStep: 5,
    bottomOffset: 10
};
window.SMA.drawSpearGroundShockwave = function (ctx, p) {
    if (!p || p.type !== 'shockwave' || p.visualKind !== 'spear_ground_shock') return false;
    var asset = window.SMA.SPEAR_GROUND_SHOCKWAVE_ASSET;
    var img = asset && window.SMA.getSpriteAsset ? window.SMA.getSpriteAsset(asset.key, asset.src) : null;
    if (!img || !img.complete || !img.naturalWidth) return false;
    var frames = asset.frames || 4;
    var frame = Math.max(0, Math.min(frames - 1, Math.floor((p.age || 0) / (asset.frameStep || 5))));
    var sx = frame * asset.frameW;
    var sy = asset.cropY || 0;
    var sw = asset.frameW;
    var sh = asset.cropH || asset.frameH;
    var drawW = asset.drawW || 170;
    var drawH = asset.drawH || 116;
    var dir = (p.vx || 0) < 0 ? -1 : 1;
    var bottomY = p.y + (asset.bottomOffset || 0);
    ctx.save();
    ctx.translate(p.x, bottomY);
    if (dir < 0) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, sx, sy, sw, sh, -drawW * 0.22, -drawH, drawW, drawH);
    ctx.restore();
    return true;
};
window.SMA.HAMMER_WEAPON_ASSET = {
    key: 'hammer_weapon',
    src: 'assets/characters/hammer/hammer_weapon.png?v=4',
    drawH: 66,
    gripXRatio: 0.5,
    gripYRatio: 0.1
};
window.SMA.drawVectorHammer = function (ctx, x, y, angleDeg, color, headColor) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angleDeg * Math.PI / 180);
    ctx.fillStyle = "#2d3436";
    ctx.fillRect(-2, -5, 5, 40);
    ctx.fillStyle = headColor || "#636e72";
    ctx.fillRect(-15, 35, 30, 20);
    ctx.strokeStyle = "#b2bec3";
    ctx.lineWidth = 2;
    ctx.strokeRect(-15, 35, 30, 20);
    ctx.restore();
};
window.SMA.drawHammer = function (ctx, x, y, angleDeg, color, headColor) {
    var asset = window.SMA.HAMMER_WEAPON_ASSET;
    var img = asset && window.SMA.getSpriteAsset ? window.SMA.getSpriteAsset(asset.key, asset.src) : null;
    if (img && img.complete && img.naturalWidth) {
        var drawH = asset.drawH || 60;
        var drawW = drawH * img.naturalWidth / img.naturalHeight;
        var gripX = drawW * (asset.gripXRatio || 0.5);
        var gripY = drawH * (asset.gripYRatio || 0.1);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angleDeg * Math.PI / 180);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, -gripX, -gripY, drawW, drawH);
        ctx.restore();
        return;
    }
    window.SMA.drawVectorHammer(ctx, x, y, angleDeg, color, headColor);
};

// --- Core game loop, simulation, fighters ---
window.SMA.initCanvas = function () {
    if (!window.SMA.canvas) window.SMA.canvas = document.getElementById('gameCanvas');
    if (window.SMA.canvas) {
        var cssW = Math.max(1, Math.round(window.SMA.canvas.clientWidth || 1280));
        var cssH = Math.max(1, Math.round(window.SMA.canvas.clientHeight || 720));
        var dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
        window.SMA.canvas.width = Math.round(cssW * dpr);
        window.SMA.canvas.height = Math.round(cssH * dpr);
        window.SMA.SCREEN_W = cssW;
        window.SMA.SCREEN_H = cssH;
        window.SMA.RENDER_SCALE = dpr;
        if (!window.SMA.ctx) window.SMA.ctx = window.SMA.canvas.getContext('2d');
    }
};
window.SMA.getTopExclusionHeight = function () {
    var h = window.innerHeight || document.documentElement.clientHeight || 0;
    return h >= 812 ? 98 : 74;
};
window.SMA.applyTopExclusionLayout = function () {
    var topExclusionHeight = window.SMA.getTopExclusionHeight();
    document.documentElement.style.setProperty('--top-exclusion-height', topExclusionHeight + 'px');
    return topExclusionHeight;
};
window.SMA.bootGame = function () {
    if (!window.SMA.Fighter) { alert("Fighter Class Missing"); return; }
    if (!window.SMA.CHAR_DATA) { alert("Data Missing"); return; }
    if (window.SMA.animationFrameId) cancelAnimationFrame(window.SMA.animationFrameId); window.SMA.initCanvas(); window.SMA.gameRunning = true; window.SMA.gameState = 'COUNTDOWN'; window.SMA.countdownTimer = 180; window.SMA.matchTimer = window.SMA.MATCH_TIME_FRAMES; window.SMA.suddenDeathTimer = 0; window.SMA.koBlastTrails = []; var elTxtOvl = document.getElementById('text-overlay'); if (elTxtOvl) elTxtOvl.style.opacity = 1;

    // STAGE INIT
    var stg = window.SMA.selectedStage;
    window.SMA.platforms = [];
    var mx = window.SMA.WORLD_W / 2 - 450; var my = window.SMA.WORLD_H * 0.7;

    if (stg === 'final') {
        // Final Destination: One big platform (FIXED WIDTH: 900)
        window.SMA.platforms.push({ x: window.SMA.WORLD_W / 2 - 450, y: my, w: 900, h: 40, type: 'main' });
    } else if (stg === 'day') {
        window.SMA.platforms.push({ x: mx, y: my, w: 900, h: 40, type: 'main' });
        window.SMA.platforms.push({ x: mx + 225, y: my - 135, w: 450, h: 10, type: 'plat' });
    } else {
        // Battlefield
        window.SMA.platforms.push({ x: mx, y: my, w: 900, h: 40, type: 'main' });
        window.SMA.platforms.push({ x: mx + 300, y: my - 180, w: 300, h: 10, type: 'plat' });
        window.SMA.platforms.push({ x: mx + 50, y: my - 90, w: 200, h: 10, type: 'plat' });
        window.SMA.platforms.push({ x: mx + 650, y: my - 90, w: 200, h: 10, type: 'plat' });
    }

    // Stars / Background setup
    window.SMA.stars = [];
    if (stg === 'final' || stg === 'day') {
        // Day: Clouds
        for (var i = 0; i < 20; i++) { window.SMA.stars.push({ x: Math.random() * (window.SMA.WORLD_W + 1000) - 500, y: Math.random() * (window.SMA.WORLD_H / 2), s: Math.random() * 50 + 30, type: 'cloud' }); }
    } else {
        // Night: Stars
        for (var i = 0; i < 200; i++) { window.SMA.stars.push({ x: Math.random() * (window.SMA.WORLD_W + 1000) - 500, y: Math.random() * (window.SMA.WORLD_H + 500) - 500, s: Math.random() * 2 + 1, type: 'star' }); }
    }

    // 繝励Ξ繧､繝､繝ｼ蛻晄悄蛹厄ｼ・莠ｺ蟇ｾ蠢懶ｼ・
    var charIds = [window.SMA.p1CharId, window.SMA.p2CharId, window.SMA.p3CharId, window.SMA.p4CharId];
    var colors = window.SMA.PLAYER_COLORS;
    var pc = window.SMA.playerCount || 2;
    // 蛻晄悄菴咲ｽｮ繧貞插遲峨↓蛻・淵
    var spawnPositions = [];
    var mainPlat = window.SMA.platforms[0];
    for (var pi = 0; pi < pc; pi++) {
        var spX = mainPlat.x + (mainPlat.w / (pc + 1)) * (pi + 1);
        spawnPositions.push({ x: spX, y: mainPlat.y - 100 });
    }
    window.SMA.players = [];
    for (var pi = 0; pi < pc; pi++) {
        var f = new window.SMA.Fighter(spawnPositions[pi].x, spawnPositions[pi].y, colors[pi], (pi > 0), charIds[pi]);
        f.playerIndex = pi;
        f.playerRole = window.SMA.PLAYER_ROLES[pi];
        window.SMA.players.push(f);
    }
    // 莠呈鋤繧ｨ繧､繝ｪ繧｢繧ｹ
    window.SMA.pOne = window.SMA.players[0];
    window.SMA.pTwo = window.SMA.players[1];
    window.SMA.projectiles = [];
    window.SMA.mageVfx = [];
    if (window.SMA.resetLockstepState) window.SMA.resetLockstepState();
    if (window.SMA.resetSoloInputDelayState) window.SMA.resetSoloInputDelayState();
    // HUD蜷榊燕險ｭ螳・
    if (window.SMA.isHost) {
        document.getElementById('p1-name').innerText = window.SMA.localPlayerName;
        for (var pi = 1; pi < pc; pi++) {
            var pObj = window.SMA.connections.find(function (x) { return x.role === window.SMA.PLAYER_ROLES[pi]; });
            var hudName = document.getElementById('p' + (pi + 1) + '-name');
            if (hudName) hudName.innerText = window.SMA.isOnline && pObj ? pObj.name : "CPU";
        }
    }
    // HUD陦ｨ遉ｺ蛻ｶ蠕｡
    for (var pi = 0; pi < 4; pi++) {
        var hud = document.getElementById('p' + (pi + 1) + '-hud');
        if (hud) hud.style.display = (pi < pc) ? '' : 'none';
    }
    var matchTimerEl = document.getElementById('match-timer');
    if (matchTimerEl) { matchTimerEl.style.display = 'block'; matchTimerEl.innerText = window.SMA.formatMatchTimer(); matchTimerEl.classList.remove('sudden-death'); }
    window.SMA.camera.x = mainPlat.x + mainPlat.w / 2; window.SMA.camera.y = mainPlat.y - 200; window.SMA.gameLoop();
};
window.SMA.updateCPU = function (cpu, targets) {
    // 譛繧りｿ代＞謨ｵ繧偵ち繝ｼ繧ｲ繝・ヨ縺ｫ
    var target = targets[0];
    var minDist = Infinity;
    for (var ti = 0; ti < targets.length; ti++) {
        if (targets[ti] === cpu || targets[ti].stocks <= 0) continue;
        var d = Math.abs(targets[ti].x - cpu.x);
        if (d < minDist) { minDist = d; target = targets[ti]; }
    }
    if (!target) target = targets[0];
    var inp = { left: false, right: false, up: false, down: false, shield: false }; if (cpu.actionState !== 'DEAD' && cpu.actionState !== 'RESPAWN') { var dx = target.x - cpu.x; var dist = Math.abs(dx); if (Math.abs(dx) > 200) { if (dx > 0) inp.right = true; else inp.left = true; } if (cpu.y > window.SMA.platforms[0].y && cpu.jumps < 2 && Math.random() < 0.1) cpu.triggerJump(inp); if (Math.abs(dx) < 300 && Math.random() < 0.05) { cpu.startCharge(); cpu.cpuTimer = 20; } if (cpu.cpuTimer > 0) { cpu.cpuTimer--; if (cpu.cpuTimer <= 0) cpu.releaseAttack('NEUTRAL'); } } cpu.update(inp, target);
};
window.SMA.gameLoop = function () {
    if (!window.SMA.gameRunning) return;
    try {
        if (window.SMA.hitStop > 0) { window.SMA.hitStop--; } else {
            var lockstepInputs = null;
            var soloDelayedInput = null;
            if (window.SMA.onlineStrictLockstep && window.SMA.isHost && window.SMA.isOnline && window.SMA.gameState === 'PLAYING') {
                lockstepInputs = window.SMA.prepareHostLockstepInputs();
                if (lockstepInputs === false) {
                    window.SMA.animationFrameId = requestAnimationFrame(window.SMA.gameLoop);
                    return;
                }
            }
            if (!window.SMA.isOnline && window.SMA.isHost && window.SMA.gameState === 'PLAYING' && window.SMA.prepareSoloDelayedInput) {
                soloDelayedInput = window.SMA.prepareSoloDelayedInput();
            }
            if (window.SMA.gameState === 'COUNTDOWN') { window.SMA.countdownTimer--; if (window.SMA.isHost && window.SMA.countdownTimer <= 0) window.SMA.gameState = 'PLAYING'; } else if (window.SMA.gameState === 'PLAYING' && window.SMA.isHost) { window.SMA.countdownTimer--; if ((window.SMA.matchTimer || 0) > 0) window.SMA.matchTimer--; else window.SMA.suddenDeathTimer++; }
            if (!soloDelayedInput && !window.SMA.isOnline && window.SMA.isHost && window.SMA.gameState === 'PLAYING' && window.SMA.prepareSoloDelayedInput) {
                soloDelayedInput = window.SMA.prepareSoloDelayedInput();
            }

            if (window.SMA.isHost) {
                if (window.SMA.gameState === 'PLAYING') {
                    var S = window.SMA;
                    var allPlayers = S.players;
                    var pc = allPlayers.length;

                    // 蜷・・繝ｬ繧､繝､繝ｼ縺ｮ蜈･蜉帛・逅・→update
                    for (var pi = 0; pi < pc; pi++) {
                        var player = allPlayers[pi];
                        var role = S.PLAYER_ROLES[pi];
                        // 蟇ｾ謌ｦ逶ｸ謇九ｒ蜿門ｾ暦ｼ域怙繧りｿ代＞謨ｵ・・
                        var nearestEnemy = null;
                        var minEnemyDist = Infinity;
                        for (var ej = 0; ej < pc; ej++) {
                            if (ej === pi || allPlayers[ej].stocks <= 0) continue;
                            var ed = Math.abs(allPlayers[ej].x - player.x);
                            if (ed < minEnemyDist) { minEnemyDist = ed; nearestEnemy = allPlayers[ej]; }
                        }
                        if (!nearestEnemy) nearestEnemy = allPlayers[(pi + 1) % pc];

                        if (lockstepInputs) {
                            var lKeys = lockstepInputs[role] || S.emptyInputKeys();
                            var localLedgeLocked = player.actionState === 'LEDGE' && player.ledgeInputLock > 0;
                            if (!localLedgeLocked && lKeys.triggerStartCharge) player.startCharge();
                            if (!localLedgeLocked && lKeys.triggerReleaseAttack) player.releaseAttack(lKeys.attackType);
                            if (!localLedgeLocked && lKeys.triggerJump) player.triggerJump(lKeys);
                            if (!localLedgeLocked && lKeys.triggerGrab) player.tryGrab(nearestEnemy);
                            player.update(lKeys, nearestEnemy);
                        } else if (pi === 0) {
                            // 1P: 繝帙せ繝医・蜈･蜉・
                            var p1Keys = soloDelayedInput || S.myKeys;
                            var p1LedgeLocked = player.actionState === 'LEDGE' && player.ledgeInputLock > 0;
                            if (!p1LedgeLocked && p1Keys.triggerStartCharge) player.startCharge();
                            if (!p1LedgeLocked && p1Keys.triggerReleaseAttack) player.releaseAttack(p1Keys.attackType);
                            if (!p1LedgeLocked && p1Keys.triggerJump) player.triggerJump(p1Keys);
                            if (!p1LedgeLocked && p1Keys.triggerGrab) player.tryGrab(nearestEnemy);
                            player.update(p1Keys, nearestEnemy);
                        } else if (S.isOnline) {
                            // 繧ｪ繝ｳ繝ｩ繧､繝ｳ: 繝ｪ繝｢繝ｼ繝亥・蜉・
                            var rKeys = S.remoteKeysMap[role] || {};
                            // 蜈･蜉帙ヵ繝ｪ繝ｼ繧ｺ繝√ぉ繝・け
                            if (S.remoteLastInputTimeMap[role] > 0 && (Date.now() - S.remoteLastInputTimeMap[role] > 1000)) {
                                rKeys = { left: false, right: false, up: false, down: false, shield: false };
                            }
                            // 繧､繝吶Φ繝亥・逅・
                            var events = S.remoteEventsMap[role] || [];
                            while (events.length > 0) {
                                var ev = events.shift();
                                var remoteLedgeLocked = player.actionState === 'LEDGE' && player.ledgeInputLock > 0;
                                if (!remoteLedgeLocked && ev.triggerStartCharge) player.startCharge();
                                if (!remoteLedgeLocked && ev.triggerReleaseAttack) player.releaseAttack(ev.attackType);
                                if (!remoteLedgeLocked && ev.triggerJump) player.triggerJump(ev);
                                if (!remoteLedgeLocked && ev.triggerGrab) player.tryGrab(nearestEnemy);
                            }
                            player.update(rKeys, nearestEnemy);
                        } else {
                            // 繧ｽ繝ｭ繝｢繝ｼ繝・ CPU
                            S.updateCPU(player, allPlayers);
                        }
                    }

                    // 繧ｹ繝昴・繝ｳ荳ｭ縺ｮ菫晁ｭｷ
                    allPlayers.forEach(function (p) {
                        if (p.invincible > 120) {
                            p.percent = 0;
                            if (p.actionState === 'STUN') p.actionState = 'IDLE';
                        }
                    });

                    for (var i = window.SMA.projectiles.length - 1; i >= 0; i--) {
                        var p = window.SMA.projectiles[i];
                        p.age = (p.age || 0) + 1;
                        if (p.type === 'fire_trap') { p.life--; } else if (p.type === 'spear_throw' || p.type === 'shockwave') {
                            p.life--; if (p.type === 'spear_throw') {
                                if (p.life === 30) { p.dmg *= 0.5; p.kb *= 0.5; p.scale *= 0.5; }
                                if (p.life > 30) { p.vx *= 0.9; p.vy *= 0.9; } else {
                                    // 謇譛芽・ｒ讀懃ｴ｢
                                    var owner = null;
                                    for (var oi = 0; oi < allPlayers.length; oi++) {
                                        if (allPlayers[oi].playerRole === p.ownerRole) { owner = allPlayers[oi]; break; }
                                    }
                                    if (owner) { var dx = owner.x + owner.w / 2 - p.x; var dy = owner.y + owner.h / 2 - p.y; var dist = Math.sqrt(dx * dx + dy * dy); if (dist < 30) { window.SMA.projectiles.splice(i, 1); continue; } p.vx += dx * 0.05; p.vy += dy * 0.05; }
                                } p.angle += 0.5;
                            } p.x += p.vx; p.y += p.vy;
                        } else { p.x += p.vx; p.y += p.vy; p.life--; if (p.type === 'fire') { for (var j = 0; j < window.SMA.platforms.length; j++) { var plat = window.SMA.platforms[j]; if (p.y > plat.y && p.y < plat.y + plat.h && p.x > plat.x && p.x < plat.x + plat.w) { p.type = 'fire_trap'; p.vx = 0; p.vy = 0; p.y = plat.y - 10; p.surfaceY = plat.y; p.life = 60; p.maxLife = 60; p.age = 0; p.w = 60; p.h = 40; p.hitW = 82; p.hitH = 125; p.hitOffsetX = 0; p.hitOffsetY = -62.5; window.SMA.playSound('special'); window.SMA.createParticles(p.x, p.surfaceY, 10, '#e17055'); break; } } } } if (p.life <= 0) window.SMA.projectiles.splice(i, 1);
                    }
                    // 繝偵ャ繝亥愛螳・ 蜈ｨ繝励Ξ繧､繝､繝ｼ縺ｮ邨・∩蜷医ｏ縺・
                    for (var ai = 0; ai < pc; ai++) {
                        for (var bi = ai + 1; bi < pc; bi++) {
                            window.SMA.checkHit(allPlayers[ai], allPlayers[bi]);
                            window.SMA.checkHit(allPlayers[bi], allPlayers[ai]);
                            window.SMA.checkMirrorHit(allPlayers[ai], allPlayers[bi]);
                            window.SMA.checkMirrorHit(allPlayers[bi], allPlayers[ai]);
                        }
                    }
                    window.SMA.checkGameSet();
                    // 繝阪ャ繝医Ρ繝ｼ繧ｯ蜷梧悄
                    if (window.SMA.isOnline) {
                        var pkt = { type: 'sync', frame: window.SMA.lockstepFrame || 0, inputDelayFrames: window.SMA.ONLINE_INPUT_DELAY_FRAMES, stg: window.SMA.selectedStage, gState: window.SMA.gameState, cd: window.SMA.countdownTimer, mt: window.SMA.matchTimer, sd: window.SMA.suddenDeathTimer, playerCount: pc, events: window.SMA.syncEvents, projs: window.SMA.projectiles.map(function (p) { return { x: p.x, y: p.y, vx: p.vx, vy: p.vy, type: p.type, w: p.w, h: p.h, hitW: p.hitW, hitH: p.hitH, hitOffsetX: p.hitOffsetX, hitOffsetY: p.hitOffsetY, visualKind: p.visualKind, color: p.color, particleColor: p.particleColor, angle: p.angle || 0, age: p.age || 0, maxLife: p.maxLife || p.life || 0, surfaceY: p.surfaceY }; }), win: (window.SMA.gameState === 'GAMEOVER' ? document.getElementById('result-text').innerText : null) };
                        // 蜷・・繝ｬ繧､繝､繝ｼ縺ｮ迥ｶ諷九ｒ霑ｽ蜉
                        for (var si = 0; si < pc; si++) {
                            pkt['p' + (si + 1)] = allPlayers[si].serialize();
                        }
                        if (!window.SMA.isGravity) window.SMA.connections.forEach(function (c) { if (c.conn.open) try { c.conn.send({ type: 'sync', data: JSON.stringify(pkt) }); } catch (e) { } });
                        // Gravity縺ｯ隧ｦ蜷井ｸｭPeerJS蜆ｪ蜈医ょｿ・ｦ∵凾縺ｮ縺ｿSDK縺ｸ菴朱ｻ蠎ｦ繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ縲・
                        if (window.SMA.isGravity) window.SMA.sendGravitySync(pkt);
                        window.SMA.syncEvents = [];
                    }
                    if (lockstepInputs && window.SMA.advanceLockstepFrame) window.SMA.advanceLockstepFrame();
                    if (soloDelayedInput && window.SMA.advanceSoloInputFrame) window.SMA.advanceSoloInputFrame();
                }
            } else {
                if (window.SMA.netConn && window.SMA.netConn.open && !(window.SMA.isGravity && window.SMA.gravityUsePeerInMatch)) {
                    window.SMA.netConn.send({ type: 'input', frame: window.SMA.getLocalInputTargetFrame(), keys: window.SMA.cloneInputKeys(window.SMA.myKeys) });
                }
                // Gravity蜈･蜉幃∽ｿ｡
                if (window.SMA.isGravity && !window.SMA.isHost) {
                    window.SMA.sendGravityInput(window.SMA.myKeys);
                }
                window.SMA.players.forEach(function (p) { if (p && p.actionState !== 'DEAD') { p.animScale.x += (1.0 - p.animScale.x) * 0.2; p.animScale.y += (1.0 - p.animScale.y) * 0.2; if (p.actionState !== 'LEDGE_ROLL') p.rotation = 0; } });
            }
        }

        // PARTICLES (FIX: MOVED OUTSIDE isHost)
        for (var i = window.SMA.comets.length - 1; i >= 0; i--) { var c = window.SMA.comets[i]; c.x += c.vx; c.y += c.vy; c.l--; if (c.l <= 0) window.SMA.comets.splice(i, 1); }
        window.SMA.updateKoBlastFx();
        for (var i = window.SMA.particles.length - 1; i >= 0; i--) { var p = window.SMA.particles[i]; p.x += p.vx; p.y += p.vy; p.life--; if (p.life <= 0) window.SMA.particles.splice(i, 1); }

        // 繧ｫ繝｡繝ｩ: 蜈ｨ逕溷ｭ倥・繝ｬ繧､繝､繝ｼ繧定ｿｽ蠕・
        var targets = [];
        window.SMA.players.forEach(function (p) { if (p.stocks > 0) targets.push(p); });
        if (window.SMA.gameState === 'GAMEOVER') {
            // 蜍晁・↓繝輔か繝ｼ繧ｫ繧ｹ
            var winner = null;
            window.SMA.players.forEach(function (p) { if (p.stocks > 0) winner = p; });
            if (winner) targets = [winner];
        }
        var tx = window.SMA.WORLD_W / 2; var ty = window.SMA.WORLD_H / 2; var tz = 1.0; var suddenActive = (window.SMA.matchTimer || 0) <= 0 && window.SMA.gameState === 'PLAYING'; if (window.SMA.gameState === 'COUNTDOWN') { tz = window.SMA.SCREEN_W / 1200; } else if (suddenActive) { var sdCenter = window.SMA.getStageCenter(); var suddenP = window.SMA.getSuddenDeathProgress(); tx = sdCenter.x; ty = sdCenter.y; tz = 0.32 + (window.SMA.getSuddenDeathFinalZoom() - 0.32) * suddenP; } else if (targets.length > 0) { var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity; targets.forEach(function (p) { if (p.x < minX) minX = p.x; if (p.x + p.w > maxX) maxX = p.x + p.w; if (p.y < minY) minY = p.y; if (p.y + p.h > maxY) maxY = p.y + p.h; }); tx = (minX + maxX) / 2; ty = (minY + maxY) / 2; var zx = window.SMA.SCREEN_W / (maxX - minX + 520); var zy = window.SMA.SCREEN_H / (maxY - minY + 400); tz = Math.min(Math.min(zx, zy), 1.2); if (tz < 0.32) tz = 0.32; if (window.SMA.gameState === 'GAMEOVER') tz = 2.0; } var camLerp = suddenActive ? 0.18 : 0.1; var zoomLerp = suddenActive ? 0.18 : 0.05; if (!isNaN(tx)) window.SMA.camera.x += (tx - window.SMA.camera.x) * camLerp; if (!isNaN(ty)) window.SMA.camera.y += (ty - window.SMA.camera.y) * camLerp; if (!isNaN(tz)) window.SMA.camera.zoom += (tz - window.SMA.camera.zoom) * zoomLerp; if (isNaN(window.SMA.camera.x)) window.SMA.camera.x = 0; if (window.SMA.shake > 0) window.SMA.shake *= 0.9; if (window.SMA.shake < 0.5) window.SMA.shake = 0; if (window.SMA.ctx) {
            var renderScale = window.SMA.RENDER_SCALE || 1;
            window.SMA.ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
            window.SMA.ctx.imageSmoothingEnabled = true;
            if (window.SMA.ctx.imageSmoothingQuality !== undefined) window.SMA.ctx.imageSmoothingQuality = 'high';

            // BACKGROUND RENDER
            var stg = window.SMA.selectedStage;
            if (stg === 'final') {
                var grad = window.SMA.ctx.createLinearGradient(0, 0, 0, window.SMA.SCREEN_H);
                grad.addColorStop(0, "#2c3e50");
                grad.addColorStop(1, "#d35400");
                window.SMA.ctx.fillStyle = grad;
                window.SMA.ctx.fillRect(0, 0, window.SMA.SCREEN_W, window.SMA.SCREEN_H);
                window.SMA.drawStageImageCover(window.SMA.ctx, window.SMA.STAGE_ASSETS.finalBg, 0, 0, window.SMA.SCREEN_W, window.SMA.SCREEN_H);
            } else if (stg === 'day') {
                window.SMA.ctx.fillStyle = "#79cfff";
                window.SMA.ctx.fillRect(0, 0, window.SMA.SCREEN_W, window.SMA.SCREEN_H);
                window.SMA.drawStageImageCover(window.SMA.ctx, window.SMA.STAGE_ASSETS.dayBg, 0, 0, window.SMA.SCREEN_W, window.SMA.SCREEN_H);
            } else {
                window.SMA.ctx.fillStyle = "#0f0f23";
                window.SMA.ctx.fillRect(0, 0, window.SMA.SCREEN_W, window.SMA.SCREEN_H);
                window.SMA.drawStageImageCover(window.SMA.ctx, window.SMA.STAGE_ASSETS.battlefieldBg, 0, 0, window.SMA.SCREEN_W, window.SMA.SCREEN_H);
            }

            var shakeX = (Math.random() - 0.5) * window.SMA.shake;
            var shakeY = (Math.random() - 0.5) * window.SMA.shake;
            var viewX = window.SMA.camera.x - shakeX;
            var viewY = window.SMA.camera.y - shakeY;
            var snap = Math.max(1, window.SMA.camera.zoom * renderScale);
            viewX = Math.round(viewX * snap) / snap;
            viewY = Math.round(viewY * snap) / snap;
            window.SMA.ctx.save(); window.SMA.ctx.translate(window.SMA.SCREEN_W / 2, window.SMA.SCREEN_H / 2); window.SMA.ctx.scale(window.SMA.camera.zoom, window.SMA.camera.zoom); window.SMA.ctx.translate(-viewX, -viewY); for (var i = 0; i < window.SMA.stars.length; i++) {
                var s = window.SMA.stars[i];
                if ((stg === 'final' || stg === 'day') && (!window.SMA.STAGE_ASSETS || !window.SMA.getSpriteAsset((stg === 'day' ? window.SMA.STAGE_ASSETS.dayBg : window.SMA.STAGE_ASSETS.finalBg).key, (stg === 'day' ? window.SMA.STAGE_ASSETS.dayBg : window.SMA.STAGE_ASSETS.finalBg).src).complete)) {
                    window.SMA.ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                    window.SMA.ctx.beginPath(); window.SMA.ctx.ellipse(s.x, s.y, s.s, s.s / 2, 0, 0, Math.PI * 2); window.SMA.ctx.fill();
                } else if (stg !== 'final' && stg !== 'day' && (!window.SMA.STAGE_ASSETS || !window.SMA.getSpriteAsset(window.SMA.STAGE_ASSETS.battlefieldBg.key, window.SMA.STAGE_ASSETS.battlefieldBg.src).complete)) {
                    window.SMA.ctx.fillStyle = "rgba(255, 255, 200, " + (0.5 + Math.random() * 0.5) + ")";
                    window.SMA.ctx.beginPath(); window.SMA.ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2); window.SMA.ctx.fill();
                }
            } if (window.SMA.platforms.length > 0) { if (stg === 'final' && window.SMA.drawFinalMainPlatformArt(window.SMA.ctx, window.SMA.platforms[0])) { } else if (stg === 'day' && window.SMA.drawDayMainPlatformArt(window.SMA.ctx, window.SMA.platforms[0])) { for (var i = 1; i < window.SMA.platforms.length; i++) { var p = window.SMA.platforms[i]; if (!window.SMA.drawDayFloatPlatformArt(window.SMA.ctx, p)) { window.SMA.ctx.fillStyle = "#3e2723"; window.SMA.ctx.fillRect(p.x, p.y, p.w, p.h); window.SMA.ctx.fillStyle = "#a1887f"; window.SMA.ctx.fillRect(p.x, p.y, p.w, 5); } } } else if (stg === 'battlefield' && window.SMA.drawBattlefieldMainPlatformArt(window.SMA.ctx, window.SMA.platforms[0])) { for (var i = 1; i < window.SMA.platforms.length; i++) { var p = window.SMA.platforms[i]; if (!window.SMA.drawBattlefieldSmallPlatformArt(window.SMA.ctx, p)) { window.SMA.ctx.fillStyle = "#3e2723"; window.SMA.ctx.fillRect(p.x, p.y, p.w, p.h); window.SMA.ctx.fillStyle = "#a1887f"; window.SMA.ctx.fillRect(p.x, p.y, p.w, 5); } } } else { window.SMA.drawVectorStagePlatforms(window.SMA.ctx); } }
            // 蜈ｨ繝励Ξ繧､繝､繝ｼ謠冗判
            window.SMA.players.forEach(function (p) { try { if (p) p.draw(window.SMA.ctx); } catch (e) { } });
            // 髀｡繧ｪ繝悶ず繧ｧ繧ｯ繝医→髀｡蜒上・謠冗判
            try {
                window.SMA.players.forEach(function (fighter) {
                    if (!fighter || fighter.charId !== 'mirror') return;
                    // 髀｡險ｭ鄂ｮ荳ｭ: 繝励Ξ繝薙Η繝ｼ陦ｨ遉ｺ
                    if (!fighter.mirror && fighter.actionState === 'ATTACK' && fighter.currentAttack && fighter.currentAttack.type === 'mirror_place') {
                        var ctx = window.SMA.ctx;
                        ctx.save();
                        var previewX = fighter.x + fighter.w / 2 + (fighter.facingRight ? fighter.mirrorPlaceRange : -fighter.mirrorPlaceRange);
                        var previewY = fighter.y + fighter.h;
                        window.SMA.drawMirrorPropImage(ctx, previewX, previewY - 31, 0, 0.4, 0.25 + Math.sin(Date.now() * 0.01) * 0.12, fighter.mirrorCooldown > 0 ? 'cooldown' : null);
                        ctx.restore();
                    }
                    // 髀｡繧ｪ繝悶ず繧ｧ繧ｯ繝医・謠冗判
                    if (fighter.mirror) {
                        var mx = fighter.mirror.x;
                        var my = fighter.mirror.y;
                        var ctx = window.SMA.ctx;
                        ctx.save();
                        // 髀｡譛ｬ菴難ｼ育ｴｰ縺・ｸｦ髟ｷ縺ｮ遏ｩ蠖｢・・
                        window.SMA.drawMirrorPropImage(ctx, mx, my - 31, 0, 0.43, 0.86);
                        // 蜈峨・繧ｨ繝輔ぉ繧ｯ繝・
                        // 繧ｿ繧､繝槭・陦ｨ遉ｺ・域ｮ九ｊ譎る俣繝舌・・・
                        var ratio = fighter.mirror.timer / 480;
                        ctx.fillStyle = 'rgba(129, 236, 236, ' + (0.3 + ratio * 0.5) + ')';
                        ctx.fillRect(mx - 10, my + 2, 20 * ratio, 3);
                        ctx.restore();
                    }
                    // 髀｡蜒上・謠冗判・域判謦・Δ繝ｼ繧ｷ繝ｧ繝ｳ蜿肴丐・・
                    if (fighter.mirrorClone && fighter.mirror) {
                        var ctx = window.SMA.ctx;
                        ctx.save();
                        ctx.globalAlpha = 0;
                        var cX = fighter.mirrorClone.x;
                        var cY = fighter.mirrorClone.y;
                        var cx = cX + fighter.w / 2;
                        ctx.strokeStyle = '#81ecec';
                        ctx.lineWidth = 4;
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        var fr = fighter.mirrorClone.facingRight;
                        // 鬆ｭ
                        ctx.beginPath(); ctx.arc(cx, cY + 10, 10, 0, Math.PI * 2); ctx.stroke();
                        // 菴・
                        ctx.beginPath(); ctx.moveTo(cx, cY + 10); ctx.lineTo(cx, cY + 40); ctx.stroke();
                        // 雜ｳ・郁ｵｰ繧翫Δ繝ｼ繧ｷ繝ｧ繝ｳ讓｡蛟｣・・
                        if (fighter.actionState === 'IDLE' && (fighter.vx > 1 || fighter.vx < -1)) {
                            var legPhase = Math.sin(Date.now() * 0.015) * 12;
                            ctx.beginPath(); ctx.moveTo(cx, cY + 40); ctx.lineTo(cx + legPhase, cY + 60); ctx.stroke();
                            ctx.beginPath(); ctx.moveTo(cx, cY + 40); ctx.lineTo(cx - legPhase, cY + 60); ctx.stroke();
                        } else {
                            ctx.beginPath(); ctx.moveTo(cx, cY + 40); ctx.lineTo(cx - 10, cY + 60); ctx.stroke();
                            ctx.beginPath(); ctx.moveTo(cx, cY + 40); ctx.lineTo(cx + 10, cY + 60); ctx.stroke();
                        }
                        ctx.globalAlpha = 1;
                        fighter.drawMirrorChibiGhost(ctx, cx, cY + fighter.h, fr);
                        ctx.globalAlpha = 0.45;
                        // 豬ｮ驕企升縺ｮ蝓ｺ譛ｬ蠎ｧ讓・
                        var hoverY = Math.sin(Date.now() / 200) * 5;
                        var baseY = cY + 20 + hoverY;
                        var baseX = cx + (fr ? 42 : -42);

                        // 閻包ｼ郁・辟ｶ縺ｫ荳九ｍ縺呻ｼ・
                        ctx.strokeStyle = '#00cec9';
                        ctx.lineWidth = 3;
                        // Clone body is drawn by the chibi ghost sprite.

                        // 豬ｮ驕企升縺ｮ繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ
                        var mirX = baseX;
                        var mirY = baseY;
                        var mirScale = 1.0;
                        var mirAngle = 0;

                        if (fighter.actionState === 'ATTACK' && fighter.currentAttack) {
                            var p = fighter.stateTimer / fighter.currentAttack.frames; // 1 -> 0
                            var forwardP = 1.0 - p; // 0 -> 1
                            var atkType = fighter.currentAttack.type;

                            if (atkType === 'mirror_spin' || fighter.currentAttackType === 'AIR_NEUTRAL') {
                                var spinAngle = forwardP * Math.PI * 2;
                                var r = 52;
                                mirX = cx + (fr ? 1 : -1) * Math.cos(spinAngle) * r;
                                mirY = cY + 25 + Math.sin(spinAngle) * r;
                                mirAngle = 0;
                            } else if (atkType === 'mirror_throw_up' || fighter.currentAttackType === 'UP' || fighter.currentAttackType === 'AIR_UP') {
                                mirScale = 1.5;
                                mirAngle = forwardP * Math.PI * 4;
                                var throwH = 50;
                                mirX = cx;
                                mirY = cY - 10 - Math.sin(forwardP * Math.PI) * throwH;
                            } else if (atkType === 'mirror_throw' || fighter.currentAttackType === 'SIDE' || fighter.currentAttackType === 'AIR_SIDE') {
                                mirScale = 1.6;
                                mirAngle = forwardP * Math.PI * 4;
                                var throwDist = 58;
                                var distX = Math.sin(forwardP * Math.PI) * throwDist;
                                mirX = cx + (fr ? 30 + distX : -30 - distX);
                                mirY = cY + 25;
                            } else if (fighter.currentAttackType === 'NEUTRAL' || atkType === 'mirror_slash') {
                                var pokeDist = Math.sin(forwardP * Math.PI) * 22;
                                mirX = cx + (fr ? 30 + pokeDist : -30 - pokeDist);
                            } else if (fighter.currentAttackType === 'DOWN' || fighter.currentAttackType === 'AIR_DOWN' || atkType === 'mirror_place') {
                                mirScale = 1.5;
                                mirAngle = forwardP * Math.PI * 4;
                                var throwH = 40;
                                mirX = cx + (fr ? 28 : -28);
                                mirY = cY + 40 + Math.sin(forwardP * Math.PI) * throwH;
                            }
                        }

                        // 髀｡蜒上・髀｡縺ｮ謠冗判・育峡遶具ｼ・
                        ctx.save();
                        ctx.translate(mirX, mirY);
                        ctx.rotate(mirAngle);
                        window.SMA.drawMirrorPropImage(ctx, 0, 0, 0, 0.34 * mirScale, 0.78);

                        ctx.restore();

                        ctx.restore();
                    }
                });
            } catch (e) { }
            for (var i = 0; i < window.SMA.projectiles.length; i++) {
                var p = window.SMA.projectiles[i]; if (window.SMA.drawMageProjectileVfx && window.SMA.drawMageProjectileVfx(window.SMA.ctx, p)) { continue; } if (p.type === 'fire_trap') { window.SMA.ctx.save(); for (var k = 0; k < 3; k++) { window.SMA.ctx.fillStyle = "rgba(255, " + (Math.floor(Math.random() * 150) + 50) + ", 0, " + (0.5 + Math.random() * 0.5) + ")"; var w = p.w * (0.8 + Math.random() * 0.4); var h = p.h * (1.0 + Math.random() * 0.5); var fx = p.x + (Math.random() - 0.5) * 20; window.SMA.ctx.beginPath(); window.SMA.ctx.moveTo(fx - w / 2, p.y + 40); window.SMA.ctx.lineTo(fx + w / 2, p.y + 40); window.SMA.ctx.lineTo(fx, p.y - h); window.SMA.ctx.fill(); } window.SMA.ctx.restore(); } else if (p.type === 'spear_throw') { try { window.SMA.ctx.save(); window.SMA.ctx.translate(p.x, p.y); window.SMA.ctx.rotate(p.angle); window.SMA.ctx.translate(-35, 0); window.SMA.drawTrident(window.SMA.ctx, 0, 0, 0, p.color); window.SMA.ctx.restore(); } catch (e) { } } else if (p.type === 'shockwave') { if (window.SMA.drawSpearGroundShockwave && window.SMA.drawSpearGroundShockwave(window.SMA.ctx, p)) { continue; } window.SMA.ctx.fillStyle = "#ffeaa7"; window.SMA.ctx.beginPath(); window.SMA.ctx.arc(p.x, p.y, p.w / 2, 0, Math.PI, true); window.SMA.ctx.fill(); } else if (p.type === 'angel_arrow') {
                    if (window.SMA.drawAngelArrowProjectile && window.SMA.drawAngelArrowProjectile(window.SMA.ctx, p)) { continue; }
                    // 繧ｨ繝ｳ繧ｸ繧ｧ繝ｫ蠑鍋泙: 遏｢縺ｮ蠖｢縺ｧ謠冗判
                    window.SMA.ctx.save();
                    window.SMA.ctx.translate(p.x, p.y);
                    var arrowAngle = Math.atan2(p.vy, p.vx);
                    window.SMA.ctx.rotate(arrowAngle);
                    // 遏｢縺ｮ蜈峨お繝輔ぉ繧ｯ繝・
                    window.SMA.ctx.shadowBlur = 8; window.SMA.ctx.shadowColor = p.color;
                    // 遏｢縺倥ｊ・井ｸ芽ｧ貞ｽ｢・・
                    window.SMA.ctx.fillStyle = p.color;
                    window.SMA.ctx.beginPath();
                    window.SMA.ctx.moveTo(12, 0);
                    window.SMA.ctx.lineTo(-4, -5);
                    window.SMA.ctx.lineTo(-4, 5);
                    window.SMA.ctx.closePath();
                    window.SMA.ctx.fill();
                    // 遏｢縺ｮ譽・
                    window.SMA.ctx.strokeStyle = '#c89b3c'; window.SMA.ctx.lineWidth = 2;
                    window.SMA.ctx.beginPath();
                    window.SMA.ctx.moveTo(-4, 0);
                    window.SMA.ctx.lineTo(-22, 0);
                    window.SMA.ctx.stroke();
                    // 鄒ｽ譬ｹ・育泙縺ｮ蠕後ｍ・・
                    window.SMA.ctx.strokeStyle = '#fff'; window.SMA.ctx.lineWidth = 1;
                    window.SMA.ctx.beginPath(); window.SMA.ctx.moveTo(-20, 0); window.SMA.ctx.lineTo(-25, -4); window.SMA.ctx.stroke();
                    window.SMA.ctx.beginPath(); window.SMA.ctx.moveTo(-20, 0); window.SMA.ctx.lineTo(-25, 4); window.SMA.ctx.stroke();
                    window.SMA.ctx.shadowBlur = 0;
                    window.SMA.ctx.restore();
                } else { window.SMA.ctx.fillStyle = p.color; window.SMA.ctx.beginPath(); window.SMA.ctx.arc(p.x, p.y, p.w / 2, 0, Math.PI * 2); window.SMA.ctx.fill(); }
            } window.SMA.drawMageTransientVfx(window.SMA.ctx); window.SMA.drawComets(window.SMA.ctx); window.SMA.drawKoBlastFx(window.SMA.ctx); window.SMA.updateParticles(window.SMA.ctx); window.SMA.drawDebugHitboxes(window.SMA.ctx); window.SMA.ctx.restore();
        } window.SMA.updateHud();
    } catch (e) { reportError("Loop Error: " + e); } window.SMA.animationFrameId = requestAnimationFrame(window.SMA.gameLoop);
};
window.SMA.checkHit = function (atk, vic) {
    if (vic.invincible > 0 || vic.actionState === 'RESPAWN' || vic.actionState === 'DEAD') return;

    if (atk.hitbox.active && !atk.hasHit && vic.stocks > 0) {
        var ab = atk.hitbox;
        if (ab.x < vic.x + vic.w && ab.x + ab.w > vic.x && ab.y < vic.y + vic.h && ab.y + ab.h > vic.y) {
            if (!atk.currentAttack) return;
            atk.hasHit = true;
            if (vic.actionState === 'DODGE') return;
            var data = atk.currentAttack; var p = atk.chargePower;
            if (vic.superArmor) {
                if (data.dmg) vic.percent += data.dmg * p;
                window.SMA.createParticles(vic.x + vic.w / 2, vic.y + vic.h / 2, 5, '#636e72');
                window.SMA.playSound('hit');
                return;
            }
            if (vic.actionState === 'SHIELD') {
                var shieldDmg = 15 * atk.chargePower;
                // 繝上Φ繝槭・荳帰・育ｫ懷ｷｻ・峨・繧ｷ繝ｼ繝ｫ繝牙炎繧雁鴨0
                if (atk.currentAttack && atk.currentAttack.type === 'tornado') shieldDmg = 0;
                vic.shieldHP -= shieldDmg; vic.vx = (atk.facingRight ? 1 : -1) * 2; window.SMA.createParticles(vic.x + vic.w / 2, vic.y + vic.h / 2, 5, '#0984e3'); if (vic.shieldHP <= 0) { vic.shieldHP = 0; vic.enterState('STUN', 120); } return;
            }
            if (vic.actionState === 'CHARGE') { vic.chargePower = 1.0; }
            if (data.dmg) vic.percent += data.dmg * p;

            // KNOCKBACK LOGIC
            var atkScale = (data.scale !== undefined) ? data.scale : 0.1;
            var kbMult = window.SMA.CHAR_DATA[vic.charId].kbMult || 1.0;

            // DEFAULT KB
            var kbValue = data.kb;

            // TORNADO FINISHER LOGIC (Dynamic KB override)
            if ((atk.currentAttackType === 'DOWN' || atk.currentAttackType === 'AIR_DOWN') && atk.charId === 'hammer') {
                if (atk.stateTimer > 80) {
                    kbValue = 6.0; // High KB finisher
                    atkScale = 0.12; // Restore scaling for finisher
                    window.SMA.playSound('special');
                } else {
                    kbValue = 0.1; // Very low base
                    atkScale = 0;  // ZERO scaling for trap hits
                }
            }

            var kb = (kbValue * p + (Math.pow(vic.percent, 1.2) * atkScale * p * 0.5)) * kbMult;
            var r = data.angle * (Math.PI / 180); vic.vx = Math.cos(r) * kb * 2.5 * (atk.facingRight ? 1 : -1); vic.vy = Math.sin(r) * kb * 2.5;

            // STUN CALCULATION (Prioritize data.hitstun over formula)
            var stunTime = 0;
            if (data.hitstun) stunTime = data.hitstun;
            else stunTime = Math.min(60, kb * 1.5);

            vic.enterState('STUN', stunTime);
            window.SMA.hitStop = Math.floor(kb * 0.5); window.SMA.shake = 10; window.SMA.createParticles(vic.x, vic.y, 10, '#fff'); window.SMA.playSound('hit');
        }
    }
    for (var i = window.SMA.projectiles.length - 1; i >= 0; i--) {
        // RESTORED SHOT LOGIC (With Size scaling and new DOWN logic)
        var p = window.SMA.projectiles[i];
        if (p.ownerRole && vic.stocks > 0) {
            var owner = null;
            for (var oi = 0; oi < window.SMA.players.length; oi++) {
                if (window.SMA.players[oi].playerRole === p.ownerRole) { owner = window.SMA.players[oi]; break; }
            }
            if (owner === vic) continue;
            var hit = false;
            if (p.type === 'fire_trap') {
                var trapW = p.hitW || p.w;
                var trapH = p.hitH || p.h;
                var trapCx = p.x + (p.hitOffsetX || 0);
                var trapCy = p.y + (p.hitOffsetY || 0);
                if (trapCx + trapW / 2 > vic.x && trapCx - trapW / 2 < vic.x + vic.w && trapCy + trapH / 2 > vic.y && trapCy - trapH / 2 < vic.y + vic.h) hit = true;
            } else {
                var hitW = p.hitW || p.w;
                var hitH = p.hitH || p.h || p.w;
                var hitOffsetX = p.hitOffsetX || 0;
                var hitOffsetY = p.hitOffsetY || 0;
                var hitCx = p.x + hitOffsetX;
                var hitCy = p.y + hitOffsetY;
                if (hitCx + hitW / 2 > vic.x && hitCx - hitW / 2 < vic.x + vic.w && hitCy + hitH / 2 > vic.y && hitCy - hitH / 2 < vic.y + vic.h) hit = true;
            }
            if (hit) {
                if (vic.actionState === 'DODGE') continue;
                if (vic.superArmor) {
                    if (p.dmg) vic.percent += p.dmg;
                    window.SMA.createParticles(vic.x + vic.w / 2, vic.y + vic.h / 2, 5, '#636e72');
                    window.SMA.playSound('hit');
                    if (p.type !== 'fire_trap') window.SMA.projectiles.splice(i, 1);
                    continue;
                }
                if (vic.actionState === 'SHIELD') { vic.shieldHP -= p.dmg; window.SMA.createParticles(p.x, p.y, 5, '#0984e3'); if (p.type !== 'fire_trap') window.SMA.projectiles.splice(i, 1); continue; }
                if (p.dmg) vic.percent += p.dmg; var scale = (p.scale !== undefined) ? p.scale : 0.1;
                var kbMult = window.SMA.CHAR_DATA[vic.charId].kbMult || 1.0;

                // FIX: Ensure scale is handled if 0
                var kb = (p.kb + (Math.pow(vic.percent, 1.2) * scale)) * kbMult;

                vic.vx = (p.vx > 0 ? 1 : -1) * kb * 2.0; if (p.vx === 0) vic.vx = (p.x < vic.x + vic.w / 2 ? 1 : -1) * kb * 2.0; vic.vy = -kb * 2.0; vic.enterState('STUN', Math.min(60, kb * 1.5)); window.SMA.hitStop = Math.floor(kb * 0.5); window.SMA.shake = 5; window.SMA.createParticles(vic.x, vic.y, 10, p.particleColor || p.color); window.SMA.playSound('hit'); if (p.type !== 'fire_trap') window.SMA.projectiles.splice(i, 1);
            }
        }
    }
};

// 髀｡蜒上・繝偵ャ繝医・繝・け繧ｹ繝√ぉ繝・け
window.SMA.checkMirrorHit = function (atk, vic) {
    if (!atk.mirrorClone || !atk.mirror) return;
    if (vic.invincible > 0 || vic.actionState === 'RESPAWN' || vic.actionState === 'DEAD') return;
    if (!atk.hitbox.active || atk.actionState !== 'ATTACK') return;
    if (vic.stocks <= 0) return;
    // 髀｡蜒冗畑縺ｮ迢ｬ遶九＠縺殄asHit繝輔Λ繧ｰ
    if (atk.mirrorHasHit) return;

    // 髀｡蜒上・繝偵ャ繝医・繝・け繧ｹ菴咲ｽｮ繧定ｨ育ｮ・
    // 髀｡蜒上・譌｢縺ｫ髀｡縺ｮ蜿榊ｯｾ蛛ｴ縺ｫ縺・ｋ縺ｮ縺ｧ縲∵判謦・婿蜷代ｒ蟾ｦ蜿ｳ蜿崎ｻ｢縺吶ｋ縺縺・
    var cloneCx = atk.mirrorClone.x + atk.w / 2;
    var offset = atk.hitbox.x - (atk.x + atk.w / 2);
    var cloneHb = {
        x: cloneCx - offset - atk.hitbox.w,
        y: atk.hitbox.y,
        w: atk.hitbox.w,
        h: atk.hitbox.h
    };

    if (cloneHb.x < vic.x + vic.w && cloneHb.x + cloneHb.w > vic.x && cloneHb.y < vic.y + vic.h && cloneHb.y + cloneHb.h > vic.y) {
        if (!atk.currentAttack) return;
        atk.mirrorHasHit = true;
        if (vic.actionState === 'DODGE') return;
        var data = atk.currentAttack;
        var p = atk.chargePower;
        if (vic.superArmor) {
            if (data.dmg) vic.percent += data.dmg * p * 0.5;
            window.SMA.createParticles(vic.x + vic.w / 2, vic.y + vic.h / 2, 3, '#636e72');
            window.SMA.playSound('hit');
            return;
        }
        if (vic.actionState === 'SHIELD') {
            vic.shieldHP -= 10 * atk.chargePower;
            window.SMA.createParticles(vic.x + vic.w / 2, vic.y + vic.h / 2, 3, '#0984e3');
            if (vic.shieldHP <= 0) { vic.shieldHP = 0; vic.enterState('STUN', 120); }
            return;
        }
        // 繝繝｡繝ｼ繧ｸ0.5蛟阪∝聖縺｣鬟帙・縺励・繝ｦ繝ｼ繧ｶ繝ｼ險ｭ螳夐壹ｊ縺ｮ2.0蛟・
        if (data.dmg) vic.percent += data.dmg * p * 0.5;
        var atkScale = (data.scale !== undefined) ? data.scale : 0.1;
        var kbMult = window.SMA.CHAR_DATA[vic.charId].kbMult || 1.0;
        // 繝舌・繧ｹ繝亥鴨繧呈悽菴薙・ 1.75 蛟阪↓隱ｿ謨ｴ・・.5 -> 1.75・・
        var kb = (data.kb * p + (Math.pow(vic.percent, 1.2) * atkScale * p * 0.5)) * kbMult * 1.75;
        var r = data.angle * (Math.PI / 180);
        // 髀｡蜒上・蜷代″縺ｧ蜷ｹ縺｣鬟帙・縺玲婿蜷代ｒ豎ｺ螳・
        var cloneFR = atk.mirrorClone.facingRight;
        vic.vx = Math.cos(r) * kb * 2.5 * (cloneFR ? 1 : -1);
        vic.vy = Math.sin(r) * kb * 2.5;
        var stunTime = data.hitstun ? data.hitstun : Math.min(60, kb * 1.5);
        vic.enterState('STUN', stunTime);
        window.SMA.shake = 5;
        window.SMA.createParticles(vic.x, vic.y, 8, '#81ecec');
        window.SMA.playSound('hit');
    }
};
window.SMA.renderResultWinnerIcon = function (icon) {
    var iconEl = document.getElementById('result-winner-icon');
    if (!iconEl) return;
    var v = (icon == null) ? '' : String(icon).trim();
    iconEl.style.backgroundImage = 'none';
    if (!v) {
        iconEl.innerText = '醇';
        return;
    }
    var isImg = /^(https?:\/\/|data:image\/|blob:|\/)/i.test(v);
    if (isImg) {
        iconEl.innerText = '';
        iconEl.style.backgroundImage = 'url(' + v + ')';
    } else {
        iconEl.innerText = v;
    }
};
window.SMA.resolveResultWinnerIcon = function (winRole, text) {
    if (winRole) {
        var roleKey = String(winRole).toLowerCase();
        if (roleKey === 'p1') return (window.SMA.lobbyState && window.SMA.lobbyState.p1Icon) || window.SMA.localPlayerIcon || '';
        if (roleKey === 'p2') {
            var p2 = window.SMA.connections && window.SMA.connections.find(function (x) { return x.role === 'p2'; });
            return (p2 && p2.icon) || (window.SMA.lobbyState && window.SMA.lobbyState.p2Icon) || '';
        }
        if (roleKey === 'p3') {
            var p3 = window.SMA.connections && window.SMA.connections.find(function (x) { return x.role === 'p3'; });
            return (p3 && p3.icon) || (window.SMA.lobbyState && window.SMA.lobbyState.p3Icon) || '';
        }
        if (roleKey === 'p4') {
            var p4 = window.SMA.connections && window.SMA.connections.find(function (x) { return x.role === 'p4'; });
            return (p4 && p4.icon) || (window.SMA.lobbyState && window.SMA.lobbyState.p4Icon) || '';
        }
    }
    var t = (text == null) ? '' : String(text);
    var m = t.match(/^(.*)\s+WINS!?$/i);
    var winnerName = m ? m[1].trim() : '';
    if (!winnerName) return '';
    if (winnerName === '1P') return (window.SMA.lobbyState && window.SMA.lobbyState.p1Icon) || window.SMA.localPlayerIcon || '';
    var byName = window.SMA.connections && window.SMA.connections.find(function (x) { return x && x.name === winnerName; });
    if (byName && byName.icon) return byName.icon;
    if (window.SMA.lobbyState) {
        if (window.SMA.lobbyState.p1 === winnerName) return window.SMA.lobbyState.p1Icon || window.SMA.localPlayerIcon || '';
        if (window.SMA.lobbyState.p2 === winnerName) return window.SMA.lobbyState.p2Icon || '';
        if (window.SMA.lobbyState.p3 === winnerName) return window.SMA.lobbyState.p3Icon || '';
        if (window.SMA.lobbyState.p4 === winnerName) return window.SMA.lobbyState.p4Icon || '';
    }
    return '';
};
window.SMA.inferWinnerRoleFromText = function (text) {
    var t = (text == null) ? '' : String(text);
    var m = t.match(/^(.*)\s+WINS!?$/i);
    var winnerName = m ? m[1].trim() : '';
    if (!winnerName) return '';
    if (winnerName === '1P') return 'p1';
    if (window.SMA.lobbyState) {
        if (window.SMA.lobbyState.p1 === winnerName) return 'p1';
        if (window.SMA.lobbyState.p2 === winnerName) return 'p2';
        if (window.SMA.lobbyState.p3 === winnerName) return 'p3';
        if (window.SMA.lobbyState.p4 === winnerName) return 'p4';
    }
    var byName = window.SMA.connections && window.SMA.connections.find(function (x) { return x && x.name === winnerName; });
    return byName ? (byName.role || '') : '';
};
window.SMA.getRoleIcon = function (role) {
    var r = String(role || '').toLowerCase();
    if (!r) return '';
    if (r === 'p1') return (window.SMA.lobbyState && window.SMA.lobbyState.p1Icon) || window.SMA.localPlayerIcon || '';
    if (r === 'p2') {
        var p2 = window.SMA.connections && window.SMA.connections.find(function (x) { return x.role === 'p2'; });
        return (p2 && p2.icon) || (window.SMA.lobbyState && window.SMA.lobbyState.p2Icon) || '';
    }
    if (r === 'p3') {
        var p3 = window.SMA.connections && window.SMA.connections.find(function (x) { return x.role === 'p3'; });
        return (p3 && p3.icon) || (window.SMA.lobbyState && window.SMA.lobbyState.p3Icon) || '';
    }
    if (r === 'p4') {
        var p4 = window.SMA.connections && window.SMA.connections.find(function (x) { return x.role === 'p4'; });
        return (p4 && p4.icon) || (window.SMA.lobbyState && window.SMA.lobbyState.p4Icon) || '';
    }
    return '';
};
window.SMA.showGameOverResult = function (text, icon) {
    var t = document.getElementById('result-text');
    if (t) t.innerText = text || 'GAME OVER';
    window.SMA.renderResultWinnerIcon(icon);
    var matchTimerEl = document.getElementById('match-timer');
    if (matchTimerEl) matchTimerEl.style.display = 'none';
    var scr = document.getElementById('game-over-screen');
    if (scr) scr.classList.remove('hidden');
};
window.SMA.getWinnerIndexFromSync = function (d) {
    if (!d) return -1;
    var pc = d.playerCount || 4;
    var alive = [];
    for (var i = 1; i <= pc; i++) {
        var pd = d['p' + i];
        if (pd && pd.st > 0) alive.push(i);
    }
    return (alive.length === 1) ? alive[0] : -1;
};
window.SMA.getHudStyleWinnerIcon = function (winnerIndex) {
    if (winnerIndex < 1) return '';
    var key = 'p' + winnerIndex + 'Icon';
    if (window.SMA.lobbyState && window.SMA.lobbyState[key]) return window.SMA.lobbyState[key];
    if (winnerIndex === 1) return window.SMA.localPlayerIcon || '';
    return '';
};
window.SMA.checkGameSet = function () {
    // 逕溷ｭ倩・き繧ｦ繝ｳ繝・
    var alive = [];
    window.SMA.players.forEach(function (p, i) { if (p.stocks > 0) alive.push(i); });
    if (alive.length <= 1) {
        window.SMA.gameRunning = false; window.SMA.gameState = 'GAMEOVER';
        var win = 'CPU';
        var winRole = 'cpu';
        var winIcon = '';
        if (alive.length === 1) {
            var idx = alive[0];
            if (idx === 0) {
                if (window.SMA.isOnline) {
                    win = (window.SMA.lobbyState && window.SMA.lobbyState.p1) || window.SMA.localPlayerName || '1P';
                } else {
                    win = window.SMA.localPlayerName || '1P';
                }
                winRole = 'p1';
                winIcon = window.SMA.getRoleIcon('p1');
            }
            else {
                var role = window.SMA.PLAYER_ROLES[idx];
                var pObj = window.SMA.connections.find(function (x) { return x.role === role; });
                winRole = role;
                winIcon = window.SMA.getRoleIcon(role);
                win = pObj ? pObj.name : (role.toUpperCase());
            }
        }
        var resultText = win + ' WINS!';
        window.SMA.showGameOverResult(resultText, winIcon);
        // 繝帙せ繝医°縺､繧ｪ繝ｳ繝ｩ繧､繝ｳ縺ｪ繧牙・謌ｦ繝懊ち繝ｳ陦ｨ遉ｺ
        var btnRematch = document.getElementById('btn-rematch');
        if (btnRematch) btnRematch.style.display = (window.SMA.isOnline && window.SMA.isHost) ? 'block' : 'none';
        window.SMA.playSound('win');
        window.parent.postMessage({ type: 'gameOver', winner: win, winnerIcon: winIcon }, '*');
        if (window.SMA.isOnline && window.SMA.isHost) {
            var gameOverSync = { type: 'sync', gState: 'GAMEOVER', win: win, winText: resultText, winRole: winRole, winIcon: winIcon };
            window.SMA.connections.forEach(function (c) { if (c && c.conn && c.conn.open) c.conn.send(gameOverSync); });
            if (window.SMA.isGravity) window.SMA.sendGravitySync(gameOverSync);
        }
    }
};
window.SMA.updateHud = function () {
    var getStockIcon = function (id) {
        if (id === 'sword') return 'S';
        if (id === 'mage') return 'M';
        if (id === 'brawler') return 'B';
        if (id === 'spear') return 'P';
        if (id === 'hammer') return 'H';
        if (id === 'mirror') return 'R';
        if (id === 'angel') return 'A';
        return '*';
    };
    var getDamageColor = function (pct, pIndex) {
        if (pct >= 100) return '#c0392b'; // 豼・＞襍､
        if (pct >= 70) return '#e67e22'; // 繧ｪ繝ｬ繝ｳ繧ｸ
        if (pct >= 30) return '#f1c40f'; // 鮟・牡
        // 30%譛ｪ貅縺ｯ蜈・・繝・・繝槭き繝ｩ繝ｼ縺ｫ縺吶ｋ・育區縺ｧ繧ょ庄縺ｧ縺吶′譁・ｭ苓牡縺ｨ縺励※縺ｮ蜿ｯ隱ｭ諤ｧ繧剃ｿ晄戟・・
        return window.SMA.PLAYER_COLORS[pIndex] || '#fff';
    };

    for (var hi = 0; hi < window.SMA.players.length; hi++) {
        var player = window.SMA.players[hi];
        var pctEl = document.getElementById('p' + (hi + 1) + '-percent');
        var stkEl = document.getElementById('p' + (hi + 1) + '-stock');
        var iconEl = document.getElementById('p' + (hi + 1) + '-icon');

        if (pctEl) {
            pctEl.innerText = Math.floor(player.percent) + '%';
            pctEl.style.color = getDamageColor(player.percent, hi);
            // 100%莉･荳翫・繝悶Ν繝悶Ν・育ｰ｡譏薙す繧ｧ繧､繧ｯ・芽｡ｨ迴ｾ
            if (player.percent >= 100) {
                pctEl.style.transform = 'translate(' + (Math.random() * 2 - 1) + 'px, ' + (Math.random() * 2 - 1) + 'px)';
            } else {
                pctEl.style.transform = 'none';
            }
        }
        if (stkEl) {
            var pIconUrl = null;
            if (window.SMA.lobbyState) {
                pIconUrl = window.SMA.lobbyState['p' + (hi + 1) + 'Icon'];
            }
            if (pIconUrl) {
                // 繝励Ξ繧､繝､繝ｼ繧｢繧､繧ｳ繝ｳ逕ｻ蜒上〒繧ｹ繝医ャ繧ｯ陦ｨ遉ｺ
                var stockHtml = '';
                for (var si = 0; si < Math.max(0, player.stocks); si++) {
                    stockHtml += '<img src="' + pIconUrl + '" style="width:16px;height:16px;border-radius:50%;margin:0 1px;vertical-align:middle;">';
                }
                stkEl.innerHTML = stockHtml;
            } else {
                // 繧｢繧､繧ｳ繝ｳ縺ｪ縺玲凾縺ｯ繧ｭ繝｣繝ｩ邨ｵ譁・ｭ励↓繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ
                var icon = getStockIcon(player.charId);
                stkEl.innerText = icon.repeat(Math.max(0, player.stocks));
            }
        }

        // 繧｢繧､繧ｳ繝ｳ縺ｯ繧ｹ繝医ャ繧ｯ陦ｨ遉ｺ縺ｫ邨ｱ蜷医＠縺溘◆繧√”ud-icon隕∫ｴ縺ｯ髱櫁｡ｨ遉ｺ縺ｮ縺ｾ縺ｾ
        if (iconEl) iconEl.style.display = 'none';
    }
    var timerEl = document.getElementById('match-timer');
    if (timerEl) {
        timerEl.innerText = window.SMA.formatMatchTimer();
        timerEl.classList.toggle('sudden-death', (window.SMA.matchTimer || 0) <= 0 && window.SMA.gameState === 'PLAYING');
        var remaining = Math.max(0, window.SMA.matchTimer || 0);
        var timerScale = 1;
        if (remaining > 0 && remaining <= 600) timerScale = 1 + Math.min(1, (600 - remaining) / 300) * 2;
        else if (remaining <= 0) timerScale = 3;
        timerEl.style.transform = 'translateX(-50%) scale(' + timerScale.toFixed(3) + ')';
    }
    var elOvlMsg = document.getElementById('overlay-msg'); var elTxtOvl = document.getElementById('text-overlay');
    if (window.SMA.gameState === 'COUNTDOWN') { var t = '3'; if (window.SMA.countdownTimer < 60) t = '1'; else if (window.SMA.countdownTimer < 120) t = '2'; if (elOvlMsg) elOvlMsg.innerText = t; if (elTxtOvl) elTxtOvl.style.opacity = 1; }
    else if (window.SMA.gameState === 'PLAYING') { if (window.SMA.countdownTimer > -30) { if (elOvlMsg) elOvlMsg.innerText = 'GO!'; if (elTxtOvl) elTxtOvl.style.opacity = 1; } else { if (elTxtOvl) elTxtOvl.style.opacity = 0; } }
};
window.SMA.applySync = function (d) {
    if (d.data) { try { d = JSON.parse(d.data); } catch (e) { return; } }
    if (typeof d.frame === 'number') window.SMA.lockstepRemoteFrame = d.frame;
    if (typeof d.inputDelayFrames === 'number') window.SMA.ONLINE_INPUT_DELAY_FRAMES = d.inputDelayFrames;
    window.SMA.gameState = d.gState; window.SMA.countdownTimer = d.cd; if (typeof d.mt === 'number') window.SMA.matchTimer = d.mt; if (typeof d.sd === 'number') window.SMA.suddenDeathTimer = d.sd;
    // 蜈ｨ繝励Ξ繧､繝､繝ｼ縺ｮ迥ｶ諷九ｒ蜿肴丐
    var pc = d.playerCount || 2;
    for (var si = 0; si < pc && si < window.SMA.players.length; si++) {
        var pData = d['p' + (si + 1)];
        if (pData) window.SMA.players[si].deserialize(pData);
    }
    if (d.projs) window.SMA.projectiles = d.projs;
    if (d.events) { d.events.forEach(function (e) { if (e.type === 'snd') window.SMA.playSound(e.key); if (e.type === 'part') window.SMA.createParticles(e.x, e.y, e.n, e.c); if (e.type === 'comet') window.SMA.triggerComet(e.x, e.y, e.dir, e.c); if (e.type === 'ko_fx') window.SMA.triggerKoBlastFx(e.x, e.y, e.dir, e.c, e.vx, e.vy); if (e.type === 'mage_vfx') window.SMA.spawnMageVfx(e.kind, e.x, e.y, { life: e.life, scale: e.scale, flipX: e.flipX }); }); }
    window.SMA.updateHud();
    if (window.SMA.gameState === 'GAMEOVER') {
        var txt = d.winText || (d.win ? (String(d.win).indexOf('WINS!') !== -1 ? d.win : (d.win + ' WINS!')) : 'GAME OVER');
        var resolvedRole = d.winRole || window.SMA.inferWinnerRoleFromText(txt);
        var winnerIndex = window.SMA.getWinnerIndexFromSync(d);
        var icon = d.winIcon || window.SMA.getHudStyleWinnerIcon(winnerIndex) || window.SMA.getRoleIcon(resolvedRole) || window.SMA.resolveResultWinnerIcon(resolvedRole, txt);
        window.SMA.showGameOverResult(txt, icon);
    }
};
// rematch蜿嶺ｿ｡蜃ｦ逅・ｼ医ご繧ｹ繝亥・・・
var origHandleClient = window.SMA.handleClient;
window.SMA.handleClient = function (d) {
    if (d.type === 'rematch') {
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('hud-layer').style.display = 'none';
        var matchTimerEl = document.getElementById('match-timer');
        if (matchTimerEl) matchTimerEl.style.display = 'none';
        document.getElementById('controller-area').style.display = 'none';
        if (window.SMA.animationFrameId) { cancelAnimationFrame(window.SMA.animationFrameId); window.SMA.animationFrameId = null; }
        window.SMA.gameRunning = false;
        var hub = document.getElementById('battle-hub-screen');
        hub.classList.remove('hidden'); hub.style.display = 'flex';
        window.SMA.showHubSelectPanel();
        return;
    }
    origHandleClient(d);
};

// 5. FIGHTER CLASS
window.SMA.Fighter = function (x, y, color, isP2, charId) {
    this.x = x; this.y = y; this.w = 30; this.h = 60; this.color = color;
    this.vx = 0; this.vy = 0; this.isGrounded = false; this.jumps = 0;
    this.percent = 0; this.stocks = 3; this.isP2 = !!isP2; this.facingRight = !isP2;
    this.role = isP2 ? 'p2' : 'p1';
    this.playerRole = this.role; // players[]縺九ｉ荳頑嶌縺阪＆繧後ｋ
    this.actionState = 'IDLE'; this.stateTimer = 0; this.respawnTimer = 0;
    this.currentAttack = null; this.currentAttackType = null;
    this.hitbox = { active: false, shape: 'box', x: 0, y: 0, w: 0, h: 0, radius: 0 };
    this.hasHit = false; this.chargePower = 1.0; this.shieldHP = 100;
    this.invincible = 0; this.dropThrough = false; this.grabbedTarget = null;
    this.ledgeGrabbed = null;
    this.cpuTimer = 0; this.dodgeCooldown = 0; this.grabInvincible = 0;
    this.animScale = { x: 1, y: 1 }; this.rotation = 0; this.currentPlatform = null; this.ledgeCooldown = 0;
    this.airborneFrames = 0; this.ledgeInputLock = 0;
    this.charId = charId || 'sword';
    this.hasAirDodged = false;
    this.hasUpSpecial = false;
    this.superArmor = false;
    // 髀｡繧ｭ繝｣繝ｩ逕ｨ繝励Ο繝代ユ繧｣
    this.mirror = null;       // {x, y, timer} 險ｭ鄂ｮ荳ｭ縺ｮ髀｡
    this.mirrorClone = null;  // {x, y, facingRight} 髀｡蜒上・菴咲ｽｮ
    this.mirrorPlaceRange = 0;
    this.mirrorHasHit = false;
    this.mirrorCooldown = 0; // 髀｡縺ｮ繧ｯ繝ｼ繝ｫ繧ｿ繧､繝・医ヵ繝ｬ繝ｼ繝謨ｰ, 300=5遘抵ｼ・
    // 髟ｷ謚ｼ縺玲凾縺ｮ險ｭ鄂ｮ霍晞屬
};

// 6. CHAR DATA
window.SMA.CHAR_DATA = {
    sword: {
        moveMult: 1.0,
        airAttackMoveMult: 1.0,
        attacks: {
            NEUTRAL: { dmg: 6, kb: 1.6, scale: 0.08, angle: -30, frames: 12, lag: 8, stun: 3, color: '#fff' },
            SIDE: { dmg: 14, kb: 2.4, scale: 0.1, angle: -25, frames: 20, lag: 20, stun: 6, color: '#ffeb3b' },
            UP: { dmg: 10, kb: 1.6, scale: 0.1, angle: -90, frames: 16, lag: 15, stun: 5, color: '#00cec9' },
            DOWN: { type: 'slide', dmg: 9, kb: 1.6, scale: 0.08, angle: -70, frames: 24, lag: 18, stun: 8, color: '#e17055' },
            AIR_NEUTRAL: { type: 'spin', dmg: 10, kb: 1.6, scale: 0.1, angle: -45, frames: 24, lag: 10, stun: 5, color: '#a29bfe' },
            AIR_SIDE: { dmg: 12, kb: 2.4, scale: 0.1, angle: -45, frames: 20, lag: 15, stun: 6, color: '#a29bfe' },
            AIR_DOWN: { type: 'slash_down', dmg: 15, kb: 2.4, scale: 0.1, angle: 90, frames: 25, lag: 12, stun: 10, color: '#d63031' },
            LEDGE_ATK: { dmg: 8, kb: 12.0, scale: 0.01, angle: -45, frames: 30, lag: 10, stun: 10 }
        },
        throws: {
            THROW_FW: { dmg: 8, kb: 7.0, scale: 0.07, angle: -30 }, THROW_BK: { dmg: 8, kb: 7.0, scale: 0.07, angle: -150 },
            THROW_UP: { dmg: 8, kb: 7.0, scale: 0.07, angle: -90 }, THROW_DN: { dmg: 8, kb: 7.0, scale: 0.07, angle: 45 }
        }
    },
    mage: {
        moveMult: 0.95,
        airAttackMoveMult: 0.9,
        attacks: {
            NEUTRAL: { type: 'shot', spawnFrame: 5, dmg: 3, kb: 3.0, scale: 0, speed: 11.34, radius: 10, frames: 21, lag: 0, stun: 2, hitstun: 15 },
            SIDE: { type: 'shot', spawnFrame: 12, dmg: 13, kb: 3.0, scale: 0.1, speed: 3.5, radius: 25, frames: 25, lag: 40, stun: 10 },
            UP: { dmg: 13.5, kb: 1.6, scale: 0.1, angle: -90, frames: 25, lag: 25, stun: 5 },
            DOWN: { type: 'fire_shot', spawnFrame: 10, dmg: 9, kb: 1.5, scale: 0.08, angle: -45, frames: 25, lag: 18, stun: 5, radius: 10 },
            AIR_NEUTRAL: { type: 'shot', spawnFrame: 5, dmg: 3, kb: 3.0, scale: 0, speed: 11.34, radius: 10, frames: 21, lag: 0, stun: 2, hitstun: 15 },
            AIR_SIDE: { type: 'shot', spawnFrame: 12, dmg: 13, kb: 3.0, scale: 0.1, speed: 3.5, radius: 25, frames: 25, lag: 40, stun: 10 },
            AIR_DOWN: { type: 'fire_shot', spawnFrame: 10, dmg: 9, kb: 1.5, scale: 0.08, angle: -45, frames: 25, lag: 18, stun: 5, radius: 10 },
            LEDGE_ATK: { dmg: 8, kb: 12.0, scale: 0.01, angle: -45, frames: 30, lag: 10, stun: 10 }
        },
        throws: {
            THROW_FW: { dmg: 8, kb: 15.0, scale: 0.01, angle: -30 }, THROW_BK: { dmg: 8, kb: 15.0, scale: 0.01, angle: -150 },
            THROW_UP: { dmg: 8, kb: 15.0, scale: 0.01, angle: -90 }, THROW_DN: { dmg: 8, kb: 15.0, scale: 0.01, angle: 45 }
        }
    },
    brawler: {
        moveMult: 1.4,
        airAttackMoveMult: 1.4,
        jumpMult: 1.15,
        kbMult: 1.1,
        attacks: {
            NEUTRAL: { dmg: 3, kb: 0.5, scale: 0.02, angle: -30, frames: 8, lag: 4, stun: 4, color: '#f1c40f' },
            SIDE: { type: 'lunge', dmg: 14, kb: 2.8, scale: 0.12, angle: -30, frames: 25, lag: 20, stun: 10, color: '#e67e22' },
            UP: { type: 'shoryu', dmg: 12, kb: 3.0, scale: 0.1, angle: -90, frames: 35, lag: 25, stun: 8, color: '#e74c3c' },
            DOWN: { type: 'low_kick', dmg: 6, kb: 3.0, scale: 0.01, angle: -90, frames: 15, lag: 6, stun: 8, hitstun: 41, color: '#d35400' },
            AIR_NEUTRAL: { type: 'sex_kick', dmg: 6, kb: 1.0, scale: 0.05, angle: -45, frames: 25, lag: 1, stun: 5, hitstun: 33, color: '#f39c12' },
            AIR_SIDE: { type: 'axe', dmg: 18, kb: 16.0, scale: 0.2, angle: 90, frames: 40, lag: 16, stun: 12, color: '#c0392b' },
            AIR_UP: { type: 'shoryu', dmg: 10, kb: 2.5, scale: 0.1, angle: -90, frames: 20, lag: 15, stun: 8, color: '#e74c3c' },
            AIR_DOWN: { type: 'dive', dmg: 15, kb: 3.0, scale: 0.1, angle: 90, frames: 999, lag: 30, stun: 10, color: '#c0392b' },
            LEDGE_ATK: { dmg: 8, kb: 12.0, scale: 0.01, angle: -45, frames: 30, lag: 10, stun: 10 },
            CHARGE: { type: 'blast', dmg: 18, kb: 5.0, scale: 0.15, angle: -45, frames: 40, lag: 30, stun: 15, color: '#e67e22' }
        },
        throws: {
            THROW_FW: { dmg: 8, kb: 15.0, scale: 0.01, angle: -30 }, THROW_BK: { dmg: 8, kb: 15.0, scale: 0.01, angle: -150 },
            THROW_UP: { dmg: 8, kb: 7.5, scale: 0.01, angle: -90 }, 
            THROW_DN: { dmg: 8, kb: 15.0, scale: 0.01, angle: 45 }
        }
    },
    spear: {
        moveMult: 0.9,
        airAttackMoveMult: 0.9,
        jumpMult: 0.9,
        kbMult: 0.85,
        attacks: {
            NEUTRAL: { type: 'poke', range: 120, dmg: 5, kb: 1.46, scale: 0.1, angle: -20, frames: 18, lag: 10, color: '#00b894' },
            SIDE: { type: 'boomerang', dmg: 8, kb: 1.17, scale: 0.08, angle: -30, frames: 30, lag: 22, color: '#00b894' }, 
            UP: { type: 'boomerang_up', range: 100, dmg: 7, kb: 1.28, scale: 0.08, angle: -80, frames: 30, lag: 22, color: '#00b894' }, 
            DOWN: { type: 'ground_shock', range: 130, dmg: 9, kb: 1.46, scale: 0.08, angle: -45, frames: 35, lag: 20, color: '#00b894' },
            AIR_NEUTRAL: { type: 'poke', range: 100, dmg: 8, kb: 1.62, scale: 0.1, angle: -30, frames: 20, lag: 10, color: '#00b894' },
            AIR_SIDE: { type: 'boomerang', dmg: 8, kb: 1.46, scale: 0.08, angle: -25, frames: 30, lag: 22, color: '#00b894' }, 
            AIR_UP: { type: 'boomerang_up', range: 100, dmg: 7, kb: 1.28, scale: 0.08, angle: -80, frames: 30, lag: 22, color: '#00b894' }, 
            AIR_DOWN: { type: 'boomerang_down', dmg: 11, kb: 1.46, scale: 0.08, angle: 90, frames: 30, lag: 20, color: '#00b894' },
            LEDGE_ATK: { dmg: 6, kb: 9.7, scale: 0.01, angle: -45, frames: 30, lag: 10, stun: 10 }
        },
        throws: {
            THROW_FW: { dmg: 6, kb: 5.7, scale: 0.07, angle: -30 }, THROW_BK: { dmg: 6, kb: 5.7, scale: 0.07, angle: -150 },
            THROW_UP: { dmg: 6, kb: 5.7, scale: 0.07, angle: -90 }, THROW_DN: { dmg: 6, kb: 5.7, scale: 0.07, angle: 45 }
        }
    },
    hammer: {
        moveMult: 0.8,
        airAttackMoveMult: 0.7,
        kbMult: 0.85,
        jumpMult: 0.9,
        attacks: {
            NEUTRAL: { dmg: 16, kb: 5.6, scale: 0.15, angle: -45, frames: 45, lag: 10, stun: 15, color: '#b2bec3' },
            SIDE: { type: 'spin_hammer', dmg: 12, kb: 3.5, scale: 0.15, angle: -30, frames: 50, lag: 25, stun: 10, color: '#636e72' },
            UP: { dmg: 13, kb: 4.4, scale: 0.15, angle: -90, frames: 40, lag: 15, stun: 12, color: '#b2bec3' },
            DOWN: { type: 'tornado', dmg: 1.6, kb: 0.2, scale: 0.05, angle: -45, frames: 90, lag: 30, stun: 30, hitstun: 30, color: '#dfe6e9' },
            AIR_NEUTRAL: { type: 'hammer_spin_air', dmg: 12, kb: 3.0, scale: 0.15, angle: -45, frames: 40, lag: 15, stun: 8, color: '#b2bec3' },
            AIR_SIDE: { dmg: 15, kb: 3.6, scale: 0.15, angle: -60, frames: 18, lag: 12, stun: 12, color: '#636e72' },
            AIR_UP: { dmg: 13, kb: 3.2, scale: 0.12, angle: -90, frames: 40, lag: 20, stun: 8, color: '#b2bec3' },
            AIR_DOWN: { type: 'tornado', dmg: 1.6, kb: 0.2, scale: 0.05, angle: -45, frames: 90, lag: 30, stun: 30, hitstun: 30, color: '#dfe6e9' },
            LEDGE_ATK: { dmg: 11, kb: 3.0, scale: 0.1, angle: -45, frames: 40, lag: 20, stun: 10 }
        },
        throws: {
            THROW_FW: { dmg: 10, kb: 6.0, scale: 0.1, angle: -30 },
            THROW_BK: { dmg: 10, kb: 6.0, scale: 0.1, angle: -150 },
            THROW_UP: { dmg: 10, kb: 6.0, scale: 0.1, angle: -90 },
            THROW_DN: { dmg: 10, kb: 8.0, scale: 0.1, angle: 45 }
        }
    },
    mirror: {
        moveMult: 1.15,
        airAttackMoveMult: 1.1,
        jumpMult: 1.1, speed: 1.05, kbMult: 1.15,
        attacks: {
            NEUTRAL: { type: 'mirror_slash', range: 50, dmg: 4, kb: 1.44, scale: 0.06, angle: -30, frames: 10, lag: 6, stun: 3, color: '#81ecec' },
            SIDE: { type: 'mirror_throw', dmg: 8, kb: 1.8, scale: 0.06, angle: -20, frames: 22, lag: 11, stun: 5, color: '#81ecec' },
            UP: { type: 'mirror_throw_up', dmg: 7, kb: 2.16, scale: 0.08, angle: -80, frames: 22, lag: 12, stun: 5, color: '#81ecec' },
            DOWN: { type: 'mirror_place', dmg: 0, kb: 0, scale: 0, angle: 0, frames: 200, lag: 12, stun: 0, color: '#dfe6e9' },
            AIR_NEUTRAL: { type: 'mirror_spin', dmg: 8, kb: 1.92, scale: 0.08, angle: -45, frames: 24, lag: 10, stun: 5, color: '#81ecec' },
            AIR_SIDE: { type: 'mirror_throw', dmg: 8, kb: 1.8, scale: 0.06, angle: -20, frames: 22, lag: 11, stun: 5, color: '#81ecec' },
            AIR_UP: { type: 'mirror_throw_up', dmg: 7, kb: 2.16, scale: 0.08, angle: -80, frames: 22, lag: 12, stun: 5, color: '#81ecec' },
            AIR_DOWN: { type: 'mirror_place', dmg: 0, kb: 0, scale: 0, angle: 0, frames: 200, lag: 12, stun: 0, color: '#dfe6e9' },
            LEDGE_ATK: { dmg: 6, kb: 10.8, scale: 0.01, angle: -45, frames: 30, lag: 10, stun: 10 }
        },
        throws: {
            THROW_FW: { dmg: 6, kb: 7.2, scale: 0.06, angle: -30 },
            THROW_BK: { dmg: 6, kb: 7.2, scale: 0.06, angle: -150 },
            THROW_UP: { dmg: 6, kb: 7.2, scale: 0.06, angle: -90 },
            THROW_DN: { dmg: 6, kb: 8.4, scale: 0.06, angle: 45 }
        }
    },
    angel: {
        moveMult: 1.0,
        airAttackMoveMult: 1.0,
        jumpMult: 0.85,
        kbMult: 1.2,
        maxJumps: 3,
        attacks: {
            // NA: 蜈峨・蠑鍋泙繧貞燕譁ｹ縺ｫ蟆・・・亥ｰ・ｨ・50px = WORLD_W/2・峨ゅメ繝｣繝ｼ繧ｸ縺ｧ3譛ｬ・育峩騾ｲ/譁懊ａ荳・譁懊ａ荳具ｼ・
            NEUTRAL: { type: 'arrow_shot', spawnFrame: 6, dmg: 3, kb: 0.75, scale: 0.06, speed: 8, radius: 8, frames: 18, lag: 12, stun: 3, range: 750, color: '#fff0a0' },
            // 讓ｪA: 鄒ｽ縺ｰ縺溘″謾ｻ謦・らｩｺ荳ｭ譎ゅ・閾ｪ蟾ｱ蠕梧婿繝弱ャ繧ｯ繝舌ャ繧ｯ
            SIDE: { type: 'wing_flap', dmg: 14, kb: 3, scale: 0.1, angle: -25, frames: 22, lag: 18, stun: 8, color: '#fff' },
            // 荳晦: 鬟帷ｿ疲判謦・ｼ域判謦・愛螳壻ｻ倥″荳頑・・・
            UP: { type: 'wing_rise', dmg: 11, kb: 3, scale: 0.1, angle: -85, frames: 30, lag: 20, stun: 6, color: '#ffe066', limit: true },
            // 荳帰: 蜀・ｽ｢陦晄茶豕｢・亥崋螳壼聖縺｣鬟帙・縺励∵茶蠅應ｸ榊庄・峨らｩｺ荳ｭ縺ｧ貊樒ｩｺ
            DOWN: { type: 'shockwave', shockFrame: 17, dmg: 6, kb: 8.0, scale: 0, angle: -45, frames: 35, lag: 34, stun: 10, shockRadius: 140, color: '#ffe066' },
            AIR_NEUTRAL: { type: 'arrow_shot', spawnFrame: 6, dmg: 3, kb: 0.75, scale: 0.06, speed: 8, radius: 8, frames: 18, lag: 12, stun: 3, range: 750, color: '#fff0a0' },
            AIR_SIDE: { type: 'wing_flap', dmg: 13, kb: 3, scale: 0.1, angle: -30, frames: 22, lag: 18, stun: 7, color: '#fff', airKnockback: true },
            AIR_UP: { type: 'wing_rise', dmg: 11, kb: 3, scale: 0.1, angle: -90, frames: 28, lag: 18, stun: 5, color: '#ffe066', limit: true },
            AIR_DOWN: { type: 'shockwave', shockFrame: 17, dmg: 6, kb: 8.0, scale: 0, angle: -45, frames: 35, lag: 34, stun: 10, shockRadius: 140, color: '#ffe066', hover: true },
            LEDGE_ATK: { dmg: 7, kb: 10.0, scale: 0.01, angle: -45, frames: 30, lag: 10, stun: 10 }
        },
        throws: {
            THROW_FW: { dmg: 7, kb: 7.0, scale: 0.07, angle: -30 },
            THROW_BK: { dmg: 7, kb: 7.0, scale: 0.07, angle: -150 },
            THROW_UP: { dmg: 7, kb: 7.0, scale: 0.07, angle: -90 },
            THROW_DN: { dmg: 7, kb: 7.0, scale: 0.07, angle: 45 }
        }
    }
};

// 7. PROTOTYPES (EXPLICIT)
window.SMA.Fighter.prototype.update = function (inputKeys, opponent) {
    var S = window.SMA;
    if (S.gameState === 'COUNTDOWN') return;

    if (this.actionState !== 'ATTACK') this.rotation = 0;

    if (this.actionState === 'DEAD' || this.stocks <= 0) return;
    this.animScale.x += (1.0 - this.animScale.x) * 0.2; this.animScale.y += (1.0 - this.animScale.y) * 0.2;
    if (this.actionState !== 'LEDGE_ROLL') this.rotation = 0;
    if (this.actionState === 'RESPAWN') { this.respawnTimer--; if (this.respawnTimer <= 0) { this.respawn(); return; } this.x = S.WORLD_W / 2 - this.w / 2; this.y = (S.WORLD_H * 0.7) - 300; this.vx = 0; this.vy = 0; return; }
    if (this.invincible > 0) this.invincible--; if (this.dodgeCooldown > 0) this.dodgeCooldown--; if (this.grabInvincible > 0) this.grabInvincible--; if (this.ledgeCooldown > 0) this.ledgeCooldown--;
    if (this.actionState === 'STUN') { this.stateTimer--; if (this.stateTimer <= 0) this.actionState = 'IDLE'; this.applyPhysics(); this.checkBounds(); this.checkPlatforms(inputKeys); this.checkSolids(); return; }
    if (this.actionState === 'GRABBED') { this.vx = 0; this.vy = 0; return; }
    if (!inputKeys.down) this.dropThrough = false;
    if (this.actionState === 'DODGE') { this.stateTimer--; this.x += this.vx; this.y += this.vy; this.vx *= 0.93; this.vy *= 0.93; this.checkPlatforms(inputKeys); this.checkSolids(); if (this.stateTimer <= 0) { this.actionState = 'IDLE'; } this.checkBounds(); return; }
    if (this.actionState === 'LEDGE') {
        this.vx = 0; this.vy = 0; this.isGrounded = false; this.jumps = 0;
        this.stateTimer++; // Count time on ledge

        if (!this.ledgeGrabbed) { this.actionState = 'IDLE'; return; }
        if (this.ledgeInputLock > 0) { this.ledgeInputLock--; return; }
        if (inputKeys.jump) { this.actionState = 'IDLE'; this.vy = -12; this.y -= 10; this.invincible = 20; } else if (inputKeys.down || (this.facingRight && inputKeys.left) || (!this.facingRight && inputKeys.right)) { this.actionState = 'IDLE'; this.y += 10; this.invincible = 10; this.ledgeCooldown = 30; } else if (inputKeys.attack) { this.enterState('LEDGE_ATK', 30); this.invincible = 20; this.hasHit = false; var set = S.CHAR_DATA[this.charId].attacks; this.currentAttack = set.LEDGE_ATK; var p = this.ledgeGrabbed.platform; var dir = this.ledgeGrabbed.dir; this.y = p.y - this.h; this.x = (dir === 'left') ? p.x : (p.x + p.w - this.w); } else if (inputKeys.shield) { this.enterState('LEDGE_ROLL', 25); this.invincible = 25; var p = this.ledgeGrabbed.platform; var dir = this.ledgeGrabbed.dir; this.y = p.y - this.h; this.x = (dir === 'left') ? p.x : (p.x + p.w - this.w); } else if (inputKeys.up || (this.facingRight && inputKeys.right) || (!this.facingRight && inputKeys.left)) { this.actionState = 'LEDGE_UP'; this.stateTimer = 20; this.invincible = 30; } return;
    }
    if (this.actionState === 'LEDGE_UP') { this.stateTimer--; this.vx = 0; this.vy = 0; if (this.stateTimer <= 0) { this.actionState = 'IDLE'; if (this.ledgeGrabbed) { var p = this.ledgeGrabbed.platform; var dir = this.ledgeGrabbed.dir; this.y = p.y - this.h; this.x = (dir === 'left') ? p.x : (p.x + p.w - this.w); } } return; }
    if (this.actionState === 'LEDGE_ATK') { this.stateTimer--; this.vx = 0; this.vy = 0; if (this.stateTimer > 20) { var p = this.ledgeGrabbed.platform; var dir = this.ledgeGrabbed.dir; var startX = (dir === 'left') ? p.x - this.w : p.x + p.w; var endX = (dir === 'left') ? p.x : p.x + p.w - this.w; var startY = p.y; var endY = p.y - this.h; var t = (30 - this.stateTimer) / 10; this.x = startX + (endX - startX) * t; this.y = startY + (endY - startY) * t; } if (this.stateTimer < 20 && this.stateTimer > 10) { this.hitbox.active = true; this.hitbox.w = 150; this.hitbox.h = 60; if (this.charId === 'mirror') { this.hitbox.w *= 1.25; this.hitbox.h *= 1.25; } this.hitbox.x = this.facingRight ? (this.x - 50) : (this.x + this.w + 50 - 150); this.hitbox.y = this.y; var set = S.CHAR_DATA[this.charId].attacks; this.currentAttack = set.LEDGE_ATK; this.chargePower = 1.0; } else { this.hitbox.active = false; } if (this.stateTimer <= 0) { this.actionState = 'IDLE'; this.currentAttack = null; } return; }
    if (this.actionState === 'LEDGE_ROLL') { this.stateTimer--; var rollSpeed = 5; this.vx = this.facingRight ? rollSpeed : -rollSpeed; this.rotation += 0.5; if (this.stateTimer <= 0) { this.vx = 0; this.actionState = 'IDLE'; this.rotation = 0; } this.x += this.vx; return; }
    switch (this.actionState) {
        case 'LAG': this.stateTimer--; if (this.stateTimer <= 0) this.actionState = 'IDLE'; this.vx *= S.FRICTION; this.applyPhysics(); break;
        case 'GRAB_ATTEMPT': {
            this.stateTimer++;
            this.vx *= 0.6;
            this.applyPhysics();
            // 7繝輔Ξ繝ｼ繝逶ｮ・郁・縺梧怙螟ｧ縺ｫ莨ｸ縺ｳ縺滓凾轤ｹ・峨〒蠖薙◆繧雁愛螳・
            if (this.stateTimer === 7) {
                var opp = this.grabTarget;
                if (opp) {
                    var dist = Math.sqrt(Math.pow(opp.x - this.x, 2) + Math.pow(opp.y - this.y, 2));
                    var isForward = this.facingRight ? (opp.x + opp.w / 2 > this.x + this.w / 2 - 10) : (opp.x + opp.w / 2 < this.x + this.w / 2 + 10);
                    if (dist < 65 && isForward && opp.invincible === 0 && opp.grabInvincible <= 0 && opp.actionState !== 'DEAD' && opp.actionState !== 'RESPAWN' && opp.actionState !== 'DODGE') {
                        // 縺､縺九∩謌仙粥
                        this.actionState = 'GRABBING'; this.grabbedTarget = opp; this.stateTimer = 120;
                        opp.chargePower = 1.0; opp.actionState = 'GRABBED'; opp.isShielding = false;
                        window.SMA.createParticles(opp.x + 15, opp.y + 30, 5, '#a29bfe');
                        this.grabTarget = null;
                    }
                }
            }
            // 15繝輔Ξ繝ｼ繝縺ｧ繝｢繝ｼ繧ｷ繝ｧ繝ｳ邨ゆｺ・竊・縺､縺九ａ縺ｦ縺・↑縺代ｌ縺ｰLAG
            if (this.stateTimer >= 15 && this.actionState === 'GRAB_ATTEMPT') {
                this.grabTarget = null;
                this.enterState('LAG', 18);
            }
            break;
        }
        case 'ATTACK': if (!this.isGrounded) { var moveSpd = S.SPEED * 0.5; var cAtk = S.CHAR_DATA[this.charId] || {}; var airMoveMult = (typeof cAtk.airAttackMoveMult === 'number') ? cAtk.airAttackMoveMult : 1.0; moveSpd *= airMoveMult; if (inputKeys.left) this.vx -= moveSpd; if (inputKeys.right) this.vx += moveSpd; if (this.vx > 5) this.vx = 5; if (this.vx < -5) this.vx = -5; } if (this.currentAttack && (this.currentAttack.type === 'meteor' || this.currentAttack.type === 'beam' || this.currentAttack.type === 'dive' || this.currentAttack.type === 'axe' || this.currentAttack.type === 'stall_fall' || this.currentAttack.type === 'up_rush' || this.currentAttack.type === 'ground_shock')) { this.handleAttackFrame(); this.applyPhysics(); } else if (this.currentAttack && (this.currentAttack.type === 'slide' || this.currentAttack.type === 'lunge' || this.currentAttack.type === 'spin_hammer' || this.currentAttack.type === 'hammer_spin_air' || this.currentAttack.type === 'tornado')) { this.handleAttackFrame(); this.vx *= 0.95; this.vy += S.GRAVITY; this.checkPlatforms(inputKeys); this.x += this.vx; this.y += this.vy; if (this.y > 2000) this.checkBounds(); } else { this.handleAttackFrame(); this.applyPhysics(); } break;
        case 'CHARGE':
            if (!inputKeys.attack) {
                var chargeReleaseType = 'NEUTRAL';
                if (inputKeys.up) chargeReleaseType = 'UP';
                else if (inputKeys.down) chargeReleaseType = 'DOWN';
                else if (inputKeys.left || inputKeys.right) chargeReleaseType = 'SIDE';
                this.releaseAttack(chargeReleaseType);
                break;
            }
            this.stateTimer++;
            if (inputKeys.left) this.facingRight = false;
            if (inputKeys.right) this.facingRight = true;
            this.vx *= 0.6; this.chargePower += 0.02; if (this.chargePower > 1.7) this.chargePower = 1.7; this.applyPhysics(); break;
        case 'SHIELD': this.shieldHP -= 0.6; if (inputKeys.left || inputKeys.right || inputKeys.down) { if (this.performDodge(inputKeys)) return; } if (this.shieldHP <= 0) { this.shieldHP = 0; this.enterState('STUN', 120); } else if (!inputKeys.shield) { this.actionState = 'IDLE'; } this.vx *= 0.5; this.applyPhysics(); break;
        case 'GRABBING': this.handleGrabbing(inputKeys); this.vx = 0; this.applyPhysics(); break;
        case 'THROWING': this.stateTimer--; if (this.stateTimer <= 0) this.actionState = 'IDLE'; this.vx *= 0.5; this.applyPhysics(); break;
        case 'IDLE':
            if (this.shieldHP < 100) this.shieldHP += 0.2;
            if (inputKeys.shield) {
                if (this.dodgeCooldown <= 0) {
                    if (!this.isGrounded) { this.performDodge(inputKeys); }
                    else { this.actionState = 'SHIELD'; }
                }
            } else {
                var moveSpd = S.SPEED;
                var cIdle = S.CHAR_DATA[this.charId] || {};
                var idleMoveMult = (typeof cIdle.moveMult === 'number') ? cIdle.moveMult : 1.0;
                moveSpd *= idleMoveMult;
                if (inputKeys.left) { this.vx -= moveSpd; this.facingRight = false; }
                if (inputKeys.right) { this.vx += moveSpd; this.facingRight = true; }
            }
            if (this.vx > 7) this.vx = 7; if (this.vx < -7) this.vx = -7; this.applyPhysics(); break;
    }

    // 髀｡繧ｭ繝｣繝ｩ: 髀｡繧ｿ繧､繝槭・譖ｴ譁ｰ縺ｨ髀｡蜒丞ｺｧ讓呵ｨ育ｮ・
    if (this.charId === 'mirror') {
        if (this.mirrorCooldown > 0) this.mirrorCooldown--;
        if (this.mirror) {
            this.mirror.timer--;
            if (this.mirror.timer <= 0) { this.mirror = null; this.mirrorClone = null; this.mirrorCooldown = 300; }
            else {
                var cx = this.x + this.w / 2;
                this.mirrorClone = {
                    x: 2 * this.mirror.x - cx - this.w / 2,
                    y: this.y,
                    facingRight: !this.facingRight
                };
            }
        } // mirror蟄伜惠繝√ぉ繝・け
    }
    if (this.isGrounded) { this.hasAirDodged = false; this.hasUpSpecial = false; this._wingRiseUsed = false; }
    var preGrounded = this.isGrounded;
    this.checkPlatforms(inputKeys); this.checkLedgeGrab(); this.checkSolids(); this.checkBounds();

    // 遨ｺ荳ｭN逹蝨ｰ遑ｬ逶ｴ (sword, brawler, hammer, mirror)
    if (!preGrounded && this.isGrounded) {
        if (this.actionState === 'ATTACK' && this.currentAttackType === 'AIR_NEUTRAL') {
            if (this.charId === 'sword' || this.charId === 'mirror') {
                this.actionState = 'LAG';
                this.stateTimer = 5; // 5F landing lag
                this.currentAttack = null;
                this.chargePower = 1.0;
                this.hitbox.active = false;
                this.rotation = 0;
            } else if (this.charId === 'hammer') {
                this.actionState = 'LAG';
                this.stateTimer = 9; // 9F landing lag
                this.currentAttack = null;
                this.chargePower = 1.0;
                this.hitbox.active = false;
                this.rotation = 0;
            } else if (this.charId === 'brawler') {
                this.actionState = 'LAG';
                this.stateTimer = 3; // 3F landing lag
                this.currentAttack = null;
                this.chargePower = 1.0;
                this.hitbox.active = false;
                this.rotation = 0;
            }
        }
    }
    if (this.isGrounded || this.actionState === 'LEDGE' || this.actionState === 'LEDGE_UP' || this.actionState === 'LEDGE_ATK' || this.actionState === 'LEDGE_ROLL') {
        this.airborneFrames = 0;
    } else {
        this.airborneFrames = (this.airborneFrames || 0) + 1;
    }
};
window.SMA.Fighter.prototype.serialize = function () { return { x: this.x, y: this.y, vx: this.vx, vy: this.vy, state: this.actionState, timer: this.stateTimer, atkType: this.currentAttackType, grounded: this.isGrounded, pct: this.percent, st: this.stocks, face: this.facingRight, chg: this.chargePower, sh: this.shieldHP, inv: this.invincible, grInv: this.grabInvincible, air: this.airborneFrames || 0, ledgeLock: this.ledgeInputLock || 0, mirror: this.mirror, mirrorClone: this.mirrorClone, mirrorCooldown: this.mirrorCooldown, mirrorPlaceRange: this.mirrorPlaceRange, mirrorChibiDownVariant: this._mirrorChibiDownVariant || null, hitboxActive: this.hitbox.active, hitboxX: this.hitbox.x, hitboxY: this.hitbox.y, hitboxW: this.hitbox.w, hitboxH: this.hitbox.h }; };
window.SMA.Fighter.prototype.deserialize = function (data) { var S = window.SMA; if (!data) return; this.x = data.x; this.y = data.y; this.vx = data.vx; this.vy = data.vy; this.actionState = data.state; this.stateTimer = data.timer; this.isGrounded = data.grounded; this.currentAttackType = data.atkType; if (this.currentAttackType) { var set = S.CHAR_DATA[this.charId]; if (set.attacks[this.currentAttackType]) this.currentAttack = set.attacks[this.currentAttackType]; else if (set.throws[this.currentAttackType]) this.currentAttack = set.throws[this.currentAttackType]; } else this.currentAttack = null; this.percent = data.pct; this.stocks = data.st; this.facingRight = data.face; this.chargePower = data.chg; this.shieldHP = data.sh; this.invincible = data.inv; this.grabInvincible = data.grInv || 0; this.airborneFrames = data.air || 0; this.ledgeInputLock = data.ledgeLock || 0; this.mirror = data.mirror || null; this.mirrorClone = data.mirrorClone || null; this.mirrorCooldown = data.mirrorCooldown || 0; this.mirrorPlaceRange = data.mirrorPlaceRange || 0; this._mirrorChibiDownVariant = data.mirrorChibiDownVariant || null; if (data.hitboxActive !== undefined) { this.hitbox.active = data.hitboxActive; this.hitbox.x = data.hitboxX; this.hitbox.y = data.hitboxY; this.hitbox.w = data.hitboxW; this.hitbox.h = data.hitboxH; } };
window.SMA.Fighter.prototype.enterState = function (state, duration) { this.actionState = state; this.stateTimer = duration; this.hitbox.active = false; };
window.SMA.Fighter.prototype.faceOpponent = function (opponent) { if (opponent && opponent.stocks > 0 && opponent.actionState !== 'RESPAWN' && this.actionState !== 'ATTACK') { if (this.x < opponent.x - 10) this.facingRight = true; if (this.x > opponent.x + 10) this.facingRight = false; } };
window.SMA.Fighter.prototype.applyPhysics = function () { var S = window.SMA; if (this.actionState === 'ATTACK' && this.currentAttack && (this.currentAttack.type === 'meteor' || this.currentAttack.type === 'dive' || this.currentAttack.type === 'axe' || this.currentAttack.type === 'stall_fall' || this.currentAttack.type === 'up_rush')) { if (this.vy > 30) this.vy = 30; } else { var cap = S.MAX_FALL_SPEED; if (this.actionState === 'STUN' && this.vy > cap) cap = 40; if (this.vy > cap) this.vy = cap; } if (this.actionState === 'STUN') { var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy); if (speed < 4.0) { this.vx *= S.FRICTION; this.vy += S.GRAVITY; } else { this.vx *= S.KB_FRICTION; this.vy *= S.KB_FRICTION; } } else { this.vx *= S.FRICTION; this.vy += S.GRAVITY; } if (isNaN(this.x)) this.x = 0; if (isNaN(this.y)) this.y = 0; if (isNaN(this.vx)) this.vx = 0; if (isNaN(this.vy)) this.vy = 0; this.x += this.vx; this.y += this.vy; };
window.SMA.Fighter.prototype.checkPlatforms = function (keys) { var S = window.SMA; var wasGrounded = this.isGrounded; this.isGrounded = false; this.currentPlatform = null; for (var i = 0; i < S.platforms.length; i++) { var p = S.platforms[i]; if (p.type === 'main') continue; if (!this.dropThrough) { if (this.vy >= 0 && this.y + this.h >= p.y && this.y + this.h <= p.y + 20 && this.x + this.w > p.x && this.x < p.x + p.w) { if (!keys || !keys.down) { this.y = p.y - this.h; this.vy = 0; this.isGrounded = true; this.jumps = 0; this.currentPlatform = p; break; } } } } if (!wasGrounded && this.isGrounded) { this.animScale.x = 1.3; this.animScale.y = 0.7; this.hasAirDodged = false; this.hasUpSpecial = false; } };
window.SMA.Fighter.prototype.checkLedgeGrab = function () {
    var S = window.SMA; if (this.vy > 0 && !this.isGrounded && this.ledgeCooldown <= 0 && this.actionState !== 'STUN' && this.actionState !== 'ATTACK' && this.actionState !== 'LEDGE' && this.actionState !== 'LEDGE_UP' && this.actionState !== 'LEDGE_ATK' && this.actionState !== 'LEDGE_ROLL') {
        for (var i = 0; i < S.platforms.length; i++) {
            var p = S.platforms[i]; if (p.type === 'main') {
                if (Math.abs((this.x + this.w) - p.x) < 40 && Math.abs(this.y - p.y) < 50) {
                    var ledgeInv = S.getLedgeInvincibleFrames(this.airborneFrames);
                    this.actionState = 'LEDGE'; this.chargePower = 1.0; this.ledgeGrabbed = { platform: p, dir: 'left' }; this.x = p.x - this.w; this.y = p.y; this.vx = 0; this.vy = 0; this.facingRight = true; this.invincible = ledgeInv; this.ledgeInputLock = S.LEDGE_INPUT_LOCK_FRAMES; this.airborneFrames = 0; this.hasAirDodged = false; this.hasUpSpecial = false;
                    this.stateTimer = 0; // RESET TIMER ON GRAB
                    return;
                } if (Math.abs(this.x - (p.x + p.w)) < 40 && Math.abs(this.y - p.y) < 50) {
                    var ledgeInvR = S.getLedgeInvincibleFrames(this.airborneFrames);
                    this.actionState = 'LEDGE'; this.chargePower = 1.0; this.ledgeGrabbed = { platform: p, dir: 'right' }; this.x = p.x + p.w; this.y = p.y; this.vx = 0; this.vy = 0; this.facingRight = false; this.invincible = ledgeInvR; this.ledgeInputLock = S.LEDGE_INPUT_LOCK_FRAMES; this.airborneFrames = 0; this.hasAirDodged = false; this.hasUpSpecial = false;
                    this.stateTimer = 0; // RESET TIMER ON GRAB
                    return;
                }
            }
        }
    }
};
window.SMA.Fighter.prototype.checkBounds = function () { var S = window.SMA; var b = S.getActiveBlastBounds ? S.getActiveBlastBounds() : { left: S.BLAST_LEFT, right: S.BLAST_RIGHT, top: S.BLAST_TOP, bottom: S.BLAST_BOTTOM }; var dieDir = null; var dx = this.x; var dy = this.y; if (this.y < b.top) dieDir = 'up'; else if (this.x > b.right) dieDir = 'right'; else if (this.x < b.left) dieDir = 'left'; else if (this.y > b.bottom) dieDir = 'down'; if (dieDir) this.die(dieDir, dx, dy, this.vx, this.vy); };
window.SMA.Fighter.prototype.checkSolids = function () { var S = window.SMA; for (var p of S.platforms) { if (p.type === 'main') { if (this.x < p.x + p.w && this.x + this.w > p.x && this.y < p.y + p.h && this.y + this.h > p.y) { var overlapX = (this.x + this.w / 2) - (p.x + p.w / 2); var overlapY = (this.y + this.h / 2) - (p.y + p.h / 2); var halfW = (this.w + p.w) / 2; var halfH = (this.h + p.h) / 2; var ox = halfW - Math.abs(overlapX); var oy = halfH - Math.abs(overlapY); if (ox < oy) { if (overlapX > 0) { this.x += ox; this.vx = 0; } else { this.x -= ox; this.vx = 0; } } else { if (overlapY > 0) { this.y += oy; this.vy = 0; } else { this.y -= oy; this.vy = 0; this.isGrounded = true; this.jumps = 0; this.currentPlatform = p; this.hasAirDodged = false; this.hasUpSpecial = false; } } } } } };
window.SMA.Fighter.prototype.performDodge = function (inputKeys) { var S = window.SMA; if (this.dodgeCooldown > 0) return false; if (!this.isGrounded && this.hasAirDodged) return false; this.actionState = 'DODGE'; this.stateTimer = 25; this.invincible = 20; this.dodgeCooldown = 55; var dx = 0; var dy = 0; if (inputKeys.left) dx = -1; if (inputKeys.right) dx = 1; if (inputKeys.up) dy = -1; if (inputKeys.down) dy = 1; if (dx !== 0 || dy !== 0) { var speed = 12; if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; } this.vx = dx * speed; this.vy = dy * speed; } if (!this.isGrounded) this.hasAirDodged = true; S.playSound('jump'); S.createParticles(this.x + 15, this.y + 30, 10, '#fff'); return true; };
window.SMA.Fighter.prototype.tryGrab = function (opponent) {
    var S = window.SMA;
    if (this.actionState !== 'IDLE' || !this.isGrounded) return;
    // 縺､縺九∩隧ｦ縺ｿ繝｢繝ｼ繧ｷ繝ｧ繝ｳ繧帝幕蟋具ｼ・5繝輔Ξ繝ｼ繝・・
    this.actionState = 'GRAB_ATTEMPT';
    this.stateTimer = 0;
    this.grabTarget = opponent; // 繝｢繝ｼ繧ｷ繝ｧ繝ｳ邨ゆｺ・ｾ後↓蛻､螳壹☆繧九◆繧∽ｿ晄戟
    this.vx *= 0.3;
};
window.SMA.Fighter.prototype.handleGrabbing = function (inputKeys) { if (!this.grabbedTarget) { this.actionState = 'IDLE'; return; } this.grabbedTarget.x = this.x + (this.facingRight ? 25 : -25); this.grabbedTarget.y = this.y - 5; this.stateTimer--; if (this.stateTimer > 108) return; var throwType = null; if (inputKeys.left) throwType = this.facingRight ? 'THROW_BK' : 'THROW_FW'; else if (inputKeys.right) throwType = this.facingRight ? 'THROW_FW' : 'THROW_BK'; else if (inputKeys.up) throwType = 'THROW_UP'; else if (inputKeys.down) throwType = 'THROW_DN'; else if (this.stateTimer <= 0) throwType = 'THROW_FW'; if (throwType) this.performThrow(throwType); };
window.SMA.Fighter.prototype.performThrow = function (typeStr) { var S = window.SMA; var vic = this.grabbedTarget; if (!vic) return; this.actionState = 'THROWING'; this.stateTimer = 15; var data = S.CHAR_DATA[this.charId].throws[typeStr]; vic.percent += data.dmg; var rad = data.angle * (Math.PI / 180); var force = data.kb + (vic.percent * data.scale); var vx = Math.cos(rad) * force; var vy = Math.sin(rad) * force; if (!this.facingRight) vx *= -1; vic.vx = vx; vic.vy = vy; vic.enterState('STUN', 40); vic.grabInvincible = 60; vic.chargePower = 1.0; this.grabbedTarget = null; S.createParticles(vic.x + 15, vic.y + 30, 15, '#fff'); S.shake = 10; S.updateHud(); S.playSound('hit'); };
window.SMA.Fighter.prototype.die = function (direction, dx, dy, vx, vy) { var S = window.SMA; var koColor = S.getKoPlayerColor ? S.getKoPlayerColor(this) : this.color; this.stocks--; if (this.charId === 'mirror') { this.mirror = null; this.mirrorClone = null; this.mirrorCooldown = 300; } S.updateHud(); this.chargePower = 1.0; this.hitbox.active = false; S.playSound('hit'); S.triggerComet(dx, dy, direction, koColor); S.triggerKoBlastFx(dx, dy, direction, koColor, vx, vy); S.freezeFrame = 10; this.actionState = 'DEAD'; this.percent = 0; if (this.stocks > 0) { this.actionState = 'RESPAWN'; this.respawnTimer = 90; this.x = -9999; } else { S.checkGameSet(); } };
window.SMA.Fighter.prototype.respawn = function () { var S = window.SMA; this.actionState = 'IDLE'; this.x = S.WORLD_W / 2 - this.w / 2; this.y = (S.WORLD_H * 0.7) - 300; this.vx = 0; this.vy = 0; this.percent = 0; this.shieldHP = 100; this.chargePower = 1.0; this.invincible = 180; this.isGrounded = false; this.airborneFrames = 0; this.ledgeInputLock = 0; this.hitbox.active = false; };
window.SMA.Fighter.prototype.triggerJump = function (keys) { var S = window.SMA; if (this.actionState === 'LEDGE') return; if (keys && keys.down && this.isGrounded) { if (this.currentPlatform && this.currentPlatform.type === 'main') { this.vy = S.JUMP_FORCE * 0.6; this.jumps++; this.animScale.x = 0.7; this.animScale.y = 1.3; S.playSound('jump'); return; } else { this.dropThrough = true; this.isGrounded = false; this.y += 1; return; } } var maxJ = (window.SMA.CHAR_DATA[this.charId] && window.SMA.CHAR_DATA[this.charId].maxJumps) || 2; if (this.actionState === 'IDLE' && this.jumps < maxJ) { var force = keys && keys.down ? S.JUMP_FORCE * 0.6 : S.JUMP_FORCE; var jm = S.CHAR_DATA[this.charId].jumpMult || 1.0; this.vy = force * jm; this.jumps++; this.animScale.x = 0.7; this.animScale.y = 1.3; if (this.jumps === 2) { this.vx *= 0.8; S.createParticles(this.x + this.w / 2, this.y + this.h, 10, '#fff'); } S.playSound('jump'); } };
window.SMA.Fighter.prototype.startCharge = function () {
    if (this.actionState === 'IDLE' || this.actionState === 'CHARGE') {
        // 髀｡繧ｭ繝｣繝ｩ: 竊灘・蜉帑ｸｭ縺ｪ繧牙叉蠎ｧ縺ｫmirror_place繧堤匱蜍包ｼ磯聞謚ｼ縺苓ｷ晞屬隱ｿ謨ｴ縺ｮ縺溘ａ・・
        if (this.charId === 'mirror') {
            var keys = null;
            if (this.playerRole && this.playerRole !== 'p1') {
                keys = (window.SMA.remoteKeysMap && window.SMA.remoteKeysMap[this.playerRole]) || window.SMA.remoteKeys || {};
            } else {
                keys = window.SMA.myKeys || {};
            }
            if (keys.down) {
                var S = window.SMA;
                var typeStr = this.isGrounded ? 'DOWN' : 'AIR_DOWN';
                var set = S.CHAR_DATA[this.charId].attacks;
                if (set[typeStr]) {
                    this.actionState = 'ATTACK';
                    this.currentAttack = set[typeStr];
                    this.currentAttackType = typeStr;
                    this._mirrorChibiDownVariant = (this.mirror && !this.mirror.swapped) ? 'swap' : 'summon';
                    this.chargePower = 1.0;
                    this.hasHit = false;
                    this.mirrorHasHit = false;
                    this.stateTimer = 0;
                    S.playSound('sword');
                    return;
                }
            }
        }
        this.actionState = 'CHARGE';
        this.stateTimer = 0;
        if (this.chargePower === 1.0) this.chargePower = 1.0;
    }
};
window.SMA.Fighter.prototype.releaseAttack = function (typeStr) {
    var S = window.SMA;
    if (this.actionState === 'CHARGE' || this.actionState === 'IDLE') {
        var power = this.chargePower;
        if (this.actionState === 'IDLE') power = 1.0;
        var set = S.CHAR_DATA[this.charId].attacks;
        if (!this.isGrounded) {
            if (typeStr === 'DOWN') typeStr = 'AIR_DOWN';
            else if (typeStr === 'SIDE') typeStr = 'AIR_SIDE';
            else if (typeStr === 'NEUTRAL') typeStr = 'AIR_NEUTRAL';
            else if (typeStr === 'UP' && set.AIR_UP) typeStr = 'AIR_UP';
        }
        this.actionState = 'ATTACK';
        if (set[typeStr]) this.currentAttack = set[typeStr]; else this.currentAttack = null;
        this.currentAttackType = typeStr;
        if (this.charId === 'mirror' && this.currentAttack && this.currentAttack.type === 'mirror_place') {
            this._mirrorChibiDownVariant = (this.mirror && !this.mirror.swapped) ? 'swap' : 'summon';
        } else if (this.charId === 'mirror') {
            this._mirrorChibiDownVariant = null;
        }
        this.chargePower = power; this.hasHit = false; this.mirrorHasHit = false; this._mageUpHitbox = null; this.stateTimer = 0; if (this.currentAttack) { if (this.currentAttack.type === 'arrow_shot') S.playSound('magic'); else if (this.currentAttack.type === 'shot') S.playSound('magic'); else if (this.currentAttack.type === 'fire_shot') S.playSound('magic'); else if (this.currentAttack.type === 'up_rush') S.playSound('jump'); else if (this.currentAttack.type === 'ground_shock') { } else if (this.currentAttack.type === 'boomerang' || this.currentAttack.type === 'boomerang_up') S.playSound('sword'); else if ((this.currentAttackType === 'UP' || this.currentAttackType === 'AIR_UP') && this.charId === 'mage') S.playSound('spin'); else S.playSound('sword'); }
    }
};
window.SMA.Fighter.prototype.handleAttackFrame = function () {
    var S = window.SMA; this.stateTimer++; var atk = this.currentAttack; if (!atk) return;

    // ARMOR CHECK
    if (atk.armorStart && atk.armorEnd) {
        this.superArmor = (this.stateTimer >= atk.armorStart && this.stateTimer <= atk.armorEnd);
    } else {
        this.superArmor = false;
    }
    // Hammer neutral armor matches the visible slam hit frames.
    if (this.charId === 'hammer' && this.currentAttackType === 'NEUTRAL') {
        if (this.stateTimer >= 15 && this.stateTimer <= 21) this.superArmor = true;
        else this.superArmor = false;
    }


    // *** 繧ｨ繝ｳ繧ｸ繧ｧ繝ｫ謾ｻ謦・・逅・***
    if (atk.type === 'arrow_shot') {
        if (this.stateTimer === (atk.spawnFrame || 6)) {
            var dir = this.facingRight ? 1 : -1;
            var sx = this.x + this.w / 2 + dir * 20;
            var sy = this.y + this.h * 0.35;
            var spd = atk.speed || 14;
            var r = atk.radius || 8;
            var maxDist = atk.range || 750;
            var atkScale = (atk.scale !== undefined) ? atk.scale : 0.06;
            // 繝｡繧､繝ｳ蠑ｾ・医∪縺｣縺吶＄・・- ownerRole譁ｹ蠑・
            S.projectiles.push({ x: sx, y: sy, vx: spd * dir, vy: 0, w: r * 2, h: r * 2, ownerRole: this.playerRole, dmg: Math.round(atk.dmg * this.chargePower), kb: atk.kb * this.chargePower, scale: atkScale, type: 'angel_arrow', life: Math.ceil(maxDist / spd), angle: 0, color: atk.color || '#ffe066' });
            // 繝√Ε繝ｼ繧ｸ譎・ 譁懊ａ荳翫・譁懊ａ荳九↓繧ら匱蟆・
            if (this.chargePower > 1.3) {
                var angUp = -25 * Math.PI / 180;
                var angDn = 25 * Math.PI / 180;
                S.projectiles.push({ x: sx, y: sy, vx: spd * dir * Math.cos(angUp), vy: spd * Math.sin(angUp), w: r * 1.6, h: r * 1.6, ownerRole: this.playerRole, dmg: Math.round(atk.dmg * this.chargePower * 0.8), kb: atk.kb * this.chargePower * 0.8, scale: atkScale, type: 'angel_arrow', life: Math.ceil(maxDist / spd), angle: 0, color: '#fff8c8' });
                S.projectiles.push({ x: sx, y: sy, vx: spd * dir * Math.cos(angDn), vy: spd * Math.sin(angDn), w: r * 1.6, h: r * 1.6, ownerRole: this.playerRole, dmg: Math.round(atk.dmg * this.chargePower * 0.8), kb: atk.kb * this.chargePower * 0.8, scale: atkScale, type: 'angel_arrow', life: Math.ceil(maxDist / spd), angle: 0, color: '#fff8c8' });
            }
            S.playSound('magic');
        }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.currentAttack = null; this.chargePower = 1.0; }
        return;
    }
    if (atk.type === 'wing_flap') {
        // 讓ｪA: 荳｡鄙ｼ繧貞燕譁ｹ縺ｧ謇薙■縺､縺代ｋ・育賢縺縺ｾ縺鈴｢ｨ・・
        var hitStart = 8; var hitEnd = 14;
        if (this.stateTimer >= hitStart && this.stateTimer <= hitEnd) {
            var dir = this.facingRight ? 1 : -1;
            var wingScale = 1 + Math.max(0, (this.chargePower || 1) - 1) * 0.45;
            var hitW = 120 * wingScale;
            var hitH = 75 * wingScale;
            this.hitbox.active = true;
            this.hitbox.w = hitW; this.hitbox.h = hitH;
            this.hitbox.x = this.x + this.w / 2 + dir * 30 - hitW / 2;
            this.hitbox.y = this.y + 5 - (hitH - 75) * 0.35;
        } else { this.hitbox.active = false; }
        // 遨ｺ荳ｭ讓ｪA縺ｮ閾ｪ蟾ｱ蠕梧婿繝弱ャ繧ｯ繝舌ャ繧ｯ
        if (atk.airKnockback && !this.isGrounded && this.stateTimer === hitEnd) {
            var dir = this.facingRight ? 1 : -1;
            this.vx = -dir * 18;
            this.vy = -6;
        }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.currentAttack = null; this.chargePower = 1.0; this.hitbox.active = false; }
        return;
    }
    if (atk.type === 'wing_rise') {
        // 荳晦: 遨ｺ荳ｭ縺ｧ縺ｯ逹蝨ｰ縺ｾ縺ｧ1蝗槭・縺ｿ荳頑・蜿ｯ閭ｽ縲・蝗樒岼縺ｯ萓幃､奇ｼ医Δ繝ｼ繧ｷ繝ｧ繝ｳ縺縺托ｼ・
        // 蛻晏屓繝輔Ξ繝ｼ繝縺ｧ謌仙粥/螟ｱ謨励ｒ遒ｺ螳壹＆縺帙ｋ・・ngel蟆ら畑繝輔Λ繧ｰ・・
        if (this.stateTimer === 1) {
            this._wingRiseFail = false;
            if (!this.isGrounded) {
                if (this._wingRiseUsed) {
                    this._wingRiseFail = true;
                } else {
                    this._wingRiseUsed = true;
                }
            }
        }
        var riseStart = 6; var riseEnd = 20;
        if (this.stateTimer >= riseStart && this.stateTimer <= riseEnd) {
            if (!this._wingRiseFail) {
                // 謌仙粥: 逵滉ｸ翫↓諤･荳頑・ + 謾ｻ謦・愛螳・
                this.vy = -9.6;
                this.vx *= 0.5;
                this.hitbox.active = true;
                this.hitbox.w = 110; this.hitbox.h = 70;
                this.hitbox.x = this.x + this.w / 2 - this.hitbox.w / 2;
                this.hitbox.y = this.y - 20;
            } else {
                // 萓幃､・ 繝｢繝ｼ繧ｷ繝ｧ繝ｳ縺縺大・縺ｦ驥榊鴨關ｽ荳具ｼ域判謦・愛螳壹↑縺暦ｼ・
                this.vx *= 0.8;
                this.hitbox.active = false;
            }
        } else { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.currentAttack = null; this.chargePower = 1.0; this.hitbox.active = false; }
        return;
    }
    if (atk.type === 'shockwave') {
        // 荳帰: 蜀・ｽ｢陦晄茶豕｢・井ｽ咲ｽｮ萓晏ｭ倥・蜷ｹ縺｣鬟帙・縺玲婿蜷托ｼ・
        if (atk.hover && !this.isGrounded) {
            this.vy = 0; this.vx *= 0.8;
        }
        var shockFrame = atk.shockFrame || 18;
        if (this.stateTimer === shockFrame) {
            // 陦晄茶豕｢繝偵ャ繝医ヵ繝ｬ繝ｼ繝・・蝗槭・縺ｿ蛻､螳・
            var sr = atk.shockRadius || 200;
            this.hitbox.active = true;
            this.hitbox.w = sr * 2; this.hitbox.h = sr * 2;
            this.hitbox.x = this.x + this.w / 2 - sr;
            this.hitbox.y = this.y + this.h / 2 - sr;
            // 譛繧りｿ代＞陲ｫ蠑ｾ蛟呵｣懊・菴咲ｽｮ繧偵メ繧ｧ繝・け縺励※facingRight繧貞虚逧・､画峩・亥聖縺｣鬟帙・縺玲婿蜷醍畑・・
            var myCx = this.x + this.w / 2;
            for (var si = 0; si < S.players.length; si++) {
                var sp = S.players[si];
                if (sp === this || sp.stocks <= 0 || sp.actionState === 'DEAD' || sp.invincible > 0) continue;
                var spCx = sp.x + sp.w / 2;
                var dx = spCx - myCx; var dy = (sp.y + sp.h / 2) - (this.y + this.h / 2);
                if (Math.sqrt(dx * dx + dy * dy) < sr) {
                    this.facingRight = (spCx >= myCx);
                    break;
                }
            }
            if (this.stateTimer === shockFrame) {
                S.createParticles(this.x + this.w / 2, this.y + this.h / 2, 25, '#ffe066');
                S.playSound('magic');
            }
        } else { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.currentAttack = null; this.chargePower = 1.0; this.hitbox.active = false; }
        return;
    }

    // *** 髀｡繧ｭ繝｣繝ｩ謾ｻ謦・・逅・***
    if (atk.type === 'mirror_place') {
        if (this.stateTimer === 1) {
            if (!this._mirrorChibiDownVariant) {
                this._mirrorChibiDownVariant = (this.mirror && !this.mirror.swapped) ? 'swap' : 'summon';
            }
            if (this.mirror && !this.mirror.swapped) {
                // 蜈･繧梧崛繧上ｊ: 譛ｬ菴薙→髀｡蜒上・菴咲ｽｮ繧剃ｺ､謠幢ｼ・蝗槭・縺ｿ・・
                var oldX = this.x; var oldY = this.y;
                if (this.mirrorClone) {
                    this.x = this.mirrorClone.x; this.y = this.mirrorClone.y;
                    this.facingRight = !this.facingRight;
                }
                this.mirror.swapped = true; // 莠､謠帶ｸ医∩繝輔Λ繧ｰ繧堤ｫ九※繧・
                S.createParticles(oldX + this.w / 2, oldY + this.h / 2, 15, '#81ecec');
                S.createParticles(this.x + this.w / 2, this.y + this.h / 2, 15, '#81ecec');
                S.playSound('magic');
                this.actionState = 'LAG'; this.stateTimer = 18;
                this.currentAttack = null; this.chargePower = 1.0; return;
            } else if (this.mirror && this.mirror.swapped) {
                // 譌｢縺ｫ蜈･繧梧崛繧上ｊ貂医∩縺ｮ蝣ｴ蜷医・菴輔ｂ縺励↑縺・ｼ磯升縺梧ｶ医∴繧九∪縺ｧ蠕・ｩ滂ｼ・
                this.actionState = 'LAG'; this.stateTimer = 18;
                this.currentAttack = null; this.chargePower = 1.0; return;
            } else {
                // 髀｡縺檎┌縺・ｴ蜷医・譁ｰ縺励＞髀｡繧定ｨｭ鄂ｮ縺吶ｋ
                if (this.mirrorCooldown > 0) {
                    // 繧ｯ繝ｼ繝ｫ繧ｿ繧､繝荳ｭ縺ｯ險ｭ鄂ｮ荳榊庄
                    this.actionState = 'LAG'; this.stateTimer = 8;
                    this.currentAttack = null; this.chargePower = 1.0; return;
                }
                // 髀｡險ｭ鄂ｮ髢句ｧ・ 縺｡繧・ｓ謚ｼ縺・60px
                this.mirrorPlaceRange = 60;
            }
        }
        // 髀｡縺後∪縺辟｡縺・ｴ蜷・ 髟ｷ謚ｼ縺励〒繧ｹ繝ｩ繧､繝・
        if (!this.mirror && this.stateTimer > 1) {
            // A繝懊ち繝ｳ縺梧款縺輔ｌ縺ｦ縺・ｋ髢薙∬ｨｭ鄂ｮ霍晞屬縺悟｢怜刈・域怙螟ｧ300px・・
            var keys = null;
            if (this.playerRole && this.playerRole !== 'p1') {
                keys = (S.remoteKeysMap && S.remoteKeysMap[this.playerRole]) || S.remoteKeys || {};
            } else {
                keys = S.myKeys || {};
            }
            if (keys.attack) {
                this.mirrorPlaceRange += 3.83;
                if (this.mirrorPlaceRange > 750) this.mirrorPlaceRange = 750;
                // 髟ｷ謚ｼ縺嶺ｸｭ縺ｯ繧ｿ繧､繝槭・繧貞ｻｶ髟ｷ・医・繧ｿ繝ｳ繧帝屬縺吶∪縺ｧ蠕・ｩ滂ｼ・
                if (this.stateTimer >= atk.frames - 1) this.stateTimer = atk.frames - 2;
            } else {
                // 繝懊ち繝ｳ繧帝屬縺励◆ 竊・險ｭ鄂ｮ遒ｺ螳・
                var placeX = this.x + this.w / 2 + (this.facingRight ? this.mirrorPlaceRange : -this.mirrorPlaceRange);
                // 繝励Λ繝・ヨ繝輔か繝ｼ繝縺ｮ鬮倥＆縺ｫ蜷医ｏ縺帙※險ｭ鄂ｮ
                var placeY = this.y + this.h;
                for (var pi = 0; pi < S.platforms.length; pi++) {
                    var plat = S.platforms[pi];
                    if (placeX > plat.x && placeX < plat.x + plat.w) {
                        placeY = plat.y; break;
                    }
                }
                this.mirror = { x: placeX, y: placeY, timer: 480, swapped: false };
                this.mirrorClone = {
                    x: 2 * placeX - (this.x + this.w / 2) - this.w / 2,
                    y: this.y,
                    facingRight: !this.facingRight
                };
                S.createParticles(placeX, placeY, 10, '#dfe6e9');
                S.playSound('magic');
                this.actionState = 'LAG'; this.stateTimer = atk.lag;
                this.currentAttack = null; this.chargePower = 1.0;
                return;
            }
        }
        if (this.stateTimer >= atk.frames) {
            // 繧ｿ繧､繝槭・蛻・ｌ・医・繧ｿ繝ｳ髮｢縺輔★縺ｫ繝輔Ξ繝ｼ繝蛻ｰ驕費ｼ・ 縺昴・縺ｾ縺ｾ險ｭ鄂ｮ
            if (!this.mirror) {
                var placeX = this.x + this.w / 2 + (this.facingRight ? this.mirrorPlaceRange : -this.mirrorPlaceRange);
                var placeY = this.y + this.h;
                for (var pi = 0; pi < S.platforms.length; pi++) {
                    var plat = S.platforms[pi];
                    if (placeX > plat.x && placeX < plat.x + plat.w) {
                        placeY = plat.y; break;
                    }
                }
                this.mirror = { x: placeX, y: placeY, timer: 480, swapped: false };
                this.mirrorClone = {
                    x: 2 * placeX - (this.x + this.w / 2) - this.w / 2,
                    y: this.y,
                    facingRight: !this.facingRight
                };
                S.createParticles(placeX, placeY, 10, '#dfe6e9');
                S.playSound('magic');
            }
            this.actionState = 'LAG'; this.stateTimer = atk.lag;
            this.currentAttack = null; this.chargePower = 1.0;
        }
        return;
    }
    if (atk.type === 'mirror_slash') {
        var p = this.chargePower || 1.0;
        var szMult = (p - 1.0) / 0.7 * 0.2 + 1.0;
        var range = (atk.range || 50) * szMult;
        if (this.stateTimer >= 3 && this.stateTimer <= 8) {
            this.hitbox.active = true; this.hitbox.w = range * 1.25; this.hitbox.h = 25 * szMult * 1.25;
            this.hitbox.x = this.x + (this.facingRight ? 15 : -15 - range) + this.w / 2;
            this.hitbox.y = this.y + 20 - (this.hitbox.h - 25) / 2;
        } else { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; }
        return;
    }
    if (atk.type === 'mirror_throw_up') {
        // 荳晦: 鬆ｭ荳翫↓髀｡繧呈兜縺偵※蝗櫁ｻ｢・育洒蟆・ｨ九・荳頑婿蜷大愛螳夲ｼ・
        var p = this.chargePower || 1.0;
        var chargeRatio = Math.max(0, (p - 1.0) / 0.7);
        if (this.stateTimer >= 4 && this.stateTimer <= 18) {
            this.hitbox.active = true;
            this.hitbox.w = 56; this.hitbox.h = 62;
            this.hitbox.x = this.x + this.w / 2 - 22;
            this.hitbox.y = this.y - 45;

            // 縺溘ａ驥上↓蠢懊§縺ｦ霄ｫ髟ｷ縺ｮ蜊雁・縺ｮ霍晞屬繧剃ｸ頑・
            var upMove = ((this.h / 2) * chargeRatio) / 15;
            this.y -= upMove;
            this.vy = 0; // 驥榊鴨縺ｧ關ｽ縺｡縺ｪ縺・ｈ縺・↓逶ｸ谿ｺ
        } else { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; }
        return;
    }
    if (atk.type === 'mirror_throw') {
        // 讓ｪA: 蜑肴婿縺ｫ髀｡繧呈兜縺偵※蝗櫁ｻ｢・亥愛螳壼ｼｷ蛹・ 蟷・5, 鬮倥＆70・・
        var p = this.chargePower || 1.0;
        var chargeRatio = Math.max(0, (p - 1.0) / 0.7);
        var szMult = chargeRatio * 0.2 + 1.0;
        var curW = 105 * szMult; var curH = 70 * szMult;
        if (this.stateTimer >= 4 && this.stateTimer <= 18) {
            this.hitbox.active = true;
            this.hitbox.w = curW; this.hitbox.h = curH;
            this.hitbox.x = this.x + (this.facingRight ? -5 : -5 - curW) + this.w / 2;
            this.hitbox.y = this.y + 35 - curH / 2;

            // 縺溘ａ驥上↓蠢懊§縺ｦ蜑肴婿縺ｫ繧ｭ繝｣繝ｩ荳菴灘・・・his.w・牙燕騾ｲ
            var fwMove = (this.w * chargeRatio) / 15;
            this.x += this.facingRight ? fwMove : -fwMove;
        } else { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; }
        return;
    }
    if (atk.type === 'mirror_spin') {
        var p = this.chargePower || 1.0;
        var szMult = (p - 1.0) / 0.7 * 0.2 + 1.0;
        var curSz = 100 * szMult;
        if (this.stateTimer >= 4 && this.stateTimer <= 20) {
            this.hitbox.active = true; this.hitbox.w = curSz; this.hitbox.h = curSz;
            this.hitbox.x = this.x + this.w / 2 - curSz / 2; this.hitbox.y = this.y + this.h / 2 - curSz / 2;
        } else { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; }
        return;
    }
    if (atk.type === 'mirror_triple' || atk.type === 'mirror_triple_hit3') {
        var hit1S = 4, hit1E = 8, hit2S = 12, hit2E = 16, hit3S = 20, hit3E = 25;
        if (this.stateTimer >= hit1S && this.stateTimer <= hit1E) {
            this.hitbox.active = true; this.hitbox.w = 55; this.hitbox.h = 20;
            this.hitbox.x = this.x + (this.facingRight ? 20 : -20 - 55) + this.w / 2; this.hitbox.y = this.y + 25;
        } else if (this.stateTimer === hit2S) {
            this.hasHit = false;
            this.hitbox.active = true; this.hitbox.w = 60; this.hitbox.h = 20;
            this.hitbox.x = this.x + (this.facingRight ? 25 : -25 - 60) + this.w / 2; this.hitbox.y = this.y + 25;
        } else if (this.stateTimer > hit2S && this.stateTimer <= hit2E) {
            this.hitbox.active = true;
        } else if (this.stateTimer === hit3S) {
            this.hasHit = false;
            this.currentAttack = { type: 'mirror_triple_hit3', dmg: atk.hit3_dmg || 6, kb: atk.hit3_kb || 2.8, scale: atk.hit3_scale || 0.1, angle: atk.hit3_angle || -40, stun: atk.hit3_stun || 8, frames: atk.frames, lag: atk.lag, color: atk.color };
            this.hitbox.active = true; this.hitbox.w = 65; this.hitbox.h = 25;
            this.hitbox.x = this.x + (this.facingRight ? 30 : -30 - 65) + this.w / 2; this.hitbox.y = this.y + 20;
        } else if (this.stateTimer > hit3S && this.stateTimer <= hit3E) {
            this.hitbox.active = true;
        } else { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; }
        return;
    }

    // *** MAGE PROJECTILE LOGIC ***
    if (atk.type === 'shot' || atk.type === 'fire_shot') {
        if (this.stateTimer === atk.spawnFrame) {
            // v379: Charge speed logic (up to 1.75x)
            var speedMult = 1.0;
            if (this.chargePower > 1.0) {
                // chargePower max is 1.7. Map 1.0->1.7 to 1.0->1.75 speed multiplier
                var rawCharge = this.chargePower - 1.0; // 0 to 0.7
                // 0.7 * X = 0.75 => X = 1.0714
                speedMult = 1.0 + (rawCharge * 1.0714);
            }
            var baseSpeed = (atk.speed || 10);
            // For fire_shot, logic is inside the if block below, but let's apply speedMult generally if possible?
            // No, fire_shot has specific speed. 'shot' uses atk.speed.

            var vx = (baseSpeed * speedMult) * (this.facingRight ? 1 : -1);
            var vy = 0;

            // SIZE LOGIC
            var baseR = atk.radius || 20;
            var sizeMult = 1.0;
            if (atk.type === 'shot') sizeMult = this.chargePower;
            var r = baseR * sizeMult;

            var p = {
                x: this.x + this.w / 2 + (this.facingRight ? 20 : -20),
                y: this.y + 30,
                vx: vx,
                vy: vy,
                w: r * 2,
                h: r * 2,
                ownerRole: this.playerRole,
                dmg: atk.dmg,
                kb: atk.kb,
                scale: (atk.scale !== undefined) ? atk.scale : 0.1, // FIX: Pass scale property!
                type: 'magic',
                life: 60,
                maxLife: 60,
                age: 0,
                color: '#73f1bf'
            };
            if (atk.type === 'shot') {
                var visualW = r >= 22.5
                    ? Math.max(120, Math.min(270, (r * 2) * 3.15))
                    : Math.max(46, Math.min(104, (r * 2) * 2.7));
                var visualH = visualW * 0.72;
                var frontExtend = Math.max(0, visualW / 2 - r);
                p.hitW = (r * 2) + frontExtend;
                p.hitH = Math.max(r * 2, visualH * (r >= 22.5 ? 0.58 : 0.82));
                p.hitOffsetX = (this.facingRight ? 1 : -1) * (frontExtend / 2);
            }
            if (atk.type === 'fire_shot') {
                p.type = 'fire';
                p.color = '#e17055';
                // 30 degrees down
                // v378: Apply speedMult to fire shot too? User said "NA and Side A".
                // Fire shot is DOWN A. User didn't ask for Down A speed change.
                // User said "Mage NA and Side A... charge... speed up".
                // Down A is Fire Shot. Side A is normal shot (same as NA but stronger).
                // Wait, Side A is `type: 'shot'`. NA is `type: 'shot'`.
                // So the `vx` calculation above already handles NA and Side A!
                // Fire Shot (Down A) uses its own logic below. I should NOT apply speedMult there unless requested.
                // User said "NA and Side A". So Down A remains same.

                var speed = 8.0;
                var rad = 30 * Math.PI / 180;
                p.vx = Math.cos(rad) * speed * (this.facingRight ? 1 : -1);
                p.vy = Math.sin(rad) * speed;

                // v373: Adjust spawn pos (y+20, chest/shoulder level)
                p.y = this.y + 20;
                // Adjust X forward
                p.x = this.x + this.w / 2 + (this.facingRight ? 45 : -45);
                var fireW = Math.max(56, Math.min(104, Math.max(p.w || 0, p.h || 0) * 4.2));
                var fireH = fireW * 0.68;
                p.hitW = fireW * 0.58;
                p.hitH = fireH * 0.58;
                p.hitOffsetX = (this.facingRight ? 1 : -1) * (Math.max(0, fireW / 2 - r) * 0.16);
            }
            S.projectiles.push(p);
        }
        if (this.stateTimer >= atk.frames) {
            this.actionState = 'LAG'; this.stateTimer = atk.lag;
            this.currentAttack = null;
            this.chargePower = 1.0; // FIX: RESET CHARGE POWER
        }
        return;
    }

    // *** SPEAR LOGIC UPDATED ***
    if (atk.type === 'boomerang' || atk.type === 'boomerang_up' || atk.type === 'boomerang_down') {
        if (this.stateTimer === 5) {
            var cp = this.chargePower || 1.0; // Charge scaling
            var startX = this.x + this.w / 2 + (this.facingRight ? 20 : -20);
            var startY = this.y + 30;
            var vx = (this.facingRight ? 16 : -16) * cp;
            var vy = 0;
            if (atk.type === 'boomerang_up') {
                vx = 0;
                vy = -16 * cp;
                startX = this.x + this.w / 2;
                startY = this.y;
            }
            if (atk.type === 'boomerang_down') { // NEW AIR DOWN
                vx = 0;
                vy = 16 * cp;
                startX = this.x + this.w / 2;
                startY = this.y + 50;
            }
            // FIX: Pass scale
            var atkScale = (atk.scale !== undefined) ? atk.scale : 0.1;
            S.projectiles.push({ x: startX, y: startY, vx: vx, vy: vy, w: 40, h: 40, ownerRole: this.playerRole, dmg: atk.dmg, kb: atk.kb, scale: atkScale, type: 'spear_throw', life: 60, angle: 0, color: atk.color, particleColor: '#050505' });
        }
        if (this.stateTimer >= atk.frames) {
            this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0;
            this.currentAttack = null; // FORCE CLEAR for safety
        } return;
    }
    if (atk.type === 'earthquake') {
        if (this.stateTimer === 20) {
            S.createParticles(this.x + this.w / 2, this.y + this.h, 20, '#dfe6e9');
            S.playSound('special');
            S.shake = 20;
            this.hitbox.active = true; this.hitbox.w = 200; this.hitbox.h = 40; this.hitbox.x = this.x + this.w / 2 - 100; this.hitbox.y = this.y + this.h - 20;
        } else if (this.stateTimer > 25) { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) {
            this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false;
            this.currentAttack = null;
        } return;
    }
    if (atk.type === 'spin_hammer') {
        if (this.stateTimer === 1) this.vx = (this.facingRight ? 6.4 : -6.4); // 蜑埼ｲ霍晞屬80%縺ｫ邵ｮ蟆・
        if (this.stateTimer % 10 === 0 && this.stateTimer < 40) {
            this.hitbox.active = true; this.hitbox.w = 105; this.hitbox.h = 80; this.hitbox.x = this.facingRight ? this.x + this.w / 2 - 5 : this.x + this.w / 2 + 5 - this.hitbox.w; this.hitbox.y = this.y;
            this.hasHit = false; // Multi hit reset
            S.playSound('sword');
        } else { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) {
            this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false;
            this.currentAttack = null;
        } return;
    }
    if (atk.type === 'hammer_spin_air') {
        // Single hit (5-35): shrink area to 25% (120x120 -> 60x60) and shift center slightly downward.
        if (this.stateTimer >= 5 && this.stateTimer <= 35) {
            this.hitbox.active = true;
            this.hitbox.w = 60;
            this.hitbox.h = 70;
            this.hitbox.x = this.x + this.w / 2 - 30;
            this.hitbox.y = this.y + this.h / 2 - 10;
            // No hasHit reset (single hit)
        } else { this.hitbox.active = false; }

        if (this.stateTimer >= atk.frames) {
            this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false;
            this.rotation = 0;
            this.currentAttack = null; // Clear attack data
        } return;
    }
    if (atk.type === 'tornado') {
        // Horizontal Spin around Y-axis (Dedede Tornado)
        var spd = 2.0;
        if (window.SMA.myKeys.left && (this.role === 'p1' || !window.SMA.isOnline)) this.vx = -spd;
        else if (window.SMA.myKeys.right && (this.role === 'p1' || !window.SMA.isOnline)) this.vx = spd;
        else if (window.SMA.remoteKeys.left && this.role === 'p2' && window.SMA.isOnline) this.vx = -spd;
        else if (window.SMA.remoteKeys.right && this.role === 'p2' && window.SMA.isOnline) this.vx = spd;

        // Hit frequency 8F, but START at 15F
        if (this.stateTimer >= 15 && this.stateTimer % 8 === 0) {
            this.hitbox.active = true; this.hitbox.w = 160; this.hitbox.h = 60; this.hitbox.x = this.x + this.w / 2 - 80; this.hitbox.y = this.y + 20;
            this.hasHit = false;
            S.playSound('sword');
        } else { this.hitbox.active = false; }

        if (this.stateTimer >= atk.frames) {
            this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false;
            this.currentAttack = null;
        } return;
    }
    if (atk.type === 'ground_shock') {
        if (this.stateTimer === 10) {
            var startY = this.y + 50;
            var baseX = this.x + this.w / 2;
            // FIX: Pass scale
            var atkScale = (atk.scale !== undefined) ? atk.scale : 0.1;
            var spawnSpearShockwave = function (dir) {
                S.projectiles.push({ x: baseX + dir * 30, y: startY, vx: dir * 10, vy: 0, w: 40, h: 30, hitW: 115, hitH: 30, hitOffsetX: dir * 37.5, ownerRole: this.playerRole, dmg: atk.dmg, kb: atk.kb, scale: atkScale, type: 'shockwave', life: 30, color: '#ffeaa7', visualKind: 'spear_ground_shock' });
            }.bind(this);
            spawnSpearShockwave(this.facingRight ? 1 : -1);
            spawnSpearShockwave(this.facingRight ? -1 : 1);
            S.playSound('special');
            S.shake = 10;
        }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.currentAttack = null; } return;
    }
    if (atk.type === 'up_rush') {
        if (this.stateTimer === 1) { this.vy = -18; this.hasUpSpecial = true; S.createParticles(this.x + this.w / 2, this.y + this.h, 10, atk.color); S.playSound('jump'); }
        if (this.stateTimer >= 2 && this.stateTimer <= 20) { this.hitbox.active = true; this.hitbox.w = 40; this.hitbox.h = 80; this.hitbox.x = this.x - 5; this.hitbox.y = this.y - 40; } else { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return;
    }
    if (atk.type === 'stall_fall') {
        if (this.stateTimer === 1) { this.vy = 25; S.createParticles(this.x + this.w / 2, this.y, 5, '#fff'); }
        if (this.isGrounded) { this.hitbox.active = false; this.currentAttack = null; this.chargePower = 1.0; this.enterState('LAG', 25); S.createParticles(this.x + this.w / 2, this.y + this.h, 20, '#fff'); S.shake = 5; return; }
        this.hitbox.active = true; this.hitbox.shape = 'box'; this.hitbox.w = 80; this.hitbox.h = 80; this.hitbox.x = this.x - 25; this.hitbox.y = this.y + 40; return;
    }
    if (atk.type === 'crouch_spin') {
        if (this.stateTimer >= 5 && this.stateTimer <= 15) { this.hitbox.active = true; this.hitbox.w = 120; this.hitbox.h = 60; this.hitbox.x = this.x + (this.facingRight ? 20 : -140) + this.w / 2; this.hitbox.y = this.y + 20; } else { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return;
    }
    if (atk.type === 'poke' || atk.type === 'long_poke') {
        var range = atk.range || 60;
        if (this.stateTimer >= 4 && this.stateTimer <= 14) { this.hitbox.active = true; this.hitbox.w = range; this.hitbox.h = 20; this.hitbox.x = this.x + (this.facingRight ? 20 : -20 - range) + this.w / 2; this.hitbox.y = this.y + 20; } else { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return;
    }
    if (atk.type === 'anti_air') {
        if (this.stateTimer >= 6 && this.stateTimer <= 16) { this.hitbox.active = true; this.hitbox.w = 50; this.hitbox.h = 50; this.hitbox.x = this.x + (this.facingRight ? 10 : -60); this.hitbox.y = this.y - 20; } else { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return;
    }
    if (atk.type === 'double_poke') {
        if ((this.stateTimer >= 5 && this.stateTimer <= 10) || (this.stateTimer >= 20 && this.stateTimer <= 25)) { this.hitbox.active = true; this.hitbox.w = 60; this.hitbox.h = 20; var isSecond = this.stateTimer >= 20; var dir = isSecond ? !this.facingRight : this.facingRight; this.hitbox.x = this.x + (dir ? 20 : -20 - 60) + this.w / 2; this.hitbox.y = this.y + 20; } else { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return;
    }
    if (atk.type === 'axe') {
        // v390: Slowed down by 1F (13-19) - 1F faster than original, 1F slower than v389
        if (this.stateTimer >= 13 && this.stateTimer <= 19) {
            this.hitbox.active = true;
            this.hitbox.w = 60;
            this.hitbox.h = 80;
            this.hitbox.x = this.facingRight ? this.x + 10 : this.x + this.w - 10 - this.hitbox.w;
            this.hitbox.y = this.y;
        } else { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; }
        return;
    }
    if (atk.type === 'blast') { if (this.stateTimer === 15) { S.createParticles(this.x + (this.facingRight ? 50 : -20), this.y + 20, 20, '#e67e22'); S.playSound('special'); } if (this.stateTimer >= 15 && this.stateTimer <= 25) { this.hitbox.active = true; this.hitbox.w = 80 * (1 + (this.chargePower - 1)); this.hitbox.h = 80 * (1 + (this.chargePower - 1)); this.hitbox.x = this.x + (this.facingRight ? 20 : -20 - this.hitbox.w); this.hitbox.y = this.y - 10; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return; } if (atk.type === 'lunge') { if (this.stateTimer > 5 && this.stateTimer < 15) { var spd = (this.chargePower - 1.0) * 22; if (spd < 0) spd = 0; this.vx = this.facingRight ? spd : -spd; } var startFrame = Math.floor(atk.frames * 0.2); var endFrame = Math.floor(atk.frames * 0.8); if (this.stateTimer >= startFrame && this.stateTimer <= endFrame) { this.hitbox.active = true; this.hitbox.shape = 'box'; this.hitbox.w = 80; this.hitbox.h = 40; this.hitbox.x = this.x + (this.facingRight ? 20 : -70); this.hitbox.y = this.y + 20; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.hitbox.active = false; this.currentAttack = null; this.chargePower = 1.0; this.enterState('LAG', atk.lag); } return; } if (atk.type === 'dive') { if (this.stateTimer === 1) { this.vx = this.facingRight ? 15 : -15; this.vy = 20; S.createParticles(this.x + this.w / 2, this.y, 5, '#fff'); } if (this.isGrounded) { this.hitbox.active = false; this.currentAttack = null; this.chargePower = 1.0; this.enterState('LAG', 30); S.createParticles(this.x + this.w / 2, this.y + this.h, 20, '#fff'); S.shake = 5; return; } this.hitbox.active = true; this.hitbox.shape = 'box'; this.hitbox.w = 50; this.hitbox.h = 60; this.hitbox.x = this.x - 10; this.hitbox.y = this.y + 50; return; } if (atk.type === 'shoryu') { if (this.stateTimer === 3) { this.vy = -8; S.createParticles(this.x + this.w / 2, this.y + this.h, 10, '#e74c3c'); } if (this.stateTimer >= 3 && this.stateTimer <= 15) { this.hitbox.active = true; this.hitbox.w = 60; this.hitbox.h = 80; this.hitbox.x = this.x - 15; this.hitbox.y = this.y - 40; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return; } if (atk.type === 'axe') { if (this.stateTimer >= 14 && this.stateTimer <= 20) { this.hitbox.active = true; this.hitbox.w = 100; this.hitbox.h = 100; this.hitbox.x = this.x + (this.facingRight ? 10 : -80); this.hitbox.y = this.y; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return; } if (atk.type === 'blast') { if (this.stateTimer === 15) { S.createParticles(this.x + (this.facingRight ? 50 : -20), this.y + 20, 20, '#e67e22'); S.playSound('special'); } if (this.stateTimer >= 15 && this.stateTimer <= 25) { this.hitbox.active = true; this.hitbox.w = 80 * (1 + (this.chargePower - 1)); this.hitbox.h = 80 * (1 + (this.chargePower - 1)); this.hitbox.x = this.x + (this.facingRight ? 20 : -20 - this.hitbox.w); this.hitbox.y = this.y - 10; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return; } if (atk.type === 'low_kick') { var startFrame = Math.floor(atk.frames * 0.2); var endFrame = Math.floor(atk.frames * 0.8); if (this.stateTimer >= startFrame && this.stateTimer <= endFrame) { this.hitbox.active = true; this.hitbox.w = 76; this.hitbox.h = 30; this.hitbox.x = this.facingRight ? this.x + 10 : this.x + this.w - 10 - this.hitbox.w; this.hitbox.y = this.y + this.h - 10; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return; } if (atk.type === 'sex_kick') { if (this.stateTimer >= 4 && this.stateTimer <= 21) { this.hitbox.active = true; this.hitbox.w = 68; this.hitbox.h = 55; this.hitbox.x = this.x + this.w / 2 - this.hitbox.w / 2 + (this.facingRight ? 18 : -18); this.hitbox.y = this.y + 6; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return; } if (atk.type === 'sweep') { var startFrame = Math.floor(atk.frames * 0.2); var endFrame = Math.floor(atk.frames * 0.8); if (this.stateTimer >= startFrame && this.stateTimer <= endFrame) { this.hitbox.active = true; this.hitbox.w = 100; this.hitbox.h = 30; this.hitbox.x = this.x + (this.facingRight ? 10 : -80); this.hitbox.y = this.y + this.h - 20; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return; } if (atk.type === 'slide') { var startFrame = Math.floor(atk.frames * 0.2); var endFrame = Math.floor(atk.frames * 0.8); if (this.stateTimer === 1) { this.vx = 9.6 * (this.facingRight ? 1 : -1); S.createParticles(this.x + this.w / 2, this.y + this.h, 5, '#fff'); } if (this.stateTimer >= startFrame && this.stateTimer <= endFrame) { this.hitbox.active = true; this.hitbox.shape = 'box'; this.hitbox.w = 90; this.hitbox.h = 30; var offX = this.facingRight ? 10 : -90; this.hitbox.x = this.x + this.w / 2 + offX; this.hitbox.y = this.y + this.h - 20; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.hitbox.active = false; this.currentAttack = null; this.chargePower = 1.0; this.enterState('LAG', atk.lag); } return; } if (atk.type === 'meteor') {
        if (this.stateTimer === 1) {
            this.vy = 12; // FIXED SPEED
            S.createParticles(this.x + this.w / 2, this.y, 5, '#fff');
        }
        if (this.isGrounded) { this.hitbox.active = false; this.currentAttack = null; this.chargePower = 1.0; this.enterState('LAG', 30); S.createParticles(this.x + this.w / 2, this.y + this.h, 20, '#fff'); S.shake = 5; return; }
        this.hitbox.active = true; this.hitbox.shape = 'box'; this.hitbox.w = 50; this.hitbox.h = 60; this.hitbox.x = this.x - 10; this.hitbox.y = this.y + 50; return;
    }

    var mageUpAttack = this.charId === 'mage' && (this.currentAttackType === 'UP' || this.currentAttackType === 'AIR_UP');
    var mageUpStart = Math.floor(atk.frames * 0.2) + 4;
    if (mageUpAttack && this.stateTimer === mageUpStart) {
        this._mageUpHitbox = { x: this.x + this.w / 2, y: this.y - 68, scale: S.getMageUpChargeScale(this.chargePower) };
        S.spawnMageVfx('overhead_explosion', this._mageUpHitbox.x, this._mageUpHitbox.y, { life: 18, scale: this._mageUpHitbox.scale });
    }

    var start = Math.floor(atk.frames * 0.2); var end = Math.floor(atk.frames * (atk.frames > 100 ? 0.1 : 0.6)); if (mageUpAttack) { start = mageUpStart; end += 4; } if (this.stateTimer >= start && this.stateTimer <= end) {
        this.hitbox.active = true; var scale = 1 + (this.chargePower - 1.0) * 0.5; this.hitbox.w = (atk.radius ? atk.radius * 2 : 70) * scale; this.hitbox.h = this.hitbox.w; if (this.currentAttackType === 'UP' || this.currentAttackType === 'AIR_UP') {
            if (this.charId === 'mage') {
                var mageUpAnchor = this._mageUpHitbox || { x: this.x + this.w / 2, y: this.y - 68, scale: S.getMageUpChargeScale(this.chargePower) };
                var mageUpSize = 108 * mageUpAnchor.scale;
                this.hitbox.w = mageUpSize;
                this.hitbox.h = mageUpSize;
                this.hitbox.x = mageUpAnchor.x - mageUpSize / 2;
                this.hitbox.y = mageUpAnchor.y - mageUpSize / 2;
            } else if (this.charId === 'hammer') {
                // Hammer up attack follows the visible overhead arc.
                if (this.stateTimer >= 15 && this.stateTimer <= 21) {
                    this.hitbox.active = true;
                    this.hitbox.w = 140 * scale; this.hitbox.h = 100 * scale;
                    this.hitbox.x = this.x + this.w / 2 - 70;
                    this.hitbox.y = this.y - 70;
                } else { this.hitbox.active = false; }
                return;
            } else { this.hitbox.w = 80 * scale; this.hitbox.h = 80 * scale; this.hitbox.x = this.x + (this.facingRight ? -10 : -40); this.hitbox.y = this.y - 40; }
        } else if (this.currentAttackType === 'SIDE') {
            this.hitbox.w = 80 * scale; this.hitbox.h = 70 * scale;
            if (this.charId === 'sword') {
                this.hitbox.w = 95 * scale;
                this.hitbox.x = this.x + (this.facingRight ? 5 : -5 - this.hitbox.w) + this.w / 2;
            } else {
                this.hitbox.x = this.x + (this.facingRight ? 20 : -20 - this.hitbox.w) + this.w / 2;
            }
            this.hitbox.y = this.y - 10;
        } else if (this.charId === 'hammer' && this.currentAttackType === 'NEUTRAL') {
            if (this.stateTimer >= 15 && this.stateTimer <= 21) {
                this.hitbox.active = true;
                this.hitbox.w = 90 * scale; this.hitbox.h = 100 * scale;
                this.hitbox.x = this.x + this.w / 2 + (this.facingRight ? -10 : 10 - this.hitbox.w);
                this.hitbox.y = this.y - 20;
                this.superArmor = true;
            } else { this.hitbox.active = false; }
            return;
        } else if (this.currentAttackType === 'NEUTRAL') {
            this.hitbox.w = 60 * scale; this.hitbox.h = 30 * scale;
            if (this.charId === 'sword') {
                this.hitbox.w = 80 * scale;
                this.hitbox.x = this.x + (this.facingRight ? 5 : -5 - this.hitbox.w) + this.w / 2;
            } else {
                this.hitbox.x = this.x + (this.facingRight ? 25 : -25 - this.hitbox.w) + this.w / 2;
            }
            this.hitbox.y = this.y + 25;
        } else if ((this.currentAttackType === 'DOWN' || this.currentAttackType === 'AIR_DOWN') && this.charId === 'mage') { if (this.charId === 'mage') { } else { this.hitbox.w = 80 * scale; this.hitbox.h = 30 * scale; this.hitbox.x = this.x + (this.facingRight ? -10 : -40); this.hitbox.y = this.y + 40; } } else if (this.currentAttackType === 'NEUTRAL' && this.charId === 'brawler') { this.hitbox.w = 40; this.hitbox.h = 30; this.hitbox.x = this.x + (this.facingRight ? 25 : -65); this.hitbox.y = this.y + 25; } else if (this.charId === 'hammer' && this.currentAttackType === 'AIR_SIDE') {
            // Vertical Chop
            if (this.stateTimer >= 10 && this.stateTimer <= 14) {
                this.hitbox.active = true;
                this.hitbox.w = 80 * scale; this.hitbox.h = 100 * scale;
                this.hitbox.x = this.x + (this.facingRight ? 20 : -20 - this.hitbox.w) + this.w / 2;
                this.hitbox.y = this.y - 20;
            } else { this.hitbox.active = false; }
            return;
        } else if (this.currentAttack.type === 'tornado') {
            // Tornado Hitbox logic is in update, but if needed here:
            // Covered in Update.
            return;
        } else if (this.currentAttack.type === 'slash_down') {
            // Sword Air Down Hitbox - CENTERED and LOW
            this.hitbox.active = true;
            this.hitbox.w = 40;
            this.hitbox.h = 80;
            this.hitbox.x = this.x + (this.w - this.hitbox.w) / 2; // Center horizontally
            this.hitbox.y = this.y + 40; // Start from legs/knees and go down
        } else if (this.currentAttackType === 'AIR_NEUTRAL' && this.charId === 'sword') {
            this.hitbox.w = 90 * scale;
            this.hitbox.h = 90 * scale;
            this.hitbox.x = this.x + this.w / 2 - this.hitbox.w / 2;
            this.hitbox.y = this.y + this.h / 2 - this.hitbox.h / 2;
        } else { this.hitbox.x = this.x + (this.facingRight ? 20 : -20 - this.hitbox.w) + this.w / 2; this.hitbox.y = this.y + 20; }
    } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) {
        this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false;
        this.currentAttack = null; // FORCE CLEAR for safety
    }
};
window.SMA.Fighter.prototype.drawTrident = function (ctx, x, y, angleDeg, color, tipColor) {
    window.SMA.drawTrident(ctx, x, y, angleDeg, color, tipColor);
};
window.SMA.Fighter.prototype.drawSword = function (ctx, cx, cy, angleDeg) {
    if (this.charId === 'mage') { ctx.save(); ctx.translate(cx, cy); ctx.rotate(angleDeg * Math.PI / 180); ctx.fillStyle = "#8e44ad"; ctx.fillRect(-2, -5, 4, 15); var orbColor = this.chargePower > 1.2 ? '#fff' : "#a29bfe"; if (this.chargePower > 1.2) { ctx.shadowBlur = 10; ctx.shadowColor = "#fff"; } ctx.fillStyle = orbColor; ctx.beginPath(); ctx.arc(0, -60, 8, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = "#555"; ctx.fillRect(-2, -55, 4, 50); ctx.restore(); } else if (this.charId === 'angel') {
        // 繧ｨ繝ｳ繧ｸ繧ｧ繝ｫ: 蠑薙・謠冗判
        ctx.save(); ctx.translate(cx, cy);
        ctx.rotate(angleDeg * Math.PI / 180);
        ctx.strokeStyle = '#c89b3c'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, -30, 25, -0.8, 0.8); ctx.stroke();
        ctx.fillStyle = this.chargePower > 1.2 ? '#fff' : '#ffe066';
        if (this.chargePower > 1.2) { ctx.shadowBlur = 8; ctx.shadowColor = '#ffe066'; }
        ctx.fillRect(-1, -55, 2, 50); // 蠑ｦ
        ctx.shadowBlur = 0;
        ctx.restore();
    } else if (this.charId === 'brawler') { } else {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(angleDeg * Math.PI / 180); var s = 0.8 * (1 + (this.chargePower - 1) * 0.5); ctx.scale(0.8, s); var bladeColor = this.chargePower > 1.2 ? '#fff' : (this.isP2 ? "#74b9ff" : "#ff7675"); var glow = this.chargePower > 1.2 ? 10 : 0; ctx.fillStyle = "#333"; ctx.fillRect(-2, -5, 4, 15); ctx.fillStyle = "#ffd700"; ctx.fillRect(-8, -5, 16, 4); ctx.fillStyle = bladeColor; if (glow) { ctx.shadowBlur = glow; ctx.shadowColor = bladeColor; } ctx.beginPath(); ctx.moveTo(-3, -5); ctx.lineTo(-3, -60); ctx.lineTo(0, -70); ctx.lineTo(3, -60); ctx.lineTo(3, -5); ctx.fill(); ctx.restore();
    }
};
window.SMA.spriteAssets = window.SMA.spriteAssets || {};
window.SMA.getSpriteAsset = function (key, src) {
    var img = window.SMA.spriteAssets[key];
    if (!img || img._smaSrc !== src) {
        img = new Image();
        img._smaSrc = src;
        img.src = src;
        window.SMA.spriteAssets[key] = img;
    }
    return img;
};
window.SMA.STAGE_ASSETS = {
    battlefieldBg: { key: 'stage_battlefield_bg_mobile_v1', src: 'assets/stages/battlefield_background_mobile.png?v=1' },
    battlefieldMain: { key: 'stage_battlefield_main_platform_v1', src: 'assets/stages/battlefield_platform_main.png?v=1' },
    battlefieldSmallWide: { key: 'stage_battlefield_small_wide_surface_v2', src: 'assets/stages/battlefield_platform_small_wide_surface_v2.png?v=2' },
    battlefieldSmallShort: { key: 'stage_battlefield_small_short_surface_v2', src: 'assets/stages/battlefield_platform_small_short_surface_v2.png?v=2' },
    finalBg: { key: 'stage_final_bg_mobile_v2', src: 'assets/stages/final_background_mobile.png?v=2' },
    dayBg: { key: 'stage_day_bg_mobile_v1', src: 'assets/stages/day_background_mobile.png?v=1' },
    dayMain: { key: 'stage_day_main_platform_v1', src: 'assets/stages/day_platform_main.png?v=1' },
    dayFloat: { key: 'stage_day_float_surface_v1', src: 'assets/stages/day_platform_float_surface.png?v=1' },
    finalMain: { key: 'stage_final_main_platform_v1', src: 'assets/stages/final_platform_main.png?v=1' }
};
window.SMA.drawStageImageCover = function (ctx, asset, x, y, w, h) {
    var img = asset && window.SMA.getSpriteAsset ? window.SMA.getSpriteAsset(asset.key, asset.src) : null;
    if (!img || !img.complete || !img.naturalWidth) return false;
    var scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    var dw = img.naturalWidth * scale;
    var dh = img.naturalHeight * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    return true;
};
window.SMA.drawBattlefieldMainPlatformArt = function (ctx, plat) {
    var asset = window.SMA.STAGE_ASSETS && window.SMA.STAGE_ASSETS.battlefieldMain;
    var img = asset && window.SMA.getSpriteAsset ? window.SMA.getSpriteAsset(asset.key, asset.src) : null;
    if (!img || !img.complete || !img.naturalWidth) return false;
    var drawW = plat.w * 1.03;
    var drawH = drawW * img.naturalHeight / img.naturalWidth;
    ctx.drawImage(img, plat.x - (drawW - plat.w) / 2, plat.y - 25, drawW, drawH);
    return true;
};
window.SMA.drawFinalMainPlatformArt = function (ctx, plat) {
    var asset = window.SMA.STAGE_ASSETS && window.SMA.STAGE_ASSETS.finalMain;
    var img = asset && window.SMA.getSpriteAsset ? window.SMA.getSpriteAsset(asset.key, asset.src) : null;
    if (!img || !img.complete || !img.naturalWidth) return false;
    var drawW = plat.w * 1.04;
    var drawH = drawW * img.naturalHeight / img.naturalWidth;
    ctx.drawImage(img, plat.x - (drawW - plat.w) / 2, plat.y - 28, drawW, drawH);
    return true;
};
window.SMA.drawDayMainPlatformArt = function (ctx, plat) {
    var asset = window.SMA.STAGE_ASSETS && window.SMA.STAGE_ASSETS.dayMain;
    var img = asset && window.SMA.getSpriteAsset ? window.SMA.getSpriteAsset(asset.key, asset.src) : null;
    if (!img || !img.complete || !img.naturalWidth) return false;
    var drawW = plat.w * 1.08;
    var drawH = drawW * img.naturalHeight / img.naturalWidth;
    ctx.drawImage(img, plat.x - (drawW - plat.w) / 2, plat.y - 18, drawW, drawH);
    return true;
};
window.SMA.drawDayFloatPlatformArt = function (ctx, plat) {
    var asset = window.SMA.STAGE_ASSETS && window.SMA.STAGE_ASSETS.dayFloat;
    var img = asset && window.SMA.getSpriteAsset ? window.SMA.getSpriteAsset(asset.key, asset.src) : null;
    if (!img || !img.complete || !img.naturalWidth) return false;
    var drawW = plat.w * 1.14;
    var drawH = drawW * img.naturalHeight / img.naturalWidth;
    ctx.drawImage(img, plat.x - (drawW - plat.w) / 2, plat.y - 8, drawW, drawH);
    return true;
};
window.SMA.drawBattlefieldSmallPlatformArt = function (ctx, plat) {
    var isWide = plat.w >= 260;
    var asset = window.SMA.STAGE_ASSETS && (isWide ? window.SMA.STAGE_ASSETS.battlefieldSmallWide : window.SMA.STAGE_ASSETS.battlefieldSmallShort);
    var img = asset && window.SMA.getSpriteAsset ? window.SMA.getSpriteAsset(asset.key, asset.src) : null;
    if (!img || !img.complete || !img.naturalWidth) return false;
    var drawW = plat.w * 1.16;
    var drawH = drawW * img.naturalHeight / img.naturalWidth;
    ctx.drawImage(img, plat.x - (drawW - plat.w) / 2, plat.y - 10, drawW, drawH);
    return true;
};
window.SMA.drawVectorStagePlatforms = function (ctx) {
    if (window.SMA.platforms.length <= 0) return;
    var m = window.SMA.platforms[0];
    ctx.fillStyle = "#3e2723";
    ctx.beginPath();
    ctx.moveTo(m.x, m.y);
    ctx.lineTo(m.x + m.w, m.y);
    ctx.lineTo(m.x + m.w / 2, m.y + 200);
    ctx.fill();
    for (var i = 0; i < window.SMA.platforms.length; i++) {
        var p = window.SMA.platforms[i];
        ctx.fillStyle = "#3e2723";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "#a1887f";
        ctx.fillRect(p.x, p.y, p.w, 5);
    }
};
window.SMA.MAGE_VFX_FRAME = 128;
window.SMA.MAGE_VFX_ANIMS = {
    magicProjectile: { key: 'mage_vfx_magic_projectile', src: 'assets/effects/mage/mage_magic_projectile_sheet.png?v=4', frames: 6, frameMs: 50 },
    fireProjectile: { key: 'mage_vfx_fire_projectile', src: 'assets/effects/mage/mage_fire_projectile_sheet.png?v=4', frames: 6, frameMs: 50 },
    firePillar: { key: 'mage_vfx_fire_pillar', src: 'assets/effects/mage/mage_fire_pillar_sheet.png?v=4', frames: 6, frameMs: 50 },
    overheadExplosion: { key: 'mage_vfx_overhead_explosion', src: 'assets/effects/mage/mage_overhead_explosion_sheet.png?v=4', frames: 6, frameMs: 45 }
};
window.SMA.preloadMageVfxSprites = function () {
    var anims = window.SMA.MAGE_VFX_ANIMS || {};
    for (var k in anims) {
        if (Object.prototype.hasOwnProperty.call(anims, k)) {
            window.SMA.getSpriteAsset(anims[k].key, anims[k].src);
        }
    }
};
window.SMA.drawMageVfxSheet = function (ctx, cfg, frame, x, y, w, h, angle, flipX) {
    if (!cfg) return false;
    var img = window.SMA.getSpriteAsset(cfg.key, cfg.src);
    if (!img.complete || !img.naturalWidth) return false;
    var fw = window.SMA.MAGE_VFX_FRAME || 128;
    var sx = Math.max(0, Math.min(cfg.frames - 1, frame || 0)) * fw;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    if (flipX) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, sx, 0, fw, fw, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
};
window.SMA.drawMageProjectileVfx = function (ctx, p) {
    if (!p) return false;
    var A = window.SMA.MAGE_VFX_ANIMS || {};
    if (p.type === 'magic') {
        var magicFrame = Math.floor((p.age || 0) / 5) % A.magicProjectile.frames;
        var magicHitSize = Math.max(p.w || 0, p.h || 0);
        var isLargeMagicShot = magicHitSize >= 45;
        var magicW = isLargeMagicShot
            ? Math.max(120, Math.min(270, magicHitSize * 3.15))
            : Math.max(46, Math.min(104, magicHitSize * 2.7));
        var magicH = magicW * 0.72;
        var magicAngle = Math.atan2(p.vy || 0, p.vx || 1);
        return window.SMA.drawMageVfxSheet(ctx, A.magicProjectile, magicFrame, p.x, p.y, magicW, magicH, magicAngle, false);
    }
    if (p.type === 'fire') {
        var fireFrame = Math.floor((p.age || 0) / 5) % A.fireProjectile.frames;
        var fireW = Math.max(56, Math.min(104, Math.max(p.w || 0, p.h || 0) * 4.2));
        var fireH = fireW * 0.68;
        var fireAngle = Math.atan2(p.vy || 0, p.vx || 1);
        return window.SMA.drawMageVfxSheet(ctx, A.fireProjectile, fireFrame, p.x, p.y, fireW, fireH, fireAngle, false);
    }
    if (p.type === 'fire_trap') {
        var maxLife = p.maxLife || 60;
        var age = p.age || Math.max(0, maxLife - (p.life || 0));
        var progress = Math.max(0, Math.min(0.999, age / maxLife));
        var pillarFrame = Math.floor(progress * A.firePillar.frames);
        var pillarScale = 1.2;
        var pillarH = 154 * pillarScale;
        var pillarW = 112 * pillarScale;
        var pillarBaselines = [123, 123, 92, 92, 123, 123];
        var pillarBaseline = pillarBaselines[pillarFrame] || 123;
        var surfaceY = (p.surfaceY !== undefined) ? p.surfaceY : p.y + 10;
        var centerY = surfaceY - (pillarBaseline / (window.SMA.MAGE_VFX_FRAME || 128)) * pillarH + pillarH / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(p.x - pillarW / 2 - 8, -10000, pillarW + 16, surfaceY + 10001);
        ctx.clip();
        var drawn = window.SMA.drawMageVfxSheet(ctx, A.firePillar, pillarFrame, p.x, centerY, pillarW, pillarH, 0, false);
        ctx.restore();
        return drawn;
    }
    return false;
};
window.SMA.getMageUpChargeScale = function (chargePower) {
    var ratio = Math.max(0, ((chargePower || 1) - 1.0) / 0.7);
    return Math.min(1.5, 1 + ratio * 0.5);
};
window.SMA.spawnMageVfx = function (kind, x, y, opts) {
    opts = opts || {};
    if (window.SMA.isHost && window.SMA.isOnline) {
        window.SMA.syncEvents.push({ type: 'mage_vfx', kind: kind, x: x, y: y, life: opts.life || 18, scale: opts.scale || 1, flipX: !!opts.flipX });
    }
    window.SMA.mageVfx = window.SMA.mageVfx || [];
    window.SMA.mageVfx.push({
        kind: kind,
        x: x,
        y: y,
        life: opts.life || 18,
        maxLife: opts.life || 18,
        scale: opts.scale || 1,
        flipX: !!opts.flipX
    });
};
window.SMA.drawMageTransientVfx = function (ctx) {
    var list = window.SMA.mageVfx || [];
    var A = window.SMA.MAGE_VFX_ANIMS || {};
    for (var i = list.length - 1; i >= 0; i--) {
        var fx = list[i];
        fx.age = (fx.age || 0) + 1;
        fx.life--;
        var progress = Math.max(0, Math.min(0.999, fx.age / fx.maxLife));
        if (fx.kind === 'overhead_explosion') {
            var expFrame = Math.floor(progress * A.overheadExplosion.frames);
            var expSize = 122 * (fx.scale || 1);
            window.SMA.drawMageVfxSheet(ctx, A.overheadExplosion, expFrame, fx.x, fx.y, expSize, expSize, 0, fx.flipX);
        } else if (fx.kind === 'fire_pillar') {
            var pillarFrame = Math.floor(progress * A.firePillar.frames);
            var pillarH = 154 * (fx.scale || 1);
            var pillarW = 112 * (fx.scale || 1);
            window.SMA.drawMageVfxSheet(ctx, A.firePillar, pillarFrame, fx.x, fx.y - pillarH / 2, pillarW, pillarH, 0, fx.flipX);
        }
        if (fx.life <= 0) list.splice(i, 1);
    }
};
window.SMA.Fighter.prototype.drawSwordSideAttackSprite = function (ctx, cx) {
    if (this.charId !== 'sword' || this.actionState !== 'ATTACK' || this.currentAttackType !== 'SIDE' || !this.currentAttack) return false;
    var img = window.SMA.getSpriteAsset('sword_side_attack', 'assets/characters/sword/side_attack_sheet.png?v=1');
    if (!img.complete || !img.naturalWidth) return false;

    var frames = 10;
    var fw = 96;
    var fh = 96;
    var p = Math.max(0, Math.min(0.999, this.stateTimer / this.currentAttack.frames));
    var frame = Math.floor(p * frames);
    var sx = frame * fw;
    var sy = 0;
    var dw = 96;
    var dh = 96;
    var dx = cx - dw / 2 + (this.facingRight ? 10 : -10);
    var dy = this.y + this.h - dh + 8;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (!this.facingRight) {
        ctx.translate(cx, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, sx, sy, fw, fh, -(dx - cx) - dw, dy, dw, dh);
    } else {
        ctx.drawImage(img, sx, sy, fw, fh, dx, dy, dw, dh);
    }
    ctx.restore();
    return true;
};
window.SMA.getSpriteAsset('sword_side_attack', 'assets/characters/sword/side_attack_sheet.png?v=1');
window.SMA.SWORD_CHIBI_FRAME = 128;
window.SMA.SWORD_CHIBI_FRAME_W = 128;
window.SMA.SWORD_CHIBI_BASELINE = 116;
window.SMA.SWORD_CHIBI_RENDER_SCALE = 0.78;
window.SMA.SWORD_CHIBI_BLADE_LEN = 72;
window.SMA.SWORD_CHIBI_BLADE_WIDTH_SCALE = 0.9;
window.SMA.SWORD_CHIBI_REACH_SCALE = 0.9;
window.SMA.SWORD_CHIBI_WEAPON_ASSET = {
    key: 'sword_chibi_weapon',
    src: 'assets/characters/sword/sword_weapon.png?v=1',
    drawH: 92,
    gripXRatio: 0.5,
    gripYRatio: 0.73
};
window.SMA.SWORD_CHIBI_ANIMS = {
    idle: { key: 'sword_chibi_idle', src: 'assets/characters/sword/chibi_idle_sheet.png?v=14', frames: 4, frameMs: 160 },
    run: { key: 'sword_chibi_run', src: 'assets/characters/sword/chibi_run_sheet.png?v=14', frames: 4, frameMs: 70 },
    jump: { key: 'sword_chibi_jump', src: 'assets/characters/sword/chibi_jump_sheet.png?v=14', frames: 2, frameMs: 120 },
    fall: { key: 'sword_chibi_fall', src: 'assets/characters/sword/chibi_fall_sheet.png?v=14', frames: 2, frameMs: 150 },
    hurt: { key: 'sword_chibi_hurt', src: 'assets/characters/sword/chibi_hurt_sheet.png?v=14', frames: 3, frameMs: 90 },
    charge: { key: 'sword_chibi_charge', src: 'assets/characters/sword/chibi_charge_sheet.png?v=14', frames: 3, frameMs: 90 },
    attackNeutral: { key: 'sword_chibi_attack_neutral', src: 'assets/characters/sword/chibi_attack_neutral_sheet.png?v=14', frames: 4, frameMs: 80 },
    attackSide: { key: 'sword_chibi_attack_side', src: 'assets/characters/sword/chibi_attack_side_sheet.png?v=14', frames: 6, frameMs: 60 },
    attackUp: { key: 'sword_chibi_attack_up', src: 'assets/characters/sword/chibi_attack_up_sheet.png?v=14', frames: 5, frameMs: 70 },
    attackDown: { key: 'sword_chibi_attack_down', src: 'assets/characters/sword/chibi_attack_down_sheet.png?v=14', frames: 5, frameMs: 70 },
    airNeutral: { key: 'sword_chibi_air_neutral', src: 'assets/characters/sword/chibi_air_neutral_sheet.png?v=14', frames: 6, frameMs: 55 },
    airSide: { key: 'sword_chibi_air_side', src: 'assets/characters/sword/chibi_air_side_sheet.png?v=14', frames: 4, frameMs: 70 },
    airDown: { key: 'sword_chibi_air_down', src: 'assets/characters/sword/chibi_air_down_sheet.png?v=14', frames: 5, frameMs: 70 },
    grab: { key: 'sword_chibi_grab', src: 'assets/characters/sword/chibi_grab_sheet.png?v=15', frames: 3, frameMs: 70 },
    grabHold: { key: 'sword_chibi_grab_hold', src: 'assets/characters/sword/chibi_grab_hold_sheet.png?v=15', frames: 4, frameMs: 100 },
    throw: { key: 'sword_chibi_throw', src: 'assets/characters/sword/chibi_throw_sheet.png?v=14', frames: 4, frameMs: 80 },
    dodge: { key: 'sword_chibi_dodge', src: 'assets/characters/sword/chibi_dodge_sheet.png?v=14', frames: 2, frameMs: 70 },
    ledge: { key: 'sword_chibi_ledge', src: 'assets/characters/sword/chibi_ledge_sheet.png?v=15', frames: 2, frameMs: 140 }
};
for (var swordChibiAnimKey in window.SMA.SWORD_CHIBI_ANIMS) {
    if (Object.prototype.hasOwnProperty.call(window.SMA.SWORD_CHIBI_ANIMS, swordChibiAnimKey)) {
        window.SMA.SWORD_CHIBI_ANIMS[swordChibiAnimKey].frameW = window.SMA.SWORD_CHIBI_FRAME_W;
        window.SMA.SWORD_CHIBI_ANIMS[swordChibiAnimKey].integratedWeapon = false;
    }
}
window.SMA.preloadSwordChibiSprites = function () {
    var anims = window.SMA.SWORD_CHIBI_ANIMS || {};
    for (var k in anims) {
        if (Object.prototype.hasOwnProperty.call(anims, k)) {
            window.SMA.getSpriteAsset(anims[k].key, anims[k].src);
        }
    }
    var weapon = window.SMA.SWORD_CHIBI_WEAPON_ASSET;
    if (weapon) window.SMA.getSpriteAsset(weapon.key, weapon.src);
};
window.SMA.resolveSwordChibiAnim = function (fighter) {
    var A = window.SMA.SWORD_CHIBI_ANIMS;
    if (!A || !fighter || fighter.charId !== 'sword') return null;
    if (fighter.actionState === 'STUN' || fighter.actionState === 'GRABBED') return A.hurt;
    if (fighter.actionState === 'CHARGE') return A.charge;
    if (fighter.actionState === 'DODGE' || fighter.actionState === 'LEDGE_ROLL') return A.dodge;
    if (fighter.actionState === 'LEDGE' || fighter.actionState === 'LEDGE_UP') return A.ledge;
    if (fighter.actionState === 'LEDGE_ATK') return A.attackSide;
    if (fighter.actionState === 'GRAB_ATTEMPT') return A.grab;
    if (fighter.actionState === 'GRABBING') return A.grabHold || A.throw;
    if (fighter.actionState === 'THROWING') return A.throw;
    if (fighter.actionState === 'ATTACK') {
        if (fighter.currentAttackType === 'SIDE') return A.attackSide;
        if (fighter.currentAttackType === 'UP' || fighter.currentAttackType === 'AIR_UP') return A.attackUp;
        if (fighter.currentAttackType === 'DOWN') return A.attackDown;
        if (fighter.currentAttackType === 'AIR_NEUTRAL') return A.airNeutral;
        if (fighter.currentAttackType === 'AIR_SIDE') return A.airSide;
        if (fighter.currentAttackType === 'AIR_DOWN') return A.airDown;
        return A.attackNeutral;
    }
    if (!fighter.isGrounded) return fighter.vy < 0 ? A.jump : A.fall;
    if (Math.abs(fighter.vx) > 0.7) return A.run;
    return A.idle;
};
window.SMA.Fighter.prototype.getSwordChibiFrame = function (anim) {
    var frames = anim.frames || 1;
    var p = null;
    if (this.actionState === 'ATTACK' && this.currentAttack) {
        var total = Math.max(1, this.currentAttack.frames || frames);
        var t = Math.max(0, this.stateTimer);
        p = t / total;
        p = Math.max(0, Math.min(0.999, p));
        if (this.currentAttackType === 'NEUTRAL') {
            var thrust = Math.sin(p * Math.PI);
            return Math.max(0, Math.min(frames - 1, Math.round(thrust * (frames - 1))));
        }
        if (this.currentAttackType === 'AIR_NEUTRAL' && this.currentAttack.type === 'spin') {
            return Math.floor(p * frames * 2) % frames;
        }
    } else if (this.actionState === 'GRAB_ATTEMPT') {
        p = this.stateTimer / 15;
    } else if (this.actionState === 'THROWING') {
        p = (15 - this.stateTimer) / 15;
    } else if (this.actionState === 'LEDGE_ATK') {
        p = (30 - this.stateTimer) / 30;
    } else if (this.actionState === 'DODGE' || this.actionState === 'LEDGE_ROLL') {
        p = (25 - this.stateTimer) / 25;
    }
    if (p !== null) {
        p = Math.max(0, Math.min(0.999, p));
        return Math.floor(p * frames);
    }
    return Math.floor(Date.now() / (anim.frameMs || 100)) % frames;
};
window.SMA.Fighter.prototype.getSwordChibiMotion = function () {
    return { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 };
};
window.SMA.swordChibiClamp01 = function (v) {
    return Math.max(0, Math.min(1, v));
};
window.SMA.swordChibiEase = function (v) {
    v = window.SMA.swordChibiClamp01(v);
    return v * v * (3 - 2 * v);
};
window.SMA.swordChibiPhase = function (p, start, end) {
    return window.SMA.swordChibiEase((p - start) / Math.max(0.001, end - start));
};
window.SMA.swordChibiLerp = function (a, b, t) {
    return a + (b - a) * t;
};
window.SMA.Fighter.prototype.getSwordChibiWeaponPose = function (cx, motion) {
    var sign = this.facingRight ? 1 : -1;
    var spriteScale = window.SMA.SWORD_CHIBI_RENDER_SCALE || 1;
    var reachScale = window.SMA.SWORD_CHIBI_REACH_SCALE || 1;
    var bodyX = cx + sign * (motion ? motion.x : 0);
    var bodyY = this.y + (motion ? motion.y : 0);
    var footY = this.y + this.h + (motion ? motion.y : 0);
    var gripPivotX = bodyX + sign * 7 * spriteScale;
    var gripPivotY = footY - 38 * spriteScale;
    var angleDeg = sign * 30;
    var handX = bodyX + sign * 21 * spriteScale;
    var handY = footY - 33 * spriteScale;
    var armRootX = bodyX + sign * 8 * spriteScale;
    var armRootY = footY - 39 * spriteScale;
    var progress = 0;
    var sweepDir = sign;
    var trailStrength = 0;
    var burst = 0;
    var thrust = 0;

    if (this.actionState === 'LEDGE_ATK' && this.currentAttack) {
        progress = Math.max(0, Math.min(0.999, (30 - this.stateTimer) / 30));
        angleDeg = sign * (110 - progress * 60);
        handX = bodyX + sign * 22 * spriteScale;
        handY = footY - 34 * spriteScale;
        armRootX = bodyX + sign * 8 * spriteScale;
        armRootY = footY - 42 * spriteScale;
    } else if (this.actionState === 'ATTACK' && this.currentAttack) {
        var atk = this.currentAttack;
        progress = Math.max(0, Math.min(0.999, this.stateTimer / Math.max(1, atk.frames || 1)));
        if (atk.type === 'slide' || this.currentAttackType === 'DOWN') {
            angleDeg = sign * 90;
            armRootX = bodyX + sign * 18 * spriteScale;
            armRootY = footY - 28 * spriteScale;
            handX = bodyX + sign * 45 * reachScale;
            handY = footY - 19 * spriteScale;
        } else if (this.currentAttackType === 'SIDE') {
            angleDeg = sign * (45 + 90 * progress);
        } else if (this.currentAttackType === 'UP' || this.currentAttackType === 'AIR_UP') {
            angleDeg = sign * (-60 + 120 * progress);
        } else if (this.currentAttackType === 'AIR_SIDE') {
            angleDeg = sign * (120 - 90 * progress);
        } else if (this.currentAttackType === 'NEUTRAL') {
            thrust = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
            var ext = (progress < 0.5 ? progress * 60 : (1 - progress) * 60) * reachScale;
            angleDeg = sign * 90;
            armRootX = bodyX + sign * 9 * spriteScale;
            armRootY = footY - 39 * spriteScale;
            handX = bodyX + sign * (23 * spriteScale + ext);
            handY = footY - 34 * spriteScale;
            burst = thrust;
        } else if (atk.type === 'meteor' || atk.type === 'down' || atk.type === 'slash_down' || this.currentAttackType === 'AIR_DOWN') {
            angleDeg = 180;
        } else if (atk.type === 'spin') {
            angleDeg = progress * 720;
        } else {
            angleDeg = sign * 45;
        }

        if (this.currentAttackType !== 'NEUTRAL' && atk.type !== 'slide' && this.currentAttackType !== 'DOWN') {
            var rad = angleDeg * Math.PI / 180;
            armRootX = bodyX + sign * 8 * spriteScale;
            armRootY = footY - 39 * spriteScale;
            handX = gripPivotX + Math.sin(rad) * 18 * spriteScale;
            handY = gripPivotY - Math.cos(rad) * 18 * spriteScale;
        }
    } else if (this.actionState === 'CHARGE') {
        angleDeg = sign * 45;
        handX = bodyX - sign * 5 * spriteScale;
        handY = footY - 44 * spriteScale;
        armRootX = bodyX + sign * 6 * spriteScale;
        armRootY = footY - 39 * spriteScale;
    }
    return { handX: handX, handY: handY, angleDeg: angleDeg, bodyX: bodyX, bodyY: bodyY, footY: footY, armRootX: armRootX, armRootY: armRootY, progress: progress, sweepDir: sweepDir, trailStrength: trailStrength, burst: burst, thrust: thrust, sign: sign };
};
window.SMA.Fighter.prototype.drawSwordChibiTrailBlade = function (ctx, pose, angleDeg, alpha, lenScale, widthScale, accent, bladeLen) {
    ctx.save();
    ctx.translate(pose.handX, pose.handY);
    ctx.rotate(angleDeg * Math.PI / 180);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-7 * widthScale, -8);
    ctx.lineTo(-18 * widthScale, -bladeLen * lenScale * 0.55);
    ctx.lineTo(0, -bladeLen * lenScale);
    ctx.lineTo(18 * widthScale, -bladeLen * lenScale * 0.55);
    ctx.lineTo(7 * widthScale, -8);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = alpha * 0.75;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-3, -14);
    ctx.lineTo(-6, -bladeLen * lenScale * 0.58);
    ctx.lineTo(0, -bladeLen * lenScale * 0.88);
    ctx.lineTo(6, -bladeLen * lenScale * 0.58);
    ctx.lineTo(3, -14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
};
window.SMA.Fighter.prototype.drawSwordChibiSlashTrail = function (ctx, pose, accent, bladeLen) {
    if (this.actionState !== 'ATTACK' || !this.currentAttack || pose.trailStrength <= 0.03) return;
    var type = this.currentAttackType;
    var alphaBase = Math.min(0.5, 0.13 + pose.trailStrength * 0.34);
    if (type === 'NEUTRAL') {
        var len = 58 + pose.thrust * 58;
        var y = pose.handY;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.25 + pose.thrust * 0.25;
        for (var i = 0; i < 3; i++) {
            ctx.lineWidth = 7 - i * 2;
            ctx.beginPath();
            ctx.moveTo(pose.handX - pose.sign * (12 + i * 5), y - 5 + i * 5);
            ctx.lineTo(pose.handX + pose.sign * (len - i * 10), y - 5 + i * 5);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
        return;
    }
    var count = this.currentAttack && this.currentAttack.type === 'spin' ? 6 : 4;
    var step = this.currentAttack && this.currentAttack.type === 'spin' ? 32 : 24;
    for (var t = count; t >= 1; t--) {
        var a = pose.angleDeg - pose.sweepDir * step * t;
        var alpha = alphaBase * (1 - t / (count + 1));
        var lenScale = 1.06 - t * 0.035;
        var widthScale = 1.15 - t * 0.08;
        this.drawSwordChibiTrailBlade(ctx, pose, a, alpha, lenScale, widthScale, accent, bladeLen);
    }
};
window.SMA.Fighter.prototype.drawSwordChibiWeapon = function (ctx, cx, motion) {
    var pose = this.getSwordChibiWeaponPose(cx, motion || { x: 0, y: 0 });
    if (!pose) return;
    var accent = this.isP2 ? '#74b9ff' : '#ff7675';
    var bladeColor = this.chargePower > 1.2 ? '#ffffff' : '#dfe8f5';
    var bladeCore = this.chargePower > 1.2 ? '#ffffff' : '#f8fbff';
    var bladeLen = window.SMA.SWORD_CHIBI_BLADE_LEN || 72;
    var bladeWidthScale = window.SMA.SWORD_CHIBI_BLADE_WIDTH_SCALE || 1;
    var scaleY = 1 + Math.max(0, this.chargePower - 1) * 0.35;
    var armRootX = pose.armRootX;
    var armRootY = pose.armRootY;
    var dx = pose.handX - armRootX;
    var dy = pose.handY - armRootY;
    if ((dx * dx + dy * dy) > 100) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(15, 18, 28, 0.72)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(armRootX, armRootY);
        ctx.lineTo(pose.handX, pose.handY);
        ctx.stroke();
        ctx.strokeStyle = '#263247';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(armRootX, armRootY);
        ctx.lineTo(pose.handX, pose.handY);
        ctx.stroke();
        ctx.restore();
    }
    var swordAsset = window.SMA.SWORD_CHIBI_WEAPON_ASSET;
    var swordImg = swordAsset && window.SMA.getSpriteAsset ? window.SMA.getSpriteAsset(swordAsset.key, swordAsset.src) : null;
    if (swordImg && swordImg.complete && swordImg.naturalWidth) {
        var swordDrawH = swordAsset.drawH || (bladeLen + 26);
        var swordDrawW = swordDrawH * swordImg.naturalWidth / swordImg.naturalHeight;
        var swordGripX = swordDrawW * (swordAsset.gripXRatio || 0.5);
        var swordGripY = swordDrawH * (swordAsset.gripYRatio || 0.72);
        ctx.save();
        ctx.translate(pose.handX, pose.handY);
        ctx.rotate(pose.angleDeg * Math.PI / 180);
        ctx.scale(bladeWidthScale, scaleY);
        ctx.imageSmoothingEnabled = true;
        if (this.chargePower > 1.2) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#ffffff';
        }
        ctx.drawImage(swordImg, -swordGripX, -swordGripY, swordDrawW, swordDrawH);
        ctx.restore();
        return;
    }
    ctx.save();
    ctx.translate(pose.handX, pose.handY);
    ctx.rotate(pose.angleDeg * Math.PI / 180);
    ctx.scale(bladeWidthScale, scaleY);
    if (this.chargePower > 1.2) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = bladeColor;
    }
    ctx.fillStyle = 'rgba(12, 16, 25, 0.88)';
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(-6, -bladeLen + 12);
    ctx.lineTo(0, -bladeLen);
    ctx.lineTo(6, -bladeLen + 12);
    ctx.lineTo(6, -6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = bladeColor;
    ctx.beginPath();
    ctx.moveTo(-4, -8);
    ctx.lineTo(-4, -bladeLen + 11);
    ctx.lineTo(0, -bladeLen + 2);
    ctx.lineTo(4, -bladeLen + 11);
    ctx.lineTo(4, -8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = bladeCore;
    ctx.beginPath();
    ctx.moveTo(-1, -9);
    ctx.lineTo(-1, -bladeLen + 12);
    ctx.lineTo(0, -bladeLen + 5);
    ctx.lineTo(1, -bladeLen + 12);
    ctx.lineTo(1, -9);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = accent;
    ctx.fillRect(2, -bladeLen + 18, 1.2, bladeLen - 32);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#232833';
    ctx.fillRect(-3.5, -3, 7, 23);
    ctx.fillStyle = '#46546b';
    ctx.fillRect(-1.2, -2, 2.4, 21);
    ctx.fillStyle = '#f7c948';
    ctx.fillRect(-13, -7, 26, 6);
    ctx.fillStyle = '#b8892e';
    ctx.fillRect(-10, -4, 20, 3);
    ctx.fillStyle = '#d7a53a';
    ctx.beginPath();
    ctx.arc(0, 21, 4.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(8, 10, 16, 0.9)';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.ellipse(0, 5, 7.2, 5.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#243042';
    ctx.beginPath();
    ctx.ellipse(0, 3, 4.4, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(236, 201, 117, 0.72)';
    ctx.lineWidth = 1;
    for (var i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-4.8, 2 + i * 2.1);
        ctx.quadraticCurveTo(0, 3.8 + i * 2.1, 4.8, 2 + i * 2.1);
        ctx.stroke();
    }
    ctx.restore();
};
window.SMA.Fighter.prototype.drawSwordChibiSprite = function (ctx, cx) {
    var anim = window.SMA.resolveSwordChibiAnim(this);
    if (!anim) return false;
    var img = window.SMA.getSpriteAsset(anim.key, anim.src);
    if (!img.complete || !img.naturalWidth) return false;

    var fw = anim.frameW || window.SMA.SWORD_CHIBI_FRAME || 128;
    var fh = anim.frameH || window.SMA.SWORD_CHIBI_FRAME || 128;
    var baseline = anim.baseline || window.SMA.SWORD_CHIBI_BASELINE || 116;
    var spriteScale = window.SMA.SWORD_CHIBI_RENDER_SCALE || 1;
    var frame = this.getSwordChibiFrame(anim);
    var sx = Math.min(frame, (anim.frames || 1) - 1) * fw;
    var footY = this.y + this.h;
    var motion = anim.integratedWeapon ? { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 } : this.getSwordChibiMotion();

    ctx.save();
    ctx.imageSmoothingEnabled = true;

    ctx.translate(cx, footY);
    if (!this.facingRight) {
        ctx.scale(-1, 1);
    }
    ctx.translate(motion.x, motion.y);
    ctx.rotate(motion.rotate);
    ctx.scale(motion.scaleX, motion.scaleY);
    ctx.drawImage(img, sx, 0, fw, fh, -fw * spriteScale / 2, -baseline * spriteScale, fw * spriteScale, fh * spriteScale);
    ctx.restore();
    var hideSword = this.actionState === 'LEDGE' || this.actionState === 'LEDGE_UP' || this.actionState === 'GRAB_ATTEMPT' || this.actionState === 'GRABBING';
    if (!anim.integratedWeapon && !hideSword) {
        this.drawSwordChibiWeapon(ctx, cx, motion);
    }

    if (this.actionState === 'SHIELD') {
        ctx.save();
        ctx.fillStyle = 'rgba(116, 185, 255, ' + (this.shieldHP / 150) + ')';
        ctx.strokeStyle = '#0984e3';
        ctx.beginPath();
        ctx.arc(cx, this.y + this.h / 2, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    return true;
};
window.SMA.MAGE_CHIBI_FRAME = 128;
window.SMA.MAGE_CHIBI_FRAME_W = 128;
window.SMA.MAGE_CHIBI_BASELINE = 116;
window.SMA.MAGE_CHIBI_RENDER_SCALE = 0.74;
window.SMA.MAGE_CHIBI_STAFF_WEIGHT = 1.05;
window.SMA.MAGE_CHIBI_STAFF_ORB_SCALE = 1.0;
window.SMA.MAGE_CHIBI_STAFF_ASSET = {
    key: 'mage_chibi_staff_weapon',
    src: 'assets/characters/mage/mage_staff.png?v=1',
    gripXRatio: 0.5,
    topYRatio: 0.18,
    bottomYRatio: 0.93,
    minDrawH: 42
};
window.SMA.MAGE_CHIBI_ANIMS = {
    idle: { key: 'mage_chibi_idle', src: 'assets/characters/mage/mage_idle_sheet.png?v=2', frames: 4, frameMs: 170 },
    run: { key: 'mage_chibi_run', src: 'assets/characters/mage/mage_run_sheet.png?v=2', frames: 4, frameMs: 75 },
    jump: { key: 'mage_chibi_jump', src: 'assets/characters/mage/mage_jump_sheet.png?v=2', frames: 2, frameMs: 220 },
    fall: { key: 'mage_chibi_fall', src: 'assets/characters/mage/mage_fall_sheet.png?v=2', frames: 2, frameMs: 240 },
    hurt: { key: 'mage_chibi_hurt', src: 'assets/characters/mage/mage_hurt_sheet.png?v=2', frames: 3, frameMs: 90 },
    charge: { key: 'mage_chibi_charge', src: 'assets/characters/mage/mage_charge_sheet.png?v=2', frames: 3, frameMs: 100 },
    attackNeutral: { key: 'mage_chibi_attack_neutral', src: 'assets/characters/mage/mage_attack_neutral_sheet.png?v=2', frames: 4, frameMs: 70 },
    attackSide: { key: 'mage_chibi_attack_side', src: 'assets/characters/mage/mage_attack_side_sheet.png?v=2', frames: 4, frameMs: 75 },
    attackUp: { key: 'mage_chibi_attack_up', src: 'assets/characters/mage/mage_attack_up_sheet.png?v=2', frames: 4, frameMs: 75 },
    attackDown: { key: 'mage_chibi_attack_down', src: 'assets/characters/mage/mage_attack_down_sheet.png?v=2', frames: 4, frameMs: 75 },
    airNeutral: { key: 'mage_chibi_air_neutral', src: 'assets/characters/mage/mage_air_neutral_sheet.png?v=2', frames: 4, frameMs: 70 },
    airSide: { key: 'mage_chibi_air_side', src: 'assets/characters/mage/mage_air_side_sheet.png?v=2', frames: 4, frameMs: 75 },
    airDown: { key: 'mage_chibi_air_down', src: 'assets/characters/mage/mage_air_down_sheet.png?v=2', frames: 4, frameMs: 75 },
    grab: { key: 'mage_chibi_grab', src: 'assets/characters/mage/mage_grab_sheet.png?v=3', frames: 3, frameMs: 75 },
    grabHold: { key: 'mage_chibi_grab_hold', src: 'assets/characters/mage/mage_grab_hold_sheet.png?v=3', frames: 4, frameMs: 100 },
    throw: { key: 'mage_chibi_throw', src: 'assets/characters/mage/mage_throw_sheet.png?v=2', frames: 4, frameMs: 85 },
    dodge: { key: 'mage_chibi_dodge', src: 'assets/characters/mage/mage_dodge_sheet.png?v=2', frames: 2, frameMs: 75 },
    ledge: { key: 'mage_chibi_ledge', src: 'assets/characters/mage/mage_ledge_sheet.png?v=3', frames: 2, frameMs: 150, baseline: 96 },
    ledgeRoll: { key: 'mage_chibi_ledge_roll', src: 'assets/characters/mage/mage_ledge_roll_sheet.png?v=3', frames: 4, frameMs: 65 }
};
for (var mageChibiAnimKey in window.SMA.MAGE_CHIBI_ANIMS) {
    if (Object.prototype.hasOwnProperty.call(window.SMA.MAGE_CHIBI_ANIMS, mageChibiAnimKey)) {
        window.SMA.MAGE_CHIBI_ANIMS[mageChibiAnimKey].frameW = window.SMA.MAGE_CHIBI_FRAME_W;
    }
}
window.SMA.preloadMageChibiSprites = function () {
    var anims = window.SMA.MAGE_CHIBI_ANIMS || {};
    for (var k in anims) {
        if (Object.prototype.hasOwnProperty.call(anims, k)) {
            window.SMA.getSpriteAsset(anims[k].key, anims[k].src);
        }
    }
    var staff = window.SMA.MAGE_CHIBI_STAFF_ASSET;
    if (staff) window.SMA.getSpriteAsset(staff.key, staff.src);
};
window.SMA.resolveMageChibiAnim = function (fighter) {
    var A = window.SMA.MAGE_CHIBI_ANIMS;
    if (!A || !fighter || fighter.charId !== 'mage') return null;
    if (fighter.actionState === 'STUN' || fighter.actionState === 'GRABBED') return A.hurt;
    if (fighter.actionState === 'CHARGE') return A.charge;
    if (fighter.actionState === 'DODGE') return A.dodge;
    if (fighter.actionState === 'LEDGE_ROLL') return A.ledgeRoll || A.dodge;
    if (fighter.actionState === 'LEDGE' || fighter.actionState === 'LEDGE_UP') return A.ledge;
    if (fighter.actionState === 'LEDGE_ATK') return A.attackSide;
    if (fighter.actionState === 'GRAB_ATTEMPT') return A.grab;
    if (fighter.actionState === 'GRABBING') return A.grabHold || A.throw;
    if (fighter.actionState === 'THROWING') return A.throw;
    if (fighter.actionState === 'ATTACK') {
        if (fighter.currentAttackType === 'SIDE') return A.attackSide;
        if (fighter.currentAttackType === 'UP' || fighter.currentAttackType === 'AIR_UP') return A.attackUp;
        if (fighter.currentAttackType === 'DOWN') return A.attackDown;
        if (fighter.currentAttackType === 'AIR_NEUTRAL') return A.airNeutral;
        if (fighter.currentAttackType === 'AIR_SIDE') return A.airSide;
        if (fighter.currentAttackType === 'AIR_DOWN') return A.airDown;
        return A.attackNeutral;
    }
    if (!fighter.isGrounded) return fighter.vy < 0 ? A.jump : A.fall;
    if (Math.abs(fighter.vx) > 0.7) return A.run;
    return A.idle;
};
window.SMA.Fighter.prototype.getMageChibiFrame = function (anim) {
    var frames = anim.frames || 1;
    var p = null;
    if (this.actionState === 'ATTACK' && this.currentAttack) {
        var total = Math.max(1, this.currentAttack.frames || frames);
        p = Math.max(0, Math.min(0.999, this.stateTimer / total));
    } else if (this.actionState === 'GRAB_ATTEMPT') {
        p = this.stateTimer / 15;
    } else if (this.actionState === 'THROWING') {
        p = (15 - this.stateTimer) / 15;
    } else if (this.actionState === 'LEDGE_ATK') {
        p = (30 - this.stateTimer) / 30;
    } else if (this.actionState === 'DODGE' || this.actionState === 'LEDGE_ROLL') {
        p = (25 - this.stateTimer) / 25;
    }
    if (p !== null) {
        p = Math.max(0, Math.min(0.999, p));
        return Math.floor(p * frames);
    }
    return Math.floor(Date.now() / (anim.frameMs || 100)) % frames;
};
window.SMA.Fighter.prototype.getMageChibiStaffPose = function (cx) {
    var sign = this.facingRight ? 1 : -1;
    var spriteScale = window.SMA.MAGE_CHIBI_RENDER_SCALE || 1;
    var footY = this.y + this.h;
    var handX = cx + sign * 26 * spriteScale;
    var handY = footY - 45 * spriteScale;
    var topX = cx + sign * 36 * spriteScale;
    var topY = footY - 66 * spriteScale;
    var bottomX = cx + sign * 18 * spriteScale;
    var bottomY = footY - 28 * spriteScale;
    var progress = 0;
    var glow = Math.max(0, Math.min(1, this.chargePower - 1));

    if (this.actionState === 'ATTACK' && this.currentAttack) {
        progress = Math.max(0, Math.min(0.999, this.stateTimer / Math.max(1, this.currentAttack.frames || 1)));
        var cast = Math.sin(progress * Math.PI);
        if (this.currentAttackType === 'UP' || this.currentAttackType === 'AIR_UP') {
            handX = cx + sign * 16 * spriteScale;
            handY = footY - 55 * spriteScale;
            topX = cx + sign * 20 * spriteScale;
            topY = footY - (78 + cast * 8) * spriteScale;
            bottomX = cx + sign * 12 * spriteScale;
            bottomY = footY - 35 * spriteScale;
            glow = Math.max(glow, cast * 0.8);
        } else if (this.currentAttackType === 'DOWN' || this.currentAttackType === 'AIR_DOWN') {
            handX = cx + sign * 26 * spriteScale;
            handY = footY - 35 * spriteScale;
            topX = cx + sign * (42 + cast * 7) * spriteScale;
            topY = footY - 20 * spriteScale;
            bottomX = cx + sign * 15 * spriteScale;
            bottomY = footY - 49 * spriteScale;
            glow = Math.max(glow, cast * 0.65);
        } else {
            handX = cx + sign * (30 + cast * 12) * spriteScale;
            handY = footY - 38 * spriteScale;
            topX = cx + sign * (52 + cast * 18) * spriteScale;
            topY = footY - (44 + cast * 4) * spriteScale;
            bottomX = cx + sign * (24 + cast * 8) * spriteScale;
            bottomY = footY - 33 * spriteScale;
            glow = Math.max(glow, cast * 0.75);
        }
    } else if (this.actionState === 'CHARGE') {
        var pulse = 0.5 + Math.sin(Date.now() / 130) * 0.5;
        handX = cx + sign * 22 * spriteScale;
        handY = footY - 48 * spriteScale;
        topX = cx + sign * 31 * spriteScale;
        topY = footY - 70 * spriteScale;
        bottomX = cx + sign * 14 * spriteScale;
        bottomY = footY - 30 * spriteScale;
        glow = Math.max(glow, 0.35 + pulse * 0.35);
    }

    return { sign: sign, scale: spriteScale, handX: handX, handY: handY, topX: topX, topY: topY, bottomX: bottomX, bottomY: bottomY, glow: glow };
};
window.SMA.Fighter.prototype.drawMageChibiStaffImage = function (ctx, pose) {
    if (!pose) return false;
    var asset = window.SMA.MAGE_CHIBI_STAFF_ASSET;
    var img = asset && window.SMA.getSpriteAsset ? window.SMA.getSpriteAsset(asset.key, asset.src) : null;
    if (!img || !img.complete || !img.naturalWidth) return false;

    var dx = pose.bottomX - pose.topX;
    var dy = pose.bottomY - pose.topY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var topRatio = asset.topYRatio || 0.18;
    var bottomRatio = asset.bottomYRatio || 0.93;
    var drawH = Math.max(asset.minDrawH || 42, dist / Math.max(0.01, bottomRatio - topRatio));
    var drawW = drawH * img.naturalWidth / img.naturalHeight;
    var gripX = drawW * (asset.gripXRatio || 0.5);
    var gripY = drawH * topRatio;
    var angle = Math.atan2(-dx, dy);
    var orbColor = this.chargePower > 1.2 ? '#ffffff' : '#73f1bf';

    ctx.save();
    ctx.translate(pose.topX, pose.topY);
    ctx.rotate(angle);
    ctx.imageSmoothingEnabled = true;
    if (pose.glow > 0.05) {
        ctx.shadowBlur = 10 + pose.glow * 12;
        ctx.shadowColor = orbColor;
    }
    ctx.drawImage(img, -gripX, -gripY, drawW, drawH);
    ctx.restore();
    return true;
};
window.SMA.Fighter.prototype.drawMageChibiStaffBack = function (ctx, pose) {
    if (!pose) return;
    var s = pose.scale;
    var w = window.SMA.MAGE_CHIBI_STAFF_WEIGHT || 1;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(8, 10, 16, 0.9)';
    ctx.lineWidth = 7.2 * s * w;
    ctx.beginPath();
    ctx.moveTo(pose.bottomX, pose.bottomY);
    ctx.lineTo(pose.topX, pose.topY);
    ctx.stroke();
    ctx.strokeStyle = '#3b2b4d';
    ctx.lineWidth = 4.3 * s * w;
    ctx.beginPath();
    ctx.moveTo(pose.bottomX, pose.bottomY);
    ctx.lineTo(pose.topX, pose.topY);
    ctx.stroke();
    ctx.strokeStyle = '#f0c45e';
    ctx.lineWidth = 1.75 * s * w;
    ctx.beginPath();
    ctx.moveTo(pose.bottomX, pose.bottomY);
    ctx.lineTo(pose.topX, pose.topY);
    ctx.stroke();
    ctx.restore();
};
window.SMA.Fighter.prototype.drawMageChibiStaffFront = function (ctx, pose) {
    if (!pose) return;
    var s = pose.scale;
    var orbScale = window.SMA.MAGE_CHIBI_STAFF_ORB_SCALE || 1;
    var orbColor = this.chargePower > 1.2 ? '#ffffff' : '#73f1bf';
    ctx.save();
    if (pose.glow > 0.05) {
        ctx.shadowBlur = 10 + pose.glow * 14;
        ctx.shadowColor = orbColor;
    }
    ctx.fillStyle = 'rgba(8, 10, 16, 0.92)';
    ctx.beginPath();
    ctx.arc(pose.topX, pose.topY, 8.8 * s * orbScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4a84f';
    ctx.beginPath();
    ctx.arc(pose.topX, pose.topY, 7.3 * s * orbScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = orbColor;
    ctx.beginPath();
    ctx.arc(pose.topX, pose.topY, 5.4 * s * orbScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pose.topX - pose.sign * 2.0 * s, pose.topY - 2.0 * s, 1.8 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.restore();
};
window.SMA.Fighter.prototype.drawMageChibiSprite = function (ctx, cx) {
    var anim = window.SMA.resolveMageChibiAnim(this);
    if (!anim) return false;
    var img = window.SMA.getSpriteAsset(anim.key, anim.src);
    if (!img.complete || !img.naturalWidth) return false;

    var fw = anim.frameW || window.SMA.MAGE_CHIBI_FRAME || 128;
    var fh = anim.frameH || window.SMA.MAGE_CHIBI_FRAME || 128;
    var baseline = anim.baseline || window.SMA.MAGE_CHIBI_BASELINE || 116;
    var spriteScale = window.SMA.MAGE_CHIBI_RENDER_SCALE || 1;
    var frame = this.getMageChibiFrame(anim);
    var sx = Math.min(frame, (anim.frames || 1) - 1) * fw;
    var footY = this.y + this.h;
    var staffPose = this.getMageChibiStaffPose(cx);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(cx, footY);
    if (!this.facingRight) {
        ctx.scale(-1, 1);
    }
    ctx.drawImage(img, sx, 0, fw, fh, -fw * spriteScale / 2, -baseline * spriteScale, fw * spriteScale, fh * spriteScale);
    ctx.restore();
    var hideStaff = this.actionState === 'LEDGE' || this.actionState === 'LEDGE_UP' || this.actionState === 'LEDGE_ROLL' || this.actionState === 'GRAB_ATTEMPT' || this.actionState === 'GRABBING';
    if (!hideStaff) {
        if (!this.drawMageChibiStaffImage(ctx, staffPose)) {
            this.drawMageChibiStaffBack(ctx, staffPose);
            this.drawMageChibiStaffFront(ctx, staffPose);
        }
    }

    if (this.actionState === 'SHIELD') {
        ctx.save();
        ctx.fillStyle = 'rgba(116, 185, 255, ' + (this.shieldHP / 150) + ')';
        ctx.strokeStyle = '#0984e3';
        ctx.beginPath();
        ctx.arc(cx, this.y + this.h / 2, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    return true;
};
window.SMA.BRAWLER_CHIBI_FRAME = 128;
window.SMA.BRAWLER_CHIBI_FRAME_W = 224;
window.SMA.BRAWLER_CHIBI_BASELINE = 116;
window.SMA.BRAWLER_CHIBI_RENDER_SCALE = 0.745;
window.SMA.BRAWLER_CHIBI_ANIMS = {
    idle: { key: 'brawler_chibi_idle', src: 'assets/characters/brawler/brawler_idle_sheet.png?v=18', frames: 4, frameMs: 260, baseline: 118 },
    run: { key: 'brawler_chibi_run', src: 'assets/characters/brawler/brawler_run_sheet.png?v=22', frames: 8, frameMs: 36, baseline: 118 },
    jump: { key: 'brawler_chibi_jump', src: 'assets/characters/brawler/brawler_jump_sheet.png?v=18', frames: 2, frameMs: 220, baseline: 118 },
    fall: { key: 'brawler_chibi_fall', src: 'assets/characters/brawler/brawler_fall_sheet.png?v=19', frames: 1, frameMs: 240, baseline: 118 },
    hurt: { key: 'brawler_chibi_hurt', src: 'assets/characters/brawler/brawler_hurt_sheet.png?v=17', frames: 3, frameMs: 80, baseline: 118 },
    charge: { key: 'brawler_chibi_charge', src: 'assets/characters/brawler/brawler_charge_sheet.png?v=17', frames: 4, frameMs: 80, baseline: 118 },
    attackNeutral: { key: 'brawler_chibi_attack_neutral', src: 'assets/characters/brawler/brawler_attack_neutral_sheet.png?v=18', frames: 8, frameMs: 42, baseline: 118 },
    attackSide: { key: 'brawler_chibi_attack_side', src: 'assets/characters/brawler/brawler_attack_side_sheet.png?v=18', frames: 8, frameMs: 52, baseline: 118 },
    attackUp: { key: 'brawler_chibi_attack_up', src: 'assets/characters/brawler/brawler_attack_up_sheet.png?v=17', frames: 8, frameMs: 52, frameH: 160, baseline: 150 },
    attackDown: { key: 'brawler_chibi_attack_down', src: 'assets/characters/brawler/brawler_attack_down_sheet.png?v=17', frames: 8, frameMs: 50, baseline: 118 },
    airNeutral: { key: 'brawler_chibi_air_neutral', src: 'assets/characters/brawler/brawler_air_neutral_sheet.png?v=17', frames: 8, frameMs: 48, baseline: 118 },
    airSide: { key: 'brawler_chibi_air_side', src: 'assets/characters/brawler/brawler_air_side_sheet.png?v=19', frames: 8, frameMs: 55, frameH: 160, baseline: 150 },
    airDown: { key: 'brawler_chibi_air_down', src: 'assets/characters/brawler/brawler_air_down_sheet.png?v=17', frames: 8, frameMs: 48, baseline: 118 },
    grab: { key: 'brawler_chibi_grab', src: 'assets/characters/brawler/brawler_grab_sheet.png?v=18', frames: 8, frameMs: 52, baseline: 118 },
    throw: { key: 'brawler_chibi_throw', src: 'assets/characters/brawler/brawler_throw_sheet.png?v=17', frames: 8, frameMs: 55, baseline: 118 },
    dodge: { key: 'brawler_chibi_dodge', src: 'assets/characters/brawler/brawler_dodge_sheet.png?v=17', frames: 8, frameMs: 45, baseline: 118 },
    ledge: { key: 'brawler_chibi_ledge', src: 'assets/characters/brawler/brawler_ledge_sheet.png?v=17', frames: 4, frameMs: 120, baseline: 118 }
};
for (var brawlerChibiAnimKey in window.SMA.BRAWLER_CHIBI_ANIMS) {
    if (Object.prototype.hasOwnProperty.call(window.SMA.BRAWLER_CHIBI_ANIMS, brawlerChibiAnimKey)) {
        window.SMA.BRAWLER_CHIBI_ANIMS[brawlerChibiAnimKey].frameW = window.SMA.BRAWLER_CHIBI_FRAME_W;
    }
}
window.SMA.preloadBrawlerChibiSprites = function () {
    var anims = window.SMA.BRAWLER_CHIBI_ANIMS || {};
    for (var k in anims) {
        if (Object.prototype.hasOwnProperty.call(anims, k)) {
            window.SMA.getSpriteAsset(anims[k].key, anims[k].src);
        }
    }
};
window.SMA.resolveBrawlerChibiAnim = function (fighter) {
    var A = window.SMA.BRAWLER_CHIBI_ANIMS;
    if (!A || !fighter || fighter.charId !== 'brawler') return null;
    if (fighter.actionState === 'STUN' || fighter.actionState === 'GRABBED') return A.hurt;
    if (fighter.actionState === 'CHARGE') return A.charge;
    if (fighter.actionState === 'DODGE' || fighter.actionState === 'LEDGE_ROLL') return A.dodge;
    if (fighter.actionState === 'LEDGE' || fighter.actionState === 'LEDGE_UP') return A.ledge;
    if (fighter.actionState === 'LEDGE_ATK') return A.attackSide;
    if (fighter.actionState === 'GRAB_ATTEMPT') return A.grab;
    if (fighter.actionState === 'GRABBING' || fighter.actionState === 'THROWING') return A.throw;
    if (fighter.actionState === 'ATTACK') {
        if (fighter.currentAttackType === 'SIDE') return A.attackSide;
        if (fighter.currentAttackType === 'UP' || fighter.currentAttackType === 'AIR_UP') return A.attackUp;
        if (fighter.currentAttackType === 'DOWN') return A.attackDown;
        if (fighter.currentAttackType === 'AIR_NEUTRAL') return A.airNeutral;
        if (fighter.currentAttackType === 'AIR_SIDE') return A.airSide;
        if (fighter.currentAttackType === 'AIR_DOWN') return A.airDown;
        return A.attackNeutral;
    }
    if (!fighter.isGrounded) return fighter.vy < 0 ? A.jump : A.fall;
    if (Math.abs(fighter.vx) > 0.7) return A.run;
    return A.idle;
};
window.SMA.Fighter.prototype.getBrawlerChibiFrame = function (anim) {
    var frames = anim.frames || 1;
    var p = null;
    if (this.actionState === 'STUN') {
        var stunSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (!this.isGrounded || stunSpeed > 4) return 0;
        return this.stateTimer > 20 ? Math.min(1, frames - 1) : Math.min(2, frames - 1);
    }
    if (this.actionState === 'GRABBED') return Math.min(1, frames - 1);
    if (this.actionState === 'ATTACK' && this.currentAttack) {
        if (this.currentAttackType === 'AIR_SIDE') {
            if (this.stateTimer < 4) return 0;
            if (this.stateTimer < 8) return Math.min(1, frames - 1);
            if (this.stateTimer < 13) return Math.min(2, frames - 1);
            if (this.stateTimer < 16) return Math.min(3, frames - 1);
            if (this.stateTimer <= 19) return Math.min(4, frames - 1);
            if (this.stateTimer < 25) return Math.min(5, frames - 1);
            if (this.stateTimer < 34) return Math.min(6, frames - 1);
            return Math.min(7, frames - 1);
        }
        if (this.currentAttackType === 'AIR_DOWN') {
            if (this.stateTimer < 1) return 0;
            if (this.stateTimer < 3) return Math.min(2, frames - 1);
            if (this.stateTimer < 8) return Math.min(3, frames - 1);
            if (this.stateTimer < 14) return Math.min(4, frames - 1);
            return Math.min(5, frames - 1);
        }
        if (this.currentAttackType === 'AIR_NEUTRAL') {
            if (this.stateTimer < 2) return 0;
            if (this.stateTimer < 4) return Math.min(1, frames - 1);
            if (this.stateTimer < 7) return Math.min(2, frames - 1);
            if (this.stateTimer < 11) return Math.min(3, frames - 1);
            if (this.stateTimer < 17) return Math.min(4, frames - 1);
            if (this.stateTimer <= 21) return Math.min(5, frames - 1);
            if (this.stateTimer < 24) return Math.min(6, frames - 1);
            return Math.min(7, frames - 1);
        }
        if (this.currentAttackType === 'SIDE') {
            if (this.stateTimer < 3) return 0;
            if (this.stateTimer < 5) return Math.min(1, frames - 1);
            if (this.stateTimer < 9) return Math.min(2, frames - 1);
            if (this.stateTimer < 13) return Math.min(3, frames - 1);
            if (this.stateTimer < 17) return Math.min(4, frames - 1);
            if (this.stateTimer <= 20) return Math.min(5, frames - 1);
            if (this.stateTimer < 23) return Math.min(6, frames - 1);
            return Math.min(7, frames - 1);
        }
        if (this.currentAttackType === 'UP') {
            if (this.stateTimer < 2) return 0;
            if (this.stateTimer < 3) return Math.min(1, frames - 1);
            if (this.stateTimer < 4) return Math.min(2, frames - 1);
            if (this.stateTimer < 8) return Math.min(3, frames - 1);
            if (this.stateTimer < 12) return Math.min(4, frames - 1);
            if (this.stateTimer <= 15) return Math.min(5, frames - 1);
            if (this.stateTimer < 26) return Math.min(6, frames - 1);
            return Math.min(7, frames - 1);
        }
        if (this.currentAttackType === 'DOWN') {
            if (this.stateTimer < 2) return 0;
            if (this.stateTimer < 3) return Math.min(1, frames - 1);
            if (this.stateTimer < 5) return Math.min(2, frames - 1);
            if (this.stateTimer < 8) return Math.min(3, frames - 1);
            if (this.stateTimer < 11) return Math.min(4, frames - 1);
            if (this.stateTimer <= 12) return Math.min(5, frames - 1);
            if (this.stateTimer < 14) return Math.min(6, frames - 1);
            return Math.min(7, frames - 1);
        }
        p = Math.max(0, Math.min(0.999, this.stateTimer / Math.max(1, this.currentAttack.frames || frames)));
    } else if (this.actionState === 'GRAB_ATTEMPT') {
        if (this.stateTimer < 2) return 0;
        if (this.stateTimer < 4) return Math.min(1, frames - 1);
        if (this.stateTimer < 6) return Math.min(2, frames - 1);
        if (this.stateTimer < 8) return Math.min(3, frames - 1);
        if (this.stateTimer < 10) return Math.min(4, frames - 1);
        if (this.stateTimer < 12) return Math.min(5, frames - 1);
        if (this.stateTimer < 14) return Math.min(6, frames - 1);
        return Math.min(7, frames - 1);
    } else if (this.actionState === 'GRABBING') {
        return 0;
    } else if (this.actionState === 'THROWING') {
        p = Math.max(0, Math.min(0.999, (15 - this.stateTimer) / 15));
        var throwFrameMap = [0, 1, 2, 4, 5, 6, 7];
        return Math.min(frames - 1, throwFrameMap[Math.floor(p * throwFrameMap.length)]);
    } else if (this.actionState === 'LEDGE') {
        return Math.floor(Date.now() / (anim.frameMs || 120)) % Math.min(2, frames);
    } else if (this.actionState === 'LEDGE_UP') {
        if (this.stateTimer > 6) return Math.min(1, frames - 1);
        if (this.stateTimer > 2) return Math.min(2, frames - 1);
        return Math.min(3, frames - 1);
    } else if (this.actionState === 'LEDGE_ATK') {
        p = (30 - this.stateTimer) / 30;
    } else if (this.actionState === 'DODGE' || this.actionState === 'LEDGE_ROLL') {
        p = (25 - this.stateTimer) / 25;
    }
    if (p !== null) {
        p = Math.max(0, Math.min(0.999, p));
        return Math.floor(p * frames);
    }
    return Math.floor(Date.now() / (anim.frameMs || 100)) % frames;
};
window.SMA.Fighter.prototype.drawBrawlerChibiStrike = function (ctx, cx) {
    var sign = this.facingRight ? 1 : -1;
    var s = window.SMA.BRAWLER_CHIBI_RENDER_SCALE || 1;
    var footY = this.y + this.h;
    var accent = this.currentAttack && this.currentAttack.color ? this.currentAttack.color : '#e67e22';
    var charged = this.chargePower > 1.2;

    var drawImpact = function (x, y, r, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = charged ? '#ffffff' : accent;
        ctx.fillStyle = charged ? 'rgba(255,255,255,0.18)' : 'rgba(230,126,34,0.15)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    };

    if (this.actionState === 'CHARGE') {
        var pulse = 0.5 + Math.sin(Date.now() / 90) * 0.5;
        var fistX = cx + sign * (25 + pulse * 3) * s;
        var fistY = footY - 39 * s;
        ctx.save();
        if (charged) {
            ctx.shadowBlur = 16 + pulse * 16;
            ctx.shadowColor = '#ffffff';
        }
        drawImpact(fistX, fistY, 8 + pulse * 4, charged ? 0.95 : 0.45);
        ctx.restore();
        return;
    }

    if (this.actionState === 'LEDGE_ATK') {
        var lp = Math.max(0, Math.min(0.999, (30 - this.stateTimer) / 30));
        var lx = cx + sign * (26 + lp * 36) * s;
        var ly = footY - 41 * s;
        drawImpact(lx, ly, 8 + lp * 5, 0.75);
        return;
    }

    if (this.actionState !== 'ATTACK' || !this.currentAttack) return;
    var p = Math.max(0, Math.min(0.999, this.stateTimer / Math.max(1, this.currentAttack.frames || 1)));
    var peak = Math.sin(p * Math.PI);
    var type = this.currentAttackType;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = charged ? '#ffffff' : accent;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.78;

    if (type === 'NEUTRAL') {
        var nx0 = cx + sign * 18 * s;
        var nx1 = cx + sign * (36 + peak * 24) * s;
        var ny = footY - 41 * s;
        ctx.beginPath();
        ctx.moveTo(nx0, ny);
        ctx.lineTo(nx1, ny);
        ctx.stroke();
        drawImpact(nx1, ny, 7 + peak * 3, 0.78);
    } else if (type === 'SIDE') {
        var sx0 = cx + sign * 18 * s;
        var sx1 = cx + sign * (56 + peak * 26) * s;
        var sy = footY - 41 * s;
        ctx.beginPath();
        ctx.moveTo(sx0, sy + 5 * s);
        ctx.quadraticCurveTo(cx + sign * 46 * s, sy - 9 * s, sx1, sy);
        ctx.stroke();
        drawImpact(sx1, sy, 10 + peak * 5, 0.8);
    } else if (type === 'UP' || type === 'AIR_UP') {
        var ux = cx + sign * 19 * s;
        var uy0 = footY - 38 * s;
        var uy1 = footY - (66 + peak * 20) * s;
        ctx.beginPath();
        ctx.moveTo(ux - sign * 4 * s, uy0);
        ctx.lineTo(ux + sign * 8 * s, uy1);
        ctx.stroke();
        drawImpact(ux + sign * 8 * s, uy1, 9 + peak * 4, 0.78);
    } else if (type === 'DOWN' || type === 'AIR_NEUTRAL') {
        var kx0 = cx + sign * 13 * s;
        var kx1 = cx + sign * (46 + peak * 14) * s;
        var ky = footY - 22 * s;
        ctx.beginPath();
        ctx.moveTo(kx0, ky - 4 * s);
        ctx.lineTo(kx1, ky + 3 * s);
        ctx.stroke();
        drawImpact(kx1, ky + 3 * s, 8 + peak * 4, 0.7);
    } else if (type === 'AIR_SIDE') {
        var ax = cx + sign * (28 + peak * 22) * s;
        ctx.beginPath();
        ctx.moveTo(cx + sign * 14 * s, footY - 60 * s);
        ctx.quadraticCurveTo(cx + sign * 48 * s, footY - 47 * s, ax, footY - 26 * s);
        ctx.stroke();
        drawImpact(ax, footY - 26 * s, 10 + peak * 5, 0.78);
    } else if (type === 'AIR_DOWN') {
        var dx = cx + sign * 14 * s;
        var dy = footY - (12 + peak * 8) * s;
        ctx.beginPath();
        ctx.moveTo(cx - sign * 10 * s, footY - 45 * s);
        ctx.lineTo(dx, dy);
        ctx.stroke();
        drawImpact(dx, dy, 11 + peak * 4, 0.78);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
};
window.SMA.Fighter.prototype.drawBrawlerChibiSprite = function (ctx, cx) {
    var anim = window.SMA.resolveBrawlerChibiAnim(this);
    if (!anim) return false;
    var img = window.SMA.getSpriteAsset(anim.key, anim.src);
    if (!img.complete || !img.naturalWidth) return false;

    var fw = anim.frameW || window.SMA.BRAWLER_CHIBI_FRAME || 128;
    var fh = anim.frameH || window.SMA.BRAWLER_CHIBI_FRAME || 128;
    var baseline = anim.baseline || window.SMA.BRAWLER_CHIBI_BASELINE || 116;
    var spriteScale = window.SMA.BRAWLER_CHIBI_RENDER_SCALE || 1;
    var frame = this.getBrawlerChibiFrame(anim);
    var sx = Math.min(frame, (anim.frames || 1) - 1) * fw;
    var footY = this.y + this.h;
    var drawCx = cx;
    var drawFootY = footY;
    if (this.actionState === 'LEDGE_UP' && this.ledgeGrabbed && this.stateTimer <= 6) {
        var ledgePlatform = this.ledgeGrabbed.platform;
        var ledgeDir = this.ledgeGrabbed.dir;
        var ledgeTopX = (ledgeDir === 'left') ? ledgePlatform.x : (ledgePlatform.x + ledgePlatform.w - this.w);
        drawCx = ledgeTopX + this.w / 2;
        drawFootY = ledgePlatform.y;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(drawCx, drawFootY);
    var sourceFacesLeft = anim.sourceFacing === 'left';
    if ((sourceFacesLeft && this.facingRight) || (!sourceFacesLeft && !this.facingRight)) {
        ctx.scale(-1, 1);
    }
    ctx.drawImage(img, sx, 0, fw, fh, -fw * spriteScale / 2, -baseline * spriteScale, fw * spriteScale, fh * spriteScale);
    ctx.restore();

    if (this.actionState === 'SHIELD') {
        ctx.save();
        ctx.fillStyle = 'rgba(116, 185, 255, ' + (this.shieldHP / 150) + ')';
        ctx.strokeStyle = '#0984e3';
        ctx.beginPath();
        ctx.arc(cx, this.y + this.h / 2, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    return true;
};
window.SMA.HAMMER_CHIBI_FRAME = 128;
window.SMA.HAMMER_CHIBI_FRAME_W = 128;
window.SMA.HAMMER_CHIBI_BASELINE = 116;
window.SMA.HAMMER_CHIBI_RENDER_SCALE = 0.78;
window.SMA.HAMMER_CHIBI_ANIMS = {
    idle: { key: 'hammer_chibi_idle', src: 'assets/characters/hammer/hammer_idle_sheet.png?v=1', frames: 4, frameMs: 220, baseline: 116 },
    run: { key: 'hammer_chibi_run_v3', src: 'assets/characters/hammer/hammer_run_sheet.png?v=3', frames: 4, frameMs: 70, baseline: 116 },
    jump: { key: 'hammer_chibi_jump_v3', src: 'assets/characters/hammer/hammer_jump_sheet.png?v=3', frames: 2, frameMs: 180, baseline: 116 },
    fall: { key: 'hammer_chibi_fall', src: 'assets/characters/hammer/hammer_fall_sheet.png?v=5', frames: 1, frameMs: 180, baseline: 116 },
    hurt: { key: 'hammer_chibi_hurt_v2', src: 'assets/characters/hammer/hammer_hurt_sheet.png?v=2', frames: 2, frameMs: 90, baseline: 116 },
    charge: { key: 'hammer_chibi_charge_v3', src: 'assets/characters/hammer/hammer_charge_sheet.png?v=3', frames: 4, frameMs: 90, baseline: 116 },
    attackNeutral: { key: 'hammer_chibi_attack_neutral_v4', src: 'assets/characters/hammer/hammer_attack_neutral_sheet.png?v=4', frames: 4, frameMs: 75, baseline: 116 },
    attackSide: { key: 'hammer_chibi_attack_side_v5', src: 'assets/characters/hammer/hammer_attack_side_sheet.png?v=5', frames: 6, frameMs: 58, baseline: 116 },
    attackUp: { key: 'hammer_chibi_attack_up_v3', src: 'assets/characters/hammer/hammer_attack_up_sheet.png?v=3', frames: 6, frameMs: 58, baseline: 116, renderScale: 0.88 },
    attackDown: { key: 'hammer_chibi_attack_down', src: 'assets/characters/hammer/hammer_attack_down_sheet.png?v=4', frames: 7, frameMs: 32, baseline: 116 },
    airNeutral: { key: 'hammer_chibi_air_neutral', src: 'assets/characters/hammer/hammer_air_neutral_sheet.png?v=2', frames: 4, frameMs: 65, baseline: 116 },
    airSide: { key: 'hammer_chibi_air_side', src: 'assets/characters/hammer/hammer_air_side_sheet.png?v=2', frames: 4, frameMs: 65, baseline: 116 },
    airUp: { key: 'hammer_chibi_air_up_v4', src: 'assets/characters/hammer/hammer_air_up_sheet.png?v=4', frames: 6, frameMs: 58, baseline: 116, renderScale: 0.88 },
    airDown: { key: 'hammer_chibi_air_down', src: 'assets/characters/hammer/hammer_attack_down_sheet.png?v=4', frames: 7, frameMs: 32, baseline: 116 },
    grab: { key: 'hammer_chibi_grab_v2', src: 'assets/characters/hammer/hammer_grab_sheet.png?v=2', frames: 4, frameMs: 65, baseline: 116 },
    grabHold: { key: 'hammer_chibi_grab_hold_v2', src: 'assets/characters/hammer/hammer_grab_hold_sheet.png?v=2', frames: 4, frameMs: 100, baseline: 116 },
    throw: { key: 'hammer_chibi_throw_v2', src: 'assets/characters/hammer/hammer_throw_sheet.png?v=2', frames: 4, frameMs: 70, baseline: 116 },
    dodge: { key: 'hammer_chibi_dodge_v2', src: 'assets/characters/hammer/hammer_dodge_sheet.png?v=2', frames: 4, frameMs: 55, baseline: 116 },
    ledge: { key: 'hammer_chibi_ledge_v2', src: 'assets/characters/hammer/hammer_ledge_sheet.png?v=2', frames: 4, frameMs: 110, baseline: 116 },
    ledgeAttack: { key: 'hammer_chibi_ledge_attack', src: 'assets/characters/hammer/hammer_ledge_attack_sheet.png?v=1', frames: 4, frameMs: 70, baseline: 116 }
};
for (var hammerChibiAnimKey in window.SMA.HAMMER_CHIBI_ANIMS) {
    if (Object.prototype.hasOwnProperty.call(window.SMA.HAMMER_CHIBI_ANIMS, hammerChibiAnimKey)) {
        window.SMA.HAMMER_CHIBI_ANIMS[hammerChibiAnimKey].frameW = window.SMA.HAMMER_CHIBI_FRAME_W;
    }
}
window.SMA.preloadHammerChibiSprites = function () {
    var anims = window.SMA.HAMMER_CHIBI_ANIMS || {};
    for (var k in anims) {
        if (Object.prototype.hasOwnProperty.call(anims, k)) {
            window.SMA.getSpriteAsset(anims[k].key, anims[k].src);
        }
    }
    var weapon = window.SMA.HAMMER_WEAPON_ASSET;
    if (weapon) window.SMA.getSpriteAsset(weapon.key, weapon.src);
};
window.SMA.resolveHammerChibiAnim = function (fighter) {
    var A = window.SMA.HAMMER_CHIBI_ANIMS;
    if (!A || !fighter || fighter.charId !== 'hammer') return null;
    if (fighter.actionState === 'STUN' || fighter.actionState === 'GRABBED') return A.hurt;
    if (fighter.actionState === 'CHARGE') return A.charge;
    if (fighter.actionState === 'DODGE' || fighter.actionState === 'LEDGE_ROLL') return A.dodge;
    if (fighter.actionState === 'LEDGE' || fighter.actionState === 'LEDGE_UP') return A.ledge;
    if (fighter.actionState === 'LEDGE_ATK') return A.ledgeAttack || A.attackSide;
    if (fighter.actionState === 'GRAB_ATTEMPT') return A.grab;
    if (fighter.actionState === 'GRABBING') return A.grabHold || A.throw;
    if (fighter.actionState === 'THROWING') return A.throw;
    if (fighter.actionState === 'LAG') return A.idle;
    if (fighter.actionState === 'ATTACK' && fighter.currentAttack) {
        if (fighter.currentAttackType === 'AIR_NEUTRAL') return A.airNeutral;
        if (fighter.currentAttackType === 'AIR_SIDE') return A.airSide;
        if (fighter.currentAttackType === 'AIR_UP') return A.airUp;
        if (fighter.currentAttackType === 'AIR_DOWN') return A.airDown;
        if (fighter.currentAttackType === 'SIDE') return A.attackSide;
        if (fighter.currentAttackType === 'UP') return A.attackUp;
        if (fighter.currentAttackType === 'DOWN') return A.attackDown;
        return A.attackNeutral;
    }
    if (!fighter.isGrounded) return fighter.vy < 0 ? A.jump : A.fall;
    if (Math.abs(fighter.vx) > 0.5) return A.run;
    return A.idle;
};
window.SMA.Fighter.prototype.getHammerChibiFrame = function (anim) {
    var frames = anim.frames || 1;
    if (frames <= 1) return 0;
    var p = null;
    if (this.actionState === 'ATTACK' && this.currentAttack) {
        if (this.charId === 'hammer' && this.currentAttackType === 'NEUTRAL') {
            if (this.stateTimer < 10) return 0;
            if (this.stateTimer < 15) return Math.min(1, frames - 1);
            if (this.stateTimer < 22) return Math.min(2, frames - 1);
            return Math.min(3, frames - 1);
        }
        if (this.charId === 'hammer' && this.currentAttackType === 'SIDE') {
            if (this.stateTimer < 6) return 0;
            if (this.stateTimer < 10) return Math.min(1, frames - 1);
            if (this.stateTimer < 18) return Math.min(2, frames - 1);
            if (this.stateTimer < 24) return Math.min(3, frames - 1);
            if (this.stateTimer < 28) return Math.min(4, frames - 1);
            return Math.min(5, frames - 1);
        }
        if (this.charId === 'hammer' && (this.currentAttackType === 'DOWN' || this.currentAttackType === 'AIR_DOWN')) {
            if (this.stateTimer >= 80) return frames - 1;
            return Math.floor(this.stateTimer / 2) % Math.max(1, frames - 1);
        }
        if (this.charId === 'hammer' && this.currentAttackType === 'UP') {
            if (this.stateTimer < 11) return 0;
            if (this.stateTimer < 13) return Math.min(1, frames - 1);
            if (this.stateTimer < 15) return Math.min(2, frames - 1);
            if (this.stateTimer < 18) return Math.min(3, frames - 1);
            if (this.stateTimer < 21) return Math.min(4, frames - 1);
            return Math.min(5, frames - 1);
        }
        if (this.charId === 'hammer' && this.currentAttackType === 'AIR_UP') {
            if (this.stateTimer < 11) return 0;
            if (this.stateTimer < 13) return Math.min(1, frames - 1);
            if (this.stateTimer < 15) return Math.min(2, frames - 1);
            if (this.stateTimer < 18) return Math.min(3, frames - 1);
            if (this.stateTimer < 21) return Math.min(4, frames - 1);
            return Math.min(5, frames - 1);
        }
        p = Math.max(0, Math.min(0.999, this.stateTimer / Math.max(1, this.currentAttack.frames || frames)));
    } else if (this.actionState === 'CHARGE') {
        return Math.floor(Date.now() / (anim.frameMs || 90)) % frames;
    } else if (this.actionState === 'GRAB_ATTEMPT') {
        p = Math.max(0, Math.min(0.999, this.stateTimer / 15));
    } else if (this.actionState === 'GRABBING') {
        return Math.floor(Date.now() / (anim.frameMs || 100)) % frames;
    } else if (this.actionState === 'THROWING') {
        p = Math.max(0, Math.min(0.999, (15 - this.stateTimer) / 15));
    } else if (this.actionState === 'LEDGE') {
        return 0;
    } else if (this.actionState === 'LEDGE_UP') {
        if (this.stateTimer > 12) return Math.min(1, frames - 1);
        if (this.stateTimer > 6) return Math.min(2, frames - 1);
        return Math.min(3, frames - 1);
    } else if (this.actionState === 'LEDGE_ATK') {
        p = Math.max(0, Math.min(0.999, (30 - this.stateTimer) / 30));
    } else if (this.actionState === 'DODGE' || this.actionState === 'LEDGE_ROLL') {
        p = Math.max(0, Math.min(0.999, (25 - this.stateTimer) / 25));
    }
    if (p !== null) return Math.floor(p * frames);
    return Math.floor(Date.now() / (anim.frameMs || 100)) % frames;
};
window.SMA.Fighter.prototype.drawHammerChibiWeapon = function (ctx, cx, drawFootY) {
    var hideHammer = this.actionState === 'LEDGE' || this.actionState === 'LEDGE_UP' || this.actionState === 'LEDGE_ROLL' || this.actionState === 'GRAB_ATTEMPT' || this.actionState === 'GRABBING' || this.actionState === 'THROWING';
    if (hideHammer) return;
    var sign = this.facingRight ? 1 : -1;
    var s = this._hammerChibiDrawScale || window.SMA.HAMMER_CHIBI_RENDER_SCALE || 1;
    var handX = cx + sign * 15 * s;
    var handY = drawFootY - 30 * s;
    var angleDeg = sign * 30;
    var headColor = null;

    if (this.actionState === 'CHARGE') {
        var isCharged = this.chargePower > 1.2;
        headColor = isCharged ? 'white' : null;
        ctx.save();
        if (isCharged) {
            ctx.shadowBlur = (this.chargePower - 1.0) * 50 + 10;
            ctx.shadowColor = 'white';
        }
        window.SMA.drawHammer(ctx, cx + sign * 8 * s, drawFootY - 38 * s, sign * 135, '#636e72', headColor);
        ctx.restore();
        return;
    }

    if (this.actionState === 'LEDGE_ATK' && this.currentAttack) {
        var ledgeP = Math.max(0, Math.min(0.999, (30 - this.stateTimer) / 30));
        var ledgeSwingP = Math.max(0, Math.min(1, (ledgeP - 0.18) / 0.55));
        var ledgeHandX = cx + sign * (6 + ledgeP * 14) * s;
        var ledgeHandY = drawFootY - (22 + Math.sin(ledgeP * Math.PI) * 4) * s;
        angleDeg = sign * (135 + ledgeSwingP * 155);
        window.SMA.drawHammer(ctx, ledgeHandX, ledgeHandY, angleDeg, '#636e72');
        return;
    }

    if (this.actionState === 'ATTACK' && this.currentAttack) {
        var p = Math.max(0, Math.min(0.999, this.stateTimer / Math.max(1, this.currentAttack.frames || 1)));
        var shouldDraw = true;
        if (this.currentAttack.type === 'tornado') {
            if (this.charId === 'hammer' && this.stateTimer >= 80) {
                window.SMA.drawHammer(ctx, cx + sign * 24 * s, drawFootY - 28 * s, this.facingRight ? -120 : 120, '#636e72');
                return;
            }
            var spin = this.stateTimer < 15 ? this.stateTimer * 0.5 : (15 * 0.5) + (this.stateTimer - 15) * 1.2;
            var xOff = Math.cos(spin) * 30 * s;
            var widthScale = Math.sin(spin);
            ctx.save();
            ctx.translate(cx + xOff, drawFootY - 30 * s);
            ctx.scale(widthScale, 1);
            window.SMA.drawHammer(ctx, 0, 0, 90, '#636e72');
            ctx.restore();
            return;
        } else if (this.currentAttackType === 'NEUTRAL') {
            var neutralT = this.stateTimer;
            if (neutralT < 15) {
                angleDeg = 180;
                handX = cx + sign * 10 * s;
                handY = drawFootY - 42 * s;
            } else if (neutralT < 22) {
                var neutralU = Math.max(0, Math.min(1, (neutralT - 14) / 7));
                angleDeg = 180 + (190 * neutralU);
                handX = cx + sign * (10 + 10 * neutralU) * s;
                handY = drawFootY - (42 - 14 * neutralU) * s;
            } else {
                angleDeg = 10;
                handX = cx + sign * 20 * s;
                handY = drawFootY - 28 * s;
            }
        } else if (this.currentAttack.type === 'hammer_spin_air') {
            angleDeg = 0;
        } else if (this.currentAttackType === 'SIDE') {
            var sideT = this.stateTimer;
            var sideU = 0;
            if (sideT < 6) {
                angleDeg = 150;
                handY = drawFootY - 46 * s;
            } else if (sideT < 12) {
                sideU = (sideT - 6) / 6;
                angleDeg = 150 + 150 * sideU;
                handY = drawFootY - (46 - 24 * sideU) * s;
            } else if (sideT < 18) {
                angleDeg = 300;
                handY = drawFootY - 22 * s;
            } else if (sideT < 24) {
                sideU = (sideT - 18) / 6;
                angleDeg = 300 - 150 * sideU;
                handY = drawFootY - (22 + 24 * sideU) * s;
            } else if (sideT < 32) {
                sideU = (sideT - 24) / 8;
                angleDeg = 150 + 150 * sideU;
                handY = drawFootY - (46 - 24 * sideU) * s;
            } else {
                angleDeg = 300;
                handY = drawFootY - 22 * s;
            }
            handX = cx + sign * (14 + Math.min(1, sideT / 42) * 18) * s;
        } else if (this.currentAttackType === 'AIR_SIDE') {
            var airSideT = Math.max(0, Math.min(1, this.stateTimer / Math.max(1, this.currentAttack.frames || 18)));
            angleDeg = -170 + (135 * airSideT);
        } else if (this.currentAttackType === 'spin_hammer') {
            angleDeg = -180 + (p * 270);
        } else if (this.currentAttackType === 'UP') {
            var groundUpT = this.stateTimer;
            var groundUpU = 0;
            if (groundUpT < 11) {
                angleDeg = -90;
                handX = cx + sign * 15 * s;
                handY = drawFootY - 45 * s;
            } else if (groundUpT < 21) {
                groundUpU = (groundUpT - 11) / 10;
                angleDeg = -90 - 180 * groundUpU;
                handX = cx + sign * (15 - 26 * groundUpU) * s;
                handY = drawFootY - (45 + Math.sin(groundUpU * Math.PI) * 28) * s;
            } else {
                angleDeg = -270;
                handX = cx - sign * 11 * s;
                handY = drawFootY - 45 * s;
            }
        } else if (this.currentAttackType === 'AIR_UP') {
            var upT = this.stateTimer;
            var upU = 0;
            if (upT < 11) {
                angleDeg = -90;
                handX = cx + sign * 15 * s;
                handY = drawFootY - 58 * s;
            } else if (upT < 21) {
                upU = (upT - 11) / 10;
                angleDeg = -90 - 180 * upU;
                handX = cx + sign * (15 - 26 * upU) * s;
                handY = drawFootY - (58 + Math.sin(upU * Math.PI) * 20) * s;
            } else {
                angleDeg = -270;
                handX = cx - sign * 11 * s;
                handY = drawFootY - 58 * s;
            }
        } else if (this.currentAttackType === 'DOWN' || this.currentAttackType === 'AIR_DOWN') {
            angleDeg = 45 + (135 - 45) * p;
        } else {
            shouldDraw = false;
        }
        if (!shouldDraw) return;
        if (!this.facingRight) {
            if (this.currentAttack.type !== 'spin_hammer' && this.currentAttack.type !== 'hammer_spin_air' && this.currentAttackType !== 'SIDE') angleDeg = -angleDeg;
            else if (this.currentAttack.type === 'hammer_spin_air') angleDeg = 0;
            else angleDeg = -angleDeg;
        }
    } else {
        handX = cx + sign * 2 * s;
        handY = drawFootY - 32 * s;
        angleDeg = this.facingRight ? -125 : 125;
    }

    window.SMA.drawHammer(ctx, handX, handY, angleDeg, '#636e72');
};
window.SMA.Fighter.prototype.drawHammerChibiSprite = function (ctx, cx) {
    var anim = window.SMA.resolveHammerChibiAnim(this);
    if (!anim) return false;
    var img = window.SMA.getSpriteAsset(anim.key, anim.src);
    if (!img.complete || !img.naturalWidth) return true;

    var fw = anim.frameW || window.SMA.HAMMER_CHIBI_FRAME_W || 128;
    var fh = anim.frameH || window.SMA.HAMMER_CHIBI_FRAME || 128;
    var baseline = anim.baseline || window.SMA.HAMMER_CHIBI_BASELINE || 116;
    var spriteScale = anim.renderScale || window.SMA.HAMMER_CHIBI_RENDER_SCALE || 1;
    var frame = this.getHammerChibiFrame(anim);
    var sx = Math.min(frame, (anim.frames || 1) - 1) * fw;
    var footY = this.y + this.h;
    var drawCx = cx;
    var drawFootY = footY;

    if (this.actionState === 'LEDGE_UP' && this.ledgeGrabbed) {
        var ledgePlatform = this.ledgeGrabbed.platform;
        var ledgeDir = this.ledgeGrabbed.dir;
        var ledgeTopX = (ledgeDir === 'left') ? ledgePlatform.x : (ledgePlatform.x + ledgePlatform.w - this.w);
        var t = Math.max(0, Math.min(1, (20 - this.stateTimer) / 20));
        var eased = t * t * (3 - 2 * t);
        drawCx = cx + ((ledgeTopX + this.w / 2) - cx) * eased;
        drawFootY = footY + (ledgePlatform.y - footY) * eased;
    }
    if (this.actionState === 'ATTACK' && this.currentAttackType === 'SIDE' && this.currentAttack) {
        var sideAdvance = Math.min(1, this.stateTimer / Math.max(1, (this.currentAttack.frames || 50) * 0.84));
        drawCx += (this.facingRight ? 1 : -1) * 14 * spriteScale * sideAdvance;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(drawCx, drawFootY);
    if (!this.facingRight) {
        ctx.scale(-1, 1);
    }
    ctx.drawImage(img, sx, 0, fw, fh, -fw * spriteScale / 2, -baseline * spriteScale, fw * spriteScale, fh * spriteScale);
    ctx.restore();

    this._hammerChibiDrawScale = spriteScale;
    this.drawHammerChibiWeapon(ctx, drawCx, drawFootY);
    this._hammerChibiDrawScale = null;

    if (this.actionState === 'SHIELD') {
        ctx.save();
        ctx.fillStyle = 'rgba(116, 185, 255, ' + (this.shieldHP / 150) + ')';
        ctx.strokeStyle = '#0984e3';
        ctx.beginPath();
        ctx.arc(cx, this.y + this.h / 2, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    return true;
};
window.SMA.SPEAR_CHIBI_FRAME = 128;
window.SMA.SPEAR_CHIBI_FRAME_W = 224;
window.SMA.SPEAR_CHIBI_BASELINE = 118;
window.SMA.SPEAR_CHIBI_RENDER_SCALE = 0.8;
window.SMA.SPEAR_CHIBI_ANIMS = {
    idle: { key: 'spear_chibi_idle', src: 'assets/characters/spear/spear_idle_sheet.png?v=3', frames: 4, frameMs: 240, baseline: 118 },
    run: { key: 'spear_chibi_run', src: 'assets/characters/spear/spear_run_sheet.png?v=3', frames: 4, frameMs: 62, baseline: 118 },
    jump: { key: 'spear_chibi_jump', src: 'assets/characters/spear/spear_jump_sheet.png?v=3', frames: 2, frameMs: 180, baseline: 118 },
    fall: { key: 'spear_chibi_fall', src: 'assets/characters/spear/spear_fall_sheet.png?v=4', frames: 1, frameMs: 190, baseline: 118 },
    hurt: { key: 'spear_chibi_hurt', src: 'assets/characters/spear/spear_hurt_sheet.png?v=2', frames: 4, frameMs: 80, baseline: 118 },
    charge: { key: 'spear_chibi_charge', src: 'assets/characters/spear/spear_charge_sheet.png?v=2', frames: 4, frameMs: 90, baseline: 118 },
    attackNeutral: { key: 'spear_chibi_attack_neutral', src: 'assets/characters/spear/spear_attack_neutral_sheet.png?v=2', frames: 4, frameMs: 64, baseline: 118 },
    attackSide: { key: 'spear_chibi_attack_side', src: 'assets/characters/spear/spear_attack_side_sheet.png?v=2', frames: 6, frameMs: 58, baseline: 118 },
    attackUp: { key: 'spear_chibi_attack_up', src: 'assets/characters/spear/spear_attack_up_sheet.png?v=2', frames: 6, frameMs: 58, baseline: 118 },
    attackDown: { key: 'spear_chibi_attack_down', src: 'assets/characters/spear/spear_attack_down_sheet.png?v=2', frames: 6, frameMs: 58, baseline: 118 },
    airNeutral: { key: 'spear_chibi_air_neutral', src: 'assets/characters/spear/spear_air_neutral_sheet.png?v=2', frames: 4, frameMs: 58, baseline: 118 },
    airSide: { key: 'spear_chibi_air_side', src: 'assets/characters/spear/spear_air_side_sheet.png?v=2', frames: 6, frameMs: 58, baseline: 118 },
    airUp: { key: 'spear_chibi_air_up', src: 'assets/characters/spear/spear_air_up_sheet.png?v=2', frames: 6, frameMs: 52, baseline: 118 },
    airDown: { key: 'spear_chibi_air_down', src: 'assets/characters/spear/spear_air_down_sheet.png?v=2', frames: 6, frameMs: 58, baseline: 118 },
    grab: { key: 'spear_chibi_grab', src: 'assets/characters/spear/spear_grab_sheet.png?v=2', frames: 4, frameMs: 62, baseline: 118 },
    grabHold: { key: 'spear_chibi_grab_hold', src: 'assets/characters/spear/spear_grab_hold_sheet.png?v=2', frames: 4, frameMs: 100, baseline: 118 },
    throw: { key: 'spear_chibi_throw', src: 'assets/characters/spear/spear_throw_sheet.png?v=2', frames: 4, frameMs: 68, baseline: 118 },
    dodge: { key: 'spear_chibi_dodge', src: 'assets/characters/spear/spear_dodge_sheet.png?v=2', frames: 4, frameMs: 55, baseline: 118 },
    ledge: { key: 'spear_chibi_ledge', src: 'assets/characters/spear/spear_ledge_sheet.png?v=2', frames: 4, frameMs: 110, baseline: 118 }
};
for (var spearChibiAnimKey in window.SMA.SPEAR_CHIBI_ANIMS) {
    if (Object.prototype.hasOwnProperty.call(window.SMA.SPEAR_CHIBI_ANIMS, spearChibiAnimKey)) {
        window.SMA.SPEAR_CHIBI_ANIMS[spearChibiAnimKey].frameW = window.SMA.SPEAR_CHIBI_FRAME_W;
    }
}
window.SMA.preloadSpearChibiSprites = function () {
    var anims = window.SMA.SPEAR_CHIBI_ANIMS || {};
    for (var k in anims) {
        if (Object.prototype.hasOwnProperty.call(anims, k)) {
            window.SMA.getSpriteAsset(anims[k].key, anims[k].src);
        }
    }
    var weapon = window.SMA.SPEAR_WEAPON_ASSET;
    if (weapon) window.SMA.getSpriteAsset(weapon.key, weapon.src);
    var shockwave = window.SMA.SPEAR_GROUND_SHOCKWAVE_ASSET;
    if (shockwave) window.SMA.getSpriteAsset(shockwave.key, shockwave.src);
};
window.SMA.resolveSpearChibiAnim = function (fighter) {
    var A = window.SMA.SPEAR_CHIBI_ANIMS;
    if (!A || !fighter || fighter.charId !== 'spear') return null;
    if (fighter.actionState === 'STUN' || fighter.actionState === 'GRABBED') return A.hurt;
    if (fighter.actionState === 'CHARGE') return A.charge;
    if (fighter.actionState === 'DODGE' || fighter.actionState === 'LEDGE_ROLL') return A.dodge;
    if (fighter.actionState === 'LEDGE' || fighter.actionState === 'LEDGE_UP') return A.ledge;
    if (fighter.actionState === 'LEDGE_ATK') return A.attackSide;
    if (fighter.actionState === 'GRAB_ATTEMPT') return A.grab;
    if (fighter.actionState === 'GRABBING') return A.grabHold || A.throw;
    if (fighter.actionState === 'THROWING') return A.throw;
    if (fighter.actionState === 'ATTACK') {
        if (fighter.currentAttackType === 'SIDE') return A.attackSide;
        if (fighter.currentAttackType === 'UP') return A.attackUp;
        if (fighter.currentAttackType === 'DOWN') return A.attackDown;
        if (fighter.currentAttackType === 'AIR_NEUTRAL') return A.airNeutral;
        if (fighter.currentAttackType === 'AIR_SIDE') return A.airSide;
        if (fighter.currentAttackType === 'AIR_UP') return A.airUp;
        if (fighter.currentAttackType === 'AIR_DOWN') return A.airDown;
        return A.attackNeutral;
    }
    if (!fighter.isGrounded) return fighter.vy < 0 ? A.jump : A.fall;
    if (Math.abs(fighter.vx) > 0.7) return A.run;
    return A.idle;
};
window.SMA.Fighter.prototype.getSpearChibiFrame = function (anim) {
    var frames = anim.frames || 1;
    var p = null;
    if (this.actionState === 'STUN') {
        var stunSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (!this.isGrounded || stunSpeed > 4) return Math.min(1, frames - 1);
        return this.stateTimer > 20 ? Math.min(2, frames - 1) : Math.min(3, frames - 1);
    }
    if (this.actionState === 'GRABBED') return Math.min(1, frames - 1);
    if (this.actionState === 'ATTACK' && this.currentAttack) {
        p = Math.max(0, Math.min(0.999, this.stateTimer / Math.max(1, this.currentAttack.frames || frames)));
    } else if (this.actionState === 'GRAB_ATTEMPT') {
        p = Math.max(0, Math.min(0.999, this.stateTimer / 15));
    } else if (this.actionState === 'GRABBING') {
        return Math.floor(Date.now() / (anim.frameMs || 100)) % frames;
    } else if (this.actionState === 'THROWING') {
        p = Math.max(0, Math.min(0.999, (15 - this.stateTimer) / 15));
    } else if (this.actionState === 'LEDGE') {
        return 0;
    } else if (this.actionState === 'LEDGE_UP') {
        if (this.stateTimer > 12) return Math.min(1, frames - 1);
        if (this.stateTimer > 6) return Math.min(2, frames - 1);
        return Math.min(3, frames - 1);
    } else if (this.actionState === 'LEDGE_ATK') {
        p = Math.max(0, Math.min(0.999, (30 - this.stateTimer) / 30));
    } else if (this.actionState === 'DODGE' || this.actionState === 'LEDGE_ROLL') {
        p = Math.max(0, Math.min(0.999, (25 - this.stateTimer) / 25));
    }
    if (p !== null) return Math.floor(p * frames);
    return Math.floor(Date.now() / (anim.frameMs || 100)) % frames;
};
window.SMA.Fighter.prototype.getSpearChibiWeaponPose = function (cx, drawFootY) {
    var sign = this.facingRight ? 1 : -1;
    var s = window.SMA.SPEAR_CHIBI_RENDER_SCALE || 1;
    var footY = drawFootY || (this.y + this.h);
    var handX = cx + sign * 16 * s;
    var handY = footY - 42 * s;
    var angleDeg = -78;
    var draw = true;
    var progress = 0;

    if (this.actionState === 'CHARGE') {
        progress = Math.min(1, Math.max(0, this.chargePower - 1));
        handX = cx - sign * (10 + progress * 2) * s;
        handY = footY - (43 + progress * 3) * s;
        angleDeg = -150;
    } else if (this.actionState === 'LEDGE_ATK') {
        progress = Math.max(0, Math.min(0.999, (30 - this.stateTimer) / 30));
        handX = cx + sign * (16 + Math.sin(progress * Math.PI) * 36) * s;
        handY = footY - (41 + Math.sin(progress * Math.PI) * 5) * s;
        angleDeg = -22;
    } else if (this.actionState === 'ATTACK' && this.currentAttack) {
        progress = Math.max(0, Math.min(0.999, this.stateTimer / Math.max(1, this.currentAttack.frames || 1)));
        if (this.currentAttackType === 'SIDE' || this.currentAttackType === 'AIR_SIDE') {
            if (this.stateTimer >= 6) draw = false;
            handX = cx + sign * (17 + progress * 16) * s;
            handY = footY - (43 - progress * 2) * s;
            angleDeg = -32 + progress * 70;
        } else if (this.currentAttackType === 'UP') {
            if (this.stateTimer >= 6) draw = false;
            handX = cx + sign * 11 * s;
            handY = footY - (54 + Math.sin(progress * Math.PI) * 22) * s;
            angleDeg = -86 + progress * 54;
        } else if (this.currentAttackType === 'DOWN') {
            handX = cx + sign * (10 + progress * 12) * s;
            handY = progress < 0.32 ? footY - 60 * s : footY - 24 * s;
            angleDeg = progress < 0.32 ? -88 : 86;
        } else if (this.currentAttackType === 'NEUTRAL' || this.currentAttackType === 'AIR_NEUTRAL') {
            var thrust = Math.sin(progress * Math.PI);
            handX = cx + sign * (19 + thrust * 39) * s;
            handY = footY - 42 * s;
            angleDeg = -18;
        } else if (this.currentAttackType === 'AIR_UP') {
            handX = cx + sign * 9 * s;
            handY = footY - (71 + Math.sin(progress * Math.PI) * 7) * s;
            angleDeg = -90;
        } else if (this.currentAttackType === 'AIR_DOWN') {
            if (this.stateTimer >= 6) draw = false;
            handX = cx + sign * (14 + progress * 16) * s;
            handY = footY - (34 - progress * 9) * s;
            angleDeg = 72;
        }
    }

    if (!this.facingRight && angleDeg !== 90 && angleDeg !== -90) {
        angleDeg = -180 - angleDeg;
    }
    return { draw: draw, handX: handX, handY: handY, angleDeg: angleDeg };
};
window.SMA.Fighter.prototype.drawSpearChibiWeapon = function (ctx, cx, drawFootY) {
    var hideSpear = this.actionState === 'LEDGE' || this.actionState === 'LEDGE_UP' || this.actionState === 'LEDGE_ROLL' || this.actionState === 'GRAB_ATTEMPT' || this.actionState === 'GRABBING' || this.actionState === 'THROWING';
    if (hideSpear) return;
    if (this.actionState === 'ATTACK' && this.currentAttack && (this.currentAttackType === 'SIDE' || this.currentAttackType === 'AIR_SIDE' || this.currentAttackType === 'UP' || this.currentAttackType === 'AIR_UP' || this.currentAttackType === 'AIR_DOWN' || this.currentAttack.type === 'boomerang_up') && this.stateTimer >= 6) {
        return;
    }
    var pose = this.getSpearChibiWeaponPose(cx, drawFootY);
    if (!pose || !pose.draw) return;
    var charged = this.chargePower > 1.2;
    ctx.save();
    if (charged) {
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#ffffff';
    }
    window.SMA.drawTrident(ctx, pose.handX, pose.handY, pose.angleDeg, '#00b894', charged ? '#ffffff' : null);
    ctx.restore();
};
window.SMA.Fighter.prototype.drawSpearChibiSprite = function (ctx, cx) {
    var anim = window.SMA.resolveSpearChibiAnim(this);
    if (!anim) return false;
    var img = window.SMA.getSpriteAsset(anim.key, anim.src);
    if (!img.complete || !img.naturalWidth) return true;

    var fw = anim.frameW || window.SMA.SPEAR_CHIBI_FRAME_W || 224;
    var fh = anim.frameH || window.SMA.SPEAR_CHIBI_FRAME || 128;
    var baseline = anim.baseline || window.SMA.SPEAR_CHIBI_BASELINE || 118;
    var spriteScale = window.SMA.SPEAR_CHIBI_RENDER_SCALE || 1;
    var frame = this.getSpearChibiFrame(anim);
    var sx = Math.min(frame, (anim.frames || 1) - 1) * fw;
    var footY = this.y + this.h;
    var drawCx = cx;
    var drawFootY = footY;

    if (this.actionState === 'LEDGE_UP' && this.ledgeGrabbed) {
        var ledgePlatform = this.ledgeGrabbed.platform;
        var ledgeDir = this.ledgeGrabbed.dir;
        var ledgeTopX = (ledgeDir === 'left') ? ledgePlatform.x : (ledgePlatform.x + ledgePlatform.w - this.w);
        var t = Math.max(0, Math.min(1, (20 - this.stateTimer) / 20));
        var eased = t * t * (3 - 2 * t);
        drawCx = cx + ((ledgeTopX + this.w / 2) - cx) * eased;
        drawFootY = footY + (ledgePlatform.y - footY) * eased;
    }

    var weaponInFront = this.actionState === 'ATTACK' || this.actionState === 'LEDGE_ATK';
    if (!weaponInFront) {
        this.drawSpearChibiWeapon(ctx, drawCx, drawFootY);
    }

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(drawCx, drawFootY);
    if (!this.facingRight) {
        ctx.scale(-1, 1);
    }
    ctx.drawImage(img, sx, 0, fw, fh, -fw * spriteScale / 2, -baseline * spriteScale, fw * spriteScale, fh * spriteScale);
    ctx.restore();

    if (weaponInFront) {
        this.drawSpearChibiWeapon(ctx, drawCx, drawFootY);
    }

    if (this.actionState === 'SHIELD') {
        ctx.save();
        ctx.fillStyle = 'rgba(116, 185, 255, ' + (this.shieldHP / 150) + ')';
        ctx.strokeStyle = '#0984e3';
        ctx.beginPath();
        ctx.arc(cx, this.y + this.h / 2, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    return true;
};
window.SMA.MIRROR_CHIBI_FRAME = 160;
window.SMA.MIRROR_CHIBI_FRAME_W = 160;
window.SMA.MIRROR_CHIBI_BASELINE = 148;
window.SMA.MIRROR_CHIBI_RENDER_SCALE = 0.56;
window.SMA.MIRROR_PROP_ASSET = { key: 'mirror_prop_v1', src: 'assets/characters/mirror/mirror_prop.png?v=1', w: 96, h: 144 };
window.SMA.MIRROR_CHIBI_ANIMS = {
    idle: { key: 'mirror_chibi_idle', src: 'assets/characters/mirror/mirror_idle_sheet.png?v=1', frames: 4, frameMs: 240, baseline: 148 },
    run: { key: 'mirror_chibi_run_v3', src: 'assets/characters/mirror/mirror_run_sheet_v3.png?v=1', frames: 4, frameMs: 76, baseline: 148 },
    jump: { key: 'mirror_chibi_jump', src: 'assets/characters/mirror/mirror_jump_sheet.png?v=1', frames: 2, frameMs: 170, baseline: 148, renderScale: 0.52 },
    fall: { key: 'mirror_chibi_fall_v2', src: 'assets/characters/mirror/mirror_fall_sheet_v2.png?v=1', frames: 1, frameMs: 180, baseline: 148, renderScale: 0.52 },
    hurt: { key: 'mirror_chibi_hurt', src: 'assets/characters/mirror/mirror_hurt_sheet.png?v=1', frames: 2, frameMs: 90, baseline: 148 },
    charge: { key: 'mirror_chibi_charge', src: 'assets/characters/mirror/mirror_charge_sheet.png?v=1', frames: 4, frameMs: 100, baseline: 148 },
    attackNeutral: { key: 'mirror_chibi_attack_neutral', src: 'assets/characters/mirror/mirror_attack_neutral_sheet.png?v=1', frames: 4, frameMs: 48, baseline: 148 },
    attackSide: { key: 'mirror_chibi_attack_side', src: 'assets/characters/mirror/mirror_attack_side_sheet.png?v=1', frames: 4, frameMs: 62, baseline: 148 },
    attackUp: { key: 'mirror_chibi_attack_up', src: 'assets/characters/mirror/mirror_attack_up_sheet.png?v=1', frames: 4, frameMs: 62, baseline: 148 },
    attackDownSummon: { key: 'mirror_chibi_attack_down_summon', src: 'assets/characters/mirror/mirror_attack_down_summon_sheet.png?v=1', frames: 4, frameMs: 64, baseline: 148 },
    attackDownSwap: { key: 'mirror_chibi_attack_down_swap', src: 'assets/characters/mirror/mirror_attack_down_swap_sheet.png?v=1', frames: 4, frameMs: 60, baseline: 148 },
    airNeutral: { key: 'mirror_chibi_air_neutral', src: 'assets/characters/mirror/mirror_air_neutral_sheet.png?v=1', frames: 4, frameMs: 60, baseline: 148 },
    airSide: { key: 'mirror_chibi_air_side', src: 'assets/characters/mirror/mirror_air_side_sheet.png?v=1', frames: 4, frameMs: 62, baseline: 148 },
    airUp: { key: 'mirror_chibi_air_up', src: 'assets/characters/mirror/mirror_air_up_sheet.png?v=1', frames: 4, frameMs: 62, baseline: 148 },
    airDown: { key: 'mirror_chibi_air_down', src: 'assets/characters/mirror/mirror_air_down_sheet.png?v=1', frames: 4, frameMs: 62, baseline: 148 },
    grab: { key: 'mirror_chibi_grab', src: 'assets/characters/mirror/mirror_grab_sheet.png?v=1', frames: 4, frameMs: 62, baseline: 148 },
    grabHold: { key: 'mirror_chibi_grab_hold', src: 'assets/characters/mirror/mirror_grab_hold_sheet.png?v=1', frames: 4, frameMs: 100, baseline: 148 },
    throw: { key: 'mirror_chibi_throw', src: 'assets/characters/mirror/mirror_throw_sheet.png?v=1', frames: 4, frameMs: 68, baseline: 148 },
    dodge: { key: 'mirror_chibi_dodge', src: 'assets/characters/mirror/mirror_dodge_sheet.png?v=1', frames: 4, frameMs: 55, baseline: 148 },
    ledge: { key: 'mirror_chibi_ledge_v2', src: 'assets/characters/mirror/mirror_ledge_sheet.png?v=1', frames: 4, frameMs: 110, baseline: 148, renderScale: 0.68 },
    ledgeAttack: { key: 'mirror_chibi_ledge_attack', src: 'assets/characters/mirror/mirror_ledge_attack_sheet.png?v=1', frames: 4, frameMs: 70, baseline: 148 },
    ledgeRoll: { key: 'mirror_chibi_ledge_roll', src: 'assets/characters/mirror/mirror_ledge_roll_sheet.png?v=1', frames: 4, frameMs: 55, baseline: 148 }
};
for (var mirrorChibiAnimKey in window.SMA.MIRROR_CHIBI_ANIMS) {
    if (Object.prototype.hasOwnProperty.call(window.SMA.MIRROR_CHIBI_ANIMS, mirrorChibiAnimKey)) {
        window.SMA.MIRROR_CHIBI_ANIMS[mirrorChibiAnimKey].frameW = window.SMA.MIRROR_CHIBI_FRAME_W;
        window.SMA.MIRROR_CHIBI_ANIMS[mirrorChibiAnimKey].frameH = window.SMA.MIRROR_CHIBI_FRAME;
    }
}
window.SMA.preloadMirrorChibiSprites = function () {
    var anims = window.SMA.MIRROR_CHIBI_ANIMS || {};
    for (var k in anims) {
        if (Object.prototype.hasOwnProperty.call(anims, k)) {
            window.SMA.getSpriteAsset(anims[k].key, anims[k].src);
        }
    }
    var prop = window.SMA.MIRROR_PROP_ASSET;
    if (prop) window.SMA.getSpriteAsset(prop.key, prop.src);
};
window.SMA.resolveMirrorChibiAnim = function (fighter) {
    var A = window.SMA.MIRROR_CHIBI_ANIMS;
    if (!A || !fighter || fighter.charId !== 'mirror') return null;
    if (fighter.actionState === 'STUN' || fighter.actionState === 'GRABBED') return A.hurt;
    if (fighter.actionState === 'CHARGE') return A.charge;
    if (fighter.actionState === 'DODGE') return A.dodge;
    if (fighter.actionState === 'LEDGE_ROLL') return A.ledgeRoll || A.dodge;
    if (fighter.actionState === 'LEDGE' || fighter.actionState === 'LEDGE_UP') return A.ledge;
    if (fighter.actionState === 'LEDGE_ATK') return A.ledgeAttack || A.attackSide;
    if (fighter.actionState === 'GRAB_ATTEMPT') return A.grab;
    if (fighter.actionState === 'GRABBING') return A.grabHold || A.throw;
    if (fighter.actionState === 'THROWING') return A.throw;
    if (fighter.actionState === 'LAG' && fighter._mirrorChibiDownVariant === 'swap') return A.attackDownSwap;
    if (fighter.actionState === 'LAG' && fighter._mirrorChibiDownVariant === 'summon') return A.attackDownSummon;
    if (fighter.actionState === 'LAG') return A.idle;
    if (fighter.actionState === 'ATTACK' && fighter.currentAttack) {
        if (fighter.currentAttackType === 'AIR_NEUTRAL') return A.airNeutral;
        if (fighter.currentAttackType === 'AIR_SIDE') return A.airSide;
        if (fighter.currentAttackType === 'AIR_UP') return A.airUp;
        if (fighter.currentAttackType === 'AIR_DOWN') {
            if (fighter.currentAttack.type === 'mirror_place') {
                return fighter._mirrorChibiDownVariant === 'swap' ? A.attackDownSwap : A.attackDownSummon;
            }
            return A.airDown;
        }
        if (fighter.currentAttackType === 'SIDE') return A.attackSide;
        if (fighter.currentAttackType === 'UP') return A.attackUp;
        if (fighter.currentAttackType === 'DOWN') {
            return fighter._mirrorChibiDownVariant === 'swap' ? A.attackDownSwap : A.attackDownSummon;
        }
        return A.attackNeutral;
    }
    if (!fighter.isGrounded) return fighter.vy < 0 ? A.jump : A.fall;
    if (Math.abs(fighter.vx) > 0.6) return A.run;
    return A.idle;
};
window.SMA.Fighter.prototype.getMirrorChibiFrame = function (anim) {
    var frames = anim.frames || 1;
    if (frames <= 1) return 0;
    var p = null;
    if (this.actionState === 'STUN') {
        var stunSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        return (!this.isGrounded || stunSpeed > 4) ? Math.min(1, frames - 1) : 0;
    }
    if (this.actionState === 'GRABBED') return Math.min(1, frames - 1);
    if (this.actionState === 'ATTACK' && this.currentAttack) {
        if (this.currentAttack.type === 'mirror_place') {
            p = Math.max(0, Math.min(0.999, this.stateTimer / 24));
        } else {
            p = Math.max(0, Math.min(0.999, this.stateTimer / Math.max(1, this.currentAttack.frames || frames)));
        }
    } else if (this.actionState === 'LAG' && this._mirrorChibiDownVariant) {
        var lagTotal = this._mirrorChibiDownVariant === 'swap' ? 18 : 12;
        p = Math.max(0, Math.min(0.999, (lagTotal - this.stateTimer) / lagTotal));
    } else if (this.actionState === 'GRAB_ATTEMPT') {
        p = Math.max(0, Math.min(0.999, this.stateTimer / 15));
    } else if (this.actionState === 'GRABBING') {
        return Math.floor(Date.now() / (anim.frameMs || 100)) % frames;
    } else if (this.actionState === 'THROWING') {
        p = Math.max(0, Math.min(0.999, (15 - this.stateTimer) / 15));
    } else if (this.actionState === 'LEDGE') {
        return 0;
    } else if (this.actionState === 'LEDGE_UP') {
        if (this.stateTimer > 12) return Math.min(1, frames - 1);
        if (this.stateTimer > 6) return Math.min(2, frames - 1);
        return Math.min(3, frames - 1);
    } else if (this.actionState === 'LEDGE_ATK') {
        p = Math.max(0, Math.min(0.999, (30 - this.stateTimer) / 30));
    } else if (this.actionState === 'DODGE' || this.actionState === 'LEDGE_ROLL') {
        p = Math.max(0, Math.min(0.999, (25 - this.stateTimer) / 25));
    }
    if (p !== null) return Math.floor(p * frames);
    return Math.floor(Date.now() / (anim.frameMs || 100)) % frames;
};
window.SMA.drawMirrorPropImage = function (ctx, x, y, angle, scale, alpha, tone) {
    var prop = window.SMA.MIRROR_PROP_ASSET;
    var img = prop ? window.SMA.getSpriteAsset(prop.key, prop.src) : null;
    var w = prop ? prop.w : 96;
    var h = prop ? prop.h : 144;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.scale(scale || 1, scale || 1);
    ctx.globalAlpha *= (alpha === undefined ? 1 : alpha);
    if (img && img.complete && img.naturalWidth) {
        if (tone === 'cooldown') ctx.filter = 'grayscale(1) brightness(0.38) contrast(1.1)';
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        if (tone === 'cooldown') ctx.filter = 'none';
    } else {
        ctx.shadowBlur = 8;
        ctx.shadowColor = tone === 'cooldown' ? 'rgba(60, 64, 72, 0.65)' : 'rgba(129, 236, 236, 0.75)';
        ctx.fillStyle = tone === 'cooldown' ? 'rgba(58, 62, 70, 0.55)' : 'rgba(220, 255, 255, 0.38)';
        ctx.strokeStyle = tone === 'cooldown' ? '#3a3f48' : '#81ecec';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-3, -9);
        ctx.lineTo(3, 9);
        ctx.stroke();
        ctx.strokeStyle = tone === 'cooldown' ? '#3a3f48' : '#81ecec';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(0, 24);
        ctx.stroke();
    }
    ctx.restore();
};
window.SMA.Fighter.prototype.drawMirrorChibiFocus = function (ctx, cx, drawFootY, spriteScale) {
    var hidden = this.actionState === 'LEDGE' || this.actionState === 'LEDGE_UP' || this.actionState === 'LEDGE_ROLL' || this.actionState === 'GRAB_ATTEMPT' || this.actionState === 'GRABBING' || this.actionState === 'THROWING' || this.actionState === 'STUN' || this.actionState === 'GRABBED';
    if (hidden) return;
    var sign = this.facingRight ? 1 : -1;
    var s = 1;
    var yS = 0.78;
    var hover = Math.sin(Date.now() / 220) * 4 * yS;
    var mirX = cx + sign * 42 * s;
    var mirY = drawFootY - 58 * yS + hover;
    var mirScale = 1.0;
    var mirAngle = 0;
    var alpha = 0.85;

    if (this.actionState === 'ATTACK' && this.currentAttack) {
        var p = Math.max(0, Math.min(0.999, this.stateTimer / Math.max(1, this.currentAttack.frames || 1)));
        var arc = Math.sin(p * Math.PI);
        if (this.currentAttack.type === 'mirror_spin' || this.currentAttackType === 'AIR_NEUTRAL') {
            var spin = p * Math.PI * 2;
            mirX = cx + sign * Math.cos(spin) * 58 * s;
            mirY = drawFootY - 62 * yS + Math.sin(spin) * 42 * yS;
            mirScale = 1.05;
        } else if (this.currentAttack.type === 'mirror_throw_up' || this.currentAttackType === 'UP' || this.currentAttackType === 'AIR_UP') {
            mirX = cx;
            mirY = drawFootY - (82 + arc * 46) * yS;
            mirAngle = p * Math.PI * 4;
            mirScale = 1.25;
        } else if (this.currentAttack.type === 'mirror_throw' || this.currentAttackType === 'SIDE' || this.currentAttackType === 'AIR_SIDE') {
            mirX = cx + sign * (30 + arc * 58) * s;
            mirY = drawFootY - 57 * yS;
            mirAngle = p * Math.PI * 4;
            mirScale = 1.25;
        } else if (this.currentAttack.type === 'mirror_slash' || this.currentAttackType === 'NEUTRAL') {
            mirX = cx + sign * (30 + arc * 22) * s;
            mirY = drawFootY - 60 * yS;
            mirAngle = sign * 0.4;
            mirScale = 1.15;
        } else if (this.currentAttack.type === 'mirror_place' || this.currentAttackType === 'DOWN' || this.currentAttackType === 'AIR_DOWN') {
            mirX = cx + sign * 34 * s;
            mirY = drawFootY - (24 + arc * 32) * yS;
            mirAngle = p * Math.PI * 3;
            mirScale = this._mirrorChibiDownVariant === 'swap' ? 1.45 : 1.2;
            alpha = this._mirrorChibiDownVariant === 'swap' ? 0.95 : 0.8;
        }
    } else if (this.actionState === 'CHARGE') {
        var charged = this.chargePower > 1.2;
        mirX += (Math.random() - 0.5) * 4 * s;
        mirY += (Math.random() - 0.5) * 4 * yS;
        mirScale = charged ? 1.2 : 1.0;
        alpha = charged ? 0.95 : 0.78;
    }

    window.SMA.drawMirrorPropImage(ctx, mirX, mirY, mirAngle, 0.34 * mirScale, alpha, this.mirrorCooldown > 0 ? 'cooldown' : null);
};
window.SMA.Fighter.prototype.drawMirrorChibiSprite = function (ctx, cx) {
    var anim = window.SMA.resolveMirrorChibiAnim(this);
    if (!anim) return false;
    var img = window.SMA.getSpriteAsset(anim.key, anim.src);
    if (!img.complete || !img.naturalWidth) return true;

    var fw = anim.frameW || window.SMA.MIRROR_CHIBI_FRAME_W || 160;
    var fh = anim.frameH || window.SMA.MIRROR_CHIBI_FRAME || 160;
    var baseline = anim.baseline || window.SMA.MIRROR_CHIBI_BASELINE || 148;
    var spriteScale = anim.renderScale || window.SMA.MIRROR_CHIBI_RENDER_SCALE || 1;
    var frame = this.getMirrorChibiFrame(anim);
    var sx = Math.min(frame, (anim.frames || 1) - 1) * fw;
    var footY = this.y + this.h;
    var drawCx = cx;
    var drawFootY = footY;

    if (this.actionState === 'LEDGE_UP' && this.ledgeGrabbed) {
        var ledgePlatform = this.ledgeGrabbed.platform;
        var ledgeDir = this.ledgeGrabbed.dir;
        var ledgeTopX = (ledgeDir === 'left') ? ledgePlatform.x : (ledgePlatform.x + ledgePlatform.w - this.w);
        var t = Math.max(0, Math.min(1, (20 - this.stateTimer) / 20));
        var eased = t * t * (3 - 2 * t);
        drawCx = cx + ((ledgeTopX + this.w / 2) - cx) * eased;
        drawFootY = footY + (ledgePlatform.y - footY) * eased;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(drawCx, drawFootY);
    if (!this.facingRight) {
        ctx.scale(-1, 1);
    }
    ctx.drawImage(img, sx, 0, fw, fh, -fw * spriteScale / 2, -baseline * spriteScale, fw * spriteScale, fh * spriteScale);
    ctx.restore();

    this.drawMirrorChibiFocus(ctx, drawCx, drawFootY, spriteScale);

    if (this.actionState === 'SHIELD') {
        ctx.save();
        ctx.fillStyle = 'rgba(116, 185, 255, ' + (this.shieldHP / 150) + ')';
        ctx.strokeStyle = '#0984e3';
        ctx.beginPath();
        ctx.arc(cx, this.y + this.h / 2, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    return true;
};
window.SMA.Fighter.prototype.drawMirrorChibiGhost = function (ctx, cloneCx, cloneFootY, cloneFacingRight) {
    var anim = window.SMA.resolveMirrorChibiAnim(this);
    if (!anim) return false;
    var img = window.SMA.getSpriteAsset(anim.key, anim.src);
    if (!img.complete || !img.naturalWidth) return false;

    var fw = anim.frameW || window.SMA.MIRROR_CHIBI_FRAME_W || 160;
    var fh = anim.frameH || window.SMA.MIRROR_CHIBI_FRAME || 160;
    var baseline = anim.baseline || window.SMA.MIRROR_CHIBI_BASELINE || 148;
    var spriteScale = (anim.renderScale || window.SMA.MIRROR_CHIBI_RENDER_SCALE || 1) * 0.98;
    var frame = this.getMirrorChibiFrame(anim);
    var sx = Math.min(frame, (anim.frames || 1) - 1) * fw;
    var ghostCanvas = window.SMA._mirrorChibiGhostCanvas;
    if (!ghostCanvas) {
        ghostCanvas = document.createElement('canvas');
        window.SMA._mirrorChibiGhostCanvas = ghostCanvas;
    }
    if (ghostCanvas.width !== fw || ghostCanvas.height !== fh) {
        ghostCanvas.width = fw;
        ghostCanvas.height = fh;
    }
    var gctx = ghostCanvas.getContext('2d');
    gctx.clearRect(0, 0, fw, fh);
    gctx.globalAlpha = 1;
    gctx.globalCompositeOperation = 'source-over';
    gctx.drawImage(img, sx, 0, fw, fh, 0, 0, fw, fh);
    var sourcePixels = gctx.getImageData(0, 0, fw, fh);
    gctx.globalCompositeOperation = 'source-in';
    gctx.fillStyle = 'rgba(80, 238, 255, 0.72)';
    gctx.fillRect(0, 0, fw, fh);
    gctx.globalCompositeOperation = 'source-over';

    var lineCanvas = window.SMA._mirrorChibiGhostLineCanvas;
    if (!lineCanvas) {
        lineCanvas = document.createElement('canvas');
        window.SMA._mirrorChibiGhostLineCanvas = lineCanvas;
    }
    if (lineCanvas.width !== fw || lineCanvas.height !== fh) {
        lineCanvas.width = fw;
        lineCanvas.height = fh;
    }
    var lctx = lineCanvas.getContext('2d');
    var linePixels = lctx.createImageData(fw, fh);
    var srcData = sourcePixels.data;
    var lineData = linePixels.data;
    function mirrorGhostLum(idx) {
        return srcData[idx] * 0.299 + srcData[idx + 1] * 0.587 + srcData[idx + 2] * 0.114;
    }
    function setMirrorGhostLinePixel(x, y, alpha) {
        if (x < 0 || y < 0 || x >= fw || y >= fh) return;
        var di = (y * fw + x) * 4;
        if (lineData[di + 3] >= alpha) return;
        lineData[di] = 165;
        lineData[di + 1] = 252;
        lineData[di + 2] = 255;
        lineData[di + 3] = alpha;
    }
    for (var ly = 1; ly < fh - 1; ly++) {
        for (var lx = 1; lx < fw - 1; lx++) {
            var idx = (ly * fw + lx) * 4;
            var a = srcData[idx + 3];
            if (a < 36) continue;
            var right = idx + 4;
            var down = idx + fw * 4;
            var left = idx - 4;
            var up = idx - fw * 4;
            var alphaDelta = Math.max(Math.abs(a - srcData[right + 3]), Math.abs(a - srcData[down + 3]), Math.abs(a - srcData[left + 3]), Math.abs(a - srcData[up + 3]));
            var l = mirrorGhostLum(idx);
            var lumDelta = Math.max(Math.abs(l - mirrorGhostLum(right)), Math.abs(l - mirrorGhostLum(down)), Math.abs(l - mirrorGhostLum(left)), Math.abs(l - mirrorGhostLum(up)));
            if (alphaDelta > 30 || lumDelta > 22) {
                var edgeAlpha = Math.max(75, Math.min(215, alphaDelta * 1.4 + lumDelta * 2.1));
                setMirrorGhostLinePixel(lx, ly, edgeAlpha);
                if (edgeAlpha > 130) {
                    setMirrorGhostLinePixel(lx + 1, ly, Math.floor(edgeAlpha * 0.55));
                    setMirrorGhostLinePixel(lx, ly + 1, Math.floor(edgeAlpha * 0.45));
                }
            }
        }
    }
    lctx.putImageData(linePixels, 0, 0);

    var outlineCanvas = window.SMA._mirrorChibiGhostOutlineCanvas;
    if (!outlineCanvas) {
        outlineCanvas = document.createElement('canvas');
        window.SMA._mirrorChibiGhostOutlineCanvas = outlineCanvas;
    }
    if (outlineCanvas.width !== fw || outlineCanvas.height !== fh) {
        outlineCanvas.width = fw;
        outlineCanvas.height = fh;
    }
    var octx = outlineCanvas.getContext('2d');
    octx.clearRect(0, 0, fw, fh);
    octx.globalCompositeOperation = 'source-over';
    octx.drawImage(img, sx, 0, fw, fh, -1, 0, fw, fh);
    octx.drawImage(img, sx, 0, fw, fh, 1, 0, fw, fh);
    octx.drawImage(img, sx, 0, fw, fh, 0, -1, fw, fh);
    octx.drawImage(img, sx, 0, fw, fh, 0, 1, fw, fh);
    octx.globalCompositeOperation = 'source-in';
    octx.fillStyle = 'rgba(140, 252, 255, 0.95)';
    octx.fillRect(0, 0, fw, fh);
    octx.globalCompositeOperation = 'destination-out';
    octx.drawImage(img, sx, 0, fw, fh, 0, 0, fw, fh);
    octx.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(cloneCx, cloneFootY);
    if (!cloneFacingRight) {
        ctx.scale(-1, 1);
    }
    ctx.globalAlpha = 0.26;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(76, 238, 255, 0.45)';
    ctx.drawImage(ghostCanvas, -fw * spriteScale / 2, -baseline * spriteScale, fw * spriteScale, fh * spriteScale);
    ctx.globalAlpha = 0.72;
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(76, 238, 255, 0.85)';
    ctx.drawImage(outlineCanvas, -fw * spriteScale / 2, -baseline * spriteScale, fw * spriteScale, fh * spriteScale);
    ctx.globalAlpha = 0.84;
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(140, 252, 255, 0.75)';
    ctx.drawImage(lineCanvas, -fw * spriteScale / 2, -baseline * spriteScale, fw * spriteScale, fh * spriteScale);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.06;
    ctx.drawImage(ghostCanvas, -fw * spriteScale / 2, -baseline * spriteScale, fw * spriteScale, fh * spriteScale);
    ctx.restore();
    return true;
};
window.SMA.ANGEL_CHIBI_FRAME = 192;
window.SMA.ANGEL_CHIBI_FRAME_W = 192;
window.SMA.ANGEL_CHIBI_BASELINE = 180;
window.SMA.ANGEL_CHIBI_RENDER_SCALE = 0.43;
window.SMA.ANGEL_CHIBI_ANIMS = {
    idle: { key: 'angel_chibi_idle_match_attacks_v5', src: 'assets/characters/angel/angel_idle_sheet.png?v=5', frames: 4, frameMs: 220, baseline: 180 },
    run: { key: 'angel_chibi_run_match_idle_v5', src: 'assets/characters/angel/angel_run_sheet.png?v=5', frames: 4, frameMs: 96, baseline: 180 },
    jump: { key: 'angel_chibi_jump_match_idle_v2', src: 'assets/characters/angel/angel_jump_sheet.png?v=2', frames: 2, frameMs: 170, baseline: 180 },
    fall: { key: 'angel_chibi_fall_match_idle_v2', src: 'assets/characters/angel/angel_fall_sheet.png?v=2', frames: 1, frameMs: 180, baseline: 180, frameW: 280, frameH: 192 },
    hurt: { key: 'angel_chibi_hurt', src: 'assets/characters/angel/angel_hurt_sheet.png?v=1', frames: 3, frameMs: 90, baseline: 180 },
    charge: { key: 'angel_chibi_charge_holy_aura_v2', src: 'assets/characters/angel/angel_charge_sheet.png?v=2', frames: 4, frameMs: 100, baseline: 226, frameW: 384, frameH: 248 },
    attackNeutral: { key: 'angel_chibi_attack_neutral_v2', src: 'assets/characters/angel/angel_attack_neutral_sheet.png?v=2', frames: 4, frameMs: 48, baseline: 180 },
    attackSide: { key: 'angel_chibi_attack_side_large_hitbox_v5', src: 'assets/characters/angel/angel_attack_side_large_hitbox_sheet.png?v=5', frames: 6, frameMs: 45, baseline: 196, frameW: 900, frameH: 216 },
    attackUp: { key: 'angel_chibi_attack_up_airplane_v2', src: 'assets/characters/angel/angel_attack_up_sheet.png?v=2', frames: 4, frameMs: 62, baseline: 180, frameW: 360, frameH: 192 },
    attackDown: { key: 'angel_chibi_attack_down_divine_v3', src: 'assets/characters/angel/angel_attack_down_sheet.png?v=3', frames: 4, frameMs: 70, baseline: 226, frameW: 384, frameH: 248 },
    airNeutral: { key: 'angel_chibi_air_neutral_v2', src: 'assets/characters/angel/angel_air_neutral_sheet.png?v=2', frames: 4, frameMs: 48, baseline: 180 },
    airSide: { key: 'angel_chibi_air_side_v7', src: 'assets/characters/angel/angel_air_side_sheet.png?v=7', frames: 6, frameMs: 45, baseline: 220, frameW: 900, frameH: 240 },
    airUp: { key: 'angel_chibi_air_up_airplane_v2', src: 'assets/characters/angel/angel_air_up_sheet.png?v=2', frames: 4, frameMs: 62, baseline: 180, frameW: 360, frameH: 192 },
    airDown: { key: 'angel_chibi_air_down_divine_v3', src: 'assets/characters/angel/angel_air_down_sheet.png?v=3', frames: 4, frameMs: 70, baseline: 226, frameW: 384, frameH: 248 },
    grab: { key: 'angel_chibi_grab_holy_ring_v2', src: 'assets/characters/angel/angel_grab_sheet.png?v=2', frames: 4, frameMs: 62, baseline: 205, frameW: 320, frameH: 220 },
    grabHold: { key: 'angel_chibi_grab_hold_holy_ring_v2', src: 'assets/characters/angel/angel_grab_hold_sheet.png?v=2', frames: 4, frameMs: 100, baseline: 205, frameW: 360, frameH: 220 },
    throw: { key: 'angel_chibi_throw_holy_release_v2', src: 'assets/characters/angel/angel_throw_sheet.png?v=2', frames: 4, frameMs: 68, baseline: 205, frameW: 360, frameH: 220 },
    dodge: { key: 'angel_chibi_dodge_graceful_v2', src: 'assets/characters/angel/angel_dodge_sheet.png?v=2', frames: 4, frameMs: 55, baseline: 205, frameW: 360, frameH: 220 },
    ledge: { key: 'angel_chibi_ledge', src: 'assets/characters/angel/angel_ledge_sheet.png?v=1', frames: 4, frameMs: 110, baseline: 180 },
    ledgeAttack: { key: 'angel_chibi_ledge_attack', src: 'assets/characters/angel/angel_ledge_attack_sheet.png?v=1', frames: 4, frameMs: 70, baseline: 180 },
    ledgeRoll: { key: 'angel_chibi_ledge_roll', src: 'assets/characters/angel/angel_ledge_roll_sheet.png?v=1', frames: 4, frameMs: 55, baseline: 180 }
};
window.SMA.ANGEL_BOW_ASSET = {
    key: 'angel_bow_v2',
    src: 'assets/characters/angel/angel_bow.png?v=2',
    drawH: 68,
    gripXRatio: 0.66,
    gripYRatio: 0.43
};
window.SMA.ANGEL_ARROW_ASSET = {
    key: 'angel_arrow_light_generated_v3',
    src: 'assets/characters/angel/angel_arrow.png?v=5',
    drawW: 46,
    drawH: 17
};
window.SMA.ANGEL_SHOCKWAVE_ASSET = {
    key: 'angel_shockwave_v1',
    src: 'assets/characters/angel/angel_shockwave_sheet.png?v=1',
    frames: 6,
    frameW: 320,
    frameH: 320,
    hitFrame: 18,
    startFrame: 9,
    frameStep: 3
};
window.SMA.ANGEL_SIDE_WING_CLAP_ASSET = {
    key: 'angel_side_wing_clap_v1',
    src: 'assets/characters/angel/angel_side_wing_clap_sheet.png?v=1',
    frames: 4,
    frameW: 288,
    frameH: 192,
    baseline: 180
};
for (var angelChibiAnimKey in window.SMA.ANGEL_CHIBI_ANIMS) {
    if (Object.prototype.hasOwnProperty.call(window.SMA.ANGEL_CHIBI_ANIMS, angelChibiAnimKey)) {
        if (!window.SMA.ANGEL_CHIBI_ANIMS[angelChibiAnimKey].frameW) window.SMA.ANGEL_CHIBI_ANIMS[angelChibiAnimKey].frameW = window.SMA.ANGEL_CHIBI_FRAME_W;
        if (!window.SMA.ANGEL_CHIBI_ANIMS[angelChibiAnimKey].frameH) window.SMA.ANGEL_CHIBI_ANIMS[angelChibiAnimKey].frameH = window.SMA.ANGEL_CHIBI_FRAME;
    }
}
window.SMA.preloadAngelChibiSprites = function () {
    var anims = window.SMA.ANGEL_CHIBI_ANIMS || {};
    for (var k in anims) {
        if (Object.prototype.hasOwnProperty.call(anims, k)) {
            window.SMA.getSpriteAsset(anims[k].key, anims[k].src);
        }
    }
    var bow = window.SMA.ANGEL_BOW_ASSET;
    if (bow) window.SMA.getSpriteAsset(bow.key, bow.src);
    var arrow = window.SMA.ANGEL_ARROW_ASSET;
    if (arrow) window.SMA.getSpriteAsset(arrow.key, arrow.src);
    var shockwave = window.SMA.ANGEL_SHOCKWAVE_ASSET;
    if (shockwave) window.SMA.getSpriteAsset(shockwave.key, shockwave.src);
    var sideWings = window.SMA.ANGEL_SIDE_WING_CLAP_ASSET;
    if (sideWings) window.SMA.getSpriteAsset(sideWings.key, sideWings.src);
};
window.SMA.drawAngelBowProp = function (ctx, x, y, facingRight, angleDeg, drawH, alpha) {
    var asset = window.SMA.ANGEL_BOW_ASSET;
    var img = asset && window.SMA.getSpriteAsset ? window.SMA.getSpriteAsset(asset.key, asset.src) : null;
    if (!img || !img.complete || !img.naturalWidth) return;
    var h = drawH || asset.drawH || 68;
    var w = h * img.naturalWidth / img.naturalHeight;
    var gripX = w * (asset.gripXRatio || 0.34);
    var gripY = h * (asset.gripYRatio || 0.43);
    ctx.save();
    ctx.translate(x, y);
    if (!facingRight) ctx.scale(-1, 1);
    ctx.rotate((angleDeg || 0) * Math.PI / 180);
    ctx.globalAlpha *= (alpha === undefined ? 1 : alpha);
    ctx.imageSmoothingEnabled = true;
    ctx.shadowColor = 'rgba(33, 28, 48, 0.55)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = facingRight ? -1 : 1;
    ctx.shadowOffsetY = 1;
    ctx.drawImage(img, -gripX, -gripY, w, h);
    ctx.restore();
};
window.SMA.drawAngelArrowProjectile = function (ctx, p) {
    var asset = window.SMA.ANGEL_ARROW_ASSET;
    var img = asset && window.SMA.getSpriteAsset ? window.SMA.getSpriteAsset(asset.key, asset.src) : null;
    if (!img || !img.complete || !img.naturalWidth) return false;
    var angle = Math.atan2(p.vy || 0, p.vx || 1);
    var speedScale = Math.max(0.85, Math.min(1.25, Math.sqrt((p.vx || 0) * (p.vx || 0) + (p.vy || 0) * (p.vy || 0)) / 8));
    var w = (asset.drawW || 64) * speedScale;
    var h = (asset.drawH || 13) * Math.max(0.9, Math.min(1.15, (p.w || 16) / 16));
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 0.98;
    ctx.shadowColor = 'rgba(255, 224, 70, 0.95)';
    ctx.shadowBlur = 12;
    ctx.drawImage(img, -w * 0.48, -h * 0.5, w, h);
    ctx.restore();
    return true;
};
window.SMA.Fighter.prototype.drawAngelSideWingClap = function (ctx, drawCx, drawFootY, spriteScale, frame) {
    if (!(this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type === 'wing_flap')) return;
    if (this.currentAttackType === 'SIDE' || this.currentAttackType === 'AIR_SIDE') return;
    var asset = window.SMA.ANGEL_SIDE_WING_CLAP_ASSET;
    var img = asset && window.SMA.getSpriteAsset ? window.SMA.getSpriteAsset(asset.key, asset.src) : null;
    if (!img || !img.complete || !img.naturalWidth) return;
    var fw = asset.frameW || 288;
    var fh = asset.frameH || 192;
    var baseline = asset.baseline || 180;
    var f = Math.max(0, Math.min((asset.frames || 4) - 1, frame || 0));
    var charge = Math.max(1, this.chargePower || 1);
    var boost = 0.9 + Math.max(0, charge - 1) * 0.45;
    var frameAlpha = f === 2 ? 0.68 : (f === 1 ? 0.52 : 0.34);
    var alpha = Math.min(0.96, frameAlpha + Math.max(0, charge - 1) * 0.5);
    var s = (spriteScale || window.SMA.ANGEL_CHIBI_RENDER_SCALE || 1) * boost;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha *= alpha;
    ctx.translate(drawCx, drawFootY);
    if (!this.facingRight) ctx.scale(-1, 1);
    ctx.shadowColor = 'rgba(255, 238, 170, 0.8)';
    ctx.shadowBlur = f === 2 ? 8 : 4;
    ctx.drawImage(img, f * fw, 0, fw, fh, -fw * s / 2, -baseline * s, fw * s, fh * s);
    ctx.restore();
};
window.SMA.resolveAngelChibiAnim = function (fighter) {
    var A = window.SMA.ANGEL_CHIBI_ANIMS;
    if (!A || !fighter || fighter.charId !== 'angel') return null;
    if (fighter.actionState === 'STUN' || fighter.actionState === 'GRABBED') return A.hurt;
    if (fighter.actionState === 'CHARGE') return A.charge;
    if (fighter.actionState === 'DODGE') return A.dodge;
    if (fighter.actionState === 'LEDGE_ROLL') return A.ledgeRoll || A.dodge;
    if (fighter.actionState === 'LEDGE' || fighter.actionState === 'LEDGE_UP') return A.ledge;
    if (fighter.actionState === 'LEDGE_ATK') return A.ledgeAttack || A.attackSide;
    if (fighter.actionState === 'GRAB_ATTEMPT') return A.grab;
    if (fighter.actionState === 'GRABBING') return A.grabHold || A.throw;
    if (fighter.actionState === 'THROWING') return A.throw;
    if (fighter.actionState === 'LAG') return A.idle;
    if (fighter.actionState === 'ATTACK' && fighter.currentAttack) {
        if (fighter.currentAttackType === 'AIR_NEUTRAL') return A.airNeutral;
        if (fighter.currentAttackType === 'AIR_SIDE') return A.airSide;
        if (fighter.currentAttackType === 'AIR_UP') return A.airUp;
        if (fighter.currentAttackType === 'AIR_DOWN') return A.airDown;
        if (fighter.currentAttackType === 'SIDE') return A.attackSide;
        if (fighter.currentAttackType === 'UP') return A.attackUp;
        if (fighter.currentAttackType === 'DOWN') return A.attackDown;
        return A.attackNeutral;
    }
    if (!fighter.isGrounded) return fighter.vy < 0 ? A.jump : A.fall;
    if (Math.abs(fighter.vx) > 0.6) return A.run;
    return A.idle;
};
window.SMA.Fighter.prototype.getAngelChibiFrame = function (anim) {
    var frames = anim.frames || 1;
    if (frames <= 1) return 0;
    var p = null;
    if (this.actionState === 'STUN') {
        var stunSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (!this.isGrounded || stunSpeed > 4) return Math.min(1, frames - 1);
        return this.stateTimer > 20 ? Math.min(1, frames - 1) : Math.min(2, frames - 1);
    }
    if (this.actionState === 'GRABBED') return Math.min(1, frames - 1);
    if (this.actionState === 'ATTACK' && this.currentAttack) {
        p = Math.max(0, Math.min(0.999, this.stateTimer / Math.max(1, this.currentAttack.frames || frames)));
    } else if (this.actionState === 'GRAB_ATTEMPT') {
        p = Math.max(0, Math.min(0.999, this.stateTimer / 15));
    } else if (this.actionState === 'GRABBING') {
        return Math.floor(Date.now() / (anim.frameMs || 100)) % frames;
    } else if (this.actionState === 'THROWING') {
        p = Math.max(0, Math.min(0.999, (15 - this.stateTimer) / 15));
    } else if (this.actionState === 'LEDGE') {
        return 0;
    } else if (this.actionState === 'LEDGE_UP') {
        if (this.stateTimer > 12) return Math.min(1, frames - 1);
        if (this.stateTimer > 6) return Math.min(2, frames - 1);
        return Math.min(3, frames - 1);
    } else if (this.actionState === 'LEDGE_ATK') {
        p = Math.max(0, Math.min(0.999, (30 - this.stateTimer) / 30));
    } else if (this.actionState === 'DODGE' || this.actionState === 'LEDGE_ROLL') {
        p = Math.max(0, Math.min(0.999, (25 - this.stateTimer) / 25));
    }
    if (p !== null) return Math.floor(p * frames);
    return Math.floor(Date.now() / (anim.frameMs || 100)) % frames;
};
window.SMA.Fighter.prototype.drawAngelChibiBow = function (ctx, drawCx, drawFootY, spriteScale) {
    if (!(this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type === 'arrow_shot')) return;
    var sign = this.facingRight ? 1 : -1;
    var total = Math.max(1, this.currentAttack.frames || 18);
    var p = Math.max(0, Math.min(1, this.stateTimer / total));
    var aim = p < 0.35 ? p / 0.35 : (p > 0.78 ? Math.max(0, (1 - p) / 0.22) : 1);
    var s = spriteScale || window.SMA.ANGEL_CHIBI_RENDER_SCALE || 1;
    var gripX = drawCx + sign * (42 + aim * 10) * s;
    var gripY = drawFootY - (106 + aim * 4) * s;
    var drawH = (154 + aim * 8) * s;
    window.SMA.drawAngelBowProp(ctx, gripX, gripY, this.facingRight, -5, drawH, 1);
};
window.SMA.Fighter.prototype.drawAngelShockwaveVfx = function (ctx, drawCx) {
    if (!(this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type === 'shockwave')) return;
    var asset = window.SMA.ANGEL_SHOCKWAVE_ASSET;
    var img = asset && window.SMA.getSpriteAsset ? window.SMA.getSpriteAsset(asset.key, asset.src) : null;
    if (!img || !img.complete || !img.naturalWidth) return;
    var fw = asset.frameW || 320;
    var fh = asset.frameH || 320;
    var start = asset.startFrame || 9;
    var step = asset.frameStep || 3;
    var frame = Math.floor((this.stateTimer - start) / step);
    if (frame < 0 || frame >= (asset.frames || 6)) return;
    var sx = Math.min(frame, (asset.frames || 6) - 1) * fw;
    var centerY = this.y + this.h / 2;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(img, sx, 0, fw, fh, drawCx - fw / 2, centerY - fh / 2, fw, fh);
    ctx.restore();
};
window.SMA.Fighter.prototype.drawAngelChibiSprite = function (ctx, cx) {
    var anim = window.SMA.resolveAngelChibiAnim(this);
    if (!anim) return false;
    var img = window.SMA.getSpriteAsset(anim.key, anim.src);
    if (!img.complete || !img.naturalWidth) return true;

    var fw = anim.frameW || window.SMA.ANGEL_CHIBI_FRAME_W || 192;
    var fh = anim.frameH || window.SMA.ANGEL_CHIBI_FRAME || 192;
    var baseline = anim.baseline || window.SMA.ANGEL_CHIBI_BASELINE || 180;
    var spriteScale = anim.renderScale || window.SMA.ANGEL_CHIBI_RENDER_SCALE || 1;
    var frame = this.getAngelChibiFrame(anim);
    var sx = Math.min(frame, (anim.frames || 1) - 1) * fw;
    var footY = this.y + this.h;
    var drawCx = cx;
    var drawFootY = footY;

    if (this.actionState === 'LEDGE_UP' && this.ledgeGrabbed) {
        var ledgePlatform = this.ledgeGrabbed.platform;
        var ledgeDir = this.ledgeGrabbed.dir;
        var ledgeTopX = (ledgeDir === 'left') ? ledgePlatform.x : (ledgePlatform.x + ledgePlatform.w - this.w);
        var t = Math.max(0, Math.min(1, (20 - this.stateTimer) / 20));
        var eased = t * t * (3 - 2 * t);
        drawCx = cx + ((ledgeTopX + this.w / 2) - cx) * eased;
        drawFootY = footY + (ledgePlatform.y - footY) * eased;
    }

    this.drawAngelShockwaveVfx(ctx, drawCx);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(drawCx, drawFootY);
    if (!this.facingRight) {
        ctx.scale(-1, 1);
    }
    ctx.drawImage(img, sx, 0, fw, fh, -fw * spriteScale / 2, -baseline * spriteScale, fw * spriteScale, fh * spriteScale);
    ctx.restore();

    this.drawAngelSideWingClap(ctx, drawCx, drawFootY, spriteScale, frame);
    this.drawAngelChibiBow(ctx, drawCx, drawFootY, spriteScale);

    if (this.actionState === 'SHIELD') {
        ctx.save();
        ctx.fillStyle = 'rgba(116, 185, 255, ' + (this.shieldHP / 150) + ')';
        ctx.strokeStyle = '#0984e3';
        ctx.beginPath();
        ctx.arc(cx, this.y + this.h / 2, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    return true;
};
window.SMA.preloadSwordChibiSprites();
window.SMA.preloadMageChibiSprites();
window.SMA.preloadBrawlerChibiSprites();
window.SMA.preloadHammerChibiSprites();
window.SMA.preloadSpearChibiSprites();
window.SMA.preloadMirrorChibiSprites();
window.SMA.preloadAngelChibiSprites();
window.SMA.preloadMageVfxSprites();
window.SMA.Fighter.prototype.draw = function (ctx) {
    if (this.stocks <= 0 || this.actionState === 'DEAD' || this.actionState === 'RESPAWN') return;
    // V409: Draw check for invincibility (blink)
    if (this.invincible > 0 && Math.floor(Date.now() / 50) % 2) return;

    var cx = this.x + this.w / 2;
    if (this.actionState === 'DODGE') { ctx.globalAlpha = 0.5; }

    ctx.save();
    ctx.translate(cx, this.y + this.h);
    ctx.scale(this.animScale.x, this.animScale.y);

    var drawn = false;
    if (this.actionState === 'LEDGE_ROLL' && this.charId !== 'brawler' && this.charId !== 'mage' && this.charId !== 'sword' && this.charId !== 'hammer' && this.charId !== 'spear' && this.charId !== 'mirror' && this.charId !== 'angel') {
        ctx.translate(0, -15); ctx.rotate(this.rotation); ctx.strokeStyle = this.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(15, 0); ctx.stroke();
        drawn = true;
    } else {
        if (!(this.actionState === 'LEDGE_ROLL' && (this.charId === 'brawler' || this.charId === 'mage' || this.charId === 'sword' || this.charId === 'hammer' || this.charId === 'spear' || this.charId === 'mirror' || this.charId === 'angel'))) {
            ctx.rotate(this.rotation);
        }
        ctx.translate(-cx, -(this.y + this.h));

        if (this.drawSwordChibiSprite(ctx, cx)) {
            ctx.restore();
            ctx.globalAlpha = 1.0;
            return;
        }

        if (this.drawMageChibiSprite(ctx, cx)) {
            ctx.restore();
            ctx.globalAlpha = 1.0;
            return;
        }

        if (this.charId === 'brawler') {
            if (this.drawBrawlerChibiSprite(ctx, cx)) {
                ctx.restore();
                ctx.globalAlpha = 1.0;
                return;
            }
            ctx.restore();
            ctx.globalAlpha = 1.0;
            return;
        }

        if (this.charId === 'hammer') {
            this.drawHammerChibiSprite(ctx, cx);
            ctx.restore();
            ctx.globalAlpha = 1.0;
            return;
        }

        if (this.charId === 'spear') {
            this.drawSpearChibiSprite(ctx, cx);
            ctx.restore();
            ctx.globalAlpha = 1.0;
            return;
        }

        if (this.charId === 'mirror') {
            this.drawMirrorChibiSprite(ctx, cx);
            ctx.restore();
            ctx.globalAlpha = 1.0;
            return;
        }

        if (this.charId === 'angel') {
            this.drawAngelChibiSprite(ctx, cx);
            ctx.restore();
            ctx.globalAlpha = 1.0;
            return;
        }

        if (this.drawSwordSideAttackSprite(ctx, cx)) {
            drawn = true;
        }

        // V412 FIX: Check for Hammer double-draw during Ledge
        if (this.charId === 'brawler') {
            ctx.save(); ctx.strokeStyle = "#e67e22"; ctx.lineWidth = 3; var hbX = cx + (this.facingRight ? -10 : 10); var hbY = this.y + 10; ctx.beginPath(); ctx.moveTo(hbX, hbY); ctx.quadraticCurveTo(hbX + (this.facingRight ? -20 : 20), hbY - 5, hbX + (this.facingRight ? -40 : 40) + this.vx * 2, hbY + 10 + Math.sin(Date.now() / 100) * 5); ctx.stroke(); ctx.restore();
            if (this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type === 'lunge') {
                ctx.strokeStyle = this.color; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.arc(cx, this.y + 10, 10, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 10); ctx.lineTo(cx, this.y + 40); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx - 20, this.y + 55); ctx.lineTo(cx - 25, this.y + 60); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + 20, this.y + 55); ctx.lineTo(cx + 25, this.y + 60); ctx.stroke(); ctx.strokeStyle = this.currentAttack.color; ctx.beginPath(); ctx.moveTo(cx, this.y + 20); ctx.lineTo(cx + (this.facingRight ? 45 : -45), this.y + 20); ctx.stroke(); ctx.strokeStyle = this.color; ctx.beginPath(); ctx.moveTo(cx, this.y + 20); ctx.lineTo(cx + (this.facingRight ? -10 : 10), this.y + 25); ctx.stroke();
                drawn = true;
            } else if (this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type === 'axe') {
                var progress = this.stateTimer / this.currentAttack.frames; ctx.strokeStyle = this.color; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.arc(cx, this.y + 10, 10, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 10); ctx.lineTo(cx, this.y + 40); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + (this.facingRight ? -10 : 10), this.y + 60); ctx.stroke(); var legX = 0; var legY = 0;
                // v390: Updated Draw timing (13, 16)
                if (this.stateTimer < 13) {
                    legX = cx + (this.facingRight ? -10 : 10); legY = this.y - 20;
                } else if (this.stateTimer < 16) {
                    var slamProg = (this.stateTimer - 13) / 3;
                    var startX = cx + (this.facingRight ? -10 : 10); var startY = this.y - 20;
                    var endX = cx + (this.facingRight ? 30 : -30); var endY = this.y + 60;
                    legX = startX + (endX - startX) * slamProg; legY = startY + (endY - startY) * slamProg;
                } else {
                    legX = cx + (this.facingRight ? 30 : -30); legY = this.y + 60;
                }
                ctx.strokeStyle = "#e67e22"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(legX, legY); ctx.stroke();
                drawn = true;
            } else if (this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type === 'dive') {
                ctx.strokeStyle = this.color; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round";
                var headY = this.y + 50; var bodyTopY = this.y + 20;
                ctx.beginPath(); ctx.arc(cx, headY, 15, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, headY - 15); ctx.lineTo(cx, bodyTopY); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, bodyTopY); ctx.lineTo(cx - 15, bodyTopY - 20); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, bodyTopY); ctx.lineTo(cx + 15, bodyTopY - 20); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, headY - 5); ctx.lineTo(cx - 10, headY - 20); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, headY - 5); ctx.lineTo(cx + 10, headY - 20); ctx.stroke();
                drawn = true;
            } else if (this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type === 'low_kick') {
                ctx.strokeStyle = this.color; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.arc(cx, this.y + 25, 10, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(cx, this.y + 45); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 45); ctx.lineTo(cx + (this.facingRight ? -15 : 15), this.y + 60); ctx.stroke(); ctx.strokeStyle = this.currentAttack.color; ctx.beginPath(); ctx.moveTo(cx, this.y + 45); ctx.lineTo(cx + (this.facingRight ? 45 : -45), this.y + 55); ctx.stroke();
                drawn = true;
            } else if (this.actionState === 'ATTACK' && this.currentAttack && (this.currentAttack.type === 'shoryu' || this.currentAttackType === 'UP' || this.currentAttackType === 'AIR_UP')) {
                ctx.strokeStyle = this.color; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round"; var headY = this.y + 10; var headR = 10; var progress = this.stateTimer / this.currentAttack.frames; if (progress > 0.2 && progress < 0.6) { headY -= 20; headR = 16; } ctx.beginPath(); ctx.arc(cx, headY, headR, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx, headY + headR); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx - 10, this.y + 60); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + 10, this.y + 60); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(cx - 15, this.y + 35); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(cx + 15, this.y + 35); ctx.stroke();
                drawn = true;
            } else if (this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type === 'sex_kick') {
                ctx.strokeStyle = this.color; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.arc(cx, this.y + 10, 10, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 10); ctx.lineTo(cx, this.y + 40); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + (this.facingRight ? -10 : 10), this.y + 50); ctx.stroke(); ctx.strokeStyle = "#e67e22"; ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + (this.facingRight ? 35 : -35), this.y + 50); ctx.stroke();
                drawn = true;
            }
            // BRAWLER CHARGE MOTION
            if (this.actionState === 'CHARGE') {
                // 1. Draw Generic Body (Manual Copy to avoid Sword)
                ctx.strokeStyle = this.color; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round";
                // Body
                ctx.beginPath(); ctx.moveTo(cx, this.y + 10); ctx.lineTo(cx, this.y + 40); ctx.stroke();
                // Legs
                ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx - 10, this.y + 60); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + 10, this.y + 60); ctx.stroke();
                // Head
                ctx.beginPath(); ctx.arc(cx, this.y + 10, 10, 0, Math.PI * 2); ctx.stroke();
                // Arm (Retracted?)
                var jitterX = (Math.random() - 0.5) * 3;
                var jitterY = (Math.random() - 0.5) * 3;
                var fistX = cx + (this.facingRight ? 20 : -20) + jitterX;
                var fistY = this.y + 30 + jitterY;

                ctx.beginPath(); ctx.moveTo(cx, this.y + 20); ctx.lineTo(fistX, fistY); ctx.stroke();

                // 2. Draw Glowing Fist - SYNCED WITH SWORD/MAGE (only glow if chargePower > 1.2)
                ctx.save();
                var isCharged = this.chargePower > 1.2;
                if (isCharged) {
                    var glow = (this.chargePower - 1.0) * 50 + 10;
                    ctx.shadowBlur = glow; ctx.shadowColor = "white"; ctx.fillStyle = "white";
                } else {
                    ctx.fillStyle = this.color; // Normal color if not charged enough
                }
                ctx.beginPath();
                ctx.arc(fistX, fistY, 8, 0, Math.PI * 2); // Fist size 8
                ctx.fill();
                ctx.restore();

                drawn = true;
            }
        }
        if (!drawn) {
            if (this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type === 'slide') {
                var headR = 10; ctx.strokeStyle = this.color; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.arc(cx + (this.facingRight ? 20 : -20), this.y + this.h - 15, headR, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + (this.facingRight ? 20 : -20), this.y + this.h - 15); ctx.lineTo(cx + (this.facingRight ? -10 : 10), this.y + this.h - 10); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + (this.facingRight ? 20 : -20), this.y + this.h - 15); ctx.lineTo(cx + (this.facingRight ? 45 : -45), this.y + this.h); ctx.stroke(); var handX = cx + (this.facingRight ? 45 : -45); var handY = this.y + this.h - 5; ctx.save(); ctx.translate(handX, handY); ctx.rotate(this.facingRight ? 90 * Math.PI / 180 : -90 * Math.PI / 180); ctx.fillStyle = this.chargePower > 1.2 ? '#fff' : (this.isP2 ? "#74b9ff" : "#ff7675"); ctx.beginPath(); ctx.moveTo(-3, -5); ctx.lineTo(-3, -60); ctx.lineTo(0, -70); ctx.lineTo(3, -60); ctx.lineTo(3, -5); ctx.fill(); ctx.restore();
            } else {
                ctx.strokeStyle = this.color; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round";
                if (this.actionState === 'STUN') ctx.strokeStyle = "#ffeaa7"; if (this.actionState === 'LAG') ctx.strokeStyle = "#b2bec3"; if (this.actionState === 'GRABBED') ctx.strokeStyle = "#a29bfe";
                if (this.charId === 'mage') { ctx.fillStyle = "#a29bfe"; ctx.beginPath(); ctx.moveTo(cx - 15, this.y + 5); ctx.lineTo(cx + 15, this.y + 5); ctx.lineTo(cx, this.y - 25); ctx.fill(); } else if (this.charId === 'brawler') { ctx.save(); ctx.strokeStyle = "#e67e22"; ctx.lineWidth = 3; var hbX = cx + (this.facingRight ? -10 : 10); var hbY = this.y + 10; ctx.beginPath(); ctx.moveTo(hbX, hbY); ctx.quadraticCurveTo(hbX + (this.facingRight ? -20 : 20), hbY - 5, hbX + (this.facingRight ? -40 : 40) + this.vx * 2, hbY + 10 + Math.sin(Date.now() / 100) * 5); ctx.stroke(); ctx.restore(); }
                else if (this.charId === 'angel') {
                    // 繧ｨ繝ｳ繧ｸ繧ｧ繝ｫ謠冗判: 讓ｪ蜷代″蟇ｾ蠢・
                    ctx.save();
                    var sc = this.color;
                    if (this.actionState === 'STUN') sc = '#ffeaa7';
                    if (this.actionState === 'LAG') sc = '#b2bec3';
                    if (this.actionState === 'GRABBED') sc = '#a29bfe';
                    ctx.strokeStyle = sc; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                    var dir = this.facingRight ? 1 : -1;
                    // 鬆ｭ
                    ctx.beginPath(); ctx.arc(cx, this.y + 10, 8, 0, Math.PI * 2); ctx.stroke();
                    // 蜈芽ｼｪ・医・繧､繝ｭ繝ｼ・・
                    ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.ellipse(cx, this.y, 10, 3, 0, 0, Math.PI * 2); ctx.stroke();
                    ctx.strokeStyle = sc; ctx.lineWidth = 4;
                    // 菴・
                    ctx.beginPath(); ctx.moveTo(cx, this.y + 18); ctx.lineTo(cx, this.y + 42); ctx.stroke();
                    // 荳｡閼・
                    ctx.beginPath(); ctx.moveTo(cx, this.y + 42); ctx.lineTo(cx - 7, this.y + 58); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(cx, this.y + 42); ctx.lineTo(cx + 7, this.y + 58); ctx.stroke();
                    // 鄙ｼ・郁レ荳ｭ蛛ｴ = 蜷代＞縺ｦ縺・ｋ譁ｹ蜷代・蜿榊ｯｾ蛛ｴ縺ｫ陦ｨ遉ｺ・・
                    var wingFlap = Math.sin(Date.now() / 200) * 4;
                    var isWingFlap = this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type === 'wing_flap';
                    var isWingRise = this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type === 'wing_rise';
                    var isShockwave = this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type === 'shockwave';
                    ctx.fillStyle = 'rgba(255,255,255,0.85)';
                    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1.5;
                    if (isWingFlap && this.stateTimer >= 6 && this.stateTimer <= 16) {
                        // 讓ｪA: 荳｡鄙ｼ繧貞燕譁ｹ縺ｫ遯√″蜃ｺ縺励※謇薙■縺､縺代ｋ繝｢繝ｼ繧ｷ繝ｧ繝ｳ
                        var flapProg = Math.min(1, (this.stateTimer - 6) / 5);
                        // 荳顔ｿｼ・亥燕譁ｹ縺ｸ・・ 蛟阪し繧､繧ｺ
                        ctx.beginPath();
                        ctx.moveTo(cx, this.y + 10);
                        ctx.quadraticCurveTo(cx + dir * (40 + flapProg * 50), this.y, cx + dir * (70 + flapProg * 30), this.y + 15);
                        ctx.quadraticCurveTo(cx + dir * (40 + flapProg * 20), this.y + 25, cx, this.y + 22);
                        ctx.fill(); ctx.stroke();
                        // 荳狗ｿｼ・亥燕譁ｹ縺ｸ・・ 蛟阪し繧､繧ｺ
                        ctx.beginPath();
                        ctx.moveTo(cx, this.y + 24);
                        ctx.quadraticCurveTo(cx + dir * (40 + flapProg * 50), this.y + 28, cx + dir * (70 + flapProg * 30), this.y + 38);
                        ctx.quadraticCurveTo(cx + dir * (40 + flapProg * 20), this.y + 42, cx, this.y + 34);
                        ctx.fill(); ctx.stroke();
                    } else if (isWingRise) {
                        // 荳晦: 蟾ｦ蜿ｳ蟇ｾ遘ｰ縺ｫ鄙ｼ繧貞､ｧ縺阪￥蠎・￡縺ｦ鬟帷ｿ・
                        var riseFlap = Math.sin(this.stateTimer * 0.8) * 5;
                        // 蟾ｦ鄙ｼ
                        ctx.beginPath();
                        ctx.moveTo(cx - 3, this.y + 18);
                        ctx.quadraticCurveTo(cx - 40, this.y + 2 + riseFlap, cx - 50, this.y + 18 + riseFlap);
                        ctx.quadraticCurveTo(cx - 35, this.y + 22, cx - 20, this.y + 28);
                        ctx.quadraticCurveTo(cx - 8, this.y + 24, cx - 3, this.y + 22);
                        ctx.fill(); ctx.stroke();
                        // 蜿ｳ鄙ｼ
                        ctx.beginPath();
                        ctx.moveTo(cx + 3, this.y + 18);
                        ctx.quadraticCurveTo(cx + 40, this.y + 2 + riseFlap, cx + 50, this.y + 18 + riseFlap);
                        ctx.quadraticCurveTo(cx + 35, this.y + 22, cx + 20, this.y + 28);
                        ctx.quadraticCurveTo(cx + 8, this.y + 24, cx + 3, this.y + 22);
                        ctx.fill(); ctx.stroke();
                    } else if (isShockwave) {
                        // 荳帰: 蟾ｦ蜿ｳ蟇ｾ遘ｰ縺ｫ鄙ｼ繧貞ｺ・￡繧具ｼ郁｡晄茶豕｢繝√Ε繝ｼ繧ｸ・・
                        var shockWingFlap = Math.sin(this.stateTimer * 0.6) * 6;
                        // 蟾ｦ鄙ｼ
                        ctx.beginPath();
                        ctx.moveTo(cx - 3, this.y + 18);
                        ctx.quadraticCurveTo(cx - 35, this.y + 5 + shockWingFlap, cx - 45, this.y + 20 + shockWingFlap);
                        ctx.quadraticCurveTo(cx - 30, this.y + 24, cx - 15, this.y + 28);
                        ctx.quadraticCurveTo(cx - 6, this.y + 24, cx - 3, this.y + 22);
                        ctx.fill(); ctx.stroke();
                        // 蜿ｳ鄙ｼ
                        ctx.beginPath();
                        ctx.moveTo(cx + 3, this.y + 18);
                        ctx.quadraticCurveTo(cx + 35, this.y + 5 + shockWingFlap, cx + 45, this.y + 20 + shockWingFlap);
                        ctx.quadraticCurveTo(cx + 30, this.y + 24, cx + 15, this.y + 28);
                        ctx.quadraticCurveTo(cx + 6, this.y + 24, cx + 3, this.y + 22);
                        ctx.fill(); ctx.stroke();
                    } else {
                        // 騾壼ｸｸ: 閭御ｸｭ蛛ｴ縺ｫ鄙ｼ・亥髄縺・※縺・ｋ譁ｹ蜷代・蜿榊ｯｾ・・
                        ctx.beginPath();
                        ctx.moveTo(cx, this.y + 18);
                        ctx.quadraticCurveTo(cx - dir * 25, this.y + 8 + wingFlap, cx - dir * 35, this.y + 20 + wingFlap);
                        ctx.quadraticCurveTo(cx - dir * 22, this.y + 22, cx - dir * 15, this.y + 28);
                        ctx.quadraticCurveTo(cx - dir * 5, this.y + 24, cx, this.y + 22);
                        ctx.fill(); ctx.stroke();
                        // 荳狗ｿｼ
                        ctx.beginPath();
                        ctx.moveTo(cx, this.y + 24);
                        ctx.quadraticCurveTo(cx - dir * 20, this.y + 22 + wingFlap * 0.7, cx - dir * 28, this.y + 32 + wingFlap * 0.7);
                        ctx.quadraticCurveTo(cx - dir * 15, this.y + 30, cx, this.y + 28);
                        ctx.fill(); ctx.stroke();
                    }
                    // 閻輔→蠑・
                    ctx.strokeStyle = sc; ctx.lineWidth = 3;
                    var isArrowShot = this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type === 'arrow_shot';
                    var isCharging = this.actionState === 'CHARGE';
                    var chargeVisualReady = isCharging && this.stateTimer >= (window.SMA.angelChargeVisualDelay || 10);
                    var isGrabAttempt = this.actionState === 'GRAB_ATTEMPT';
                    var isGrabHold = this.actionState === 'GRABBING' || this.actionState === 'THROWING';
                    if (isGrabAttempt) {
                        var grabProgress = this.stateTimer <= 7 ? this.stateTimer / 7 : 1 - (this.stateTimer - 7) / 8;
                        var armLen = Math.round(10 + grabProgress * 35);
                        ctx.strokeStyle = sc; ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(cx + dir * armLen, this.y + 25); ctx.stroke();
                        ctx.beginPath(); ctx.arc(cx + dir * armLen, this.y + 25, 5, 0, Math.PI * 2); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(cx - dir * 5, this.y + 33); ctx.stroke();
                    } else if (isGrabHold) {
                        var pullProgress = this.actionState === 'GRABBING' ? Math.max(0, (120 - this.stateTimer) / 30) : 1.0;
                        var holdLen = Math.round(40 - pullProgress * 15);
                        ctx.strokeStyle = sc; ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(cx + dir * holdLen, this.y + 25); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(cx - dir * 5, this.y + 33); ctx.stroke();
                    } else if (isArrowShot || isCharging) {
                        // NA / 繝√Ε繝ｼ繧ｸ: 蜑肴婿縺ｫ蠑薙ｒ讒九∴縺ｦ蟆・ｋ讒九∴
                        // 蠑捺悽菴難ｼ亥燕譁ｹ縺ｫ蜷代￠繧具ｼ俄・貅懊ａ荳ｭ縺ｯ逋ｽ逋ｺ蜈・
                        var bowColor = chargeVisualReady ? '#fff' : '#c89b3c';
                        if (chargeVisualReady) { ctx.shadowBlur = 12; ctx.shadowColor = '#fff'; }
                        var bowJx = chargeVisualReady ? (Math.random() - 0.5) * 2.5 : 0;
                        var bowJy = chargeVisualReady ? (Math.random() - 0.5) * 2.5 : 0;
                        ctx.strokeStyle = bowColor; ctx.lineWidth = 2.5;
                        ctx.beginPath(); ctx.arc(cx + dir * 20 + bowJx, this.y + 25 + bowJy, 18, dir > 0 ? -1.2 : Math.PI - 1.2, dir > 0 ? 1.2 : Math.PI + 1.2); ctx.stroke();
                        // 蠑ｦ
                        var pullBack = isCharging ? (chargeVisualReady ? Math.min(this.chargePower * 5, 10) : 3) : 3;
                        ctx.strokeStyle = chargeVisualReady ? '#fff' : '#ddd'; ctx.lineWidth = chargeVisualReady ? 1.5 : 1;
                        ctx.beginPath(); ctx.moveTo(cx + dir * (20 + 18 * Math.cos(-1.2)) + bowJx, this.y + 25 + 18 * Math.sin(-1.2) + bowJy);
                        ctx.lineTo(cx + dir * (20 - pullBack) + bowJx, this.y + 25 + bowJy);
                        ctx.lineTo(cx + dir * (20 + 18 * Math.cos(1.2)) + bowJx, this.y + 25 + 18 * Math.sin(1.2) + bowJy); ctx.stroke();
                        // 遏｢・亥ｼｦ縺ｮ荳奇ｼ・
                        if (isCharging || (isArrowShot && this.stateTimer < 6)) {
                            ctx.fillStyle = '#ffe066';
                            ctx.shadowBlur = 5; ctx.shadowColor = '#ffe066';
                            ctx.beginPath();
                            ctx.moveTo(cx + dir * (25) + bowJx, this.y + 25 + bowJy);
                            ctx.lineTo(cx + dir * (20 - pullBack - 2) + bowJx, this.y + 22 + bowJy);
                            ctx.lineTo(cx + dir * (20 - pullBack - 2) + bowJx, this.y + 28 + bowJy);
                            ctx.closePath(); ctx.fill();
                            ctx.shadowBlur = 0;
                        }
                        // 閻包ｼ亥ｾ後ｍ謇九〒蠑ｦ繧貞ｼ輔￥・・
                        ctx.strokeStyle = sc; ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(cx + dir * 18 + bowJx * 0.6, this.y + 24 + bowJy * 0.6); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(cx + dir * (20 - pullBack) + bowJx, this.y + 25 + bowJy); ctx.stroke();
                    } else {
                        // 騾壼ｸｸ: 蠑薙ｒ荳九￡謖√■
                        ctx.strokeStyle = '#c89b3c'; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.arc(cx + dir * 8, this.y + 35, 12, dir > 0 ? -1.0 : Math.PI - 1.0, dir > 0 ? 1.0 : Math.PI + 1.0); ctx.stroke();
                        // 蠑ｦ
                        ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(cx + dir * (8 + 12 * Math.cos(-1.0)), this.y + 35 + 12 * Math.sin(-1.0));
                        ctx.lineTo(cx + dir * 8, this.y + 35);
                        ctx.lineTo(cx + dir * (8 + 12 * Math.cos(1.0)), this.y + 35 + 12 * Math.sin(1.0)); ctx.stroke();
                        // 閻・
                        ctx.strokeStyle = sc; ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(cx + dir * 12, this.y + 33); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(cx - dir * 5, this.y + 33); ctx.stroke();
                    }
                    if (this.actionState === 'SHIELD') { ctx.save(); ctx.fillStyle = 'rgba(116, 185, 255, ' + (this.shieldHP / 150) + ')'; ctx.strokeStyle = '#0984e3'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, this.y + 30, 45, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
                    // 陦晄茶豕｢繧ｨ繝輔ぉ繧ｯ繝・
                    if (this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type === 'shockwave') {
                        if (this.stateTimer >= 12 && this.stateTimer <= 22) {
                            var alpha = 1.0 - (this.stateTimer - 12) / 10;
                            if (alpha > 0) {
                                ctx.strokeStyle = 'rgba(255,224,102,' + alpha + ')';
                                ctx.lineWidth = 3;
                                var rad = (this.currentAttack.shockRadius || 200) * Math.min(1, (this.stateTimer - 12) / 5);
                                ctx.beginPath(); ctx.arc(cx, this.y + this.h / 2, rad, 0, Math.PI * 2); ctx.stroke();
                            }
                        }
                    }
                    ctx.restore();
                    drawn = true;
                }
                else if (this.charId === 'spear') {
                    ctx.save();
                    ctx.strokeStyle = this.color; // Use Player Color
                    if (this.actionState === 'STUN') ctx.strokeStyle = "#ffeaa7";
                    if (this.actionState === 'LAG') ctx.strokeStyle = "#b2bec3";
                    if (this.actionState === 'GRABBED') ctx.strokeStyle = "#a29bfe";
                    ctx.lineWidth = 3;
                    // Crouching Check
                    if (this.actionState === 'ATTACK' && this.currentAttackType === 'ground_shock' && this.stateTimer < 10) {
                        // Wind up (raise spear)
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 10); ctx.lineTo(cx, this.y + 40); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx - 10, this.y + 60); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + 10, this.y + 60); ctx.stroke();
                        ctx.beginPath(); ctx.arc(cx, this.y + 10, 8, 0, Math.PI * 2); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 20); ctx.lineTo(cx, this.y - 10); ctx.stroke(); // Arms up
                    }
                    else if (this.actionState === 'ATTACK' && this.currentAttackType === 'ground_shock') {
                        // Stab down
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 30); ctx.lineTo(cx, this.y + 50); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 50); ctx.lineTo(cx - 15, this.y + 60); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 50); ctx.lineTo(cx + 15, this.y + 60); ctx.stroke();
                        ctx.beginPath(); ctx.arc(cx, this.y + 30, 8, 0, Math.PI * 2); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + (this.facingRight ? 15 : -15), this.y + 55); ctx.stroke();
                    } else {
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 10); ctx.lineTo(cx, this.y + 40); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx - 10, this.y + 60); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + 10, this.y + 60); ctx.stroke();
                        ctx.beginPath(); ctx.arc(cx, this.y + 10, 8, 0, Math.PI * 2); ctx.stroke();
                        if (this.actionState === 'GRAB_ATTEMPT') {
                            var gp = this.stateTimer <= 7 ? this.stateTimer / 7 : 1 - (this.stateTimer - 7) / 8;
                            var al = Math.round(10 + gp * 35);
                            ctx.beginPath(); ctx.moveTo(cx, this.y + 20); ctx.lineTo(cx + (this.facingRight ? al : -al), this.y + 22); ctx.stroke();
                            ctx.beginPath(); ctx.arc(cx + (this.facingRight ? al : -al), this.y + 22, 5, 0, Math.PI * 2); ctx.stroke();
                        } else {
                            ctx.beginPath(); ctx.moveTo(cx, this.y + 20); ctx.lineTo(cx + (this.facingRight ? 15 : -15), this.y + 30); ctx.stroke();
                        }
                    }
                    // GRAB_ATTEMPT MOTION FOR SPEAR
                    if (this.actionState === 'GRAB_ATTEMPT') {
                        var grabProgress = this.stateTimer <= 7 ? this.stateTimer / 7 : 1 - (this.stateTimer - 7) / 8;
                        var armLen = Math.round(10 + grabProgress * 35);
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 20); ctx.lineTo(cx + (this.facingRight ? armLen : -armLen), this.y + 22); ctx.stroke();
                        ctx.beginPath(); ctx.arc(cx + (this.facingRight ? armLen : -armLen), this.y + 22, 5, 0, Math.PI * 2); ctx.stroke();
                        drawn = true;
                    }
                    // CHARGE MOTION FOR SPEAR
                    if (this.actionState === 'CHARGE') {
                        ctx.save();
                        var isCharged = this.chargePower > 1.2;
                        var tipColor = isCharged ? "white" : null;
                        var glow = isCharged ? (this.chargePower - 1.0) * 50 + 10 : 0;

                        if (glow) { ctx.shadowBlur = glow; ctx.shadowColor = "white"; }
                        var holdAngle = -150;
                        if (!this.facingRight) holdAngle = -30;

                        var jitter = (Math.random() - 0.5) * 5;
                        window.SMA.drawTrident(ctx, cx - (this.facingRight ? 15 : -15), this.y + 25, holdAngle + jitter, "#00b894", tipColor);
                        ctx.restore();
                        drawn = true;
                    }
                    // Shield check for spear
                    if (!drawn && this.actionState === 'SHIELD') { ctx.save(); ctx.fillStyle = `rgba(116, 185, 255, ${this.shieldHP / 150})`; ctx.strokeStyle = "#0984e3"; ctx.beginPath(); ctx.arc(cx, this.y + 30, 45, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
                    ctx.restore();

                    // Spear Attack Visuals
                    var spearDrawn = false;
                    if (this.currentAttack && !drawn) {
                        var angleDeg = 0; var offsetX = 0; var offsetY = 0;
                        var p = this.stateTimer / this.currentAttack.frames;
                        var shouldDrawSpear = true;

                        if (this.currentAttackType === 'UP' || this.currentAttackType === 'AIR_UP' || this.currentAttack.type === 'boomerang_up') {
                            if (this.stateTimer < 5) { angleDeg = -80 + p * 60; } else shouldDrawSpear = false;
                        }
                        else if (this.currentAttackType === 'ground_shock') {
                            if (this.stateTimer < 10) { angleDeg = -90; offsetY = -40; } // Up
                            else { angleDeg = 90; offsetY = 20; } // Down
                        }
                        else if (this.currentAttackType === 'SIDE' || this.currentAttackType === 'AIR_SIDE' || this.currentAttackType === 'boomerang') {
                            if (this.stateTimer < 5) angleDeg = -30 + p * 60;
                            else shouldDrawSpear = false;
                        }
                        else if (this.currentAttackType === 'NEUTRAL' || this.currentAttackType === 'AIR_NEUTRAL') {
                            angleDeg = -20;
                            offsetX = Math.sin(p * Math.PI) * 40;
                        }
                        else if (this.currentAttackType === 'AIR_DOWN' || this.currentAttackType === 'boomerang_down') {
                            // NEW: Hide spear after throw
                            if (this.stateTimer < 5) angleDeg = 90;
                            else shouldDrawSpear = false;
                        }

                        if (shouldDrawSpear) {
                            if (!this.facingRight) {
                                if (angleDeg === 90 || angleDeg === -90) { }
                                else angleDeg = -180 - angleDeg;
                            }

                            var handX = cx + (this.facingRight ? 15 : -15) + (this.facingRight ? offsetX : -offsetX);
                            var handY = this.y + 30 + offsetY;

                            window.SMA.drawTrident(ctx, handX, handY, angleDeg, "#00b894");
                            spearDrawn = true;
                        }
                        drawn = true;
                    }

                    if (!spearDrawn && !drawn) {
                        // Default Spear Position
                        var isThrown = (this.currentAttack && (this.currentAttackType === 'SIDE' || this.currentAttackType === 'AIR_SIDE' || this.currentAttackType === 'UP' || this.currentAttackType === 'AIR_UP' || this.currentAttackType === 'boomerang' || this.currentAttackType === 'boomerang_up' || this.currentAttackType === 'boomerang_down') && this.stateTimer >= 5);

                        if (!isThrown) {
                            var angleDeg = -80;
                            if (!this.facingRight) angleDeg = -180 - angleDeg;
                            var handX = cx + (this.facingRight ? 15 : -15);
                            var handY = this.y + 30;
                            window.SMA.drawTrident(ctx, handX, handY, angleDeg, "#00b894");
                        }
                    }
                }
                else if (this.charId === 'hammer' && this.actionState.indexOf('LEDGE') === -1) { // V412 FIX: Check Ledge
                    ctx.save();
                    ctx.strokeStyle = this.color;
                    if (this.actionState === 'STUN') ctx.strokeStyle = "#ffeaa7";
                    if (this.actionState === 'LAG') ctx.strokeStyle = "#b2bec3";
                    if (this.actionState === 'GRABBED') ctx.strokeStyle = "#a29bfe";
                    if (this.superArmor) {
                        ctx.shadowBlur = 10; ctx.shadowColor = "#dfe6e9";
                        ctx.strokeStyle = "#dfe6e9";
                    }
                    ctx.lineWidth = 3;
                    // Body
                    ctx.beginPath(); ctx.moveTo(cx, this.y + 10); ctx.lineTo(cx, this.y + 40); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx - 10, this.y + 60); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + 10, this.y + 60); ctx.stroke();
                    ctx.beginPath(); ctx.arc(cx, this.y + 10, 8, 0, Math.PI * 2); ctx.stroke();
                    // Arms
                    ctx.beginPath(); ctx.moveTo(cx, this.y + 20); ctx.lineTo(cx + (this.facingRight ? 5 : -5), this.y + 30); ctx.stroke();

                    if (this.actionState === 'SHIELD') { ctx.save(); ctx.fillStyle = `rgba(116, 185, 255, ${this.shieldHP / 150})`; ctx.strokeStyle = "#0984e3"; ctx.beginPath(); ctx.arc(cx, this.y + 30, 45, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }

                    // GRAB_ATTEMPT MOTION FOR HAMMER
                    if (this.actionState === 'GRAB_ATTEMPT') {
                        var grabProgress = this.stateTimer <= 7 ? this.stateTimer / 7 : 1 - (this.stateTimer - 7) / 8;
                        var armLen = Math.round(10 + grabProgress * 35);
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 20); ctx.lineTo(cx + (this.facingRight ? armLen : -armLen), this.y + 22); ctx.stroke();
                        ctx.beginPath(); ctx.arc(cx + (this.facingRight ? armLen : -armLen), this.y + 22, 5, 0, Math.PI * 2); ctx.stroke();
                        drawn = true;
                    }
                    // HAMMER CHARGE MOTION (UNIFIED)
                    if (!drawn && this.actionState === 'CHARGE') {
                        ctx.save();
                        var isCharged = this.chargePower > 1.2;
                        var headColor = isCharged ? "white" : null;
                        var glow = isCharged ? (this.chargePower - 1.0) * 50 + 10 : 0;
                        if (glow) { ctx.shadowBlur = glow; ctx.shadowColor = "white"; }
                        var holdAngle = this.facingRight ? 135 : -135;

                        var jitter = (Math.random() - 0.5) * 5;
                        var handX = cx + (this.facingRight ? 8 : -8);
                        var handY = this.y + 27;
                        window.SMA.drawHammer(ctx, handX, handY, holdAngle + jitter, "#636e72", headColor);
                        ctx.restore();
                        drawn = true;
                    }

                    ctx.restore();

                    // Hammer Visual
                    var hammerDrawn = false;

                    // *** FIX: Only run custom drawing if in ATTACK state ***
                    if (this.actionState === 'ATTACK' && this.currentAttack) {
                        var angleDeg = 0; var offsetX = 0; var offsetY = 0;
                        var p = this.stateTimer / this.currentAttack.frames;
                        var shouldDraw = true;
                        if (this.currentAttack.type === 'tornado') {
                            if (this.charId === 'hammer' && this.stateTimer >= 80) {
                                var finishSign = this.facingRight ? 1 : -1;
                                window.SMA.drawHammer(ctx, cx + finishSign * 24, this.y + 42, this.facingRight ? -120 : 120, "#636e72");
                                hammerDrawn = true;
                                shouldDraw = false;
                            } else {
                            // Tornado Visual: Spin around Y axis
                            // Hammer X offset moves left/right. Scale flips.
                            // NEW: Spin slowly during wind-up (0-15), fast after.
                            var spin;
                            if (this.stateTimer < 15) {
                                spin = this.stateTimer * 0.5; // Slow wind up spin
                            } else {
                                spin = (15 * 0.5) + (this.stateTimer - 15) * 1.2; // Fast spin
                            }

                            var xOff = Math.cos(spin) * 30;
                            var widthScale = Math.sin(spin);

                            ctx.save();
                            ctx.translate(cx + xOff, this.y + 30);
                            ctx.scale(widthScale, 1);
                            // Draw handle down (0) -> rotated 90 for horizontal
                            window.SMA.drawHammer(ctx, 0, 0, 90, "#636e72");
                            ctx.restore();
                            hammerDrawn = true; // Mark as drawn
                            shouldDraw = false; // Skip default hammer logic below
                            }
                        } else if (this.currentAttackType === 'NEUTRAL') {
                            // Ground neutral: hold up, then slam during the hit frames.
                            if (this.stateTimer < 15) {
                                angleDeg = 180; // Instant Hold Up
                            } else if (this.stateTimer < 22) {
                                var subP = Math.max(0, Math.min(1, (this.stateTimer - 14) / 7));
                                angleDeg = 180 + (190 * subP); // 180 -> 370 (10 deg)
                            } else {
                                angleDeg = 10; // Hold at bottom
                            }
                        } else if (this.currentAttack.type === 'hammer_spin_air') {
                            // AIR: "Broken" static pose -> User wants HAMMER DOWN (0).
                            angleDeg = 0;
                        } else if (this.currentAttackType === 'SIDE' || this.currentAttackType === 'AIR_SIDE' || this.currentAttackType === 'spin_hammer') {
                            if (this.currentAttackType === 'AIR_SIDE') {
                                var airSideT = Math.max(0, Math.min(1, this.stateTimer / Math.max(1, this.currentAttack.frames || 18)));
                                angleDeg = -170 + (135 * airSideT);
                            } else {
                                angleDeg = p * 720;
                            }
                        } else if (this.currentAttackType === 'UP') {
                            if (this.stateTimer < 11) {
                                angleDeg = -90;
                            } else if (this.stateTimer < 21) {
                                var groundUpU = (this.stateTimer - 11) / 10;
                                angleDeg = -90 - 180 * groundUpU;
                            } else {
                                angleDeg = -270;
                            }
                        } else if (this.currentAttackType === 'AIR_UP') {
                            if (this.stateTimer < 11) {
                                angleDeg = -90;
                            } else if (this.stateTimer < 21) {
                                var upU = (this.stateTimer - 11) / 10;
                                angleDeg = -90 - 180 * upU;
                            } else {
                                angleDeg = -270;
                            }
                        } else if (this.currentAttackType === 'DOWN' || this.currentAttackType === 'earthquake' || this.currentAttackType === 'AIR_DOWN' || this.currentAttackType === 'meteor') {
                            var start = 45; var end = 135;
                            angleDeg = start + (end - start) * p;
                        }

                        if (shouldDraw) {
                            if (!this.facingRight) {
                                if (this.currentAttack.type !== 'spin_hammer' && this.currentAttack.type !== 'hammer_spin_air' && this.currentAttackType !== 'SIDE') angleDeg = -angleDeg;
                                else if (this.currentAttack.type === 'hammer_spin_air') angleDeg = 0; // Keep Down
                                else angleDeg = -angleDeg;
                            }
                            var handX = cx + (this.facingRight ? 9 : -9);
                            var handY = this.y + 26;
                            window.SMA.drawHammer(ctx, handX, handY, angleDeg, "#636e72");
                            hammerDrawn = true;
                        }
                        drawn = true;
                    }

                    if (!hammerDrawn && !drawn) {
                        var angleDeg = this.facingRight ? -125 : 125;
                        var handX = cx + (this.facingRight ? 2 : -2);
                        var handY = this.y + 38;
                        window.SMA.drawHammer(ctx, handX, handY, angleDeg, "#636e72");
                    }
                }

                if (!drawn) {
                    if ((this.actionState === 'LEDGE' || this.actionState === 'LEDGE_UP' || this.actionState === 'LEDGE_ATK') && this.charId !== 'mirror') {
                        // V410 FIX: Only draw white if invincible
                        ctx.strokeStyle = (this.invincible > 0) ? "#fff" : this.color;

                        ctx.beginPath(); ctx.arc(cx, this.y + 10, 10, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 10); ctx.lineTo(cx, this.y + 40); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx - 10, this.y + 60); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + 10, this.y + 60); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, this.y + 15); ctx.lineTo(this.facingRight ? cx + 10 : cx - 10, this.y - 5); ctx.stroke();
                        if (this.actionState === 'LEDGE_ATK' && this.currentAttack) {
                            var progress = (30 - this.stateTimer) / 30;
                            var angleDeg = this.facingRight ? 110 - (progress * 60) : -110 + (progress * 60);
                            var handX = cx + (this.facingRight ? 15 : -15);
                            var handY = this.y + 30;

                            // V411 FIX: Weapon specific drawing for LEDGE_ATK
                            if (this.charId === 'hammer') {
                                window.SMA.drawHammer(ctx, handX, handY, angleDeg + (this.facingRight ? 180 : -180), "#636e72");
                            } else if (this.charId === 'spear') {
                                var spearAngle = angleDeg + (this.facingRight ? 90 : -90);
                                window.SMA.drawTrident(ctx, handX, handY, spearAngle, "#00b894");
                            } else if (this.charId === 'mirror') {
                                // 髀｡繧ｭ繝｣繝ｩ: 蟆上＆縺ｪ髀｡繧呈険繧雁屓縺吝ｴ匁判謦・
                                ctx.save();
                                ctx.strokeStyle = '#81ecec';
                                ctx.lineWidth = 2;
                                var mirAngRad = angleDeg * Math.PI / 180;
                                var mirEndX = handX + Math.sin(mirAngRad) * 23;
                                var mirEndY = handY - Math.cos(mirAngRad) * 23;
                                ctx.beginPath(); ctx.moveTo(handX, handY); ctx.lineTo(mirEndX, mirEndY); ctx.stroke();
                                // 髀｡縺ｮ鬆ｭ驛ｨ蛻・
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                                ctx.beginPath(); ctx.arc(mirEndX, mirEndY, 6.5, 0, Math.PI * 2); ctx.fill();
                                ctx.restore();
                            } else {
                                this.drawSword(ctx, handX, handY, angleDeg);
                            }
                        }
                    } else if (this.charId === 'mirror') {

                        // 髀｡繧ｭ繝｣繝ｩ譛ｬ菴捺緒逕ｻ
                        ctx.save();
                        ctx.strokeStyle = this.color;
                        if (this.actionState === 'STUN') ctx.strokeStyle = '#ffeaa7';
                        if (this.actionState === 'LAG') ctx.strokeStyle = '#b2bec3';
                        if (this.actionState === 'GRABBED') ctx.strokeStyle = '#a29bfe';
                        if (this.actionState === 'LEDGE' || this.actionState === 'LEDGE_UP') {
                            ctx.strokeStyle = (this.invincible > 0) ? '#fff' : this.color;
                        }
                        ctx.lineWidth = 3;

                        // 豬ｮ驕企升縺ｮ蝓ｺ譛ｬ蠎ｧ讓・(蟆代＠蜑肴婿)
                        var hoverY = Math.sin(Date.now() / 200) * 5; // 繝輔Ρ繝輔Ρ荳贋ｸ・
                        var baseY = this.y + 20 + hoverY;
                        var baseX = cx + (this.facingRight ? 30 : -30);

                        // 蟠悶▽縺九∪繧贋ｸｭ縺ｮ謠冗判
                        if (this.actionState === 'LEDGE' || this.actionState === 'LEDGE_UP' || this.actionState === 'LEDGE_ATK') {
                            ctx.beginPath(); ctx.arc(cx, this.y + 10, 8, 0, Math.PI * 2); ctx.stroke();
                            ctx.beginPath(); ctx.moveTo(cx, this.y + 10); ctx.lineTo(cx, this.y + 40); ctx.stroke();
                            ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx - 10, this.y + 60); ctx.stroke();
                            ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + 10, this.y + 60); ctx.stroke();
                            ctx.beginPath(); ctx.moveTo(cx, this.y + 15); ctx.lineTo(this.facingRight ? cx + 10 : cx - 10, this.y - 5); ctx.stroke();
                            if (this.actionState === 'LEDGE_ATK' && this.currentAttack) {
                                var progress = (30 - this.stateTimer) / 30;
                                var throwAng3 = progress * Math.PI * 3;
                                var mAtkX = cx + (this.facingRight ? 25 : -25);
                                var mAtkY = this.y + 15;
                                ctx.strokeStyle = '#81ecec'; ctx.lineWidth = 2;
                                var mw3 = 12 * Math.cos(throwAng3);
                                ctx.beginPath(); ctx.moveTo(mAtkX - mw3, mAtkY); ctx.lineTo(mAtkX + mw3, mAtkY); ctx.stroke();
                                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                                ctx.beginPath(); ctx.arc(mAtkX, mAtkY, 4, 0, Math.PI * 2); ctx.fill();
                            }
                            ctx.restore();
                            drawn = true;
                        }
                        if (!drawn) {
                            // 菴・
                            ctx.beginPath(); ctx.moveTo(cx, this.y + 10); ctx.lineTo(cx, this.y + 40); ctx.stroke();
                            // 雜ｳ
                            ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx - 10, this.y + 60); ctx.stroke();
                            ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + 10, this.y + 60); ctx.stroke();
                            // 鬆ｭ
                            ctx.beginPath(); ctx.arc(cx, this.y + 10, 8, 0, Math.PI * 2); ctx.stroke();

                            // 閻包ｼ・RAB_ATTEMPT縺ｪ繧牙燕縺ｫ莨ｸ縺ｰ縺吶√◎繧御ｻ･螟悶・閾ｪ辟ｶ縺ｫ荳九ｍ縺呻ｼ・
                            if (this.actionState === 'GRAB_ATTEMPT') {
                                var gp = this.stateTimer <= 7 ? this.stateTimer / 7 : 1 - (this.stateTimer - 7) / 8;
                                var al = Math.round(10 + gp * 35);
                                ctx.beginPath(); ctx.moveTo(cx, this.y + 20); ctx.lineTo(cx + (this.facingRight ? al : -al), this.y + 22); ctx.stroke();
                                ctx.beginPath(); ctx.arc(cx + (this.facingRight ? al : -al), this.y + 22, 5, 0, Math.PI * 2); ctx.stroke();
                            } else {
                                // 閾ｪ辟ｶ縺ｫ荳九ｍ縺・
                                ctx.beginPath(); ctx.moveTo(cx, this.y + 20); ctx.lineTo(cx + (this.facingRight ? 5 : -5), this.y + 35); ctx.stroke();
                            }

                            // 豬ｮ驕企升縺ｮ謠冗判險ｭ螳・
                            var cdColor = window.SMA.selectedStage === 'battlefield' ? '#555' : '#000';
                            var mirrorColor = this.mirrorCooldown > 0 ? cdColor : '#81ecec';
                            var mirrorGlowColor = this.mirrorCooldown > 0 ? cdColor : 'rgba(255,255,255,0.6)';
                            ctx.strokeStyle = mirrorColor;
                            ctx.lineWidth = 2.6;

                            // 豬ｮ驕企升縺ｮ繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ
                            var mirX = baseX;
                            var mirY = baseY;
                            var mirScale = 1.0;
                            var mirAngle = 0;

                            if (this.actionState === 'ATTACK' && this.currentAttack) {
                                var p = this.stateTimer / this.currentAttack.frames; // 1 -> 0
                                var forwardP = 1.0 - p; // 0 -> 1

                                if (this.currentAttack.type === 'mirror_spin' || this.currentAttackType === 'AIR_NEUTRAL') {
                                    // 遨ｺ荳ｭNA: 繧ｭ繝｣繝ｩ縺ｮ蜻ｨ繧翫ｒ荳蜻ｨ
                                    var spinAngle = forwardP * Math.PI * 2;
                                    var r = 50;
                                    mirX = cx + (this.facingRight ? 1 : -1) * Math.cos(spinAngle) * r;
                                    mirY = this.y + 25 + Math.sin(spinAngle) * r;
                                    mirAngle = 0; // 髀｡縺ｮ蜷代″縺ｯ荳螳・
                                } else if (this.currentAttack.type === 'mirror_throw_up' || this.currentAttackType === 'UP' || this.currentAttackType === 'AIR_UP') {
                                    // 荳晦: 荳頑婿縺ｸ鬟帙・蜃ｺ縺・
                                    mirScale = 1.5;
                                    mirAngle = forwardP * Math.PI * 4;
                                    var throwH = 62;
                                    mirX = cx;
                                    mirY = this.y - 10 - Math.sin(forwardP * Math.PI) * throwH;
                                } else if (this.currentAttack.type === 'mirror_throw' || this.currentAttackType === 'SIDE' || this.currentAttackType === 'AIR_SIDE') {
                                    // 讓ｪA: 蜑肴婿縺ｸ鬟帙・蜃ｺ縺怜屓霆｢
                                    mirScale = 1.6;
                                    mirAngle = forwardP * Math.PI * 4;
                                    var throwDist = 75;
                                    var distX = Math.sin(forwardP * Math.PI) * throwDist;
                                    mirX = cx + (this.facingRight ? distX : -distX);
                                    mirY = this.y + 25;
                                } else if (this.currentAttackType === 'NEUTRAL') {
                                    // 蝨ｰ荳劾A: 蜑肴婿縺ｫ荳迸ｬ遯√″蜃ｺ繧具ｼ亥屓霆｢辟｡縺暦ｼ・
                                    var pokeDist = Math.sin(forwardP * Math.PI) * 56;
                                    mirX = cx + (this.facingRight ? 30 + pokeDist : -30 - pokeDist);
                                } else if (this.currentAttackType === 'DOWN' || this.currentAttackType === 'AIR_DOWN' || this.currentAttack.type === 'mirror_place') {
                                    // 荳帰: 荳区婿縺ｸ鬟帙・蜃ｺ縺怜屓霆｢
                                    mirScale = 1.5;
                                    mirAngle = forwardP * Math.PI * 4;
                                    var throwH = 40;
                                    mirX = cx + (this.facingRight ? 15 : -15);
                                    mirY = this.y + 40 + Math.sin(forwardP * Math.PI) * throwH;
                                }
                            } else if (this.actionState === 'CHARGE') {
                                // 繝√Ε繝ｼ繧ｸ荳ｭ・夐怫縺医ｋ
                                mirX += (Math.random() - 0.5) * 5;
                                mirY += (Math.random() - 0.5) * 5;
                                if (this.chargePower > 1.2) {
                                    ctx.shadowBlur = 10; ctx.shadowColor = '#81ecec'; ctx.strokeStyle = '#fff';
                                }
                            } else if (this.actionState === 'LEDGE_ATK') {
                                // 蟠匁判謦・
                                mirX = cx + (this.facingRight ? 40 : -40);
                                mirAngle = Math.PI / 4;
                                mirScale = 1.2;
                            }

                            // 髀｡縺ｮ謠冗判・育峡遶具ｼ・
                            ctx.save();
                            ctx.translate(mirX, mirY);
                            ctx.rotate(mirAngle);
                            ctx.scale(mirScale, mirScale);

                            // 髀｡縺ｮ螟匁棧・育ｸｦ髟ｷ讌募・縺ｮ莉｣繧上ｊ縺ｨ縺励※縺ｮ邱夲ｼ・
                            var len = this.actionState === 'ATTACK' ? 17.5 : 14;
                            ctx.beginPath(); ctx.moveTo(0, -len); ctx.lineTo(0, len); ctx.stroke();

                            ctx.restore();

                            // 繧ｷ繝ｼ繝ｫ繝・
                            if (this.actionState === 'SHIELD') { ctx.save(); ctx.fillStyle = 'rgba(116, 185, 255, ' + (this.shieldHP / 150) + ')'; ctx.strokeStyle = '#0984e3'; ctx.beginPath(); ctx.arc(cx, this.y + 30, 45, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }

                            ctx.restore();
                            drawn = true;
                        } // !drawn 髢峨§
                    }
                    if (this.charId !== 'spear' && this.charId !== 'hammer' && this.charId !== 'mirror') {
                        // GENERIC BODY DRAW (SWORD/MAGE when not special)
                        // GRABBING荳ｭ縺ｯ閻輔ｒ蜑阪↓莨ｸ縺ｰ縺励※蠑輔″蟇・○繝｢繝ｼ繧ｷ繝ｧ繝ｳ縲ゝHROWING繧ょ酔讒・
                        if (this.actionState === 'GRABBING' || this.actionState === 'THROWING') {
                            var pullProgress = this.actionState === 'GRABBING' ? Math.max(0, (120 - this.stateTimer) / 30) : 1.0;
                            var armLen = Math.round(40 - pullProgress * 15); // 蠑輔″蟇・○繧九⊇縺ｩ閻輔′邵ｮ繧
                            ctx.beginPath(); ctx.moveTo(cx, this.y + 10); ctx.lineTo(cx, this.y + 40); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx - 10, this.y + 60); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + 10, this.y + 60); ctx.moveTo(cx, this.y + 20); ctx.lineTo(cx + (this.facingRight ? armLen : -armLen), this.y + 25); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, this.y + 10, 10, 0, Math.PI * 2); ctx.stroke();
                        } else if (this.actionState === 'GRAB_ATTEMPT') {
                            // 縺､縺九∩隧ｦ縺ｿ繝｢繝ｼ繧ｷ繝ｧ繝ｳ: stateTimer 0竊・縺ｧ莨ｸ縺ｳ繧・ 7竊・5縺ｧ邵ｮ繧
                            var grabProgress = this.stateTimer <= 7 ? this.stateTimer / 7 : 1 - (this.stateTimer - 7) / 8;
                            var armLen = Math.round(10 + grabProgress * 35); // 10px・・5px
                            ctx.beginPath(); ctx.moveTo(cx, this.y + 10); ctx.lineTo(cx, this.y + 40); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx - 10, this.y + 60); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + 10, this.y + 60); ctx.moveTo(cx, this.y + 22); ctx.lineTo(cx + (this.facingRight ? armLen : -armLen), this.y + 22); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, this.y + 10, 10, 0, Math.PI * 2); ctx.stroke();
                            // 謇具ｼ医げ繝ｼ・峨ｒ蜈育ｫｯ縺ｫ謠上￥
                            ctx.beginPath(); ctx.arc(cx + (this.facingRight ? armLen : -armLen), this.y + 22, 5, 0, Math.PI * 2); ctx.stroke();
                        } else {
                            ctx.beginPath(); ctx.moveTo(cx, this.y + 10); ctx.lineTo(cx, this.y + 40); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx - 10, this.y + 60); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + 10, this.y + 60); ctx.moveTo(cx, this.y + 20); ctx.lineTo(cx + (this.facingRight ? 15 : -15), this.y + 30); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, this.y + 10, 10, 0, Math.PI * 2); ctx.stroke();
                        }
                        if (this.actionState === 'SHIELD') { ctx.save(); ctx.fillStyle = `rgba(116, 185, 255, ${this.shieldHP / 150})`; ctx.strokeStyle = "#0984e3"; ctx.beginPath(); ctx.arc(cx, this.y + this.h / 2, 45, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
                        if (this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type !== 'beam') {
                            var atk = this.currentAttack; var progress = this.stateTimer / atk.frames; var angleDeg = 0;
                            if (this.currentAttackType === 'SIDE') { var start = 45; var end = 135; if (!this.facingRight) { start = -45; end = -135; } angleDeg = start + (end - start) * progress; } else if (this.currentAttackType === 'UP' || this.currentAttackType === 'AIR_UP') { if (this.charId === 'mage') { var spinSpeed = 0.5; var t = this.stateTimer * spinSpeed; var handX = cx; var handY = this.y - 40; var width = 40; var height = 10; var staffX = Math.cos(t) * width; var staffY = Math.sin(t) * height; ctx.save(); ctx.translate(handX, handY); ctx.globalAlpha = 0.2; ctx.fillStyle = "#a29bfe"; ctx.beginPath(); ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.translate(staffX, staffY); var scaleX = Math.sin(t); ctx.scale(scaleX, 1); ctx.rotate(-90 * Math.PI / 180); ctx.fillStyle = "#8e44ad"; ctx.fillRect(-2, -5, 4, 15); var orbColor = this.chargePower > 1.2 ? '#fff' : "#a29bfe"; if (this.chargePower > 1.2) { ctx.shadowBlur = 10; ctx.shadowColor = "#fff"; } ctx.fillStyle = orbColor; ctx.beginPath(); ctx.arc(0, -60, 8, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = "#555"; ctx.fillRect(-2, -55, 4, 50); ctx.restore(); ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(handX, handY); ctx.stroke(); ctx.restore(); return; } else { var start = -60; var end = 60; if (!this.facingRight) { start = 60; end = -60; } angleDeg = start + (end - start) * progress; } } else if (this.currentAttackType === 'AIR_SIDE') { var start = 120; var end = 30; if (!this.facingRight) { start = -120; end = -30; } angleDeg = start + (end - start) * progress; } else if (this.currentAttackType === 'NEUTRAL') { angleDeg = this.facingRight ? 90 : -90; var ext = progress < 0.5 ? progress * 60 : (1 - progress) * 60; var handX = cx + (this.facingRight ? 15 : -15) + (this.facingRight ? ext : -ext); var handY = this.y + 30; ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(handX, handY); ctx.stroke(); this.drawSword(ctx, handX, handY, angleDeg); ctx.restore(); return; } else if ((this.currentAttackType === 'DOWN' || this.currentAttackType === 'AIR_DOWN') && this.charId === 'mage') { angleDeg = this.facingRight ? 120 : -120; var handX = cx + (this.facingRight ? 20 : -20); var handY = this.y + 30; ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(handX, handY); ctx.stroke(); this.drawSword(ctx, handX, handY, angleDeg); ctx.restore(); return; } else if (atk.type === 'meteor') { angleDeg = 180; } else if (atk.type === 'spin') { angleDeg = progress * 720; } else if (atk.type === 'down') { angleDeg = 180; } else if (atk.type === 'slash_down') {
                                // Sword Air Down Visual (points down)
                                angleDeg = 180;
                            } else { angleDeg = this.facingRight ? 45 : -45; } var rad = angleDeg * Math.PI / 180; var handX = cx + Math.sin(rad) * 20; var handY = (this.y + 25) - Math.cos(rad) * 20; ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(handX, handY); ctx.stroke(); this.drawSword(ctx, handX, handY, angleDeg); ctx.restore(); return;
                        } else if (this.actionState === 'CHARGE') { var chargeAng = this.facingRight ? 45 : -45; var handX = cx - (this.facingRight ? 10 : -10); var handY = (this.y + 25) - 5; ctx.beginPath(); ctx.moveTo(cx, (this.y + 25)); ctx.lineTo(handX, handY); ctx.stroke(); this.drawSword(ctx, handX, handY, chargeAng + (Math.random() * 5)); } else { var handX = cx + (this.facingRight ? 15 : -15); var handY = (this.y + 25) + 15; ctx.beginPath(); ctx.moveTo(cx, (this.y + 25)); ctx.lineTo(handX, handY); ctx.stroke(); this.drawSword(ctx, handX, handY, this.facingRight ? 30 : -30); }
                    }
                }
            }
        }
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
};

// 8. ONLOAD (INITIALIZATION)
