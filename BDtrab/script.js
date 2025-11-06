/* === ARQUIVO: script.js (VERSÃO 3 - Com Tema LEX) === */

// Espera o HTML carregar antes de executar
document.addEventListener('DOMContentLoaded', () => {

    // === PARTE 1: CADASTRO ===
    
    const form = document.getElementById('form-cliente');
    const mensagemDiv = document.getElementById('mensagem');

    form.addEventListener('submit', (event) => {
        event.preventDefault(); 
        const data = {
            nome: document.getElementById('nome').value,
            sobrenome: document.getElementById('sobrenome').value,
            cpf: document.getElementById('cpf').value,
            email: document.getElementById('email').value
        };

        fetch('http://localhost:3000/cadastrar-cliente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(resposta => {
            if (resposta.sucesso) {
                mensagemDiv.textContent = resposta.sucesso;
                mensagemDiv.style.color = 'green';
                form.reset(); 
                carregarClientes(); 
            } else {
                mensagemDiv.textContent = `Erro: ${resposta.erro}`;
                // Cor do erro precisa se adaptar ao tema
                mensagemDiv.style.color = (document.body.dataset.theme === 'dark') ? '#ff8a80' : '#c0392b';
            }
        })
        .catch(error => {
            console.error('Erro de conexão:', error);
            mensagemDiv.textContent = 'Erro ao conectar com o servidor.';
            mensagemDiv.style.color = (document.body.dataset.theme === 'dark') ? '#ff8a80' : '#c0392b';
        });
    });

    
    // === PARTE 2: LISTAGEM E EXCLUSÃO ===
    
    const btnCarregar = document.getElementById('btn-carregar');
    const corpoTabela = document.getElementById('corpo-tabela');
    const totalClientesP = document.getElementById('total-clientes');

    function carregarClientes() {
        console.log("Buscando clientes...");
        
        fetch('http://localhost:3000/clientes')
            .then(response => response.json())
            .then(clientes => {
                console.log("Clientes recebidos:", clientes);
                corpoTabela.innerHTML = ''; 
                totalClientesP.textContent = `Total de clientes: ${clientes.length}`;

                if (clientes.length === 0) {
                    corpoTabela.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum cliente cadastrado.</td></tr>';
                    return;
                }

                clientes.forEach(cliente => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${cliente.idCliente}</td>
                        <td>${cliente.nomeCompleto}</td>
                        <td>${cliente.email}</td>
                        <td>${cliente.documento}</td>
                        <td>
                            <button class="danger btn-excluir" data-idpessoa="${cliente.idPessoa}">
                                Excluir
                            </button>
                        </td>
                    `;
                    corpoTabela.appendChild(tr);
                });
                adicionarListenersDeExclusao();
            })
            .catch(error => {
                console.error('Erro ao carregar clientes:', error);
                const errorColor = (document.body.dataset.theme === 'dark') ? '#ff8a80' : '#c0392b';
                corpoTabela.innerHTML = `<tr><td colspan="5" style="text-align: center; color: ${errorColor};">Erro ao carregar lista.</td></tr>`;
            });
    }

    function adicionarListenersDeExclusao() {
        const botoesExcluir = document.querySelectorAll('.btn-excluir');
        botoesExcluir.forEach(botao => {
            botao.addEventListener('click', () => {
                const idPessoa = botao.dataset.idpessoa; 
                if (confirm(`Tem certeza que quer excluir o cliente (Pessoa ID ${idPessoa})?`)) {
                    excluirCliente(idPessoa);
                }
            });
        });
    }

    function excluirCliente(idPessoa) {
        console.log(`Enviando requisição DELETE para /clientes/${idPessoa}`);
        
        fetch(`http://localhost:3000/clientes/${idPessoa}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(resposta => {
            if (resposta.sucesso) {
                alert(resposta.sucesso); 
                carregarClientes();     
            } else {
                alert(`Erro: ${resposta.erro}`);
            }
        })
        .catch(error => {
            console.error('Erro ao excluir:', error);
            alert('Erro de conexão ao tentar excluir.');
        });
    }

    btnCarregar.addEventListener('click', carregarClientes);
    carregarClientes(); // Carrega a lista inicial

    // === PARTE 3: LÓGICA DO TEMA (NOVO) ===
    
    const themeToggle = document.getElementById('theme-toggle');

    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            // Se o toggle estiver "checado", usamos o tema claro (light)
            document.body.dataset.theme = 'light';
        } else {
            // Se não, usamos o tema escuro (dark)
            document.body.dataset.theme = 'dark';
        }
    });

});