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
window.SMA.createParticles = function (x, y, n, c) { if (window.SMA.isHost && window.SMA.isOnline) window.SMA.syncEvents.push({ type: 'part', x: x, y: y, n: n, c: c }); for (var i = 0; i < n; i++) window.SMA.particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, color: c, l: 20 }); };
window.SMA.updateParticles = function (ctx) { for (var i = window.SMA.particles.length - 1; i >= 0; i--) { var p = window.SMA.particles[i]; ctx.fillStyle = p.color; ctx.globalAlpha = p.life / 30; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; } };
window.SMA.drawTrident = function (ctx, x, y, angleDeg, color, tipColor) {
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
window.SMA.drawHammer = function (ctx, x, y, angleDeg, color, headColor) {
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

// --- Core game loop, simulation, fighters ---
window.SMA.initCanvas = function () { if (!window.SMA.canvas) window.SMA.canvas = document.getElementById('gameCanvas'); if (window.SMA.canvas) { window.SMA.canvas.width = window.SMA.canvas.clientWidth || 1280; window.SMA.canvas.height = window.SMA.canvas.clientHeight || 720; window.SMA.SCREEN_W = window.SMA.canvas.width; window.SMA.SCREEN_H = window.SMA.canvas.height; if (!window.SMA.ctx) window.SMA.ctx = window.SMA.canvas.getContext('2d'); } };
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
    if (window.SMA.animationFrameId) cancelAnimationFrame(window.SMA.animationFrameId); window.SMA.initCanvas(); window.SMA.gameRunning = true; window.SMA.gameState = 'COUNTDOWN'; window.SMA.countdownTimer = 180; var elTxtOvl = document.getElementById('text-overlay'); if (elTxtOvl) elTxtOvl.style.opacity = 1;

    // STAGE INIT
    var stg = window.SMA.selectedStage;
    window.SMA.platforms = [];
    var mx = window.SMA.WORLD_W / 2 - 450; var my = window.SMA.WORLD_H * 0.7;

    if (stg === 'final') {
        // Final Destination: One big platform (FIXED WIDTH: 900)
        window.SMA.platforms.push({ x: window.SMA.WORLD_W / 2 - 450, y: my, w: 900, h: 40, type: 'main' });
    } else {
        // Battlefield
        window.SMA.platforms.push({ x: mx, y: my, w: 900, h: 40, type: 'main' });
        window.SMA.platforms.push({ x: mx + 300, y: my - 180, w: 300, h: 10, type: 'plat' });
        window.SMA.platforms.push({ x: mx + 50, y: my - 90, w: 200, h: 10, type: 'plat' });
        window.SMA.platforms.push({ x: mx + 650, y: my - 90, w: 200, h: 10, type: 'plat' });
    }

    // Stars / Background setup
    window.SMA.stars = [];
    if (stg === 'final') {
        // Day: Clouds
        for (var i = 0; i < 20; i++) { window.SMA.stars.push({ x: Math.random() * (window.SMA.WORLD_W + 1000) - 500, y: Math.random() * (window.SMA.WORLD_H / 2), s: Math.random() * 50 + 30, type: 'cloud' }); }
    } else {
        // Night: Stars
        for (var i = 0; i < 200; i++) { window.SMA.stars.push({ x: Math.random() * (window.SMA.WORLD_W + 1000) - 500, y: Math.random() * (window.SMA.WORLD_H + 500) - 500, s: Math.random() * 2 + 1, type: 'star' }); }
    }

    // プレイヤー初期化（4人対応）
    var charIds = [window.SMA.p1CharId, window.SMA.p2CharId, window.SMA.p3CharId, window.SMA.p4CharId];
    var colors = window.SMA.PLAYER_COLORS;
    var pc = window.SMA.playerCount || 2;
    // 初期位置を均等に分散
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
    // 互換エイリアス
    window.SMA.pOne = window.SMA.players[0];
    window.SMA.pTwo = window.SMA.players[1];
    window.SMA.projectiles = [];
    // HUD名前設定
    if (window.SMA.isHost) {
        document.getElementById('p1-name').innerText = window.SMA.localPlayerName;
        for (var pi = 1; pi < pc; pi++) {
            var pObj = window.SMA.connections.find(function (x) { return x.role === window.SMA.PLAYER_ROLES[pi]; });
            var hudName = document.getElementById('p' + (pi + 1) + '-name');
            if (hudName) hudName.innerText = window.SMA.isOnline && pObj ? pObj.name : "CPU";
        }
    }
    // HUD表示制御
    for (var pi = 0; pi < 4; pi++) {
        var hud = document.getElementById('p' + (pi + 1) + '-hud');
        if (hud) hud.style.display = (pi < pc) ? '' : 'none';
    }
    window.SMA.camera.x = mainPlat.x + mainPlat.w / 2; window.SMA.camera.y = mainPlat.y - 200; window.SMA.gameLoop();
};
window.SMA.updateCPU = function (cpu, targets) {
    // 最も近い敵をターゲットに
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
            if (window.SMA.gameState === 'COUNTDOWN') { window.SMA.countdownTimer--; if (window.SMA.isHost && window.SMA.countdownTimer <= 0) window.SMA.gameState = 'PLAYING'; } else if (window.SMA.gameState === 'PLAYING' && window.SMA.isHost) { window.SMA.countdownTimer--; }

            if (window.SMA.isHost) {
                if (window.SMA.gameState === 'PLAYING') {
                    var S = window.SMA;
                    var allPlayers = S.players;
                    var pc = allPlayers.length;

                    // 各プレイヤーの入力処理とupdate
                    for (var pi = 0; pi < pc; pi++) {
                        var player = allPlayers[pi];
                        var role = S.PLAYER_ROLES[pi];
                        // 対戦相手を取得（最も近い敵）
                        var nearestEnemy = null;
                        var minEnemyDist = Infinity;
                        for (var ej = 0; ej < pc; ej++) {
                            if (ej === pi || allPlayers[ej].stocks <= 0) continue;
                            var ed = Math.abs(allPlayers[ej].x - player.x);
                            if (ed < minEnemyDist) { minEnemyDist = ed; nearestEnemy = allPlayers[ej]; }
                        }
                        if (!nearestEnemy) nearestEnemy = allPlayers[(pi + 1) % pc];

                        if (pi === 0) {
                            // 1P: ホストの入力
                            player.update(S.myKeys, nearestEnemy);
                        } else if (S.isOnline) {
                            // オンライン: リモート入力
                            var rKeys = S.remoteKeysMap[role] || {};
                            // 入力フリーズチェック
                            if (S.remoteLastInputTimeMap[role] > 0 && (Date.now() - S.remoteLastInputTimeMap[role] > 1000)) {
                                rKeys = { left: false, right: false, up: false, down: false, shield: false };
                            }
                            // イベント処理
                            var events = S.remoteEventsMap[role] || [];
                            while (events.length > 0) {
                                var ev = events.shift();
                                if (ev.triggerStartCharge) player.startCharge();
                                if (ev.triggerReleaseAttack) player.releaseAttack(ev.attackType);
                                if (ev.triggerJump) player.triggerJump(ev);
                                if (ev.triggerGrab) player.tryGrab(nearestEnemy);
                            }
                            player.update(rKeys, nearestEnemy);
                        } else {
                            // ソロモード: CPU
                            S.updateCPU(player, allPlayers);
                        }
                    }

                    // スポーン中の保護
                    allPlayers.forEach(function (p) {
                        if (p.invincible > 120) {
                            p.percent = 0;
                            if (p.actionState === 'STUN') p.actionState = 'IDLE';
                        }
                    });

                    for (var i = window.SMA.projectiles.length - 1; i >= 0; i--) {
                        var p = window.SMA.projectiles[i];
                        if (p.type === 'fire_trap') { p.life--; } else if (p.type === 'spear_throw' || p.type === 'shockwave') {
                            p.life--; if (p.type === 'spear_throw') {
                                if (p.life === 30) { p.dmg *= 0.5; p.kb *= 0.5; p.scale *= 0.5; }
                                if (p.life > 30) { p.vx *= 0.9; p.vy *= 0.9; } else {
                                    // 所有者を検索
                                    var owner = null;
                                    for (var oi = 0; oi < allPlayers.length; oi++) {
                                        if (allPlayers[oi].playerRole === p.ownerRole) { owner = allPlayers[oi]; break; }
                                    }
                                    if (owner) { var dx = owner.x + owner.w / 2 - p.x; var dy = owner.y + owner.h / 2 - p.y; var dist = Math.sqrt(dx * dx + dy * dy); if (dist < 30) { window.SMA.projectiles.splice(i, 1); continue; } p.vx += dx * 0.05; p.vy += dy * 0.05; }
                                } p.angle += 0.5;
                            } p.x += p.vx; p.y += p.vy;
                        } else { p.x += p.vx; p.y += p.vy; p.life--; if (p.type === 'fire') { for (var j = 0; j < window.SMA.platforms.length; j++) { var plat = window.SMA.platforms[j]; if (p.y > plat.y && p.y < plat.y + plat.h && p.x > plat.x && p.x < plat.x + plat.w) { p.type = 'fire_trap'; p.vx = 0; p.vy = 0; p.y = plat.y - 10; p.life = 60; p.w = 60; p.h = 40; window.SMA.playSound('special'); window.SMA.createParticles(p.x, p.y, 10, '#e17055'); break; } } } } if (p.life <= 0) window.SMA.projectiles.splice(i, 1);
                    }
                    // ヒット判定: 全プレイヤーの組み合わせ
                    for (var ai = 0; ai < pc; ai++) {
                        for (var bi = ai + 1; bi < pc; bi++) {
                            window.SMA.checkHit(allPlayers[ai], allPlayers[bi]);
                            window.SMA.checkHit(allPlayers[bi], allPlayers[ai]);
                            window.SMA.checkMirrorHit(allPlayers[ai], allPlayers[bi]);
                            window.SMA.checkMirrorHit(allPlayers[bi], allPlayers[ai]);
                        }
                    }
                    window.SMA.checkGameSet();
                    // ネットワーク同期
                    if (window.SMA.isOnline) {
                        var pkt = { type: 'sync', stg: window.SMA.selectedStage, gState: window.SMA.gameState, cd: window.SMA.countdownTimer, playerCount: pc, events: window.SMA.syncEvents, projs: window.SMA.projectiles.map(function (p) { return { x: p.x, y: p.y, vx: p.vx, vy: p.vy, type: p.type, w: p.w, h: p.h, color: p.color, angle: p.angle || 0 }; }), win: (window.SMA.gameState === 'GAMEOVER' ? document.getElementById('result-text').innerText : null) };
                        // 各プレイヤーの状態を追加
                        for (var si = 0; si < pc; si++) {
                            pkt['p' + (si + 1)] = allPlayers[si].serialize();
                        }
                        if (!window.SMA.isGravity) window.SMA.connections.forEach(function (c) { if (c.conn.open) try { c.conn.send({ type: 'sync', data: JSON.stringify(pkt) }); } catch (e) { } });
                        // Gravityは試合中PeerJS優先。必要時のみSDKへ低頻度フォールバック。
                        if (window.SMA.isGravity) window.SMA.sendGravitySync(pkt);
                        window.SMA.syncEvents = [];
                    }
                }
            } else {
                if (window.SMA.netConn && window.SMA.netConn.open && !(window.SMA.isGravity && window.SMA.gravityUsePeerInMatch)) {
                    window.SMA.netConn.send({ type: 'input', keys: window.SMA.myKeys });
                }
                // Gravity入力送信
                if (window.SMA.isGravity && !window.SMA.isHost) {
                    window.SMA.sendGravityInput(window.SMA.myKeys);
                }
                window.SMA.players.forEach(function (p) { if (p && p.actionState !== 'DEAD') { p.animScale.x += (1.0 - p.animScale.x) * 0.2; p.animScale.y += (1.0 - p.animScale.y) * 0.2; if (p.actionState !== 'LEDGE_ROLL') p.rotation = 0; } });
            }
        }

        // PARTICLES (FIX: MOVED OUTSIDE isHost)
        for (var i = window.SMA.comets.length - 1; i >= 0; i--) { var c = window.SMA.comets[i]; c.x += c.vx; c.y += c.vy; c.l--; if (c.l <= 0) window.SMA.comets.splice(i, 1); }
        for (var i = window.SMA.particles.length - 1; i >= 0; i--) { var p = window.SMA.particles[i]; p.x += p.vx; p.y += p.vy; p.life--; if (p.life <= 0) window.SMA.particles.splice(i, 1); }

        // カメラ: 全生存プレイヤーを追従
        var targets = [];
        window.SMA.players.forEach(function (p) { if (p.stocks > 0) targets.push(p); });
        if (window.SMA.gameState === 'GAMEOVER') {
            // 勝者にフォーカス
            var winner = null;
            window.SMA.players.forEach(function (p) { if (p.stocks > 0) winner = p; });
            if (winner) targets = [winner];
        }
        var tx = window.SMA.WORLD_W / 2; var ty = window.SMA.WORLD_H / 2; var tz = 1.0; if (window.SMA.gameState === 'COUNTDOWN') { tz = window.SMA.SCREEN_W / 1200; } else if (targets.length > 0) { var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity; targets.forEach(function (p) { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y; }); tx = (minX + maxX) / 2; ty = (minY + maxY) / 2; var zx = window.SMA.SCREEN_W / (maxX - minX + 500); var zy = window.SMA.SCREEN_H / (maxY - minY + 400); tz = Math.min(Math.min(zx, zy), 1.2); if (tz < 0.5) tz = 0.5; if (window.SMA.gameState === 'GAMEOVER') tz = 2.0; } if (!isNaN(tx)) window.SMA.camera.x += (tx - window.SMA.camera.x) * 0.1; if (!isNaN(ty)) window.SMA.camera.y += (ty - window.SMA.camera.y) * 0.1; if (!isNaN(tz)) window.SMA.camera.zoom += (tz - window.SMA.camera.zoom) * 0.05; if (isNaN(window.SMA.camera.x)) window.SMA.camera.x = 0; if (window.SMA.shake > 0) window.SMA.shake *= 0.9; if (window.SMA.shake < 0.5) window.SMA.shake = 0; if (window.SMA.ctx) {
            window.SMA.ctx.setTransform(1, 0, 0, 1, 0, 0);

            // BACKGROUND RENDER
            var stg = window.SMA.selectedStage;
            if (stg === 'final') {
                var grad = window.SMA.ctx.createLinearGradient(0, 0, 0, window.SMA.canvas.height);
                grad.addColorStop(0, "#2c3e50");
                grad.addColorStop(1, "#d35400");
                window.SMA.ctx.fillStyle = grad;
            } else {
                window.SMA.ctx.fillStyle = "#0f0f23";
            }
            window.SMA.ctx.fillRect(0, 0, window.SMA.canvas.width, window.SMA.canvas.height);

            window.SMA.ctx.save(); window.SMA.ctx.translate(window.SMA.SCREEN_W / 2, window.SMA.SCREEN_H / 2); window.SMA.ctx.scale(window.SMA.camera.zoom, window.SMA.camera.zoom); window.SMA.ctx.translate(-window.SMA.camera.x + (Math.random() - 0.5) * window.SMA.shake, -window.SMA.camera.y + (Math.random() - 0.5) * window.SMA.shake); for (var i = 0; i < window.SMA.stars.length; i++) {
                var s = window.SMA.stars[i];
                if (stg === 'final') {
                    window.SMA.ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                    window.SMA.ctx.beginPath(); window.SMA.ctx.ellipse(s.x, s.y, s.s, s.s / 2, 0, 0, Math.PI * 2); window.SMA.ctx.fill();
                } else {
                    window.SMA.ctx.fillStyle = "rgba(255, 255, 200, " + (0.5 + Math.random() * 0.5) + ")";
                    window.SMA.ctx.beginPath(); window.SMA.ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2); window.SMA.ctx.fill();
                }
            } if (window.SMA.platforms.length > 0) { var m = window.SMA.platforms[0]; window.SMA.ctx.fillStyle = "#3e2723"; window.SMA.ctx.beginPath(); window.SMA.ctx.moveTo(m.x, m.y); window.SMA.ctx.lineTo(m.x + m.w, m.y); window.SMA.ctx.lineTo(m.x + m.w / 2, m.y + 200); window.SMA.ctx.fill(); for (var i = 0; i < window.SMA.platforms.length; i++) { var p = window.SMA.platforms[i]; window.SMA.ctx.fillStyle = "#3e2723"; window.SMA.ctx.fillRect(p.x, p.y, p.w, p.h); window.SMA.ctx.fillStyle = "#a1887f"; window.SMA.ctx.fillRect(p.x, p.y, p.w, 5); } }
            // 全プレイヤー描画
            window.SMA.players.forEach(function (p) { try { if (p) p.draw(window.SMA.ctx); } catch (e) { } });
            // 鏡オブジェクトと鏡像の描画
            try {
                window.SMA.players.forEach(function (fighter) {
                    if (!fighter || fighter.charId !== 'mirror') return;
                    // 鏡設置中: プレビュー表示
                    if (!fighter.mirror && fighter.actionState === 'ATTACK' && fighter.currentAttack && fighter.currentAttack.type === 'mirror_place') {
                        var ctx = window.SMA.ctx;
                        ctx.save();
                        var previewX = fighter.x + fighter.w / 2 + (fighter.facingRight ? fighter.mirrorPlaceRange : -fighter.mirrorPlaceRange);
                        var previewY = fighter.y + fighter.h;
                        ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.15;
                        ctx.strokeStyle = '#81ecec';
                        ctx.lineWidth = 2;
                        ctx.setLineDash([4, 4]);
                        ctx.strokeRect(previewX - 4, previewY - 56, 8, 57);
                        ctx.setLineDash([]);
                        ctx.restore();
                    }
                    // 鏡オブジェクトの描画
                    if (fighter.mirror) {
                        var mx = fighter.mirror.x;
                        var my = fighter.mirror.y;
                        var ctx = window.SMA.ctx;
                        ctx.save();
                        // 鏡本体（細い縦長の矩形）
                        var grad = ctx.createLinearGradient(mx - 3, my - 50, mx + 3, my);
                        grad.addColorStop(0, 'rgba(129, 236, 236, 0.9)');
                        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
                        grad.addColorStop(1, 'rgba(129, 236, 236, 0.9)');
                        ctx.fillStyle = grad;
                        ctx.fillRect(mx - 3, my - 55, 6, 55);
                        // 光のエフェクト
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(mx - 4, my - 56, 8, 57);
                        // タイマー表示（残り時間バー）
                        var ratio = fighter.mirror.timer / 480;
                        ctx.fillStyle = 'rgba(129, 236, 236, ' + (0.3 + ratio * 0.5) + ')';
                        ctx.fillRect(mx - 10, my + 2, 20 * ratio, 3);
                        ctx.restore();
                    }
                    // 鏡像の描画（攻撃モーション反映）
                    if (fighter.mirrorClone && fighter.mirror) {
                        var ctx = window.SMA.ctx;
                        ctx.save();
                        ctx.globalAlpha = 0.45;
                        var cX = fighter.mirrorClone.x;
                        var cY = fighter.mirrorClone.y;
                        var cx = cX + fighter.w / 2;
                        ctx.strokeStyle = '#81ecec';
                        ctx.lineWidth = 4;
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        var fr = fighter.mirrorClone.facingRight;
                        // 頭
                        ctx.beginPath(); ctx.arc(cx, cY + 10, 10, 0, Math.PI * 2); ctx.stroke();
                        // 体
                        ctx.beginPath(); ctx.moveTo(cx, cY + 10); ctx.lineTo(cx, cY + 40); ctx.stroke();
                        // 足（走りモーション模倣）
                        if (fighter.actionState === 'IDLE' && (fighter.vx > 1 || fighter.vx < -1)) {
                            var legPhase = Math.sin(Date.now() * 0.015) * 12;
                            ctx.beginPath(); ctx.moveTo(cx, cY + 40); ctx.lineTo(cx + legPhase, cY + 60); ctx.stroke();
                            ctx.beginPath(); ctx.moveTo(cx, cY + 40); ctx.lineTo(cx - legPhase, cY + 60); ctx.stroke();
                        } else {
                            ctx.beginPath(); ctx.moveTo(cx, cY + 40); ctx.lineTo(cx - 10, cY + 60); ctx.stroke();
                            ctx.beginPath(); ctx.moveTo(cx, cY + 40); ctx.lineTo(cx + 10, cY + 60); ctx.stroke();
                        }
                        // 浮遊鏡の基本座標
                        var hoverY = Math.sin(Date.now() / 200) * 5;
                        var baseY = cY + 20 + hoverY;
                        var baseX = cx + (fr ? 30 : -30);

                        // 腕（自然に下ろす）
                        ctx.strokeStyle = '#00cec9';
                        ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.moveTo(cx, cY + 20); ctx.lineTo(cx + (fr ? 5 : -5), cY + 35); ctx.stroke();

                        // 浮遊鏡のアニメーション
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
                                var r = 40;
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
                                var throwDist = 60;
                                var distX = Math.sin(forwardP * Math.PI) * throwDist;
                                mirX = cx + (fr ? distX : -distX);
                                mirY = cY + 25;
                            } else if (fighter.currentAttackType === 'NEUTRAL' || atkType === 'mirror_slash') {
                                var pokeDist = Math.sin(forwardP * Math.PI) * 45;
                                mirX = cx + (fr ? 30 + pokeDist : -30 - pokeDist);
                            } else if (fighter.currentAttackType === 'DOWN' || fighter.currentAttackType === 'AIR_DOWN' || atkType === 'mirror_place') {
                                mirScale = 1.5;
                                mirAngle = forwardP * Math.PI * 4;
                                var throwH = 40;
                                mirX = cx + (fr ? 15 : -15);
                                mirY = cY + 40 + Math.sin(forwardP * Math.PI) * throwH;
                            }
                        }

                        // 鏡像の鏡の描画（独立）
                        ctx.save();
                        ctx.translate(mirX, mirY);
                        ctx.rotate(mirAngle);
                        ctx.scale(mirScale, mirScale);

                        ctx.strokeStyle = '#81ecec';
                        ctx.lineWidth = 2.6;
                        var len = 14;
                        ctx.beginPath(); ctx.moveTo(0, -len); ctx.lineTo(0, len); ctx.stroke();

                        ctx.restore();

                        ctx.restore();
                    }
                });
            } catch (e) { }
            for (var i = 0; i < window.SMA.projectiles.length; i++) {
                var p = window.SMA.projectiles[i]; if (p.type === 'fire_trap') { window.SMA.ctx.save(); for (var k = 0; k < 3; k++) { window.SMA.ctx.fillStyle = "rgba(255, " + (Math.floor(Math.random() * 150) + 50) + ", 0, " + (0.5 + Math.random() * 0.5) + ")"; var w = p.w * (0.8 + Math.random() * 0.4); var h = p.h * (1.0 + Math.random() * 0.5); var fx = p.x + (Math.random() - 0.5) * 20; window.SMA.ctx.beginPath(); window.SMA.ctx.moveTo(fx - w / 2, p.y + 40); window.SMA.ctx.lineTo(fx + w / 2, p.y + 40); window.SMA.ctx.lineTo(fx, p.y - h); window.SMA.ctx.fill(); } window.SMA.ctx.restore(); } else if (p.type === 'spear_throw') { try { window.SMA.ctx.save(); window.SMA.ctx.translate(p.x, p.y); window.SMA.ctx.rotate(p.angle); window.SMA.ctx.translate(-35, 0); window.SMA.drawTrident(window.SMA.ctx, 0, 0, 0, p.color); window.SMA.ctx.restore(); } catch (e) { } } else if (p.type === 'shockwave') { window.SMA.ctx.fillStyle = "#ffeaa7"; window.SMA.ctx.beginPath(); window.SMA.ctx.arc(p.x, p.y, p.w / 2, 0, Math.PI, true); window.SMA.ctx.fill(); } else if (p.type === 'angel_arrow') {
                    // エンジェル弓矢: 矢の形で描画
                    window.SMA.ctx.save();
                    window.SMA.ctx.translate(p.x, p.y);
                    var arrowAngle = Math.atan2(p.vy, p.vx);
                    window.SMA.ctx.rotate(arrowAngle);
                    // 矢の光エフェクト
                    window.SMA.ctx.shadowBlur = 8; window.SMA.ctx.shadowColor = p.color;
                    // 矢じり（三角形）
                    window.SMA.ctx.fillStyle = p.color;
                    window.SMA.ctx.beginPath();
                    window.SMA.ctx.moveTo(12, 0);
                    window.SMA.ctx.lineTo(-4, -5);
                    window.SMA.ctx.lineTo(-4, 5);
                    window.SMA.ctx.closePath();
                    window.SMA.ctx.fill();
                    // 矢の棒
                    window.SMA.ctx.strokeStyle = '#c89b3c'; window.SMA.ctx.lineWidth = 2;
                    window.SMA.ctx.beginPath();
                    window.SMA.ctx.moveTo(-4, 0);
                    window.SMA.ctx.lineTo(-22, 0);
                    window.SMA.ctx.stroke();
                    // 羽根（矢の後ろ）
                    window.SMA.ctx.strokeStyle = '#fff'; window.SMA.ctx.lineWidth = 1;
                    window.SMA.ctx.beginPath(); window.SMA.ctx.moveTo(-20, 0); window.SMA.ctx.lineTo(-25, -4); window.SMA.ctx.stroke();
                    window.SMA.ctx.beginPath(); window.SMA.ctx.moveTo(-20, 0); window.SMA.ctx.lineTo(-25, 4); window.SMA.ctx.stroke();
                    window.SMA.ctx.shadowBlur = 0;
                    window.SMA.ctx.restore();
                } else { window.SMA.ctx.fillStyle = p.color; window.SMA.ctx.beginPath(); window.SMA.ctx.arc(p.x, p.y, p.w / 2, 0, Math.PI * 2); window.SMA.ctx.fill(); }
            } window.SMA.drawComets(window.SMA.ctx); window.SMA.updateParticles(window.SMA.ctx); window.SMA.ctx.restore();
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
                // ハンマー下A（竜巻）はシールド削り力0
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
            if (p.type === 'fire_trap') { if (p.x + p.w / 2 > vic.x && p.x - p.w / 2 < vic.x + vic.w && p.y + 40 > vic.y && p.y - p.h < vic.y + vic.h) hit = true; } else { if (p.x + p.w / 2 > vic.x && p.x - p.w / 2 < vic.x + vic.w && p.y + p.w / 2 > vic.y && p.y - p.w / 2 < vic.y + vic.h) hit = true; }
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

                vic.vx = (p.vx > 0 ? 1 : -1) * kb * 2.0; if (p.vx === 0) vic.vx = (p.x < vic.x + vic.w / 2 ? 1 : -1) * kb * 2.0; vic.vy = -kb * 2.0; vic.enterState('STUN', Math.min(60, kb * 1.5)); window.SMA.hitStop = Math.floor(kb * 0.5); window.SMA.shake = 5; window.SMA.createParticles(vic.x, vic.y, 10, p.color); window.SMA.playSound('hit'); if (p.type !== 'fire_trap') window.SMA.projectiles.splice(i, 1);
            }
        }
    }
};

