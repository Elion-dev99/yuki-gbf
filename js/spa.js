function toggleMenu() {
  document.getElementById("sideMenu").classList.toggle("open");
}

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
    app.innerHTML = `<h1 class="title">キャラ（準備中）</h1>`;
  }

  if (page === "party") {
    app.innerHTML = `<h1 class="title">編成ツール（準備中）</h1>`;
  }

  if (page === "settings") {
    app.innerHTML = `<h1 class="title">設定（準備中）</h1>`;
  }
}

// 初期表示
navigate("home");
