function renderweapons(list) {
  const container = document.getElementById("weapon-list");
  container.innerHTML = "";

  list.forEach(w => {
    const card = document.createElement("div");
    card.className = "weapon-card";

    const name = w.name;
    const element = w.element;
    const type = w.weapon_type;
    const rarity = w.rarity;

    // convert.js の JSON 構造に合わせる
    const atk = w.stats?.max_atk ?? "";
    const hp = w.stats?.max_hp ?? "";
    const related = w.related ? `関連: ${w.related}` : "";

    card.innerHTML = `
      <div class="weapon-name">${name}</div>
      <div class="weapon-info">${element} / ${type} / ${rarity}</div>
      <div class="weapon-stats">ATK: ${atk} / HP: ${hp}</div>
      ${related ? `<div class="weapon-related">${related}</div>` : ""}
    `;

    container.appendChild(card);
  });
}
