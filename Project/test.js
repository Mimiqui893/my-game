
// --- BGMボリューム ---
const bgm = document.getElementById("bgm");
bgm.volume = 0.05; // 音量（範囲は 0.0〜1.0）

let turnCount = 1;
let currentTurn = "player";
let actionsThisTurn = 0;
let isBossActing = false; // ← 多重起動防止フラグ

// --- 初期位置を保存するオブジェクト ---
const originalPositions = {};

window.addEventListener("DOMContentLoaded", () => {
  const chars = document.querySelectorAll("img[id^='char']");
  chars.forEach(img => {
    const rect = window.getComputedStyle(img);
    originalPositions[img.id] = {
      top: rect.top,
      right: rect.right
    };
  });
});

// --- HP/SP データ ---
let hp = {
  char1: 1000, char2: 1000, char3: 1000,
  char4: 1000, char5: 1000, char6: 1000,
  boss: 1000000
};

let maxHP = { ...hp };

let sp = {
  char1: 0, char2: 0, char3: 0,
  char4: 0, char5: 0, char6: 0
};
let maxSP = {
  char1: 150, char2: 150, char3: 150,
  char4: 150, char5: 150, char6: 150
};

// --- HP表示更新 ---
function updateHPDisplay() {
  // 味方
  characters.forEach(char => {
    const span = document.getElementById("hp-" + char.id);
    if (span) span.textContent = char.hp;

    const bar = document.getElementById("bar-" + char.id);
    if (bar) {
      let ratio = Math.max(char.hp, 0) / char.maxHP;
      bar.style.width = (ratio * 100) + "%";
      if (ratio > 0.6) bar.style.backgroundColor = "limegreen";
      else if (ratio > 0.3) bar.style.backgroundColor = "orange";
      else bar.style.backgroundColor = "red";
    }
  });

  // ボス
  const spanBoss = document.getElementById("hp-boss");
  if (spanBoss) spanBoss.textContent = boss.hp;

  const barBoss = document.getElementById("bar-boss");
  if (barBoss) {
    let ratio = Math.max(boss.hp, 0) / boss.maxHP;
    barBoss.style.width = (ratio * 100) + "%";
    if (ratio > 0.6) barBoss.style.backgroundColor = "limegreen";
    else if (ratio > 0.3) barBoss.style.backgroundColor = "orange";
    else barBoss.style.backgroundColor = "red";
  }
}

// --- SP表示更新 ---
function updateSPDisplay() {
  for (const key in sp) {
    const span = document.getElementById("sp-" + key);
    if (span) span.textContent = sp[key];

    const blueBar = document.getElementById("sp-blue-" + key);
    const goldBar = document.getElementById("sp-gold-" + key);
    if (blueBar) blueBar.style.width = (Math.min(sp[key], 50) / 50) * 100 + "%";
    if (goldBar) goldBar.style.width = sp[key] > 50 ? ((sp[key] - 50) / 100) * 100 + "%" : "0%";

    const skillBtn = document.getElementById("skill-" + key);
    if (skillBtn) {
      if (sp[key] >= 50) {
        skillBtn.disabled = false;
        skillBtn.classList.remove("disabled");
      } else {
        skillBtn.disabled = true;
        skillBtn.classList.add("disabled");
      }
    }

    const skill2Btn = document.getElementById("skill2-" + key);
    if (skill2Btn) {
      if (sp[key] >= 150) {
        skill2Btn.disabled = false;
        skill2Btn.classList.remove("disabled");
      } else {
        skill2Btn.disabled = true;
        skill2Btn.classList.add("disabled");
      }
    }
  }
}

// --- ディレイ ---
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- 通常攻撃 ---
const sparklist = [];

