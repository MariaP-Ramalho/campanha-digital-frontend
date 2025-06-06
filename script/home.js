const modal = document.getElementById("novaTransmissaoModal");
const btn = document.querySelector(".reports-new button");
const span = document.querySelector(".close");

btn.onclick = function () {
    loadTags();
    modal.style.display = "block";
}

span.onclick = function () {
    modal.style.display = "none";
}

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function toggleNewTagInput() {
    const selected = document.getElementById("tagSelect").value;
    const input = document.getElementById("newTagInput");
    input.style.display = selected === "__new__" ? "inline-block" : "none";
}

function loadTags() {
    fetch("http://localhost:8080/tags", { credentials: "include" })
        .then(res => res.json())
        .then(tags => {
            const select = document.getElementById("tagSelect");
            select.innerHTML = `
                <option value="" disabled selected>Escolha uma tag</option>
                ${tags.map(t => `<option value="${t}">${t}</option>`).join("")}
                <option value="__new__">Criar nova tag...</option>
            `;
        });
}

function loadLives() {
    fetch("http://localhost:8080/lives", { credentials: "include" })
        .then(res => res.json())
        .then(lives => {
            const container = document.getElementById("livesContainer");
            container.innerHTML = "";

            const grouped = {};
            lives.forEach(live => {
                const tag = live.tag?.name || "Sem Tag";
                if (!grouped[tag]) grouped[tag] = [];
                grouped[tag].push(live);
            });

            Object.keys(grouped).forEach(tag => {
                const section = document.createElement("div");
                section.className = "tag-section";

                const title = document.createElement("h3");
                title.textContent = tag.toUpperCase();

                const scrollArea = document.createElement("div");
                scrollArea.className = "live-scroll";

                grouped[tag].forEach(live => {
                    const card = document.createElement("div");
                    card.className = "live-card";
                    const tagRaw = live.tag?.name || live.tag || "Sem Tag";
                    const tag = tagRaw.toUpperCase();
                    const data = live.date || live.createdAt || null;

                    card.innerHTML = `
                    <img src="https://img.youtube.com/vi/${live.liveId}/0.jpg" alt="Thumbnail" class="live-thumbnail">
                    
                    <div class="live-header">
                        <div class="live-title">[${tag}] ${live.title}</div>
                        <div class="live-actions">
                        <button onclick="editLive('${live.liveId}', '${live.title}')" title="Editar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pen-icon lucide-square-pen"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>
                            <path d="M18.4 2.6a2.1 2.1 0 013 3L7.7 19.3 3 21l1.7-4.7L18.4 2.6z"/>
                            </svg>
                        </button>
                        <button onclick="deleteLive('${live.liveId}')" title="Apagar">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                            <path d="M3 6h18M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6m-4-3h0a1 1 0 00-1 1v1h6V4a1 1 0 00-1-1h-4z"/>
                            </svg>
                        </button>
                        </div>
                    </div>

                    <div class="live-date">${data ? new Date(data).toLocaleDateString() : "Data indefinida"}</div>
                    `;


                    card.onclick = () => window.location.href = `live.html?liveId=${live.liveId}`;
                    scrollArea.appendChild(card);
                });

                section.appendChild(title);
                section.appendChild(scrollArea);
                container.appendChild(section);
            });
        });
}

function addTransmissao() {
    const liveId = document.getElementById("liveId").value;
    const title = document.getElementById("title").value;
    const tagSelect = document.getElementById("tagSelect").value;
    const newTag = document.getElementById("newTagInput").value;
    const tagName = tagSelect === "__new__" ? newTag : tagSelect;

    fetch("http://localhost:8080/lives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveId, title, tagName }),
        credentials: "include"
    }).then(res => {
        if (res.ok) {
            alert("Transmissão cadastrada com sucesso!");
            document.getElementById("novaTransmissaoModal").style.display = "none";
            loadLives();
        } else {
            alert("Erro ao cadastrar transmissão.");
        }
    });
}

window.onload = function () {
    loadTags();
    loadLives();
};
