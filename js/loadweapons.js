async function loadweapons() {
  try {
    // index.json を読み込む
    const index = await fetch("data/weapons/index.json").then(r => {
      if (!r.ok) throw new Error(`Failed to load index.json: ${r.status}`);
      return r.json();
    });
    const weapons = [];

    // index.json に書かれたパスを順番に読み込む
    for (const path of index) {
      const json = await fetch(`data/weapons/${path}`).then(r => {
        if (!r.ok) throw new Error(`Failed to load ${path}: ${r.status}`);
        return r.json();
      });
      weapons.push(json);
    }

    return weapons;
  } catch (error) {
    console.error("Error loading weapons:", error);
    throw error;
  }
}