async function action(id, elem) {
  if (currentTurn !== "player") return;
  elem.classList.add("disabled");

  let count = 0;
  const char = characters[id - 1];

  for (const time of char.nomalattackspace) {
    await delay(time * 100);

    const timestamp = Date.now();
    sparklist[id - 1] = timestamp;

    for (const i in sparklist) {
      if (i != id - 1) {
        const diff = Math.abs(timestamp - sparklist[i]);
        if (diff <= 10) {
          console.log("spark");
          count++;
          showSparkTextAroundBoss();
        }
      }
    }

    const randomFactor = 0.9 + Math.random() * 0.2;
    const nomalattack = Math.floor(
      char.attack * char.nomalattackvalue * randomFactor * (100 / (100 + (boss.baseDefense || 0)))
    );
    boss.hp = Math.max(0, boss.hp - nomalattack);
    updateHPDisplay();
    showDamage(nomalattack, "char" + id);
  }

  const charKey = "char" + id;
  const rate = spRecoveryRate[charKey] || 1.0;
  const randomFactor = 0.8 + Math.random() * 0.4;
  const recovery = Math.floor(40 * rate * randomFactor);
  sp[charKey] = Math.min(maxSP[charKey], sp[charKey] + recovery);

  console.log(`${charKey} のSPが ${recovery} 回復！（合計: ${sp[charKey]}）`);
  updateSPDisplay();

  actionsThisTurn++;
  checkEndPlayerTurn();
}

// --- スキル1 ---
function useSkill(event, id) {
  event.stopPropagation();
  if (currentTurn !== "player") return;

  const char = characters.find(c => c.id === id);
  if (!char) return;

  console.log(`${char.name} が「${char.skill1[0].name}」を使用！`);

  sp[id] -= 50;
  updateSPDisplay();

  const skillBtn = document.getElementById("skill-" + id);
  skillBtn.classList.add("disabled");
  skillBtn.disabled = true;

  moveLeft(id);

  for (const effect of char.skill1) {
    switch (effect.type) {
      case "attack":
        const dmg = char.attack * effect.power;
        boss.hp = Math.max(0, boss.hp - dmg);
        showDamage(dmg, id);
        break;
      case "heal":
        const heal = Math.floor(char.maxHP * effect.power);
        characters.forEach(a => a.hp = Math.min(a.maxHP, a.hp + heal));
        break;
      case "buff":
        characters.forEach(a => {
          a.buffs = a.buffs || [];

          // --- 割合バフ対応 ---
          let baseKey = "base" + effect.stat.charAt(0).toUpperCase() + effect.stat.slice(1);
          let baseValue = a[baseKey] ?? 0;
          let buffValue = effect.isPercent
            ? Math.floor(baseValue * effect.value)
            : effect.value;

          // --- 同一種類のバフがあるかチェック ---
          const existing = a.buffs.find(b => b.stat === effect.stat);
          if (existing) {
            // すでに同じステータスのバフがある場合：値は上書きせず、ターンだけ更新
            existing.turns = 3;
            console.log(`🌀 ${a.name} の ${effect.stat} バフ延長`);
          } else {
            // 新規付与
            a.buffs.push({ stat: effect.stat, value: buffValue, turns: 3 });
            console.log(`✨ ${a.name} に ${effect.stat} バフ付与 +${buffValue}`);
          }
        });


        // 即時反映
        applyBuffs();
        console.log("=== バフ即時適用 ===");
        characters.forEach(a => console.log(`${a.name}: 攻撃=${a.attack}, 防御=${a.baseDefense}`));
        break;


      case "debuff":
        boss.status = effect.effect;
        break;
    }
  }

  updateHPDisplay();
  actionsThisTurn++;
  checkEndPlayerTurn();
}

// --- スキル2 ---
function useSkill2(event, id) {
  event.stopPropagation();
  if (currentTurn !== "player") return;

  const char = characters.find(c => c.id === id);
  if (!char) return;

  console.log(`${char.name} が「${char.skill2[0].name}」を使用！`);
  sp[id] = 0;
  updateSPDisplay();

  const skillBtn = document.getElementById("skill2-" + id);
  skillBtn.classList.add("disabled");
  skillBtn.disabled = true;

  moveLeft(id);

  boss.hp = Math.max(0, boss.hp - 500);
  updateHPDisplay();

  actionsThisTurn++;
  checkEndPlayerTurn();
}

// --- ターン管理 ---
function checkEndPlayerTurn() {
  if (currentTurn !== "player") return;
  const buttons = document.querySelectorAll(".action-button");
  const allDisabled = Array.from(buttons).every(btn => btn.classList.contains("disabled"));
  if (allDisabled) endPlayerTurn();
}

