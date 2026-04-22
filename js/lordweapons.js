async function loadWeapons() {
  const elements = ["fire", "water", "earth", "wind", "light", "dark"];
  const types = ["sword", "spear", "axe", "staff", "gun", "combat", "bow", "harp", "katana", "dagger"];

  const weapons = [];

  for (const element of elements) {
    for (const type of types) {
      const path = `data/weapons/${element}/${type}/`;

      try {
        const res = await fetch(path);
        if (!res.ok) continue;

        const html = await res.text();
        const files = [...html.matchAll(/href="(\d+\.json)"/g)].map(m => m[1]);

        for (const file of files) {
          const json = await fetch(path + file).then(r => r.json());
          weapons.push(json);
        }
      } catch (e) {
        continue;
      }
    }
  }

  return weapons;
}