// 鏡像のヒットボックスチェック
window.SMA.checkMirrorHit = function (atk, vic) {
    if (!atk.mirrorClone || !atk.mirror) return;
    if (vic.invincible > 0 || vic.actionState === 'RESPAWN' || vic.actionState === 'DEAD') return;
    if (!atk.hitbox.active || atk.actionState !== 'ATTACK') return;
    if (vic.stocks <= 0) return;
    // 鏡像用の独立したhasHitフラグ
    if (atk.mirrorHasHit) return;

    // 鏡像のヒットボックス位置を計算
    // 鏡像は既に鏡の反対側にいるので、攻撃方向を左右反転するだけ
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
        // ダメージ0.5倍、吹っ飛ばしはユーザー設定通りの2.0倍
        if (data.dmg) vic.percent += data.dmg * p * 0.5;
        var atkScale = (data.scale !== undefined) ? data.scale : 0.1;
        var kbMult = window.SMA.CHAR_DATA[vic.charId].kbMult || 1.0;
        // バースト力を本体の 1.75 倍に調整（1.5 -> 1.75）
        var kb = (data.kb * p + (Math.pow(vic.percent, 1.2) * atkScale * p * 0.5)) * kbMult * 1.75;
        var r = data.angle * (Math.PI / 180);
        // 鏡像の向きで吹っ飛ばし方向を決定
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
        iconEl.innerText = '🏆';
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
    // 生存者カウント
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
        // ホストかつオンラインなら再戦ボタン表示
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
        if (id === 'sword') return '⚔️';
        if (id === 'mage') return '🪄';
        if (id === 'brawler') return '👊';
        if (id === 'spear') return '🔱';
        if (id === 'hammer') return '🔨';
        if (id === 'mirror') return '🪞';
        if (id === 'angel') return '👼';
        return '👤';
    };
    var getDamageColor = function (pct, pIndex) {
        if (pct >= 100) return '#c0392b'; // 濃い赤
        if (pct >= 70) return '#e67e22'; // オレンジ
        if (pct >= 30) return '#f1c40f'; // 黄色
        // 30%未満は元のテーマカラーにする（白でも可ですが文字色としての可読性を保持）
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
            // 100%以上のブルブル（簡易シェイク）表現
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
                // プレイヤーアイコン画像でストック表示
                var stockHtml = '';
                for (var si = 0; si < Math.max(0, player.stocks); si++) {
                    stockHtml += '<img src="' + pIconUrl + '" style="width:16px;height:16px;border-radius:50%;margin:0 1px;vertical-align:middle;">';
                }
                stkEl.innerHTML = stockHtml;
            } else {
                // アイコンなし時はキャラ絵文字にフォールバック
                var icon = getStockIcon(player.charId);
                stkEl.innerText = icon.repeat(Math.max(0, player.stocks));
            }
        }

        // アイコンはストック表示に統合したため、hud-icon要素は非表示のまま
        if (iconEl) iconEl.style.display = 'none';
    }
    var elOvlMsg = document.getElementById('overlay-msg'); var elTxtOvl = document.getElementById('text-overlay');
    if (window.SMA.gameState === 'COUNTDOWN') { var t = '3'; if (window.SMA.countdownTimer < 60) t = '1'; else if (window.SMA.countdownTimer < 120) t = '2'; if (elOvlMsg) elOvlMsg.innerText = t; if (elTxtOvl) elTxtOvl.style.opacity = 1; }
    else if (window.SMA.gameState === 'PLAYING') { if (window.SMA.countdownTimer > -30) { if (elOvlMsg) elOvlMsg.innerText = 'GO!'; if (elTxtOvl) elTxtOvl.style.opacity = 1; } else { if (elTxtOvl) elTxtOvl.style.opacity = 0; } }
};
window.SMA.applySync = function (d) {
    if (d.data) { try { d = JSON.parse(d.data); } catch (e) { return; } }
    window.SMA.gameState = d.gState; window.SMA.countdownTimer = d.cd;
    // 全プレイヤーの状態を反映
    var pc = d.playerCount || 2;
    for (var si = 0; si < pc && si < window.SMA.players.length; si++) {
        var pData = d['p' + (si + 1)];
        if (pData) window.SMA.players[si].deserialize(pData);
    }
    if (d.projs) window.SMA.projectiles = d.projs;
    if (d.events) { d.events.forEach(function (e) { if (e.type === 'snd') window.SMA.playSound(e.key); if (e.type === 'part') window.SMA.createParticles(e.x, e.y, e.n, e.c); if (e.type === 'comet') window.SMA.triggerComet(e.x, e.y, e.dir, e.c); }); }
    window.SMA.updateHud();
    if (window.SMA.gameState === 'GAMEOVER') {
        var txt = d.winText || (d.win ? (String(d.win).indexOf('WINS!') !== -1 ? d.win : (d.win + ' WINS!')) : 'GAME OVER');
        var resolvedRole = d.winRole || window.SMA.inferWinnerRoleFromText(txt);
        var winnerIndex = window.SMA.getWinnerIndexFromSync(d);
        var icon = d.winIcon || window.SMA.getHudStyleWinnerIcon(winnerIndex) || window.SMA.getRoleIcon(resolvedRole) || window.SMA.resolveResultWinnerIcon(resolvedRole, txt);
        window.SMA.showGameOverResult(txt, icon);
    }
};
// rematch受信処理（ゲスト側）
var origHandleClient = window.SMA.handleClient;
window.SMA.handleClient = function (d) {
    if (d.type === 'rematch') {
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('hud-layer').style.display = 'none';
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
    this.playerRole = this.role; // players[]から上書きされる
    this.actionState = 'IDLE'; this.stateTimer = 0; this.respawnTimer = 0;
    this.currentAttack = null; this.currentAttackType = null;
    this.hitbox = { active: false, shape: 'box', x: 0, y: 0, w: 0, h: 0, radius: 0 };
    this.hasHit = false; this.chargePower = 1.0; this.shieldHP = 100;
    this.invincible = 0; this.dropThrough = false; this.grabbedTarget = null;
    this.ledgeGrabbed = null;
    this.cpuTimer = 0; this.dodgeCooldown = 0; this.grabInvincible = 0;
    this.animScale = { x: 1, y: 1 }; this.rotation = 0; this.currentPlatform = null; this.ledgeCooldown = 0;
    this.charId = charId || 'sword';
    this.hasAirDodged = false;
    this.hasUpSpecial = false;
    this.superArmor = false;
    // 鏡キャラ用プロパティ
    this.mirror = null;       // {x, y, timer} 設置中の鏡
    this.mirrorClone = null;  // {x, y, facingRight} 鏡像の位置
    this.mirrorPlaceRange = 0;
    this.mirrorHasHit = false;
    this.mirrorCooldown = 0; // 鏡のクールタイム（フレーム数, 300=5秒）
    // 長押し時の設置距離
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
            SIDE: { type: 'shot', spawnFrame: 12, dmg: 12, kb: 3.0, scale: 0.1, speed: 3.5, radius: 25, frames: 25, lag: 35, stun: 10 },
            UP: { dmg: 10, kb: 1.6, scale: 0.1, angle: -90, frames: 25, lag: 20, stun: 5 },
            DOWN: { type: 'fire_shot', spawnFrame: 10, dmg: 8, kb: 1.5, scale: 0.08, angle: -45, frames: 25, lag: 18, stun: 5, radius: 10 },
            AIR_NEUTRAL: { type: 'shot', spawnFrame: 5, dmg: 3, kb: 3.0, scale: 0, speed: 11.34, radius: 10, frames: 21, lag: 0, stun: 2, hitstun: 15 },
            AIR_SIDE: { type: 'shot', spawnFrame: 12, dmg: 12, kb: 3.0, scale: 0.1, speed: 3.5, radius: 25, frames: 25, lag: 35, stun: 10 },
            AIR_DOWN: { type: 'fire_shot', spawnFrame: 10, dmg: 8, kb: 1.5, scale: 0.08, angle: -45, frames: 25, lag: 18, stun: 5, radius: 10 },
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
            DOWN: { type: 'low_kick', dmg: 6, kb: 3.0, scale: 0.01, angle: -90, frames: 15, lag: 6, stun: 8, hitstun: 45, color: '#d35400' },
            AIR_NEUTRAL: { type: 'sex_kick', dmg: 6, kb: 1.0, scale: 0.05, angle: -45, frames: 25, lag: 1, stun: 5, hitstun: 33, color: '#f39c12' },
            AIR_SIDE: { type: 'axe', dmg: 18, kb: 16.0, scale: 0.2, angle: 90, frames: 40, lag: 16, stun: 12, color: '#c0392b' },
            AIR_UP: { dmg: 10, kb: 2.5, scale: 0.1, angle: -90, frames: 20, lag: 15, stun: 8, color: '#e74c3c' },
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
            AIR_UP: { type: 'up_rush', dmg: 9, kb: 1.63, scale: 0.08, angle: -90, frames: 40, lag: 32, color: '#00cec9', limit: true }, 
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
            NEUTRAL: { dmg: 14, kb: 5.6, scale: 0.15, angle: -45, frames: 45, lag: 10, stun: 15, color: '#b2bec3' },
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
            SIDE: { type: 'mirror_throw', dmg: 8, kb: 1.8, scale: 0.06, angle: -20, frames: 22, lag: 12, stun: 5, color: '#81ecec' },
            UP: { type: 'mirror_throw_up', dmg: 7, kb: 2.16, scale: 0.08, angle: -80, frames: 22, lag: 12, stun: 5, color: '#81ecec' },
            DOWN: { type: 'mirror_place', dmg: 0, kb: 0, scale: 0, angle: 0, frames: 200, lag: 12, stun: 0, color: '#dfe6e9' },
            AIR_NEUTRAL: { type: 'mirror_spin', dmg: 8, kb: 1.92, scale: 0.08, angle: -45, frames: 24, lag: 10, stun: 5, color: '#81ecec' },
            AIR_SIDE: { type: 'mirror_throw', dmg: 8, kb: 1.8, scale: 0.06, angle: -20, frames: 22, lag: 12, stun: 5, color: '#81ecec' },
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
            // NA: 光の弓矢を前方に射出（射程750px = WORLD_W/2）。チャージで3本（直進/斜め上/斜め下）
            NEUTRAL: { type: 'arrow_shot', spawnFrame: 6, dmg: 3, kb: 0.75, scale: 0.06, speed: 8, radius: 8, frames: 18, lag: 12, stun: 3, range: 750, color: '#ffe066' },
            // 横A: 羽ばたき攻撃。空中時は自己後方ノックバック
            SIDE: { type: 'wing_flap', dmg: 13, kb: 3, scale: 0.1, angle: -25, frames: 22, lag: 18, stun: 8, color: '#fff' },
            // 上A: 飛翔攻撃（攻撃判定付き上昇）
            UP: { type: 'wing_rise', dmg: 11, kb: 3, scale: 0.1, angle: -85, frames: 30, lag: 20, stun: 6, color: '#ffe066', limit: true },
            // 下A: 円形衝撃波（固定吹っ飛ばし、撃墜不可）。空中で滞空
            DOWN: { type: 'shockwave', dmg: 6, kb: 8.0, scale: 0, angle: -45, frames: 35, lag: 35, stun: 10, shockRadius: 140, color: '#ffe066' },
            AIR_NEUTRAL: { type: 'arrow_shot', spawnFrame: 6, dmg: 3, kb: 0.75, scale: 0.06, speed: 8, radius: 8, frames: 18, lag: 12, stun: 3, range: 750, color: '#ffe066' },
            AIR_SIDE: { type: 'wing_flap', dmg: 12, kb: 3, scale: 0.1, angle: -30, frames: 22, lag: 18, stun: 7, color: '#fff', airKnockback: true },
            AIR_UP: { type: 'wing_rise', dmg: 11, kb: 3, scale: 0.1, angle: -90, frames: 28, lag: 18, stun: 5, color: '#ffe066', limit: true },
            AIR_DOWN: { type: 'shockwave', dmg: 6, kb: 8.0, scale: 0, angle: -45, frames: 35, lag: 35, stun: 10, shockRadius: 140, color: '#ffe066', hover: true },
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

        // V410: Ledge Invincibility Limit (150 frames = 2.5 seconds)
        if (this.stateTimer > 150) {
            this.invincible = 0; // Remove invincibility
        } else {
            this.invincible = 5; // Maintain invincibility
        }

        if (!this.ledgeGrabbed) { this.actionState = 'IDLE'; return; }
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
            // 7フレーム目（腕が最大に伸びた時点）で当たり判定
            if (this.stateTimer === 7) {
                var opp = this.grabTarget;
                if (opp) {
                    var dist = Math.sqrt(Math.pow(opp.x - this.x, 2) + Math.pow(opp.y - this.y, 2));
                    var isForward = this.facingRight ? (opp.x + opp.w / 2 > this.x + this.w / 2 - 10) : (opp.x + opp.w / 2 < this.x + this.w / 2 + 10);
                    if (dist < 65 && isForward && opp.invincible === 0 && opp.grabInvincible <= 0 && opp.actionState !== 'DEAD' && opp.actionState !== 'RESPAWN' && opp.actionState !== 'DODGE') {
                        // つかみ成功
                        this.actionState = 'GRABBING'; this.grabbedTarget = opp; this.stateTimer = 120;
                        opp.chargePower = 1.0; opp.actionState = 'GRABBED'; opp.isShielding = false;
                        window.SMA.createParticles(opp.x + 15, opp.y + 30, 5, '#a29bfe');
                        this.grabTarget = null;
                    }
                }
            }
            // 15フレームでモーション終了 → つかめていなければLAG
            if (this.stateTimer >= 15 && this.actionState === 'GRAB_ATTEMPT') {
                this.grabTarget = null;
                this.enterState('LAG', 18);
            }
            break;
        }
        case 'ATTACK': if (!this.isGrounded) { var moveSpd = S.SPEED * 0.5; var cAtk = S.CHAR_DATA[this.charId] || {}; var airMoveMult = (typeof cAtk.airAttackMoveMult === 'number') ? cAtk.airAttackMoveMult : 1.0; moveSpd *= airMoveMult; if (inputKeys.left) this.vx -= moveSpd; if (inputKeys.right) this.vx += moveSpd; if (this.vx > 5) this.vx = 5; if (this.vx < -5) this.vx = -5; } if (this.currentAttack && (this.currentAttack.type === 'meteor' || this.currentAttack.type === 'beam' || this.currentAttack.type === 'dive' || this.currentAttack.type === 'axe' || this.currentAttack.type === 'stall_fall' || this.currentAttack.type === 'up_rush' || this.currentAttack.type === 'ground_shock')) { this.handleAttackFrame(); this.applyPhysics(); } else if (this.currentAttack && (this.currentAttack.type === 'slide' || this.currentAttack.type === 'lunge' || this.currentAttack.type === 'spin_hammer' || this.currentAttack.type === 'hammer_spin_air' || this.currentAttack.type === 'tornado')) { this.handleAttackFrame(); this.vx *= 0.95; this.vy += S.GRAVITY; this.checkPlatforms(inputKeys); this.x += this.vx; this.y += this.vy; if (this.y > 2000) this.checkBounds(); } else { this.handleAttackFrame(); this.applyPhysics(); } break;
        case 'CHARGE':
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

    // 鏡キャラ: 鏡タイマー更新と鏡像座標計算
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
        } // mirror存在チェック
    }
    if (this.isGrounded) { this.hasAirDodged = false; this.hasUpSpecial = false; this._wingRiseUsed = false; }
    var preGrounded = this.isGrounded;
    this.checkPlatforms(inputKeys); this.checkLedgeGrab(); this.checkSolids(); this.checkBounds();

    // 空中N着地硬直 (sword, brawler, hammer, mirror)
    if (!preGrounded && this.isGrounded) {
        if (this.actionState === 'ATTACK' && this.currentAttackType === 'AIR_NEUTRAL') {
            if (this.charId === 'sword' || this.charId === 'mirror') {
                this.actionState = 'LAG';
                this.stateTimer = 5; // 5F landing lag
                this.currentAttack = null;
                this.hitbox.active = false;
                this.rotation = 0;
            } else if (this.charId === 'hammer') {
                this.actionState = 'LAG';
                this.stateTimer = 9; // 9F landing lag
                this.currentAttack = null;
                this.hitbox.active = false;
                this.rotation = 0;
            } else if (this.charId === 'brawler') {
                this.actionState = 'LAG';
                this.stateTimer = 3; // 3F landing lag
                this.currentAttack = null;
                this.hitbox.active = false;
                this.rotation = 0;
            }
        }
    }
};
window.SMA.Fighter.prototype.serialize = function () { return { x: this.x, y: this.y, vx: this.vx, vy: this.vy, state: this.actionState, timer: this.stateTimer, atkType: this.currentAttackType, grounded: this.isGrounded, pct: this.percent, st: this.stocks, face: this.facingRight, chg: this.chargePower, sh: this.shieldHP, inv: this.invincible, grInv: this.grabInvincible, mirror: this.mirror, mirrorClone: this.mirrorClone, mirrorCooldown: this.mirrorCooldown, mirrorPlaceRange: this.mirrorPlaceRange, hitboxActive: this.hitbox.active, hitboxX: this.hitbox.x, hitboxY: this.hitbox.y, hitboxW: this.hitbox.w, hitboxH: this.hitbox.h }; };
window.SMA.Fighter.prototype.deserialize = function (data) { var S = window.SMA; if (!data) return; this.x = data.x; this.y = data.y; this.vx = data.vx; this.vy = data.vy; this.actionState = data.state; this.stateTimer = data.timer; this.isGrounded = data.grounded; this.currentAttackType = data.atkType; if (this.currentAttackType) { var set = S.CHAR_DATA[this.charId]; if (set.attacks[this.currentAttackType]) this.currentAttack = set.attacks[this.currentAttackType]; else if (set.throws[this.currentAttackType]) this.currentAttack = set.throws[this.currentAttackType]; } else this.currentAttack = null; this.percent = data.pct; this.stocks = data.st; this.facingRight = data.face; this.chargePower = data.chg; this.shieldHP = data.sh; this.invincible = data.inv; this.grabInvincible = data.grInv || 0; this.mirror = data.mirror || null; this.mirrorClone = data.mirrorClone || null; this.mirrorCooldown = data.mirrorCooldown || 0; this.mirrorPlaceRange = data.mirrorPlaceRange || 0; if (data.hitboxActive !== undefined) { this.hitbox.active = data.hitboxActive; this.hitbox.x = data.hitboxX; this.hitbox.y = data.hitboxY; this.hitbox.w = data.hitboxW; this.hitbox.h = data.hitboxH; } };
window.SMA.Fighter.prototype.enterState = function (state, duration) { this.actionState = state; this.stateTimer = duration; this.hitbox.active = false; };
window.SMA.Fighter.prototype.faceOpponent = function (opponent) { if (opponent && opponent.stocks > 0 && opponent.actionState !== 'RESPAWN' && this.actionState !== 'ATTACK') { if (this.x < opponent.x - 10) this.facingRight = true; if (this.x > opponent.x + 10) this.facingRight = false; } };
window.SMA.Fighter.prototype.applyPhysics = function () { var S = window.SMA; if (this.actionState === 'ATTACK' && this.currentAttack && (this.currentAttack.type === 'meteor' || this.currentAttack.type === 'dive' || this.currentAttack.type === 'axe' || this.currentAttack.type === 'stall_fall' || this.currentAttack.type === 'up_rush')) { if (this.vy > 30) this.vy = 30; } else { var cap = S.MAX_FALL_SPEED; if (this.actionState === 'STUN' && this.vy > cap) cap = 40; if (this.vy > cap) this.vy = cap; } if (this.actionState === 'STUN') { var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy); if (speed < 4.0) { this.vx *= S.FRICTION; this.vy += S.GRAVITY; } else { this.vx *= S.KB_FRICTION; this.vy *= S.KB_FRICTION; } } else { this.vx *= S.FRICTION; this.vy += S.GRAVITY; } if (isNaN(this.x)) this.x = 0; if (isNaN(this.y)) this.y = 0; if (isNaN(this.vx)) this.vx = 0; if (isNaN(this.vy)) this.vy = 0; this.x += this.vx; this.y += this.vy; };
window.SMA.Fighter.prototype.checkPlatforms = function (keys) { var S = window.SMA; var wasGrounded = this.isGrounded; this.isGrounded = false; this.currentPlatform = null; for (var i = 0; i < S.platforms.length; i++) { var p = S.platforms[i]; if (p.type === 'main') continue; if (!this.dropThrough) { if (this.vy >= 0 && this.y + this.h >= p.y && this.y + this.h <= p.y + 20 && this.x + this.w > p.x && this.x < p.x + p.w) { if (!keys || !keys.down) { this.y = p.y - this.h; this.vy = 0; this.isGrounded = true; this.jumps = 0; this.currentPlatform = p; break; } } } } if (!wasGrounded && this.isGrounded) { this.animScale.x = 1.3; this.animScale.y = 0.7; this.hasAirDodged = false; this.hasUpSpecial = false; } };
window.SMA.Fighter.prototype.checkLedgeGrab = function () {
    var S = window.SMA; if (this.vy > 0 && !this.isGrounded && this.ledgeCooldown <= 0 && this.actionState !== 'STUN' && this.actionState !== 'ATTACK' && this.actionState !== 'LEDGE' && this.actionState !== 'LEDGE_UP' && this.actionState !== 'LEDGE_ATK' && this.actionState !== 'LEDGE_ROLL') {
        for (var i = 0; i < S.platforms.length; i++) {
            var p = S.platforms[i]; if (p.type === 'main') {
                if (Math.abs((this.x + this.w) - p.x) < 40 && Math.abs(this.y - p.y) < 50) {
                    this.actionState = 'LEDGE'; this.chargePower = 1.0; this.ledgeGrabbed = { platform: p, dir: 'left' }; this.x = p.x - this.w; this.y = p.y; this.vx = 0; this.vy = 0; this.facingRight = true; this.invincible = 20; this.hasAirDodged = false; this.hasUpSpecial = false;
                    this.stateTimer = 0; // RESET TIMER ON GRAB
                    return;
                } if (Math.abs(this.x - (p.x + p.w)) < 40 && Math.abs(this.y - p.y) < 50) {
                    this.actionState = 'LEDGE'; this.chargePower = 1.0; this.ledgeGrabbed = { platform: p, dir: 'right' }; this.x = p.x + p.w; this.y = p.y; this.vx = 0; this.vy = 0; this.facingRight = false; this.invincible = 20; this.hasAirDodged = false; this.hasUpSpecial = false;
                    this.stateTimer = 0; // RESET TIMER ON GRAB
                    return;
                }
            }
        }
    }
};
window.SMA.Fighter.prototype.checkBounds = function () { var S = window.SMA; var dieDir = null; var dx = this.x; var dy = this.y; if (this.y < S.BLAST_TOP) dieDir = 'up'; else if (this.x > S.BLAST_RIGHT) dieDir = 'right'; else if (this.x < S.BLAST_LEFT) dieDir = 'left'; else if (this.y > S.BLAST_BOTTOM) dieDir = 'down'; if (dieDir) this.die(dieDir, dx, dy); };
window.SMA.Fighter.prototype.checkSolids = function () { var S = window.SMA; for (var p of S.platforms) { if (p.type === 'main') { if (this.x < p.x + p.w && this.x + this.w > p.x && this.y < p.y + p.h && this.y + this.h > p.y) { var overlapX = (this.x + this.w / 2) - (p.x + p.w / 2); var overlapY = (this.y + this.h / 2) - (p.y + p.h / 2); var halfW = (this.w + p.w) / 2; var halfH = (this.h + p.h) / 2; var ox = halfW - Math.abs(overlapX); var oy = halfH - Math.abs(overlapY); if (ox < oy) { if (overlapX > 0) { this.x += ox; this.vx = 0; } else { this.x -= ox; this.vx = 0; } } else { if (overlapY > 0) { this.y += oy; this.vy = 0; } else { this.y -= oy; this.vy = 0; this.isGrounded = true; this.jumps = 0; this.currentPlatform = p; this.hasAirDodged = false; this.hasUpSpecial = false; } } } } } };
window.SMA.Fighter.prototype.performDodge = function (inputKeys) { var S = window.SMA; if (this.dodgeCooldown > 0) return false; if (!this.isGrounded && this.hasAirDodged) return false; this.actionState = 'DODGE'; this.stateTimer = 25; this.invincible = 20; this.dodgeCooldown = 55; var dx = 0; var dy = 0; if (inputKeys.left) dx = -1; if (inputKeys.right) dx = 1; if (inputKeys.up) dy = -1; if (inputKeys.down) dy = 1; if (dx !== 0 || dy !== 0) { var speed = 12; if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; } this.vx = dx * speed; this.vy = dy * speed; } if (!this.isGrounded) this.hasAirDodged = true; S.playSound('jump'); S.createParticles(this.x + 15, this.y + 30, 10, '#fff'); return true; };
window.SMA.Fighter.prototype.tryGrab = function (opponent) {
    var S = window.SMA;
    if (this.actionState !== 'IDLE' || !this.isGrounded) return;
    // つかみ試みモーションを開始（15フレーム）
    this.actionState = 'GRAB_ATTEMPT';
    this.stateTimer = 0;
    this.grabTarget = opponent; // モーション終了後に判定するため保持
    this.vx *= 0.3;
};
window.SMA.Fighter.prototype.handleGrabbing = function (inputKeys) { if (!this.grabbedTarget) { this.actionState = 'IDLE'; return; } this.grabbedTarget.x = this.x + (this.facingRight ? 25 : -25); this.grabbedTarget.y = this.y - 5; this.stateTimer--; if (this.stateTimer > 108) return; var throwType = null; if (inputKeys.left) throwType = this.facingRight ? 'THROW_BK' : 'THROW_FW'; else if (inputKeys.right) throwType = this.facingRight ? 'THROW_FW' : 'THROW_BK'; else if (inputKeys.up) throwType = 'THROW_UP'; else if (inputKeys.down) throwType = 'THROW_DN'; else if (this.stateTimer <= 0) throwType = 'THROW_FW'; if (throwType) this.performThrow(throwType); };
window.SMA.Fighter.prototype.performThrow = function (typeStr) { var S = window.SMA; var vic = this.grabbedTarget; if (!vic) return; this.actionState = 'THROWING'; this.stateTimer = 15; var data = S.CHAR_DATA[this.charId].throws[typeStr]; vic.percent += data.dmg; var rad = data.angle * (Math.PI / 180); var force = data.kb + (vic.percent * data.scale); var vx = Math.cos(rad) * force; var vy = Math.sin(rad) * force; if (!this.facingRight) vx *= -1; vic.vx = vx; vic.vy = vy; vic.enterState('STUN', 40); vic.grabInvincible = 60; vic.chargePower = 1.0; this.grabbedTarget = null; S.createParticles(vic.x + 15, vic.y + 30, 15, '#fff'); S.shake = 10; S.updateHud(); S.playSound('hit'); };
window.SMA.Fighter.prototype.die = function (direction, dx, dy) { var S = window.SMA; this.stocks--; if (this.charId === 'mirror') { this.mirror = null; this.mirrorClone = null; this.mirrorCooldown = 300; } S.updateHud(); this.chargePower = 1.0; this.hitbox.active = false; S.playSound('hit'); S.triggerComet(dx, dy, direction, this.color); S.freezeFrame = 10; this.actionState = 'DEAD'; this.percent = 0; if (this.stocks > 0) { this.actionState = 'RESPAWN'; this.respawnTimer = 90; this.x = -9999; } else { S.checkGameSet(); } };
window.SMA.Fighter.prototype.respawn = function () { var S = window.SMA; this.actionState = 'IDLE'; this.x = S.WORLD_W / 2 - this.w / 2; this.y = (S.WORLD_H * 0.7) - 300; this.vx = 0; this.vy = 0; this.percent = 0; this.shieldHP = 100; this.chargePower = 1.0; this.invincible = 180; this.isGrounded = false; this.hitbox.active = false; };
window.SMA.Fighter.prototype.triggerJump = function (keys) { var S = window.SMA; if (this.actionState === 'LEDGE') return; if (keys && keys.down && this.isGrounded) { if (this.currentPlatform && this.currentPlatform.type === 'main') { this.vy = S.JUMP_FORCE * 0.6; this.jumps++; this.animScale.x = 0.7; this.animScale.y = 1.3; S.playSound('jump'); return; } else { this.dropThrough = true; this.isGrounded = false; this.y += 1; return; } } var maxJ = (window.SMA.CHAR_DATA[this.charId] && window.SMA.CHAR_DATA[this.charId].maxJumps) || 2; if (this.actionState === 'IDLE' && this.jumps < maxJ) { var force = keys && keys.down ? S.JUMP_FORCE * 0.6 : S.JUMP_FORCE; var jm = S.CHAR_DATA[this.charId].jumpMult || 1.0; this.vy = force * jm; this.jumps++; this.animScale.x = 0.7; this.animScale.y = 1.3; if (this.jumps === 2) { this.vx *= 0.8; S.createParticles(this.x + this.w / 2, this.y + this.h, 10, '#fff'); } S.playSound('jump'); } };
window.SMA.Fighter.prototype.startCharge = function () {
    if (this.actionState === 'IDLE' || this.actionState === 'CHARGE') {
        // 鏡キャラ: ↓入力中なら即座にmirror_placeを発動（長押し距離調整のため）
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
window.SMA.Fighter.prototype.releaseAttack = function (typeStr) { var S = window.SMA; if (this.actionState === 'CHARGE' || this.actionState === 'IDLE') { var power = this.chargePower; if (this.actionState === 'IDLE') power = 1.0; this.actionState = 'ATTACK'; if (!this.isGrounded) { if (typeStr === 'DOWN') typeStr = 'AIR_DOWN'; else if (typeStr === 'SIDE') typeStr = 'AIR_SIDE'; else if (typeStr === 'NEUTRAL') typeStr = 'AIR_NEUTRAL'; if (this.charId === 'spear' && typeStr === 'AIR_UP' && this.hasUpSpecial) return; } var set = S.CHAR_DATA[this.charId].attacks; if (set[typeStr]) this.currentAttack = set[typeStr]; else this.currentAttack = null; this.currentAttackType = typeStr; this.chargePower = power; this.hasHit = false; this.mirrorHasHit = false; this.stateTimer = 0; if (this.currentAttack) { if (this.currentAttack.type === 'arrow_shot') S.playSound('magic'); else if (this.currentAttack.type === 'shot') S.playSound('magic'); else if (this.currentAttack.type === 'fire_shot') S.playSound('magic'); else if (this.currentAttack.type === 'up_rush') S.playSound('jump'); else if (this.currentAttack.type === 'ground_shock') { } else if (this.currentAttack.type === 'boomerang' || this.currentAttack.type === 'boomerang_up') S.playSound('sword'); else if (this.currentAttackType === 'UP' && this.charId === 'mage') S.playSound('spin'); else S.playSound('sword'); } } };
window.SMA.Fighter.prototype.handleAttackFrame = function () {
    var S = window.SMA; this.stateTimer++; var atk = this.currentAttack; if (!atk) return;

    // ARMOR CHECK
    if (atk.armorStart && atk.armorEnd) {
        this.superArmor = (this.stateTimer >= atk.armorStart && this.stateTimer <= atk.armorEnd);
    } else {
        this.superArmor = false;
    }
    // Explicit Armor for Hammer NA - Only during HITBOX (18-22)
    if (this.charId === 'hammer' && this.currentAttackType === 'NEUTRAL') {
        if (this.stateTimer >= 18 && this.stateTimer <= 22) this.superArmor = true;
        else this.superArmor = false;
    }


    // *** エンジェル攻撃処理 ***
    if (atk.type === 'arrow_shot') {
        if (this.stateTimer === (atk.spawnFrame || 6)) {
            var dir = this.facingRight ? 1 : -1;
            var sx = this.x + this.w / 2 + dir * 20;
            var sy = this.y + this.h * 0.35;
            var spd = atk.speed || 14;
            var r = atk.radius || 8;
            var maxDist = atk.range || 750;
            var atkScale = (atk.scale !== undefined) ? atk.scale : 0.06;
            // メイン弾（まっすぐ） - ownerRole方式
            S.projectiles.push({ x: sx, y: sy, vx: spd * dir, vy: 0, w: r * 2, h: r * 2, ownerRole: this.playerRole, dmg: Math.round(atk.dmg * this.chargePower), kb: atk.kb * this.chargePower, scale: atkScale, type: 'angel_arrow', life: Math.ceil(maxDist / spd), angle: 0, color: atk.color || '#ffe066' });
            // チャージ時: 斜め上・斜め下にも発射
            if (this.chargePower > 1.3) {
                var angUp = -25 * Math.PI / 180;
                var angDn = 25 * Math.PI / 180;
                S.projectiles.push({ x: sx, y: sy, vx: spd * dir * Math.cos(angUp), vy: spd * Math.sin(angUp), w: r * 1.6, h: r * 1.6, ownerRole: this.playerRole, dmg: Math.round(atk.dmg * this.chargePower * 0.8), kb: atk.kb * this.chargePower * 0.8, scale: atkScale, type: 'angel_arrow', life: Math.ceil(maxDist / spd), angle: 0, color: '#fff5ba' });
                S.projectiles.push({ x: sx, y: sy, vx: spd * dir * Math.cos(angDn), vy: spd * Math.sin(angDn), w: r * 1.6, h: r * 1.6, ownerRole: this.playerRole, dmg: Math.round(atk.dmg * this.chargePower * 0.8), kb: atk.kb * this.chargePower * 0.8, scale: atkScale, type: 'angel_arrow', life: Math.ceil(maxDist / spd), angle: 0, color: '#fff5ba' });
            }
            S.playSound('magic');
        }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.currentAttack = null; this.chargePower = 1.0; }
        return;
    }
    if (atk.type === 'wing_flap') {
        // 横A: 両翼を前方で打ちつける（猫だまし風）
        var hitStart = 8; var hitEnd = 14;
        if (this.stateTimer >= hitStart && this.stateTimer <= hitEnd) {
            var dir = this.facingRight ? 1 : -1;
            this.hitbox.active = true;
            this.hitbox.w = 120; this.hitbox.h = 75;
            this.hitbox.x = this.x + this.w / 2 + dir * 30 - 60;
            this.hitbox.y = this.y + 5;
        } else { this.hitbox.active = false; }
        // 空中横Aの自己後方ノックバック
        if (atk.airKnockback && !this.isGrounded && this.stateTimer === hitEnd) {
            var dir = this.facingRight ? 1 : -1;
            this.vx = -dir * 18;
            this.vy = -6;
        }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.currentAttack = null; this.chargePower = 1.0; this.hitbox.active = false; }
        return;
    }
    if (atk.type === 'wing_rise') {
        // 上A: 空中では着地まで1回のみ上昇可能、2回目は供養（モーションだけ）
        // 初回フレームで成功/失敗を確定させる（angel専用フラグ）
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
                // 成功: 真上に急上昇 + 攻撃判定
                this.vy = -9.6;
                this.vx *= 0.5;
                this.hitbox.active = true;
                this.hitbox.w = 50; this.hitbox.h = 70;
                this.hitbox.x = this.x + this.w / 2 - 25;
                this.hitbox.y = this.y - 20;
            } else {
                // 供養: モーションだけ出て重力落下（攻撃判定なし）
                this.vx *= 0.8;
                this.hitbox.active = false;
            }
        } else { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.currentAttack = null; this.chargePower = 1.0; this.hitbox.active = false; }
        return;
    }
    if (atk.type === 'shockwave') {
        // 下A: 円形衝撃波（位置依存の吹っ飛ばし方向）
        if (atk.hover && !this.isGrounded) {
            this.vy = 0; this.vx *= 0.8;
        }
        var shockFrame = 18;
        if (this.stateTimer === shockFrame) {
            // 衝撃波ヒットフレーム：1回のみ判定
            var sr = atk.shockRadius || 200;
            this.hitbox.active = true;
            this.hitbox.w = sr * 2; this.hitbox.h = sr * 2;
            this.hitbox.x = this.x + this.w / 2 - sr;
            this.hitbox.y = this.y + this.h / 2 - sr;
            // 最も近い被弾候補の位置をチェックしてfacingRightを動的変更（吹っ飛ばし方向用）
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

    // *** 鏡キャラ攻撃処理 ***
    if (atk.type === 'mirror_place') {
        if (this.stateTimer === 1) {
            if (this.mirror && !this.mirror.swapped) {
                // 入れ替わり: 本体と鏡像の位置を交換（1回のみ）
                var oldX = this.x; var oldY = this.y;
                if (this.mirrorClone) {
                    this.x = this.mirrorClone.x; this.y = this.mirrorClone.y;
                    this.facingRight = !this.facingRight;
                }
                this.mirror.swapped = true; // 交換済みフラグを立てる
                S.createParticles(oldX + this.w / 2, oldY + this.h / 2, 15, '#81ecec');
                S.createParticles(this.x + this.w / 2, this.y + this.h / 2, 15, '#81ecec');
                S.playSound('magic');
                this.actionState = 'LAG'; this.stateTimer = 18;
                this.currentAttack = null; this.chargePower = 1.0; return;
            } else if (this.mirror && this.mirror.swapped) {
                // 既に入れ替わり済みの場合は何もしない（鏡が消えるまで待機）
                this.actionState = 'LAG'; this.stateTimer = 18;
                this.currentAttack = null; this.chargePower = 1.0; return;
            } else {
                // 鏡が無い場合は新しい鏡を設置する
                if (this.mirrorCooldown > 0) {
                    // クールタイム中は設置不可
                    this.actionState = 'LAG'; this.stateTimer = 8;
                    this.currentAttack = null; this.chargePower = 1.0; return;
                }
                // 鏡設置開始: ちょん押し=60px
                this.mirrorPlaceRange = 60;
            }
        }
        // 鏡がまだ無い場合: 長押しでスライド
        if (!this.mirror && this.stateTimer > 1) {
            // Aボタンが押されている間、設置距離が増加（最大300px）
            var keys = null;
            if (this.playerRole && this.playerRole !== 'p1') {
                keys = (S.remoteKeysMap && S.remoteKeysMap[this.playerRole]) || S.remoteKeys || {};
            } else {
                keys = S.myKeys || {};
            }
            if (keys.attack) {
                this.mirrorPlaceRange += 3.83;
                if (this.mirrorPlaceRange > 750) this.mirrorPlaceRange = 750;
                // 長押し中はタイマーを延長（ボタンを離すまで待機）
                if (this.stateTimer >= atk.frames - 1) this.stateTimer = atk.frames - 2;
            } else {
                // ボタンを離した → 設置確定
                var placeX = this.x + this.w / 2 + (this.facingRight ? this.mirrorPlaceRange : -this.mirrorPlaceRange);
                // プラットフォームの高さに合わせて設置
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
            // タイマー切れ（ボタン離さずにフレーム到達）: そのまま設置
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
        // 上A: 頭上に鏡を投げて回転（短射程の上方向判定）
        var p = this.chargePower || 1.0;
        var chargeRatio = Math.max(0, (p - 1.0) / 0.7);
        if (this.stateTimer >= 4 && this.stateTimer <= 18) {
            this.hitbox.active = true;
            this.hitbox.w = 56; this.hitbox.h = 62;
            this.hitbox.x = this.x + this.w / 2 - 22;
            this.hitbox.y = this.y - 45;

            // ため量に応じて身長の半分の距離を上昇
            var upMove = ((this.h / 2) * chargeRatio) / 15;
            this.y -= upMove;
            this.vy = 0; // 重力で落ちないように相殺
        } else { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; }
        return;
    }
    if (atk.type === 'mirror_throw') {
        // 横A: 前方に鏡を投げて回転（判定強化: 幅85, 高さ70）
        var p = this.chargePower || 1.0;
        var chargeRatio = Math.max(0, (p - 1.0) / 0.7);
        var szMult = chargeRatio * 0.2 + 1.0;
        var curW = 105 * szMult; var curH = 87 * szMult;
        if (this.stateTimer >= 4 && this.stateTimer <= 18) {
            this.hitbox.active = true;
            this.hitbox.w = curW; this.hitbox.h = curH;
            this.hitbox.x = this.x + (this.facingRight ? -5 : -5 - curW) + this.w / 2;
            this.hitbox.y = this.y - (curH - 70) / 2;

            // ため量に応じて前方にキャラ一体分（this.w）前進
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
                color: '#a29bfe'
            };
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
            S.projectiles.push({ x: startX, y: startY, vx: vx, vy: vy, w: 40, h: 40, ownerRole: this.playerRole, dmg: atk.dmg, kb: atk.kb, scale: atkScale, type: 'spear_throw', life: 60, angle: 0, color: atk.color });
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
        if (this.stateTimer === 1) this.vx = (this.facingRight ? 6.4 : -6.4); // 前進距離80%に縮小
        if (this.stateTimer % 10 === 0 && this.stateTimer < 40) {
            this.hitbox.active = true; this.hitbox.w = 140; this.hitbox.h = 60; this.hitbox.x = this.x + this.w / 2 - 70; this.hitbox.y = this.y + 20;
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
            this.hitbox.h = 60;
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
            var startX = this.x + this.w / 2 + (this.facingRight ? 30 : -30); var startY = this.y + 50;
            var vx = this.facingRight ? 10 : -10;
            // FIX: Pass scale
            var atkScale = (atk.scale !== undefined) ? atk.scale : 0.1;
            S.projectiles.push({ x: startX, y: startY, vx: vx, vy: 0, w: 40, h: 30, ownerRole: this.playerRole, dmg: atk.dmg, kb: atk.kb, scale: atkScale, type: 'shockwave', life: 30, color: '#ffeaa7' });
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
            this.hitbox.x = this.x + (this.facingRight ? 10 : -80);
            this.hitbox.y = this.y;
        } else { this.hitbox.active = false; }
        if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; }
        return;
    }
    if (atk.type === 'blast') { if (this.stateTimer === 15) { S.createParticles(this.x + (this.facingRight ? 50 : -20), this.y + 20, 20, '#e67e22'); S.playSound('special'); } if (this.stateTimer >= 15 && this.stateTimer <= 25) { this.hitbox.active = true; this.hitbox.w = 80 * (1 + (this.chargePower - 1)); this.hitbox.h = 80 * (1 + (this.chargePower - 1)); this.hitbox.x = this.x + (this.facingRight ? 20 : -20 - this.hitbox.w); this.hitbox.y = this.y - 10; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return; } if (atk.type === 'lunge') { if (this.stateTimer > 5 && this.stateTimer < 15) { var spd = (this.chargePower - 1.0) * 22; if (spd < 0) spd = 0; this.vx = this.facingRight ? spd : -spd; } var startFrame = Math.floor(atk.frames * 0.2); var endFrame = Math.floor(atk.frames * 0.8); if (this.stateTimer >= startFrame && this.stateTimer <= endFrame) { this.hitbox.active = true; this.hitbox.shape = 'box'; this.hitbox.w = 80; this.hitbox.h = 40; this.hitbox.x = this.x + (this.facingRight ? 20 : -70); this.hitbox.y = this.y + 20; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.hitbox.active = false; this.currentAttack = null; this.chargePower = 1.0; this.enterState('LAG', atk.lag); } return; } if (atk.type === 'dive') { if (this.stateTimer === 1) { this.vx = this.facingRight ? 15 : -15; this.vy = 20; S.createParticles(this.x + this.w / 2, this.y, 5, '#fff'); } if (this.isGrounded) { this.hitbox.active = false; this.currentAttack = null; this.chargePower = 1.0; this.enterState('LAG', 30); S.createParticles(this.x + this.w / 2, this.y + this.h, 20, '#fff'); S.shake = 5; return; } this.hitbox.active = true; this.hitbox.shape = 'box'; this.hitbox.w = 50; this.hitbox.h = 60; this.hitbox.x = this.x - 10; this.hitbox.y = this.y + 50; return; } if (atk.type === 'shoryu') { if (this.stateTimer === 3) { this.vy = -8; S.createParticles(this.x + this.w / 2, this.y + this.h, 10, '#e74c3c'); } if (this.stateTimer >= 3 && this.stateTimer <= 15) { this.hitbox.active = true; this.hitbox.w = 60; this.hitbox.h = 80; this.hitbox.x = this.x - 15; this.hitbox.y = this.y - 40; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return; } if (atk.type === 'axe') { if (this.stateTimer >= 14 && this.stateTimer <= 20) { this.hitbox.active = true; this.hitbox.w = 100; this.hitbox.h = 100; this.hitbox.x = this.x + (this.facingRight ? 10 : -80); this.hitbox.y = this.y; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return; } if (atk.type === 'blast') { if (this.stateTimer === 15) { S.createParticles(this.x + (this.facingRight ? 50 : -20), this.y + 20, 20, '#e67e22'); S.playSound('special'); } if (this.stateTimer >= 15 && this.stateTimer <= 25) { this.hitbox.active = true; this.hitbox.w = 80 * (1 + (this.chargePower - 1)); this.hitbox.h = 80 * (1 + (this.chargePower - 1)); this.hitbox.x = this.x + (this.facingRight ? 20 : -20 - this.hitbox.w); this.hitbox.y = this.y - 10; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return; } if (atk.type === 'low_kick') { var startFrame = Math.floor(atk.frames * 0.2); var endFrame = Math.floor(atk.frames * 0.8); if (this.stateTimer >= startFrame && this.stateTimer <= endFrame) { this.hitbox.active = true; this.hitbox.w = 100; this.hitbox.h = 30; this.hitbox.x = this.x + (this.facingRight ? 10 : -80); this.hitbox.y = this.y + this.h - 10; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return; } if (atk.type === 'sex_kick') { if (this.stateTimer >= 2 && this.stateTimer <= 24) { this.hitbox.active = true; this.hitbox.w = 60; this.hitbox.h = 60; this.hitbox.x = this.x - 15; this.hitbox.y = this.y; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return; } if (atk.type === 'sweep') { var startFrame = Math.floor(atk.frames * 0.2); var endFrame = Math.floor(atk.frames * 0.8); if (this.stateTimer >= startFrame && this.stateTimer <= endFrame) { this.hitbox.active = true; this.hitbox.w = 100; this.hitbox.h = 30; this.hitbox.x = this.x + (this.facingRight ? 10 : -80); this.hitbox.y = this.y + this.h - 20; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.actionState = 'LAG'; this.stateTimer = atk.lag; this.chargePower = 1.0; this.hitbox.active = false; this.currentAttack = null; } return; } if (atk.type === 'slide') { var startFrame = Math.floor(atk.frames * 0.2); var endFrame = Math.floor(atk.frames * 0.8); if (this.stateTimer === 1) { this.vx = 9.6 * (this.facingRight ? 1 : -1); S.createParticles(this.x + this.w / 2, this.y + this.h, 5, '#fff'); } if (this.stateTimer >= startFrame && this.stateTimer <= endFrame) { this.hitbox.active = true; this.hitbox.shape = 'box'; this.hitbox.w = 90; this.hitbox.h = 30; var offX = this.facingRight ? 10 : -90; this.hitbox.x = this.x + this.w / 2 + offX; this.hitbox.y = this.y + this.h - 20; } else { this.hitbox.active = false; } if (this.stateTimer >= atk.frames) { this.hitbox.active = false; this.currentAttack = null; this.chargePower = 1.0; this.enterState('LAG', atk.lag); } return; } if (atk.type === 'meteor') {
        if (this.stateTimer === 1) {
            this.vy = 12; // FIXED SPEED
            S.createParticles(this.x + this.w / 2, this.y, 5, '#fff');
        }
        if (this.isGrounded) { this.hitbox.active = false; this.currentAttack = null; this.chargePower = 1.0; this.enterState('LAG', 30); S.createParticles(this.x + this.w / 2, this.y + this.h, 20, '#fff'); S.shake = 5; return; }
        this.hitbox.active = true; this.hitbox.shape = 'box'; this.hitbox.w = 50; this.hitbox.h = 60; this.hitbox.x = this.x - 10; this.hitbox.y = this.y + 50; return;
    }

    var start = Math.floor(atk.frames * 0.2); var end = Math.floor(atk.frames * (atk.frames > 100 ? 0.1 : 0.6)); if (this.stateTimer >= start && this.stateTimer <= end) {
        this.hitbox.active = true; var scale = 1 + (this.chargePower - 1.0) * 0.5; this.hitbox.w = (atk.radius ? atk.radius * 2 : 70) * scale; this.hitbox.h = this.hitbox.w; if (this.currentAttackType === 'UP' || this.currentAttackType === 'AIR_UP') {
            if (this.charId === 'mage') { this.hitbox.w = 80; this.hitbox.h = 40; this.hitbox.x = this.x - 25; this.hitbox.y = this.y - 40; } else if (this.charId === 'hammer') {
                // Hammer Up Attack Arc Hitbox - Large Overhead Box - FASTER (17-20)
                if (this.stateTimer >= 17 && this.stateTimer <= 20) {
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
        } else if (this.currentAttackType === 'NEUTRAL') {
            this.hitbox.w = 60 * scale; this.hitbox.h = 30 * scale;
            if (this.charId === 'sword') {
                this.hitbox.w = 80 * scale;
                this.hitbox.x = this.x + (this.facingRight ? 5 : -5 - this.hitbox.w) + this.w / 2;
            } else {
                this.hitbox.x = this.x + (this.facingRight ? 25 : -25 - this.hitbox.w) + this.w / 2;
            }
            this.hitbox.y = this.y + 25;
        } else if ((this.currentAttackType === 'DOWN' || this.currentAttackType === 'AIR_DOWN') && this.charId === 'mage') { if (this.charId === 'mage') { } else { this.hitbox.w = 80 * scale; this.hitbox.h = 30 * scale; this.hitbox.x = this.x + (this.facingRight ? -10 : -40); this.hitbox.y = this.y + 40; } } else if (this.currentAttackType === 'NEUTRAL' && this.charId === 'brawler') { this.hitbox.w = 40; this.hitbox.h = 30; this.hitbox.x = this.x + (this.facingRight ? 25 : -65); this.hitbox.y = this.y + 25; } else if (this.charId === 'hammer' && this.currentAttackType === 'NEUTRAL') {
            // Hammer Ground NA Hitbox - 15-21 (SWING PHASE)
            if (this.stateTimer >= 15 && this.stateTimer <= 21) {
                this.hitbox.active = true;
                // Hitbox covers ARC in front
                this.hitbox.w = 100 * scale; this.hitbox.h = 100 * scale;
                this.hitbox.x = this.x + (this.facingRight ? 20 : -20 - this.hitbox.w) + this.w / 2;
                this.hitbox.y = this.y - 20; // Starts from head height, covers down to feet
                this.superArmor = true;
            } else { this.hitbox.active = false; }
            return; // Skip default box logic
        } else if (this.charId === 'hammer' && this.currentAttackType === 'AIR_SIDE') {
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
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angleDeg * Math.PI / 180);
    ctx.fillStyle = color;
    // DRAW RELATIVE TO GRIP (at 0,0)
    // Shaft extends BACK (-20) and FORWARD (+60)
    ctx.fillRect(-20, -3, 80, 6);
    // Crossbar near tip
    ctx.fillRect(55, -12, 6, 24);
    // Center prong
    if (tipColor) ctx.fillStyle = tipColor; // Apply tip color
    ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(90, 0); ctx.lineTo(85, 4); ctx.lineTo(85, -4); ctx.fill();
    // Side prongs (curved)
    ctx.beginPath();
    ctx.moveTo(60, -10); ctx.quadraticCurveTo(70, -15, 80, -15); ctx.lineTo(80, -12); ctx.quadraticCurveTo(70, -12, 60, -8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(60, 10); ctx.quadraticCurveTo(70, 15, 80, 15); ctx.lineTo(80, 12); ctx.quadraticCurveTo(70, 12, 60, 8);
    ctx.fill();
    ctx.restore();
};
window.SMA.Fighter.prototype.drawSword = function (ctx, cx, cy, angleDeg) {
    if (this.charId === 'mage') { ctx.save(); ctx.translate(cx, cy); ctx.rotate(angleDeg * Math.PI / 180); ctx.fillStyle = "#8e44ad"; ctx.fillRect(-2, -5, 4, 15); var orbColor = this.chargePower > 1.2 ? '#fff' : "#a29bfe"; if (this.chargePower > 1.2) { ctx.shadowBlur = 10; ctx.shadowColor = "#fff"; } ctx.fillStyle = orbColor; ctx.beginPath(); ctx.arc(0, -60, 8, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = "#555"; ctx.fillRect(-2, -55, 4, 50); ctx.restore(); } else if (this.charId === 'angel') {
        // エンジェル: 弓の描画
        ctx.save(); ctx.translate(cx, cy);
        ctx.rotate(angleDeg * Math.PI / 180);
        ctx.strokeStyle = '#c89b3c'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, -30, 25, -0.8, 0.8); ctx.stroke();
        ctx.fillStyle = this.chargePower > 1.2 ? '#fff' : '#ffe066';
        if (this.chargePower > 1.2) { ctx.shadowBlur = 8; ctx.shadowColor = '#ffe066'; }
        ctx.fillRect(-1, -55, 2, 50); // 弦
        ctx.shadowBlur = 0;
        ctx.restore();
    } else if (this.charId === 'brawler') { } else {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(angleDeg * Math.PI / 180); var s = 0.8 * (1 + (this.chargePower - 1) * 0.5); ctx.scale(0.8, s); var bladeColor = this.chargePower > 1.2 ? '#fff' : (this.isP2 ? "#74b9ff" : "#ff7675"); var glow = this.chargePower > 1.2 ? 10 : 0; ctx.fillStyle = "#333"; ctx.fillRect(-2, -5, 4, 15); ctx.fillStyle = "#ffd700"; ctx.fillRect(-8, -5, 16, 4); ctx.fillStyle = bladeColor; if (glow) { ctx.shadowBlur = glow; ctx.shadowColor = bladeColor; } ctx.beginPath(); ctx.moveTo(-3, -5); ctx.lineTo(-3, -60); ctx.lineTo(0, -70); ctx.lineTo(3, -60); ctx.lineTo(3, -5); ctx.fill(); ctx.restore();
    }
};
window.SMA.spriteAssets = window.SMA.spriteAssets || {};
window.SMA.getSpriteAsset = function (key, src) {
    var img = window.SMA.spriteAssets[key];
    if (!img) {
        img = new Image();
        img.src = src;
        window.SMA.spriteAssets[key] = img;
    }
    return img;
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
window.SMA.SWORD_CHIBI_BLADE_WIDTH_SCALE = 0.78;
window.SMA.SWORD_CHIBI_REACH_SCALE = 0.9;
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
    grab: { key: 'sword_chibi_grab', src: 'assets/characters/sword/chibi_grab_sheet.png?v=14', frames: 3, frameMs: 70 },
    throw: { key: 'sword_chibi_throw', src: 'assets/characters/sword/chibi_throw_sheet.png?v=14', frames: 4, frameMs: 80 },
    dodge: { key: 'sword_chibi_dodge', src: 'assets/characters/sword/chibi_dodge_sheet.png?v=14', frames: 2, frameMs: 70 },
    ledge: { key: 'sword_chibi_ledge', src: 'assets/characters/sword/chibi_ledge_sheet.png?v=14', frames: 2, frameMs: 140 }
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
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, footY - 3, 24 * spriteScale, 7 * spriteScale, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.translate(cx, footY);
    if (!this.facingRight) {
        ctx.scale(-1, 1);
    }
    ctx.translate(motion.x, motion.y);
    ctx.rotate(motion.rotate);
    ctx.scale(motion.scaleX, motion.scaleY);
    ctx.drawImage(img, sx, 0, fw, fh, -fw * spriteScale / 2, -baseline * spriteScale, fw * spriteScale, fh * spriteScale);
    ctx.restore();
    if (!anim.integratedWeapon) {
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
window.SMA.preloadSwordChibiSprites();
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
    if (this.actionState === 'LEDGE_ROLL') {
        ctx.translate(0, -15); ctx.rotate(this.rotation); ctx.strokeStyle = this.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(15, 0); ctx.stroke();
        drawn = true;
    } else {
        ctx.rotate(this.rotation);
        ctx.translate(-cx, -(this.y + this.h));

        if (this.drawSwordChibiSprite(ctx, cx)) {
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
                    // エンジェル描画: 横向き対応
                    ctx.save();
                    var sc = this.color;
                    if (this.actionState === 'STUN') sc = '#ffeaa7';
                    if (this.actionState === 'LAG') sc = '#b2bec3';
                    if (this.actionState === 'GRABBED') sc = '#a29bfe';
                    ctx.strokeStyle = sc; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                    var dir = this.facingRight ? 1 : -1;
                    // 頭
                    ctx.beginPath(); ctx.arc(cx, this.y + 10, 8, 0, Math.PI * 2); ctx.stroke();
                    // 光輪（ヘイロー）
                    ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.ellipse(cx, this.y, 10, 3, 0, 0, Math.PI * 2); ctx.stroke();
                    ctx.strokeStyle = sc; ctx.lineWidth = 4;
                    // 体
                    ctx.beginPath(); ctx.moveTo(cx, this.y + 18); ctx.lineTo(cx, this.y + 42); ctx.stroke();
                    // 両脚
                    ctx.beginPath(); ctx.moveTo(cx, this.y + 42); ctx.lineTo(cx - 7, this.y + 58); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(cx, this.y + 42); ctx.lineTo(cx + 7, this.y + 58); ctx.stroke();
                    // 翼（背中側 = 向いている方向の反対側に表示）
                    var wingFlap = Math.sin(Date.now() / 200) * 4;
                    var isWingFlap = this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type === 'wing_flap';
                    var isWingRise = this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type === 'wing_rise';
                    var isShockwave = this.actionState === 'ATTACK' && this.currentAttack && this.currentAttack.type === 'shockwave';
                    ctx.fillStyle = 'rgba(255,255,255,0.85)';
                    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1.5;
                    if (isWingFlap && this.stateTimer >= 6 && this.stateTimer <= 16) {
                        // 横A: 両翼を前方に突き出して打ちつけるモーション
                        var flapProg = Math.min(1, (this.stateTimer - 6) / 5);
                        // 上翼（前方へ）- 倍サイズ
                        ctx.beginPath();
                        ctx.moveTo(cx, this.y + 10);
                        ctx.quadraticCurveTo(cx + dir * (40 + flapProg * 50), this.y, cx + dir * (70 + flapProg * 30), this.y + 15);
                        ctx.quadraticCurveTo(cx + dir * (40 + flapProg * 20), this.y + 25, cx, this.y + 22);
                        ctx.fill(); ctx.stroke();
                        // 下翼（前方へ）- 倍サイズ
                        ctx.beginPath();
                        ctx.moveTo(cx, this.y + 24);
                        ctx.quadraticCurveTo(cx + dir * (40 + flapProg * 50), this.y + 28, cx + dir * (70 + flapProg * 30), this.y + 38);
                        ctx.quadraticCurveTo(cx + dir * (40 + flapProg * 20), this.y + 42, cx, this.y + 34);
                        ctx.fill(); ctx.stroke();
                    } else if (isWingRise) {
                        // 上A: 左右対称に翼を大きく広げて飛翔
                        var riseFlap = Math.sin(this.stateTimer * 0.8) * 5;
                        // 左翼
                        ctx.beginPath();
                        ctx.moveTo(cx - 3, this.y + 18);
                        ctx.quadraticCurveTo(cx - 40, this.y + 2 + riseFlap, cx - 50, this.y + 18 + riseFlap);
                        ctx.quadraticCurveTo(cx - 35, this.y + 22, cx - 20, this.y + 28);
                        ctx.quadraticCurveTo(cx - 8, this.y + 24, cx - 3, this.y + 22);
                        ctx.fill(); ctx.stroke();
                        // 右翼
                        ctx.beginPath();
                        ctx.moveTo(cx + 3, this.y + 18);
                        ctx.quadraticCurveTo(cx + 40, this.y + 2 + riseFlap, cx + 50, this.y + 18 + riseFlap);
                        ctx.quadraticCurveTo(cx + 35, this.y + 22, cx + 20, this.y + 28);
                        ctx.quadraticCurveTo(cx + 8, this.y + 24, cx + 3, this.y + 22);
                        ctx.fill(); ctx.stroke();
                    } else if (isShockwave) {
                        // 下A: 左右対称に翼を広げる（衝撃波チャージ）
                        var shockWingFlap = Math.sin(this.stateTimer * 0.6) * 6;
                        // 左翼
                        ctx.beginPath();
                        ctx.moveTo(cx - 3, this.y + 18);
                        ctx.quadraticCurveTo(cx - 35, this.y + 5 + shockWingFlap, cx - 45, this.y + 20 + shockWingFlap);
                        ctx.quadraticCurveTo(cx - 30, this.y + 24, cx - 15, this.y + 28);
                        ctx.quadraticCurveTo(cx - 6, this.y + 24, cx - 3, this.y + 22);
                        ctx.fill(); ctx.stroke();
                        // 右翼
                        ctx.beginPath();
                        ctx.moveTo(cx + 3, this.y + 18);
                        ctx.quadraticCurveTo(cx + 35, this.y + 5 + shockWingFlap, cx + 45, this.y + 20 + shockWingFlap);
                        ctx.quadraticCurveTo(cx + 30, this.y + 24, cx + 15, this.y + 28);
                        ctx.quadraticCurveTo(cx + 6, this.y + 24, cx + 3, this.y + 22);
                        ctx.fill(); ctx.stroke();
                    } else {
                        // 通常: 背中側に翼（向いている方向の反対）
                        ctx.beginPath();
                        ctx.moveTo(cx, this.y + 18);
                        ctx.quadraticCurveTo(cx - dir * 25, this.y + 8 + wingFlap, cx - dir * 35, this.y + 20 + wingFlap);
                        ctx.quadraticCurveTo(cx - dir * 22, this.y + 22, cx - dir * 15, this.y + 28);
                        ctx.quadraticCurveTo(cx - dir * 5, this.y + 24, cx, this.y + 22);
                        ctx.fill(); ctx.stroke();
                        // 下翼
                        ctx.beginPath();
                        ctx.moveTo(cx, this.y + 24);
                        ctx.quadraticCurveTo(cx - dir * 20, this.y + 22 + wingFlap * 0.7, cx - dir * 28, this.y + 32 + wingFlap * 0.7);
                        ctx.quadraticCurveTo(cx - dir * 15, this.y + 30, cx, this.y + 28);
                        ctx.fill(); ctx.stroke();
                    }
                    // 腕と弓
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
                        // NA / チャージ: 前方に弓を構えて射る構え
                        // 弓本体（前方に向ける）— 溜め中は白発光
                        var bowColor = chargeVisualReady ? '#fff' : '#c89b3c';
                        if (chargeVisualReady) { ctx.shadowBlur = 12; ctx.shadowColor = '#fff'; }
                        var bowJx = chargeVisualReady ? (Math.random() - 0.5) * 2.5 : 0;
                        var bowJy = chargeVisualReady ? (Math.random() - 0.5) * 2.5 : 0;
                        ctx.strokeStyle = bowColor; ctx.lineWidth = 2.5;
                        ctx.beginPath(); ctx.arc(cx + dir * 20 + bowJx, this.y + 25 + bowJy, 18, dir > 0 ? -1.2 : Math.PI - 1.2, dir > 0 ? 1.2 : Math.PI + 1.2); ctx.stroke();
                        // 弦
                        var pullBack = isCharging ? (chargeVisualReady ? Math.min(this.chargePower * 5, 10) : 3) : 3;
                        ctx.strokeStyle = chargeVisualReady ? '#fff' : '#ddd'; ctx.lineWidth = chargeVisualReady ? 1.5 : 1;
                        ctx.beginPath(); ctx.moveTo(cx + dir * (20 + 18 * Math.cos(-1.2)) + bowJx, this.y + 25 + 18 * Math.sin(-1.2) + bowJy);
                        ctx.lineTo(cx + dir * (20 - pullBack) + bowJx, this.y + 25 + bowJy);
                        ctx.lineTo(cx + dir * (20 + 18 * Math.cos(1.2)) + bowJx, this.y + 25 + 18 * Math.sin(1.2) + bowJy); ctx.stroke();
                        // 矢（弦の上）
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
                        // 腕（後ろ手で弦を引く）
                        ctx.strokeStyle = sc; ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(cx + dir * 18 + bowJx * 0.6, this.y + 24 + bowJy * 0.6); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(cx + dir * (20 - pullBack) + bowJx, this.y + 25 + bowJy); ctx.stroke();
                    } else {
                        // 通常: 弓を下げ持ち
                        ctx.strokeStyle = '#c89b3c'; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.arc(cx + dir * 8, this.y + 35, 12, dir > 0 ? -1.0 : Math.PI - 1.0, dir > 0 ? 1.0 : Math.PI + 1.0); ctx.stroke();
                        // 弦
                        ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(cx + dir * (8 + 12 * Math.cos(-1.0)), this.y + 35 + 12 * Math.sin(-1.0));
                        ctx.lineTo(cx + dir * 8, this.y + 35);
                        ctx.lineTo(cx + dir * (8 + 12 * Math.cos(1.0)), this.y + 35 + 12 * Math.sin(1.0)); ctx.stroke();
                        // 腕
                        ctx.strokeStyle = sc; ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(cx + dir * 12, this.y + 33); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(cx, this.y + 25); ctx.lineTo(cx - dir * 5, this.y + 33); ctx.stroke();
                    }
                    if (this.actionState === 'SHIELD') { ctx.save(); ctx.fillStyle = 'rgba(116, 185, 255, ' + (this.shieldHP / 150) + ')'; ctx.strokeStyle = '#0984e3'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, this.y + 30, 45, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
                    // 衝撃波エフェクト
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

                        if (this.currentAttackType === 'UP' || this.currentAttackType === 'boomerang_up') {
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
                        else if (this.currentAttackType === 'AIR_UP') { angleDeg = -90; }
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
                        var isThrown = (this.currentAttack && (this.currentAttackType === 'SIDE' || this.currentAttackType === 'AIR_SIDE' || this.currentAttackType === 'UP' || this.currentAttackType === 'boomerang' || this.currentAttackType === 'boomerang_up' || this.currentAttackType === 'boomerang_down') && this.stateTimer >= 5);

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
                        var holdAngle = 45;
                        if (!this.facingRight) holdAngle = -45;

                        var jitter = (Math.random() - 0.5) * 5;
                        var handX = cx + (this.facingRight ? 5 : -5);
                        var handY = this.y + 25;
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
                        } else if (this.currentAttackType === 'NEUTRAL') {
                            // GROUND: New Wind up (Straight Up) then Slam
                            // 0-14 frames: Instant hold UP (180)
                            // 14-22 frames: Fast Slam (180 -> 10)
                            // 22-45 frames: Hold Down (10)
                            if (this.stateTimer < 14) {
                                angleDeg = 180; // Instant Hold Up
                            } else if (this.stateTimer < 22) {
                                var subP = (this.stateTimer - 14) / 8;
                                angleDeg = 180 + (190 * subP); // 180 -> 370 (10 deg)
                            } else {
                                angleDeg = 10; // Hold at bottom
                            }
                        } else if (this.currentAttack.type === 'hammer_spin_air') {
                            // AIR: "Broken" static pose -> User wants HAMMER DOWN (0).
                            angleDeg = 0;
                        } else if (this.currentAttackType === 'SIDE' || this.currentAttackType === 'AIR_SIDE' || this.currentAttackType === 'spin_hammer') {
                            if (this.currentAttackType === 'AIR_SIDE') {
                                // VERTICAL CHOP: -180 to 90
                                angleDeg = -180 + (p * 270);
                            } else {
                                angleDeg = p * 720;
                            }
                        } else if (this.currentAttackType === 'UP' || this.currentAttackType === 'AIR_UP') {
                            // Overhead Arc: -90 (Front) -> -270 (Back)
                            // Wait 0-15: Hold Front (-90).
                            // Swing 15-20: Fast Arc.
                            if (this.stateTimer < 15) {
                                angleDeg = -90;
                            } else if (this.stateTimer < 20) {
                                var subP = (this.stateTimer - 15) / 5;
                                angleDeg = -90 - (subP * 180);
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
                            var handX = cx + (this.facingRight ? 15 : -15);
                            var handY = this.y + 30;
                            window.SMA.drawHammer(ctx, handX, handY, angleDeg, "#636e72");
                            hammerDrawn = true;
                        }
                        drawn = true;
                    }

                    if (!hammerDrawn && !drawn) {
                        var angleDeg = 30;
                        if (!this.facingRight) angleDeg = -30;
                        var handX = cx + (this.facingRight ? 15 : -15);
                        var handY = this.y + 30;
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
                                // 鏡キャラ: 小さな鏡を振り回す崖攻撃
                                ctx.save();
                                ctx.strokeStyle = '#81ecec';
                                ctx.lineWidth = 2;
                                var mirAngRad = angleDeg * Math.PI / 180;
                                var mirEndX = handX + Math.sin(mirAngRad) * 23;
                                var mirEndY = handY - Math.cos(mirAngRad) * 23;
                                ctx.beginPath(); ctx.moveTo(handX, handY); ctx.lineTo(mirEndX, mirEndY); ctx.stroke();
                                // 鏡の頭部分
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                                ctx.beginPath(); ctx.arc(mirEndX, mirEndY, 6.5, 0, Math.PI * 2); ctx.fill();
                                ctx.restore();
                            } else {
                                this.drawSword(ctx, handX, handY, angleDeg);
                            }
                        }
                    } else if (this.charId === 'mirror') {

                        // 鏡キャラ本体描画
                        ctx.save();
                        ctx.strokeStyle = this.color;
                        if (this.actionState === 'STUN') ctx.strokeStyle = '#ffeaa7';
                        if (this.actionState === 'LAG') ctx.strokeStyle = '#b2bec3';
                        if (this.actionState === 'GRABBED') ctx.strokeStyle = '#a29bfe';
                        if (this.actionState === 'LEDGE' || this.actionState === 'LEDGE_UP') {
                            ctx.strokeStyle = (this.invincible > 0) ? '#fff' : this.color;
                        }
                        ctx.lineWidth = 3;

                        // 浮遊鏡の基本座標 (少し前方)
                        var hoverY = Math.sin(Date.now() / 200) * 5; // フワフワ上下
                        var baseY = this.y + 20 + hoverY;
                        var baseX = cx + (this.facingRight ? 30 : -30);

                        // 崖つかまり中の描画
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
                            // 体
                            ctx.beginPath(); ctx.moveTo(cx, this.y + 10); ctx.lineTo(cx, this.y + 40); ctx.stroke();
                            // 足
                            ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx - 10, this.y + 60); ctx.stroke();
                            ctx.beginPath(); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + 10, this.y + 60); ctx.stroke();
                            // 頭
                            ctx.beginPath(); ctx.arc(cx, this.y + 10, 8, 0, Math.PI * 2); ctx.stroke();

                            // 腕（GRAB_ATTEMPTなら前に伸ばす、それ以外は自然に下ろす）
                            if (this.actionState === 'GRAB_ATTEMPT') {
                                var gp = this.stateTimer <= 7 ? this.stateTimer / 7 : 1 - (this.stateTimer - 7) / 8;
                                var al = Math.round(10 + gp * 35);
                                ctx.beginPath(); ctx.moveTo(cx, this.y + 20); ctx.lineTo(cx + (this.facingRight ? al : -al), this.y + 22); ctx.stroke();
                                ctx.beginPath(); ctx.arc(cx + (this.facingRight ? al : -al), this.y + 22, 5, 0, Math.PI * 2); ctx.stroke();
                            } else {
                                // 自然に下ろす
                                ctx.beginPath(); ctx.moveTo(cx, this.y + 20); ctx.lineTo(cx + (this.facingRight ? 5 : -5), this.y + 35); ctx.stroke();
                            }

                            // 浮遊鏡の描画設定
                            var cdColor = window.SMA.selectedStage === 'battlefield' ? '#555' : '#000';
                            var mirrorColor = this.mirrorCooldown > 0 ? cdColor : '#81ecec';
                            var mirrorGlowColor = this.mirrorCooldown > 0 ? cdColor : 'rgba(255,255,255,0.6)';
                            ctx.strokeStyle = mirrorColor;
                            ctx.lineWidth = 2.6;

                            // 浮遊鏡のアニメーション
                            var mirX = baseX;
                            var mirY = baseY;
                            var mirScale = 1.0;
                            var mirAngle = 0;

                            if (this.actionState === 'ATTACK' && this.currentAttack) {
                                var p = this.stateTimer / this.currentAttack.frames; // 1 -> 0
                                var forwardP = 1.0 - p; // 0 -> 1

                                if (this.currentAttack.type === 'mirror_spin' || this.currentAttackType === 'AIR_NEUTRAL') {
                                    // 空中NA: キャラの周りを一周
                                    var spinAngle = forwardP * Math.PI * 2;
                                    var r = 50;
                                    mirX = cx + (this.facingRight ? 1 : -1) * Math.cos(spinAngle) * r;
                                    mirY = this.y + 25 + Math.sin(spinAngle) * r;
                                    mirAngle = 0; // 鏡の向きは一定
                                } else if (this.currentAttack.type === 'mirror_throw_up' || this.currentAttackType === 'UP' || this.currentAttackType === 'AIR_UP') {
                                    // 上A: 上方へ飛び出す
                                    mirScale = 1.5;
                                    mirAngle = forwardP * Math.PI * 4;
                                    var throwH = 62;
                                    mirX = cx;
                                    mirY = this.y - 10 - Math.sin(forwardP * Math.PI) * throwH;
                                } else if (this.currentAttack.type === 'mirror_throw' || this.currentAttackType === 'SIDE' || this.currentAttackType === 'AIR_SIDE') {
                                    // 横A: 前方へ飛び出し回転
                                    mirScale = 1.6;
                                    mirAngle = forwardP * Math.PI * 4;
                                    var throwDist = 75;
                                    var distX = Math.sin(forwardP * Math.PI) * throwDist;
                                    mirX = cx + (this.facingRight ? distX : -distX);
                                    mirY = this.y + 25;
                                } else if (this.currentAttackType === 'NEUTRAL') {
                                    // 地上NA: 前方に一瞬突き出る（回転無し）
                                    var pokeDist = Math.sin(forwardP * Math.PI) * 56;
                                    mirX = cx + (this.facingRight ? 30 + pokeDist : -30 - pokeDist);
                                } else if (this.currentAttackType === 'DOWN' || this.currentAttackType === 'AIR_DOWN' || this.currentAttack.type === 'mirror_place') {
                                    // 下A: 下方へ飛び出し回転
                                    mirScale = 1.5;
                                    mirAngle = forwardP * Math.PI * 4;
                                    var throwH = 40;
                                    mirX = cx + (this.facingRight ? 15 : -15);
                                    mirY = this.y + 40 + Math.sin(forwardP * Math.PI) * throwH;
                                }
                            } else if (this.actionState === 'CHARGE') {
                                // チャージ中：震える
                                mirX += (Math.random() - 0.5) * 5;
                                mirY += (Math.random() - 0.5) * 5;
                                if (this.chargePower > 1.2) {
                                    ctx.shadowBlur = 10; ctx.shadowColor = '#81ecec'; ctx.strokeStyle = '#fff';
                                }
                            } else if (this.actionState === 'LEDGE_ATK') {
                                // 崖攻撃
                                mirX = cx + (this.facingRight ? 40 : -40);
                                mirAngle = Math.PI / 4;
                                mirScale = 1.2;
                            }

                            // 鏡の描画（独立）
                            ctx.save();
                            ctx.translate(mirX, mirY);
                            ctx.rotate(mirAngle);
                            ctx.scale(mirScale, mirScale);

                            // 鏡の外枠（縦長楕円の代わりとしての線）
                            var len = this.actionState === 'ATTACK' ? 17.5 : 14;
                            ctx.beginPath(); ctx.moveTo(0, -len); ctx.lineTo(0, len); ctx.stroke();

                            ctx.restore();

                            // シールド
                            if (this.actionState === 'SHIELD') { ctx.save(); ctx.fillStyle = 'rgba(116, 185, 255, ' + (this.shieldHP / 150) + ')'; ctx.strokeStyle = '#0984e3'; ctx.beginPath(); ctx.arc(cx, this.y + 30, 45, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }

                            ctx.restore();
                            drawn = true;
                        } // !drawn 閉じ
                    }
                    if (this.charId !== 'spear' && this.charId !== 'hammer' && this.charId !== 'mirror') {
                        // GENERIC BODY DRAW (SWORD/MAGE when not special)
                        // GRABBING中は腕を前に伸ばして引き寄せモーション、THROWINGも同様
                        if (this.actionState === 'GRABBING' || this.actionState === 'THROWING') {
                            var pullProgress = this.actionState === 'GRABBING' ? Math.max(0, (120 - this.stateTimer) / 30) : 1.0;
                            var armLen = Math.round(40 - pullProgress * 15); // 引き寄せるほど腕が縮む
                            ctx.beginPath(); ctx.moveTo(cx, this.y + 10); ctx.lineTo(cx, this.y + 40); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx - 10, this.y + 60); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + 10, this.y + 60); ctx.moveTo(cx, this.y + 20); ctx.lineTo(cx + (this.facingRight ? armLen : -armLen), this.y + 25); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, this.y + 10, 10, 0, Math.PI * 2); ctx.stroke();
                        } else if (this.actionState === 'GRAB_ATTEMPT') {
                            // つかみ試みモーション: stateTimer 0→7で伸びる, 7→15で縮む
                            var grabProgress = this.stateTimer <= 7 ? this.stateTimer / 7 : 1 - (this.stateTimer - 7) / 8;
                            var armLen = Math.round(10 + grabProgress * 35); // 10px～45px
                            ctx.beginPath(); ctx.moveTo(cx, this.y + 10); ctx.lineTo(cx, this.y + 40); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx - 10, this.y + 60); ctx.moveTo(cx, this.y + 40); ctx.lineTo(cx + 10, this.y + 60); ctx.moveTo(cx, this.y + 22); ctx.lineTo(cx + (this.facingRight ? armLen : -armLen), this.y + 22); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, this.y + 10, 10, 0, Math.PI * 2); ctx.stroke();
                            // 手（グー）を先端に描く
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
