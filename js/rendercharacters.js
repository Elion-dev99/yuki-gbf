function renderCharacters(list) {
  const container = document.getElementById("character-list");
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<p>該当するキャラがいません。</p>`;
    return;
  }

  container.innerHTML = list.map(c => `
    <div class="character-card ${c.attribute}">
      <div class="char-header">
        <img class="char-icon" src="${c.icon}" alt="${c.name}">
        <div class="char-name">${c.name}</div>
      </div>

      <div class="char-info">
        <div>属性：${convertAttr(c.attribute)}</div>
        <div>タイプ：${convertType(c.type)}</div>
        <div>得意武器：${c.weapons.join(" / ")}</div>
      </div>
    </div>
  `).join("");
}

function convertAttr(a) {
  return {
    fire: "火",
    water: "水",
    earth: "土",
    wind: "風",
    light: "光",
    dark: "闇"
  }[a] || a;
}

function convertType(t) {
  return {
    attack: "攻撃",
    defense: "防御",
    balance: "バランス",
    special: "特殊"
  }[t] || t;
}
