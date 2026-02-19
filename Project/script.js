// --- 初期位置を保存するオブジェクト ---
const originalPositions = {};

// ページ読み込み時に全キャラの位置を保存
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

// HPデータ
let hp = {
    char1: 100, char2: 100, char3: 100,
    char4: 100, char5: 100, char6: 100,
    boss: 10000
};

// 最大HP（バー計算用）
let maxHP = {
    char1: 100, char2: 100, char3: 100,
    char4: 100, char5: 100, char6: 100,
    boss: 10000
};

// SP（バー計算用）
let sp = {
    char1: 10, char2: 50, char3: 50,
    char4: 50, char5: 50, char6: 50
};
let maxSP = {
  char1: 100, char2: 100, char3: 100,
  char4: 100, char5: 100, char6: 100
};



// HP表示とバーを更新する関数
function updateHPDisplay() {
    for (const key in hp) {
        // 数値を更新
        const span = document.getElementById("hp-" + key);
        if (span) {
            span.textContent = hp[key];
        }

        // HPバーを更新
        const bar = document.getElementById("bar-" + key);
        if (bar) {
            let ratio = Math.max(hp[key], 0) / maxHP[key]; // 残量の割合（0～1）
            bar.style.width = (ratio * 100) + "%";

            // 色（残量で変化させたい場合）
            if (ratio > 0.6) {
                bar.style.backgroundColor = "limegreen";
            } else if (ratio > 0.3) {
                bar.style.backgroundColor = "orange";
            } else {
                bar.style.backgroundColor = "red";
            }
        }
    }
}
// SP表示更新
function updateSPDisplay() {
    for (const key in sp) {
        const span = document.getElementById("sp-" + key);
        if (span) {
            span.textContent = sp[key];
        }

        const bar = document.getElementById("sp-" + key);
        const fill = document.querySelector(`#${bar.id.replace("sp-", "sp-")} .sp-fill`);
        if (fill) {
            let ratio = Math.max(sp[key], 0) / maxSP[key];
            fill.style.width = (ratio * 100) + "%";
        }
    }
}


let currentTurn = "player";
let actionsThisTurn = 0;

// プレイヤー行動
function action(id, elem) {
    // ボタンブラックアウト
    // ボタン無効化
    elem.classList.add("disabled");

    // 攻撃処理（Bossに50ダメージ）
    hp.boss -= 50;
    if (hp.boss < 0) hp.boss = 0;
    updateHPDisplay();

    actionsThisTurn++;

    // 全員行動したらBossターン
    const buttons = document.querySelectorAll(".action-button");
    const allDisabled = Array.from(buttons).every(btn => btn.classList.contains("disabled"));

    if (allDisabled) {
        alert("すべてのコマンドが選択されました！");
        setTimeout(bossAttack, 1000);
    }
}

// ここでSP
function updateSPDisplay() {
  for (const key in sp) {
    const span = document.getElementById("sp-" + key);
    if (span) {
      span.textContent = sp[key];
    }

    const bar = document.getElementById("bar-sp-" + key);
    if (bar) {
      let ratio = Math.max(sp[key], 0) / maxSP[key];
      bar.style.width = (ratio * 100) + "%";
    }

    // ★ スキルボタンの有効/無効切り替え
    const skillBtn = document.getElementById("skill-" + key);
    if (skillBtn) {
      if (sp[key] >= maxSP[key]) {
        skillBtn.disabled = false;  // 100%なら使える
      } else {
        skillBtn.disabled = true;   // それ以外は使えない
      }
    }
  }
}
// SPを消費する処理
function useSkill(event, id) {
  event.stopPropagation(); // 親divのクリックを防止
  console.log(id + " がスキルを使用！");

  // ここでSP消費
  sp[id] = 0;
  updateSPDisplay();
}


// Bossの攻撃
function bossAttack() {
    currentTurn = "boss";
    console.log("Bossの攻撃ターン！");

    const target = "char" + (Math.floor(Math.random() * 6) + 1);
    // const target = "char1" ;
    hp[target] -= 30;
    if (hp[target] < 0) hp[target] = 0;
    console.log(`Bossが ${target} を攻撃！ 残りHP:${hp[target]}`);
    updateHPDisplay();

    // 攻撃後にキャラを元の位置へ戻す
    for (const [id, pos] of Object.entries(originalPositions)) {
        const img = document.getElementById(id);
        if (img) {
            img.style.right = pos.right;
            img.style.top = pos.top;
        }
    }

    // 次のターンへ
    endBossTurn();
}

function moveLeft(id) {
    const img = document.getElementById(id);
    let currentRight = parseInt(window.getComputedStyle(img).right, 10);
    img.style.right = (currentRight + 250) + "px";
}

function endBossTurn() {
    actionsThisTurn = 0;
    currentTurn = "player";

    const buttons = document.querySelectorAll(".action-button");
    buttons.forEach(btn => {
        btn.classList.remove("disabled"); // ← 復活
    });

    console.log("次のプレイヤーターン！");
}