function endPlayerTurn() {
  console.log("=== プレイヤーターン終了 ===");
  currentTurn = "boss";

  if (isBossActing) return;
  isBossActing = true;

  setTimeout(async () => {
    await bossAttack();
    isBossActing = false;
  }, 5000);
}

// --- ボスの攻撃 ---
async function bossAttack() {
  console.log(`=== ${turnCount}ターン目 ボスターン ===`);
  currentTurn = "boss";

  // --- そのターンに発動可能な行動を抽出 ---
  let possibleActions = boss.actions.filter(a => {
    let baseCondition = a.condition ? a.condition(boss, turnCount) : true;

    // randomChance がある場合は確率抽選
    if (a.randomChance !== undefined) {
      return baseCondition && Math.random() < a.randomChance;
    }
    return baseCondition;
  });

  // 候補が1つもなければ通常攻撃を追加（保険）
  if (possibleActions.length === 0) {
    possibleActions.push(boss.actions.find(a => a.name === "通常攻撃"));
  }

  // --- 候補が1個しかない場合は複製して最低2個にする ---
  if (possibleActions.length === 1) {
    possibleActions.push(possibleActions[0]);
  }

  // --- 行動回数をランダムで決定（2〜3回） ---
  const actionCount = Math.floor(Math.random() * 2) + 2; // 2 or 3
  const selectedActions = [];

  // --- 重複ありでランダム抽選 ---
  for (let i = 0; i < actionCount; i++) {
    const index = Math.floor(Math.random() * possibleActions.length);
    selectedActions.push(possibleActions[index]);
  }

  // --- 優先度の高い順（強攻撃を前に） ---
  selectedActions.sort((a, b) => b.priority - a.priority);

  // --- 行動実行 ---
  for (const action of selectedActions) {
    console.log(`${boss.name} は「${action.name}」を使った！`);

    if (action.priority >= 900) {
      showBattleMessage(`${action.name}`);
    }

    if (action.type === "attack") {
      const targetId = Math.floor(Math.random() * 6) + 1;
      const target = "char" + targetId;
      bossMoveToTarget(target);

      const ally = characters.find(c => c.id === target);
      if (ally) {
        const beforeHP = ally.hp;
        const reducedDamage = Math.floor(
          action.power * (100 / (100 + ally.baseDefense))
        );
        ally.hp = Math.max(0, ally.hp - reducedDamage);

        const lostRatio = (beforeHP - ally.hp) / ally.maxHP;
        if (lostRatio > 0) {
          const recovery = Math.floor(lostRatio * 100);
          sp[target] = Math.min(maxSP[target], sp[target] + recovery);
          console.log(`${ally.name} は被弾でSPが ${recovery} 回復！（合計: ${sp[target]}）`);
        }
      }

    } else if (action.type === "attackAll") {
      characters.forEach(a => {
        const beforeHP = a.hp;
        const reducedDamage = Math.floor(
      action.power * (100 / (100 + a.baseDefense))
    );
    a.hp = Math.max(0, a.hp - reducedDamage);

        const lostRatio = (beforeHP - a.hp) / a.maxHP;
        if (lostRatio > 0) {
          const recovery = Math.floor(lostRatio * 80);
          sp[a.id] = Math.min(maxSP[a.id], sp[a.id] + recovery);
        }
      });

    } else if (action.type === "heal") {
      boss.hp = Math.min(boss.maxHP, boss.hp + action.amount);
      showBattleMessage(`${boss.name} は ${action.amount} 回復した！`);
    }

    updateHPDisplay();
    await delay(2000); // 行動間ディレイ
  }

  endBossTurn();
}




function endBossTurn() {
  decrementBuffs();
  applyBuffs();
  turnCount++;
  console.log(`=== ${turnCount}ターン目へ ===`);
  startPlayerTurn();
}

function startPlayerTurn() {
  console.log(`=== ${turnCount}ターン目 プレイヤーターン開始 ===`);
  currentTurn = "player";
  actionsThisTurn = 0;

  const buttons = document.querySelectorAll(".action-button");
  buttons.forEach(btn => {
    btn.classList.remove("disabled");
    btn.disabled = false;
  });

  updateSPDisplay();
}

