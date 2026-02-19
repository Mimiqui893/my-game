let characters = [
  {
    id: "char1",
    name: "覇戴の窮戯神キラ",
    hp: 1000, maxHP: 1000,
    sp: 0, maxSP: 200,
    attack: 1000, defense: 5,
    baseAttack: 1000, baseDefense: 500, // ←追加
    nomalattackvalue: 1.1,
    nomalattackspace: [1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    skill1: [
      { name: "てすと", type: "attack", power: 100, target: "enemy" },
      { name: "てすと", type: "heal", power: 0.5, target: "party" },
      { name: "てすと", type: "buff", value: 1.3, isPercent: true, stat: "attack", turns: 2, target: "party" },
      { name: "てすと", type: "buff", value: 1.3, isPercent: true, stat: "defense", turns: 2, target: "party" },
      { name: "てすと", type: "debuff", effect: "sleep", target: "enemy" }
    ],
    skill2: [
      { name: "シャドークロー", cost: 50, type: "attack", power: 120, target: "enemy" }
    ],
    buffs: []
  },
  {
    id: "char2",
    name: "覇戴の窮戯神キラ②",
    hp: 1000, maxHP: 1000,
    sp: 0, maxSP: 200,
    attack: 1000, defense: 5,
    baseAttack: 1000, baseDefense: 500,
    nomalattackvalue: 0.8,
    nomalattackspace: [1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    skill1: [
      { name: "てすと", type: "attack", power: 100, target: "enemy" }
    ],
    skill2: [
      { name: "シャドークロー", cost: 50, type: "attack", power: 120, target: "enemy" }
    ],
    buffs: []
  },
  {
    id: "char3",
    name: "覇戴の窮戯神キラ③",
    hp: 1000, maxHP: 1000,
    sp: 0, maxSP: 200,
    attack: 1000, defense: 5,
    baseAttack: 1000, baseDefense: 500,
    nomalattackvalue: 1.1,
    nomalattackspace: [1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    skill1: [
      { name: "てすと", type: "attack", power: 100, target: "enemy" }
    ],
    skill2: [
      { name: "シャドークロー", cost: 50, type: "attack", power: 120, target: "enemy" }
    ],
    buffs: []
  },
  {
    id: "char4",
    name: "覇戴の窮戯神キラ④",
    hp: 1000, maxHP: 1000,
    sp: 0, maxSP: 200,
    attack: 1000, defense: 5,
    baseAttack: 1000, baseDefense: 500,
    nomalattackvalue: 1.1,
    nomalattackspace: [1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    skill1: [
      { name: "てすと", type: "attack", power: 100, target: "enemy" }
    ],
    skill2: [
      { name: "シャドークロー", cost: 50, type: "attack", power: 120, target: "enemy" }
    ],
    buffs: []
  },
  {
    id: "char5",
    name: "覇戴の窮戯神キラ⑤",
    hp: 1000, maxHP: 1000,
    sp: 0, maxSP: 200,
    attack: 1000, defense: 5,
    baseAttack: 1000, baseDefense: 500,
    nomalattackvalue: 1.1,
    nomalattackspace: [1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    skill1: [
      { name: "てすと", type: "attack", power: 100, target: "enemy" }
    ],
    skill2: [
      { name: "シャドークロー", cost: 50, type: "attack", power: 120, target: "enemy" }
    ],
    buffs: []
  },
  {
    id: "char6",
    name: "覇戴の窮戯神キラ⑥",
    hp: 1000, maxHP: 1000,
    sp: 0, maxSP: 200,
    attack: 1000, defense: 1000,
    baseAttack: 1000, baseDefense: 500,
    nomalattackvalue: 1.1,
    nomalattackspace: [1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    skill1: [
      { name: "てすと", type: "attack", power: 100, target: "enemy" }
    ],
    skill2: [
      { name: "シャドークロー", cost: 50, type: "attack", power: 120, target: "enemy" }
    ],
    buffs: []
  }
];

// キャラごとのSP回復効率
const spRecoveryRate = {
  char1: 1.0,  // みみっきゅ
  char2: 1.2,  // ダークライ
  char3: 0.8,  // ぶらっきー
  char4: 1.5,  // ふかまる
  char5: 1.1,  // ハッサム
  char6: 1.3   // れしらむ
};





let boss = {
  name: "Maskwell",
  hp: 5000000,
  maxHP: 5000000,
  status: null,
  attack: 1000, defense: 100,

  actions: [
    {
      name: "通常攻撃",
      type: "attack",
      power: 1200,
      condition: (self, turn) => true,
      priority: 1
    },

    {
      name: "源聖のジェネシス",
      type: "attackAll",
      power: 1250,
      randomChance: 1, // ← 25%の確率で候補入り
      priority: 1
    },
    {
      name: "自己回復",
      type: "heal",
      amount: 200,
      condition: (self, turn) => self.hp < self.maxHP * 0.3,
      priority: 1
    },
    {
      name: "ヴァース・ジェネシス",
      type: "attackAll",
      power: 500,
      condition: (self, turn) => turn % 5 === 0, // 5ターンごとに確定
      priority: 999
    },
    {
      name: "アカシック・ルーン",
      type: "attack",
      power: 500,
      condition: (self, turn) => turn % 4 === 0, // 5ターンごとに確定
      priority: 998
    }
  ]
};
