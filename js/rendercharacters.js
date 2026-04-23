function setupCharacterFilter() {
  const attr = document.getElementById("filter-attr");
  const type = document.getElementById("filter-type");
  const name = document.getElementById("filter-name");

  function applyFilter() {
    const a = attr.value;
    const t = type.value;
    const n = name.value.toLowerCase();

    const filtered = window._characterList.filter(c => {
      if (a && c.attribute !== a) return false;
      if (t && c.type !== t) return false;
      if (n && !c.name.toLowerCase().includes(n)) return false;
      return true;
    });

    renderCharacters(filtered);
  }

  attr.onchange = applyFilter;
  type.onchange = applyFilter;
  name.oninput = applyFilter;
}
