function renderweapons(list) {
  const container = document.getElementById("weapon-list");
  container.innerHTML = "";

  list.forEach(w => {
    const div = document.createElement("div");
    div.textContent = w.name;
    container.appendChild(div);
  });
}
