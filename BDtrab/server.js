/* === ARQUIVO: server.js (VERSÃO 2) === */

// 1. Importar as "ferramentas"
const express = require('express');
const sqlite3 = require('sqlite3');
const cors = require('cors');
const app = express();
const port = 3000;

// 2. Configurar o servidor
app.use(express.json());
app.use(cors());

// 3. Conectar ao banco de dados
const db = new sqlite3.Database('./lex.db', (err) => {
    if (err) {
        console.error("Erro ao abrir o banco de dados", err.message);
    } else {
        console.log("Conectado ao banco de dados 'lex.db'.");
    }
});

/* ===================================================================
   ENDPOINT (NOVO): BUSCAR TODOS OS CLIENTES (GET)
=================================================================== */
app.get('/clientes', (req, res) => {
    console.log("Recebi uma requisição GET para /clientes");

    // Usamos o super-SELECT que fizemos no DB Browser!
    // Usamos COALESCE para juntar nome de PF e PJ em uma só coluna
    const sql = `
        SELECT 
            Cliente.idCliente,
            Pessoa.idPessoa,
            Pessoa.email,
            COALESCE(Fisica.nome || ' ' || Fisica.sobrenome, Juridica.razaoSocial) AS nomeCompleto,
            COALESCE(Fisica.cpf, Juridica.cnpj) AS documento
        FROM 
            Cliente
        JOIN Pessoa ON Cliente.idPessoa = Pessoa.idPessoa
        LEFT JOIN Fisica ON Pessoa.idPessoa = Fisica.idPessoa
        LEFT JOIN Juridica ON Pessoa.idPessoa = Juridica.idPessoa
        ORDER BY nomeCompleto;
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send({ erro: 'Erro ao consultar clientes' });
        }
        // Se tudo deu certo, envia a lista de clientes (em JSON)
        res.status(200).json(rows);
    });
});


/* ===================================================================
   ENDPOINT (EXISTENTE): CADASTRAR UM CLIENTE (POST)
=================================================================== */
app.post('/cadastrar-cliente', (req, res) => {
    console.log("Recebi uma requisição POST para /cadastrar-cliente");
    
    const { nome, sobrenome, cpf, email } = req.body;
    if (!nome || !cpf || !email) {
        return res.status(400).send({ erro: 'Nome, CPF e Email são obrigatórios.' });
    }

    db.serialize(() => {
        const sqlPessoa = `INSERT INTO Pessoa (email) VALUES (?)`;
        
        db.run(sqlPessoa, [email], function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).send({ erro: 'Erro ao cadastrar Pessoa (email duplicado?)' });
            }

            const idPessoa = this.lastID;
            console.log(`Pessoa criada com ID: ${idPessoa}`);

            const sqlFisica = `INSERT INTO Fisica (idPessoa, cpf, nome, sobrenome) VALUES (?, ?, ?, ?)`;
            db.run(sqlFisica, [idPessoa, cpf, nome, sobrenome], (err) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).send({ erro: 'Erro ao cadastrar Fisica (CPF duplicado?)' });
                }
                console.log(`Fisica ligada ao ID: ${idPessoa}`);

                const sqlCliente = `INSERT INTO Cliente (idPessoa) VALUES (?)`;
                db.run(sqlCliente, [idPessoa], (err) => {
                    if (err) {
                        console.error(err.message);
                        return res.status(500).send({ erro: 'Erro ao cadastrar Cliente' });
                    }
                    console.log(`Cliente criado com ID: ${idPessoa}`);
                    res.status(201).send({ sucesso: `Cliente ${nome} cadastrado com ID ${idPessoa}!` });
                });
            });
        });
    });
});

/* ===================================================================
   ENDPOINT (NOVO): EXCLUIR UM CLIENTE (DELETE)
=================================================================== */
app.delete('/clientes/:idPessoa', (req, res) => {
    // Pegamos o ID da URL (ex: /clientes/3)
    const { idPessoa } = req.params;
    console.log(`Recebi uma requisição DELETE para /clientes/${idPessoa}`);

    // Graças ao "ON DELETE CASCADE" que fizemos no SQLite,
    // só precisamos deletar da tabela "Pessoa".
    const sql = `DELETE FROM Pessoa WHERE idPessoa = ?`;

    db.run(sql, [idPessoa], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send({ erro: 'Erro ao excluir cliente' });
        }
        
        // this.changes > 0 significa que uma linha foi realmente deletada
        if (this.changes > 0) {
            res.status(200).send({ sucesso: `Cliente (Pessoa ID ${idPessoa}) foi excluído.` });
        } else {
            res.status(404).send({ erro: 'Cliente não encontrado.' });
        }
    });
});


// 4. Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor (v2) rodando em http://localhost:${port}`);
});