const fs = require("fs");

// 入力ファイル
const INPUT = "raw_data.txt";

// 属性マップ
const ELEMENT_MAP = {
  火: "fire",
  水: "water",
  土: "earth",
  風: "wind",
  光: "light",
  闇: "dark"
};

// 武器種マップ
const WEAPON_MAP = {
  剣: "sword",
  槍: "spear",
  斧: "axe",
  杖: "staff",
  銃: "gun",
  格闘: "combat",
  弓: "bow",
  楽器: "harp",
  刀: "katana",
  短剣: "dagger"
};

// フォルダ内の最新番号を取得（0001〜9999）
function getNextId(dir) {
  if (!fs.existsSync(dir)) return "0001";

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
  if (files.length === 0) return "0001";

  const nums = files.map(f => parseInt(f.replace(".json", ""), 10));
  const max = Math.max(...nums);
  return String(max + 1).padStart(4, "0");
}

// 平文を読み込む
const lines = fs.readFileSync(INPUT, "utf8").split("\n");

lines.forEach((line) => {
  if (!line.trim()) return;

  const parts = line.split(",").map(v => v.trim());
  const type = parts[0];

  // ============================
  // 武器
  // ============================
  if (type === "武器") {
    const [
      _,
      rarity,
      name,
      elementJP,
      weaponJP,
      ougi,
      skill1,
      skill2,
      skill3,
      maxLv,
      minHP,
      minATK,
      maxHP,
      maxATK,
      series,
      related,
      obtain
    ] = parts;

    const element = ELEMENT_MAP[elementJP];
    const weapon_type = WEAPON_MAP[weaponJP];

    if (!element || !weapon_type) {
      console.log("変換できない行:", line);
      return;
    }

    const outDir = `data/weapons/${element}/${weapon_type}`;
    fs.mkdirSync(outDir, { recursive: true });

    const id = getNextId(outDir);

    const json = {
      id,
      name,
      element,
      weapon_type,
      rarity: rarity.toLowerCase(),
      series,
      obtain,
      stats: {
        max_level: Number(maxLv),
        min_hp: Number(minHP),
        min_atk: Number(minATK),
        max_hp: Number(maxHP),
        max_atk: Number(maxATK)
      },
      ougi: {
        name: ougi
      },
      skills: [
        { name: skill1 },
        { name: skill2 },
        { name: skill3 }
      ],
      related
    };

    const outPath = `${outDir}/${id}.json`;
    fs.writeFileSync(outPath, JSON.stringify(json, null, 2));

    console.log("生成:", outPath);
  }
});
