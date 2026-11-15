CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    perfil VARCHAR(20) NOT NULL CHECK (
        perfil IN ('professor', 'aluno')
    ),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);