const API_URL = "https://6a29e97ff59cb8f65f1dc47a.mockapi.io/materiais";


function validarRetirada(estoqueAtual, quantidadeRetirada) {
    if (quantidadeRetirada <= 0) return false;
    if (quantidadeRetirada > estoqueAtual) return false;
    return true;
}

function setFeedback(msg, type = "info") {
    const el = document.getElementById("feedback");
    if (!el) return;

    el.textContent = msg;
    el.className = `feedback ${type}`;
}

function renderMateriais(materiais) {
    const tbody = document.getElementById("lista-materiais");
    tbody.innerHTML = "";

    if (!materiais || materiais.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5">Nenhum material cadastrado.</td>
            </tr>
        `;
        return;
    }

    materiais.forEach((m, i) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${m.nome ?? m.name ?? "-"}</td>
            <td>${m.quantidade ?? m.quantity ?? "-"}</td>
            <td>
                <input
                    type="number"
                    class="input-retirada"
                    min="1"
                    style="width: 60px;"
                    value="1"
                >
            </td>
            <td>
                <button
                    class="btn-baixar"
                    data-id="${m.id}"
                    data-qty="${m.quantidade ?? m.quantity ?? 0}"
                >
                    Retirar
                </button>

                <button
                    class="btn-excluir"
                    data-id="${m.id}"
                >
                    Excluir
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

async function carregarMateriais() {
    try {
        const res = await fetch(API_URL);

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        renderMateriais(data);

    } catch (err) {
        document.getElementById("lista-materiais").innerHTML = `
            <tr class="empty-row error">
                <td colspan="5">Erro ao carregar materiais.</td>
            </tr>
        `;

        console.error("GET error:", err);
    }
}

document.getElementById("btn-cadastrar").addEventListener("click", async () => {
    const nome = document.getElementById("input-nome").value.trim();
    const quantidade = document.getElementById("input-quantidade").value.trim();

    if (!nome || !quantidade) {
        setFeedback(
            "Preencha o nome e a quantidade antes de cadastrar.",
            "error"
        );
        return;
    }

    setFeedback("Cadastrando...", "info");

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome,
                quantidade: Number(quantidade)
            })
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        setFeedback("Material cadastrado com sucesso!", "success");

        document.getElementById("input-nome").value = "";
        document.getElementById("input-quantidade").value = "";

        await carregarMateriais();

    } catch (err) {
        setFeedback("Erro ao cadastrar material.", "error");
        console.error("POST error:", err);
    }
});

document.getElementById("lista-materiais").addEventListener("click", async (e) => {

    if (e.target.classList.contains("btn-baixar")) {

        const btn = e.target;
        const id = btn.dataset.id;
        const estoqueAtual = Number(btn.dataset.qty);

        const inputRetirada = btn
            .closest("tr")
            .querySelector(".input-retirada");

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

        setFeedback("Atualizando estoque...", "info");

        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    quantidade: novaQtd
                })
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            setFeedback(
                `Baixa realizada. Novo estoque: ${novaQtd}.`,
                "success"
            );

            await carregarMateriais();

        } catch (err) {
            setFeedback("Erro ao realizar baixa.", "error");
            console.error("PUT error:", err);
        }
    }

    if (e.target.classList.contains("btn-excluir")) {

        const id = e.target.dataset.id;

        setFeedback("Excluindo...", "info");

        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            setFeedback("Material excluído.", "success");

            await carregarMateriais();

        } catch (err) {
            setFeedback("Erro ao excluir material.", "error");
            console.error("DELETE error:", err);
        }
    }
});




carregarMateriais();