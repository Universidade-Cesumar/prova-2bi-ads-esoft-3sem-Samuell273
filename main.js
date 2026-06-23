const API_URL = "https://6a29e97ff59cb8f65f1dc47a.mockapi.io/materiais";

// Cache local dos materiais para filtro sem nova requisição
let materiaisCache = [];

// ── Validação (Sprint 2) ───────────────────────────────────────────────────

function validarRetirada(estoqueAtual, quantidadeRetirada) {
  if (quantidadeRetirada <= 0) return false;
  if (quantidadeRetirada > estoqueAtual) return false;
  return true;
}

// ── Dashboard ──────────────────────────────────────────────────────────────

function atualizarDashboard(materiais) {
  const total   = materiais.length;
  const critico = materiais.filter(m => Number(m.quantidade ?? m.quantity ?? 0) < 10).length;

  document.getElementById("total-itens").textContent  = total;
  document.getElementById("total-critico").textContent = critico;
}

// ── Render ─────────────────────────────────────────────────────────────────

function renderMateriais(materiais) {
  const tbody = document.getElementById("lista-materiais");
  tbody.innerHTML = "";

  if (!materiais || materiais.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Nenhum material encontrado.</td></tr>`;
    return;
  }

  materiais.forEach((m, i) => {
    const nome = m.nome ?? m.name ?? "—";
    const qty  = Number(m.quantidade ?? m.quantity ?? 0);
    const critico = qty < 10;

    const tr = document.createElement("tr");
    if (critico) tr.classList.add("estoque-critico");

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${nome}${critico ? ' <span class="badge-critico">CRÍTICO</span>' : ""}</td>
      <td><span class="qty-pill${critico ? " qty-pill--low" : ""}">${qty}</span></td>
      <td>
        <input
          type="number"
          id="input-retirada"
          class="input-retirada"
          placeholder="0"
          min="1"
          max="${qty}"
          data-id="${m.id}"
          data-qty="${qty}"
        />
      </td>
      <td class="actions-cell">
        <button class="btn-baixar" data-id="${m.id}" data-qty="${qty}">Baixar</button>
        <button class="btn-excluir" data-id="${m.id}">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Filtro por busca ───────────────────────────────────────────────────────

document.getElementById("input-busca").addEventListener("input", (e) => {
  const termo = e.target.value.trim().toLowerCase();
  const filtrados = termo
    ? materiaisCache.filter(m => (m.nome ?? m.name ?? "").toLowerCase().includes(termo))
    : materiaisCache;
  renderMateriais(filtrados);
});

// ── GET ────────────────────────────────────────────────────────────────────

async function carregarMateriais() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    materiaisCache = await res.json();
    renderMateriais(materiaisCache);
    atualizarDashboard(materiaisCache);
  } catch (err) {
    document.getElementById("lista-materiais").innerHTML =
      `<tr class="empty-row error"><td colspan="5">Erro ao carregar materiais. Verifique sua conexão.</td></tr>`;
    console.error("GET error:", err);
  }
}

// ── POST ───────────────────────────────────────────────────────────────────

document.getElementById("btn-cadastrar").addEventListener("click", async () => {
  const nome      = document.getElementById("input-nome").value.trim();
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
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    setFeedback("Material cadastrado com sucesso!", "success");
    document.getElementById("input-nome").value = "";
    document.getElementById("input-quantidade").value = "";
    document.getElementById("input-busca").value = "";
    await carregarMateriais();
  } catch (err) {
    setFeedback("Erro ao cadastrar. Verifique sua conexão.", "error");
    console.error("POST error:", err);
  }
});

// ── PUT + DELETE via delegação ─────────────────────────────────────────────

document.getElementById("lista-materiais").addEventListener("click", async (e) => {

  // PUT – baixar estoque
  if (e.target.classList.contains("btn-baixar")) {
    const btn              = e.target;
    const id               = btn.dataset.id;
    const estoqueAtual     = Number(btn.dataset.qty);
    const inputRetirada    = btn.closest("tr").querySelector(".input-retirada");
    const quantidadeRetirada = Number(inputRetirada.value);

    if (!validarRetirada(estoqueAtual, quantidadeRetirada)) {
      setFeedback(
        quantidadeRetirada <= 0
          ? "Informe uma quantidade maior que zero."
          : `Quantidade inválida. Estoque atual: ${estoqueAtual}.`,
        "error"
      );
      return;
    }

    const novaQtd = estoqueAtual - quantidadeRetirada;
    setFeedback("Atualizando estoque…", "info");

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantidade: novaQtd }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setFeedback(`Baixa realizada. Novo estoque: ${novaQtd}.`, "success");
      await carregarMateriais();
    } catch (err) {
      setFeedback("Erro ao realizar baixa. Verifique sua conexão.", "error");
      console.error("PUT error:", err);
    }
  }

  // DELETE – excluir item
  if (e.target.classList.contains("btn-excluir")) {
    const id = e.target.dataset.id;
    setFeedback("Excluindo…", "info");

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setFeedback("Material excluído.", "success");
      await carregarMateriais();
    } catch (err) {
      setFeedback("Erro ao excluir. Verifique sua conexão.", "error");
      console.error("DELETE error:", err);
    }
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────

function setFeedback(msg, type = "info") {
  const el = document.getElementById("feedback");
  el.textContent = msg;
  el.className = `feedback ${type}`;
}

// ── Init ───────────────────────────────────────────────────────────────────

carregarMateriais();