// --- 各種エフェクト ---
function moveLeft(id) {
  const img = document.getElementById(id);
  let currentRight = parseInt(window.getComputedStyle(img).right, 10);
  img.style.transition = "right 0.3s linear";
  img.style.right = (currentRight + 150) + "px";
  setTimeout(() => img.style.right = currentRight + "px", 500);
}

function showBattleMessage(text) {
  const msg = document.getElementById("battle-message");
  msg.textContent = text;
  msg.style.opacity = "1";
  setTimeout(() => msg.style.opacity = "0", 2000);
}

function showDamage(amount, attackerId) {
  const bossImg = document.querySelector(".enemyposition");
  if (!bossImg) return;
  const dmgElem = document.createElement("div");
  dmgElem.textContent = `${amount}`;
  dmgElem.classList.add("damage-text");
  const rect = bossImg.getBoundingClientRect();
  const baseOffsets = {
    char1: { x: -50, y: -30 },
    char2: { x: 50, y: -30 },
    char3: { x: -80, y: 10 },
    char4: { x: 80, y: 10 },
    char5: { x: -40, y: 50 },
    char6: { x: 40, y: 50 },
  };
  const offset = baseOffsets[attackerId] || { x: 0, y: 0 };
  const randomX = (Math.random() - 0.5) * 40;
  const randomY = (Math.random() - 0.5) * 40;
  dmgElem.style.left = rect.left + rect.width / 2 + offset.x + randomX + window.scrollX + "px";
  dmgElem.style.top = rect.top + rect.height / 4 + offset.y + randomY + window.scrollY + "px";
  document.body.appendChild(dmgElem);
  setTimeout(() => dmgElem.remove(), 1000);
}

function showSparkTextAroundBoss() {
  const effectLayer = document.getElementById("effect-layer");
  const text = document.createElement("div");
  text.className = "spark-text";
  text.innerText = "SPARK!";
  const boss = document.querySelector(".enemyposition");
  const rect = boss.getBoundingClientRect();
  const parentRect = effectLayer.getBoundingClientRect();
  const offsetX = rect.left - parentRect.left;
  const offsetY = rect.top - parentRect.top;
  const randX = offsetX - 20 + Math.random() * (rect.width + 40);
  const randY = offsetY - 20 + Math.random() * (rect.height + 40);
  text.style.left = randX + "px";
  text.style.top = randY + "px";
  effectLayer.appendChild(text);
  setTimeout(() => text.remove(), 1000);
}

// --- バフ管理 ---
function applyBuffs() {
  characters.forEach(a => {
    a.attack = a.baseAttack;
    a.baseDefense = a.baseDefense;
    if (!a.buffs) return;
    a.buffs.forEach(b => {
      if (b.stat === "attack") a.attack += b.value;
      if (b.stat === "baseDefense") a.baseDefense += b.value;
    });

    // 🔽 ここ追加
    console.log(`${a.name} の現在ステータス => 攻撃:${a.attack} 防御:${a.baseDefense}`);
  });
}

function decrementBuffs() {
  characters.forEach(a => {
    if (!a.buffs) return;
    a.buffs.forEach(b => b.turns--);
    a.buffs = a.buffs.filter(b => b.turns > 0);

    // 🔽 ここ追加
    console.log(`${a.name} の残りバフ:`, a.buffs);
  });
}

// --- ボス移動 ---
function bossMoveToTarget(targetId) {
  const bossImg = document.querySelector(".enemyposition");
  const targetImg = document.getElementById(targetId);
  if (!bossImg || !targetImg) return;

  const bossRect = bossImg.getBoundingClientRect();
  const targetRect = targetImg.getBoundingClientRect();

  const offsetX = targetRect.left - bossRect.left - 50;
  const offsetY = targetRect.top - bossRect.top;

  bossImg.style.transition = "all 0.5s linear";
  bossImg.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

  setTimeout(() => {
    bossImg.style.transform = "translate(0,0)";
  }, 600);
}