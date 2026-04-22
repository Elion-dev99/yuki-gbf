function renderweapons(list) {
  const container = document.getElementById("weapon-list");
  container.innerHTML = "";

  list.forEach(w => {
    const card = document.createElement("div");
    card.className = "weapon-card";

    card.innerHTML = `
      <div class="weapon-name">${w.name}</div>
      <div class="weapon-info">${w.element} / ${w.weapon_type} / ${w.rarity}</div>
      <div class="weapon-stats">ATK: ${w.atk} / HP: ${w.hp}</div>
    `;

    container.appendChild(card);
  });
}
