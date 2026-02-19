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
    const nomalattack = Math.floor(char.attack * char.nomalattackvalue * randomFactor);

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
          a.buffs.push({ stat: effect.stat, value: effect.value, turns: 3 });
        });
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
  }, 800);
}

// --- ボスの攻撃 ---
async function bossAttack() {
  console.log(`=== ${turnCount}ターン目 ボスターン ===`);
  currentTurn = "boss";

  const actions = bossActions[boss.name];
  if (!actions) return;

  for (let i = 0; i < 2; i++) {
    const possibleActions = actions.filter(a => a.condition(boss));
    const action = possibleActions[Math.floor(Math.random() * possibleActions.length)];
    console.log(`${boss.name} は「${action.name}」を使った！`);

    if (action.type === "attack") {
      const targetId = Math.floor(Math.random() * 6) + 1;


      
      const ally = characters.find(c => c.id === "char" + targetId);
      if (ally) ally.hp = Math.max(0, ally.hp - action.power);
    } else if (action.type === "attackAll") {
      characters.forEach(a => a.hp = Math.max(0, a.hp - action.power));
      showBattleMessage(action.name);
    } else if (action.type === "heal") {
      boss.hp = Math.min(boss.maxHP, boss.hp + action.amount);
      showBattleMessage(`${boss.name} は ${action.amount} 回復した！`);
    }

    updateHPDisplay();
    await delay(1000);
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
    a.defense = a.baseDefense;
    if (!a.buffs) return;
    a.buffs.forEach(b => {
      if (b.stat === "attack") a.attack += b.value;
      if (b.stat === "defense") a.defense += b.value;
    });
  });
}

function decrementBuffs() {
  characters.forEach(a => {
    if (!a.buffs) return;
    a.buffs.forEach(b => b.turns--);
    a.buffs = a.buffs.filter(b => b.turns > 0);
  });
}
