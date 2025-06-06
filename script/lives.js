window.onload = function () {
  const urlParams = new URLSearchParams(window.location.search);
  const liveId = urlParams.get("liveId");

  fetch(`http://localhost:8080/lives`, { credentials: "include" })
    .then(res => res.json())
    .then(lives => {
      const live = lives.find(l => l.liveId === liveId);
      if (live) {
        const tagRaw = live.tag?.name || "Sem Tag";
        const tag = tagRaw.toUpperCase();
        const title = live.title || "Sem Título";
        document.getElementById("liveTitle").textContent = `[${tag}] ${title}`;
        document.getElementById("liveTag").textContent = `${tag}`;
      } else {
        document.getElementById("liveTitle").textContent = "Live não encontrada";
      }
    })
    .catch(err => {
      console.error("Erro ao buscar live:", err);
      document.getElementById("liveTitle").textContent = "Erro ao carregar live";
    });

  fetchComments(liveId);
}
