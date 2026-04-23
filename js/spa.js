async function navigate(page) {
  const app = document.getElementById("app");

  // メニュー閉じる
  document.getElementById("sideMenu").classList.remove("open");

  if (page === "home") {
    app.innerHTML = `
      <h1 class="title">GBF Tools</h1>
      <p class="subtitle">メニューから機能を選んでください。</p>
    `;
  }

  if (page === "weapons") {
    app.innerHTML = `<div id="weapon-list">読み込み中...</div>`;
    const list = await loadweapons();
    renderweapons(list);
  }

  if (page === "summons") {
    app.innerHTML = `<h1 class="title">召喚石（準備中）</h1>`;
  }

  if (page === "characters") {
    app.innerHTML = `
      <div id="character-filter">
        <select id="filter-attr">
          <option value="">属性(全て)</option>
          <option value="fire">火</option>
          <option value="water">水</option>
          <option value="earth">土</option>
          <option value="wind">風</option>
          <option value="light">光</option>
          <option value="dark">闇</option>
        </select>

        <select id="filter-type">
          <option value="">分類(全て)</option>
          <option value="attack">攻撃</option>
          <option value="defense">防御</option>
          <option value="balance">バランス</option>
          <option value="special">特殊</option>
        </select>

        <input id="filter-name" type="text" placeholder="名前検索">
      </div>

      <div id="character-list">読み込み中...</div>
    `;

    loadCharacters().then(list => {
      window._characterList = list;
      renderCharacters(list);
      setupCharacterFilter();
    });
  }

  if (page === "party") {
    app.innerHTML = `<h1 class="title">編成ツール（準備中）</h1>`;
  }

  if (page === "settings") {
    app.innerHTML = `<h1 class="title">設定（準備中）</h1>`;
  }
}
