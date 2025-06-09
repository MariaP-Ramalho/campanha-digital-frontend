window.onload = function () {
  const urlParams = new URLSearchParams(window.location.search);
  const liveId = urlParams.get("liveId");
  document.getElementById("liveIdDisplay").textContent = `ID: ${liveId}`;

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

let intervalId = null;
let sentimentChart = null;
let timelineChart = null;
let interactionChart = null;

const dashboards = ["sentimentChart", "timelineChart", "interactionChart"];
let dashboardIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const liveId = urlParams.get("liveId");
  if (liveId) {
    fetchComments(liveId);
  }
});


function setStatus(value) {
  const statusText = document.getElementById("statusText");

  if (!statusText) return;

  if (value === "running") {
    statusText.textContent = "Ativo";
  } else if (value === "stopped") {
    statusText.textContent = "Inativo";
  } else if (value === "error") {
    statusText.textContent = "Finalizado";
  }
}



function getLiveIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("liveId");
}

function startAnalysis() {
  const liveId = getLiveIdFromURL();
  if (!liveId) return alert("ID da live não encontrado.");

  fetch(`http://localhost:8080/live/start/${liveId}`, {
    method: 'POST',
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(msg => {
          throw new Error(msg || "Erro ao iniciar análise");
        });
      }
      return response.text();
    })
    .then(msg => {
      alert(msg);
      setStatus("running");
      intervalId = setInterval(() => fetchComments(liveId), 5000);
    })
    .catch(err => {
      console.error(err);
      alert(err.message || "Erro ao iniciar análise");
      setStatus("error");
    });
}

function stopAnalysis() {
  clearInterval(intervalId);
  setStatus("stopped");

  fetch(`http://localhost:8080/live/stop`, {
    method: 'POST',
    credentials: 'include'
  })
    .then(() => {
      alert("Análise parada.");
    })
    .catch(() => {
      alert("Erro ao parar análise.");
    });
}

function refreshComments() {
  const liveId = getLiveId();
  if (!liveId) return alert("Insira o ID da live para atualizar os comentários.");
  fetchComments(liveId);
}

function getLiveId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("liveId");
}


function fetchComments() {
  const liveId = getLiveIdFromURL();
  if (!liveId) return;

  fetch(`http://localhost:8080/comments/${liveId}`, {
    credentials: "include"
  })
    .then(response => {
      if (!response.ok) throw new Error("Erro ao buscar comentários.");
      return response.json();
    })
    .then(comments => {
      renderCommentsTable(comments);
      buildSentimentChart(comments);
      buildTimelineChart(comments);
      buildInteractionChart(comments);
      showDashboard(0);
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao buscar comentários.");
    });
}



function renderCommentsTable(comments) {
  const tbody = document.querySelector(".comments-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  comments.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td class="col-horario">
          ${new Date(c.commentsDetailsData?.commentTimeStamp)
        .toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })}
        </td>
        <td class="col-autor">
          <a href="${c.authorDetailsData?.channelUrl}" target="_blank" class="author-link">
            <img src="${c.authorDetailsData?.userProfileImageUrl}" alt="foto de perfil" class="author-avatar">
            <span>${c.authorDetailsData?.userDisplayName || "?"}</span>
          </a>
        </td>
        <td class="col-comentario">${c.commentsDetailsData?.commentContent || ""}</td>
        <td class="col-class">${c.sentiment || "-"}</td>
        <td class="col-interacao">${c.interaction || "-"}</td>
      `;
    tbody.appendChild(tr);
  });

  const count = document.getElementById("commentCount");
  if (count) count.textContent = comments.length;
}


function buildSentimentChart(comments) {
  const counts = {};
  comments.forEach(c => {
    const sentiment = c.sentiment || "Indefinido";
    counts[sentiment] = (counts[sentiment] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const values = Object.values(counts);

  const ctx = document.getElementById('sentimentChart').getContext('2d');

  if (sentimentChart) {
    sentimentChart.data.labels = labels;
    sentimentChart.data.datasets[0].data = values;
    sentimentChart.update();
  } else {
    sentimentChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: ['#FFEB8A', '#F57C1F', '#F59A55']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }
}


function buildTimelineChart(comments) {
  const timeBuckets = {};
  comments.forEach(c => {
    const time = new Date(c.commentsDetailsData?.commentTimeStamp);
    const key = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    timeBuckets[key] = (timeBuckets[key] || 0) + 1;
  });

  const labels = Object.keys(timeBuckets).sort();
  const values = labels.map(k => timeBuckets[k]);

  const ctx = document.getElementById('timelineChart').getContext('2d');

  if (timelineChart) {
    timelineChart.data.labels = labels;
    timelineChart.data.datasets[0].data = values;
    timelineChart.update();
  } else {
    timelineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Comentários por horário',
          data: values,
          borderColor: 'white',
          pointBackgroundColor: 'white'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(250, 180, 0, 0.3)'
            },
            ticks: {
              color: 'white'
            }
          },
          y: {
            grid: {
              color: 'rgba(250, 180, 0, 0.3)'
            },
            ticks: {
              color: 'white'
            }
          }
        }
      }
    });
  }
}

function buildInteractionChart(comments) {
  const types = {};
  comments.forEach(c => {
    const interaction = c.interaction || "Outro";
    types[interaction] = (types[interaction] || 0) + 1;
  });

  const labels = Object.keys(types);
  const values = Object.values(types);

  const ctx = document.getElementById('interactionChart').getContext('2d');

  if (interactionChart) {
    interactionChart.data.labels = labels;
    interactionChart.data.datasets[0].data = values;
    interactionChart.update();
  } else {
    interactionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Tipo de Interação',
          data: values,
          backgroundColor: '#F57C1F'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });
  }
}


function showDashboard(index) {
  dashboards.forEach((id, i) => {
    const canvas = document.getElementById(id);
    if (canvas) canvas.style.display = i === index ? "block" : "none";
  });
}

function showNextDashboard() {
  dashboardIndex = (dashboardIndex + 1) % dashboards.length;
  showDashboard(dashboardIndex);
}

function showPrevDashboard() {
  dashboardIndex = (dashboardIndex - 1 + dashboards.length) % dashboards.length;
  showDashboard(dashboardIndex);
}


document.addEventListener("input", () => {
  const searchInput = document.getElementById("searchInput");
  const filter = searchInput.value.toLowerCase();
  const rows = document.querySelectorAll(".comments-table tbody tr");

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    const match = [...cells].some(cell => cell.textContent.toLowerCase().includes(filter));
    row.style.display = match ? "" : "none";
  });
});

