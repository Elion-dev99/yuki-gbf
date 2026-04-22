async function loadWeapons() {
  // index.json を読み込む
  const index = await fetch("data/weapons/index.json").then(r => r.json());
  const weapons = [];

  // index.json に書かれたパスを順番に読み込む
  for (const path of index) {
    const json = await fetch(`data/weapons/${path}`).then(r => r.json());
    weapons.push(json);
  }

  return weapons;
}
