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
            console.log("Tags recebidas:", tags);
            const select = document.getElementById("tagSelect");
            select.innerHTML = `
        <option value="" disabled selected>Escolha uma tag</option>
        ${tags.map(t => `<option value="${t}">${t}</option>`).join("")}
        <option value="__new__">Criar nova tag...</option>
      `;
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
