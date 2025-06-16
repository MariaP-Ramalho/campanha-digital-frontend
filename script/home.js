document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("novaTransmissaoModal");
    const openModalBtn = document.getElementById("openModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const tagSelect = document.getElementById("tagSelect");
    const newTagInput = document.getElementById("newTagInput");
    const addBtn = document.getElementById("addTransmissaoBtn");

    openModalBtn.addEventListener("click", () => {
        loadTags();
        modal.style.display = "block";
        modal.setAttribute("aria-hidden", "false");
    });

    closeModalBtn.addEventListener("click", () => closeModal());

    window.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    tagSelect.addEventListener("change", () => {
        newTagInput.style.display = tagSelect.value === "__new__" ? "inline-block" : "none";
    });

    addBtn.addEventListener("click", addTransmissao);

    loadTags();
    loadLives();
    updateButtonText();

});

window.addEventListener("resize", updateButtonText);

function closeModal() {
    const modal = document.getElementById("novaTransmissaoModal");
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
}

async function loadTags() {
    try {
        const res = await fetch("http://localhost:8080/tags", { credentials: "include" });
        const tags = await res.json();

        const select = document.getElementById("tagSelect");
        select.innerHTML = `
      <option value="" disabled selected>Escolha uma tag</option>
      ${tags.map(tag => `<option value="${tag}">${tag}</option>`).join("")}
      <option value="__new__">Criar nova tag...</option>
    `;
    } catch (err) {
        alert("Erro ao carregar tags.");
        console.error(err);
    }
}

async function loadLives() {
    try {
        const res = await fetch("http://localhost:8080/lives", { credentials: "include" });
        const lives = await res.json();

        const grouped = lives.reduce((acc, live) => {
            const tag = live.tag?.name || "Sem Tag";
            acc[tag] = acc[tag] || [];
            acc[tag].push(live);
            return acc;
        }, {});

        const container = document.getElementById("livesContainer");
        container.innerHTML = "";

        Object.entries(grouped).forEach(([tag, lives]) => {
            const section = document.createElement("div");
            section.className = "tag-section";

            const title = document.createElement("h3");
            title.textContent = tag.toUpperCase();

            const scrollArea = document.createElement("div");
            scrollArea.className = "live-scroll";

            lives.forEach(live => {
                const card = createLiveCard(live);
                scrollArea.appendChild(card);
            });

            section.appendChild(title);
            section.appendChild(scrollArea);
            container.appendChild(section);
        });

    } catch (err) {
        alert("Erro ao carregar lives.");
        console.error(err);
    }
}

function createLiveCard(live) {
    const card = document.createElement("div");
    card.className = "live-card";
    const tag = (live.tag?.name || "Sem Tag").toUpperCase();
    const date = live.date || live.createdAt;

    card.innerHTML = `
    <img src="https://img.youtube.com/vi/${live.liveId}/0.jpg" alt="Thumbnail" class="live-thumbnail">
    <div class="live-header">
      <div class="live-title">[${tag}] ${live.title}</div>
      <div class="live-actions">
        <button title="Atualizar Tag" data-id="${live.liveId}" class="btn-update-tag">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" fill="none" stroke="currentColor" 
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bookmark-icon lucide-bookmark">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
        </button>
        <button title="Editar" data-id="${live.liveId}" data-title="${live.title}" class="btn-edit">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            class="lucide lucide-square-pen-icon lucide-square-pen">
            <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>s
            <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>
            </svg>
        </button>
        <button title="Apagar" data-id="${live.liveId}" class="btn-delete">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            class="lucide lucide-trash2-icon lucide-trash-2">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
        </button>
      </div>
    </div>
    <div class="live-date">${date ? new Date(date).toLocaleDateString() : "Data indefinida"}</div>
  `;

    card.addEventListener("click", () => {
        window.location.href = `live.html?liveId=${live.liveId}`;
    });

    card.querySelector(".btn-delete").addEventListener("click", (e) => {
        e.stopPropagation();
        deleteLive(e.currentTarget.dataset.id);
    });

    card.querySelector(".btn-edit").addEventListener("click", (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        const title = e.currentTarget.dataset.title;
        editLive(id, title);
    });

    card.querySelector(".btn-update-tag").addEventListener("click", (e) => {
        e.stopPropagation();
        updateTag(e.currentTarget.dataset.id);
    });

    return card;
}

async function addTransmissao() {
    const liveId = document.getElementById("liveId").value.trim();
    const title = document.getElementById("title").value.trim();
    const tagSelect = document.getElementById("tagSelect").value;
    const newTag = document.getElementById("newTagInput").value.trim();
    const tagName = tagSelect === "__new__" ? newTag : tagSelect;

    if (!tagName) return alert("Você precisa selecionar ou criar uma tag.");
    if (!liveId || !title) return alert("Preencha o título e o ID da live.");

    try {
        const res = await fetch("http://localhost:8080/lives", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ liveId, title, tagName }),
            credentials: "include"
        });

        if (!res.ok) throw new Error("Erro ao cadastrar transmissão.");

        alert("Transmissão cadastrada com sucesso!");
        closeModal();
        loadLives();
    } catch (err) {
        alert(err.message);
    }
}

function editLive(liveId, currentTitle) {
    const newTitle = prompt("Novo título da live:", currentTitle);
    if (!newTitle || newTitle === currentTitle) return;

    fetch(`http://localhost:8080/lives/${liveId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
        credentials: "include"
    }).then(res => {
        if (res.ok) {
            loadLives();
        } else {
            alert("Erro ao atualizar título da live.");
        }
    });
}

function deleteLive(liveId) {
    if (!confirm("Tem certeza que deseja deletar esta live?")) return;

    fetch(`http://localhost:8080/lives/${liveId}`, {
        method: "DELETE",
        credentials: "include"
    }).then(res => {
        if (res.ok) {
            loadLives();
        } else {
            alert("Erro ao deletar live.");
        }
    });
}

function updateTag(liveId) {
    const newTag = prompt("Digite a nova tag:");
    if (!newTag || newTag.trim() === "") return;

    fetch(`http://localhost:8080/lives/${liveId}/tag`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tagName: newTag })
    }).then(res => {
        if (res.ok) {
            alert("Tag atualizada!");
            loadLives();
        } else {
            alert("Erro ao atualizar tag.");
        }
    });
}

function updateButtonText() {
    const btn = document.getElementById("openModalBtn");
    if (window.matchMedia("(max-width: 600px)").matches) {
        btn.innerText = "+";
    } else {
        btn.innerText = "NOVA TRANSMISSÃO";
    }
}
