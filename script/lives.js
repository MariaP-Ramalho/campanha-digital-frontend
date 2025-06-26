let intervalId = null;
let checkStatusIntervalId = null;
let analysisRunning = false;
let sentimentChart = null;
let timelineChart = null;
let interactionChart = null;
let currentLayout = window.innerWidth <= 992 ? "mobile" : "desktop";
let resizeTimeout;

const dashboards = ["timelineChart", "sentimentChart", "interactionChart"];
let dashboardIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  const liveId = getLiveIdFromURL();
  if (!liveId) return alert("ID da live não encontrado.");

  document.getElementById("liveIdDisplay").textContent = `ID: ${liveId}`;

  document.getElementById("btnStart").addEventListener("click", startAnalysis);
  document.getElementById("btnStop").addEventListener("click", stopAnalysis);
  document.getElementById("btnRefresh").addEventListener("click", refreshComments);
  document.getElementById("btnNextDashboard").addEventListener("click", showNextDashboard);
  document.getElementById("btnPrevDashboard").addEventListener("click", showPrevDashboard);
  document.getElementById("searchInput").addEventListener("input", filterComments);

  fetchLiveInfo(liveId);
  checkLiveStatus();
  fetchComments();
});

window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const newLayout = window.innerWidth <= 991 ? "mobile" : "desktop";
    if (newLayout !== currentLayout) {
      currentLayout = newLayout;
      fetchComments();
    }
  }, 300);
})


function getLiveIdFromURL() {
  return new URLSearchParams(window.location.search).get("liveId");
}

async function fetchLiveInfo(liveId) {
  try {
    const res = await fetch("http://localhost:8080/lives", { credentials: "include" });
    const lives = await res.json();
    const live = lives.find(l => l.liveId === liveId);
    if (!live) return (document.getElementById("liveTitle").textContent = "Live não encontrada");

    const tag = (live.tag?.name || "Sem Tag").toUpperCase();
    document.getElementById("liveTitle").textContent = `[${tag}] ${live.title || "Sem Título"}`;
    document.getElementById("liveTag").textContent = tag;
  } catch (err) {
    console.error("Erro ao carregar live:", err);
    document.getElementById("liveTitle").textContent = "Erro ao carregar live";
  }
}

async function startAnalysis() {
  const liveId = getLiveIdFromURL();
  try {
    const res = await fetch(`http://localhost:8080/live/start/${liveId}`, {
      method: "POST",
      credentials: "include"
    });
    if (!res.ok) throw new Error(await res.text());

    alert(await res.text());
    intervalId = setInterval(() => fetchComments(liveId), 5000);
    checkStatusIntervalId = setInterval(() => checkLiveStatus(), 5000);
    analysisRunning = true;
  } catch (err) {
    alert(err.message || "Erro ao iniciar análise");
    stopTimers();
  }
}

function stopAnalysis() {
  fetch("http://localhost:8080/live/stop", {
    method: "POST",
    credentials: "include"
  })
    .then(() => {
      alert("Análise parada.");
      stopTimers();
    })
    .catch(() => alert("Erro ao parar análise."));
}

function stopTimers() {
  clearInterval(intervalId);
  clearInterval(checkStatusIntervalId);
  analysisRunning = false;
}

