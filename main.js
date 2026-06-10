// Arquivo para código javascript

const API_URL = "https://6a29e97ff59cb8f65f1dc47a.mockapi.io/:endpoint"


function setFeedback(msg, type = "info") {
  const el = document.getElementById("feedback");
  el.textContent = msg;
  el.className = `feedback ${type}`;
}

function renderMateriais(materiais) {
  const tbody = document.getElementById("lista-materiais");
  tbody.innerHTML = "";

  if (!materiais || materiais.length === 0) {
    tbody.innerHTML = <tr class="empty-row"><td colspan="3">Nenhum material cadastrado.</td></tr>;
    return;
  }

  materiais.forEach((m, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${m.nome ?? m.name ?? "—"}</td>
      <td>${m.quantidade ?? m.quantity ?? "—"}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function carregarMateriais() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(HTTP ${res.status});
    const data = await res.json();
    renderMateriais(data);
  } catch (err) {
    document.getElementById("lista-materiais").innerHTML =
      <tr class="empty-row error"><td colspan="3">Erro ao carregar materiais.</td></tr>;
    console.error("GET error:", err);
  }
}


document.getElementById("btn-cadastrar").addEventListener("click", async () => {
  const nome = document.getElementById("input-nome").value.trim();
  const quantidade = document.getElementById("input-quantidade").value.trim();

  if (!nome || !quantidade) {
    setFeedback("Preencha o nome e a quantidade antes de cadastrar.", "error");
    return;
  }

  setFeedback("Cadastrando…", "info");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, quantidade: Number(quantidade) }),
    });

    if (!res.ok) throw new Error(HTTP ${res.status});

    setFeedback("Material cadastrado com sucesso!", "success");
    document.getElementById("input-nome").value = "";
    document.getElementById("input-quantidade").value = "";

    await carregarMateriais();
  } catch (err) {
    setFeedback("Erro ao cadastrar material.", "error");
    console.error("POST error:", err);
  }
});


carregarMateriais();