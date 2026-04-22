function renderweapons(list) {
  const container = document.getElementById("weapon-list");
  container.innerHTML = "";

  list.forEach(w => {
    const card = document.createElement("div");
    card.className = "weapon-card";

    card.innerHTML = `
      <div class="weapon-name">${w.name}</div>
      <div class="weapon-info">
        <span>${w.element}</span> /
        <span>${w.weapon_type}</span> /
        <span>${w.rarity.toUpperCase()}</span>
      </div>
      <div class="weapon-stats">
        HP ${w.stats.min_hp} → ${w.stats.max_hp}<br>
        ATK ${w.stats.min_atk} → ${w.stats.max_atk}
      </div>
    `;

    container.appendChild(card);
  });
}