async function checkLiveStatus() {
  const liveId = getLiveIdFromURL();
  try {
    const res = await fetch("http://localhost:8080/lives", { credentials: "include" });
    const lives = await res.json();
    const live = lives.find(l => l.liveId === liveId);
    if (!live) return;

    const newStatus = capitalize(live.status);
    const statusText = document.getElementById("statusText");
    if (statusText.textContent !== newStatus) {
      statusText.textContent = newStatus;
      if (newStatus === "Finalizado" && analysisRunning) {
        alert("A live foi finalizada.");
        stopTimers();
      }
    }
  } catch (err) {
    console.error("Erro ao verificar status da live:", err);
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function fetchComments() {
  const liveId = getLiveIdFromURL();
  try {
    const res = await fetch(`http://localhost:8080/comments/${liveId}`, { credentials: "include" });
    if (!res.ok) throw new Error("Erro ao buscar comentários.");
    const comments = await res.json();
    renderCommentsTable(comments);
    buildSentimentChart(comments);
    buildTimelineChart(comments);
    buildInteractionChart(comments);
    showDashboard(0);
  } catch (err) {
    alert(err.message);
  }
}

function renderCommentsTable(comments) {
  const tbody = document.querySelector(".comments-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  comments.forEach(c => {
    const tr = document.createElement("tr");

    if (currentLayout === "mobile") {
      tr.innerHTML = `
    <td colspan="5">
      <div class="comment-card">
        <div class="comment-top">
          <div class="comment-author">
            <img src="${c.authorDetailsData?.userProfileImageUrl}" class="author-avatar">
            <span>${c.authorDetailsData?.userDisplayName || "?"}</span>
          </div>
          <span class="comment-time">${formatTime(c.commentsDetailsData?.commentTimeStamp)}</span>
        </div>

        <div class="comment-body">
          ${c.commentsDetailsData?.commentContent || ""}
        </div>

        <div class="comment-bottom">
          <span class="comment-interaction">${formatEnumLabel(c.sentiment) || "-"}</span>
          <span class="comment-sentiment">${formatEnumLabel(c.sentiment) || "-"}</span>
        </div>
      </div>
    </td>
  `;
      tr.classList.add("comment-row");
    } else {
      tr.innerHTML = `
    <td class="col-horario">${formatTime(c.commentsDetailsData?.commentTimeStamp)}</td>
    <td class="col-autor">
      <div class="comment-author">
        <img src="${c.authorDetailsData?.userProfileImageUrl}" class="author-avatar">
        <span>${c.authorDetailsData?.userDisplayName || "?"}</span>
      </div>
    </td>
    <td class="col-comentario">${c.commentsDetailsData?.commentContent || ""}</td>
    <td class="col-class">${formatEnumLabel(c.sentiment) || "-"}</td>
    <td class="col-interacao">${formatEnumLabel(c.interaction) || "-"}</td>
  `;
    }

    tbody.appendChild(tr);
  });
  document.getElementById("commentCount").textContent = comments.length;
}

function formatTime(timestamp) {
  if (!timestamp) return "--:--:--";
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}

function buildSentimentChart(comments) {
  const counts = {};
  comments.forEach(c => {
    const sentiment = c.sentiment || "Indefinido";
    counts[sentiment] = (counts[sentiment] || 0) + 1;
  });

  const ctx = document.getElementById("sentimentChart").getContext("2d");
  const data = {
    labels: Object.keys(counts).map(formatEnumLabel),
    datasets: [{
      data: Object.values(counts),
      backgroundColor: ["#FFEB8A", "#F57C1F", "#F59A55"],
      borderWidth: 0
    }]
  };

  if (sentimentChart) {
    sentimentChart.data = data;
    sentimentChart.update();
  } else {
    sentimentChart = new Chart(ctx, {
      type: "pie",
      data, options: {
        plugins: {
          legend: {
            position: "bottom"
          }
        }
      }
    });
  }
}

function buildTimelineChart(comments) {
  const buckets = {};
  const positives = {};
  const negatives = {};
  const neutrals = {};

  comments.forEach(c => {
    const time = new Date(c.commentsDetailsData?.commentTimeStamp);
    const key = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const sentiment = c.sentiment?.toLowerCase() || "neutro";

    buckets[key] = (buckets[key] || 0) + 1;

    if (sentiment === "positivo") {
      positives[key] = (positives[key] || 0) + 1;
    } else if (sentiment === "negativo") {
      negatives[key] = (negatives[key] || 0) + 1;
    } else {
      neutrals[key] = (neutrals[key] || 0) + 1;
    }
  });

  const labels = Array.from(new Set([
    ...Object.keys(buckets),
    ...Object.keys(positives),
    ...Object.keys(negatives),
    ...Object.keys(neutrals)
  ])).sort();

  const totalData = labels.map(k => buckets[k] || 0);
  const posData = labels.map(k => positives[k] || 0);
  const negData = labels.map(k => negatives[k] || 0);
  const neuData = labels.map(k => neutrals[k] || 0);

  const ctx = document.getElementById("timelineChart").getContext("2d");

  if (timelineChart) {
    timelineChart.data.labels = labels;
    timelineChart.data.datasets[0].data = totalData;
    timelineChart.data.datasets[1].data = posData;
    timelineChart.data.datasets[2].data = negData;
    timelineChart.data.datasets[3].data = neuData;
    timelineChart.update();
  } else {
    timelineChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Total",
            data: totalData,
            borderColor: "white",
            pointBackgroundColor: "white",
            tension: 0.3
          },
          {
            label: "Positivos",
            data: posData,
            borderColor: "#00C853",
            pointBackgroundColor: "#00C853",
            tension: 0.3
          },
          {
            label: "Negativos",
            data: negData,
            borderColor: "#D50000",
            pointBackgroundColor: "#D50000",
            tension: 0.3
          },
          {
            label: "Neutros",
            data: neuData,
            borderColor: "#FFAB00",
            pointBackgroundColor: "#FFAB00",
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom"
          }
        },
        scales: {
          x: {
            grid: { color: "rgba(250, 180, 0, 0.2)" },
            ticks: { color: "white" }
          },
          y: {
            grid: { color: "rgba(250, 180, 0, 0.2)" },
            ticks: { color: "white" }
          }
        }
      }
    });
  }
}


function buildInteractionChart(comments) {
  const types = {};
  comments.forEach(c => {
    const type = c.interaction || "Outro";
    types[type] = (types[type] || 0) + 1;
  });

  const ctx = document.getElementById("interactionChart").getContext("2d");
  const labels = Object.keys(types).map(formatEnumLabel);
  const values = Object.values(types);

  if (interactionChart) {
    interactionChart.data.labels = labels;
    interactionChart.data.datasets[0].data = values;
    interactionChart.update();
  } else {
    interactionChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Interações",
          data: values,
          backgroundColor: "#F57C1F"
        }]
      },
      options: {
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
}

function showDashboard(index) {
  dashboards.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.style.display = i === index ? "block" : "none";
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

function filterComments() {
  const filter = document.getElementById("searchInput").value.toLowerCase();
  const rows = document.querySelectorAll(".comments-table tbody tr");
  rows.forEach(row => {
    const visible = [...row.children].some(cell => cell.textContent.toLowerCase().includes(filter));
    row.style.display = visible ? "" : "none";
  });
}

function refreshComments() {
  fetchComments();
}

function formatEnumLabel(enumValue) {
  if (!enumValue) return "-";
  return enumValue
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

