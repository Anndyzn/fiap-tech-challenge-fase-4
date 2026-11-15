import request from "supertest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import app from "../src/app";
import { pool } from "../src/database/db";
import { gerarHashSenha } from "../src/utils/senha";

const senhaTeste = "SenhaTeste123!";
const emailProfessor = "professor.teste@fiap.local";
const emailAluno = "aluno.teste@fiap.local";

let tokenProfessor = "";
let tokenAluno = "";

describe("API de postagens - Fase 4", () => {
  beforeAll(async () => {
    // Protege o banco principal contra exclusoes dos testes
    if (process.env.DB_NAME !== "blog_fiap_f4_test") {
      throw new Error("Os testes devem utilizar blog_fiap_f4_test.");
    }

    const conexao = await pool.query("SELECT current_database() AS nome");

    if (conexao.rows[0].nome !== "blog_fiap_f4_test") {
      throw new Error("Banco de testes incorreto.");
    }

    // Prepara as tabelas do banco de testes
    for (const arquivo of ["001_criar_usuarios.sql", "002_criar_posts.sql"]) {
      const sql = readFileSync(
        join(__dirname, "../src/database/migrations", arquivo),
        "utf8",
      );

      await pool.query(sql);
    }

    // Cria contas exclusivas para os testes
    const contas = [
      {
        nome: "Professor Teste",
        email: emailProfessor,
        perfil: "professor",
      },
      {
        nome: "Aluno Teste",
        email: emailAluno,
        perfil: "aluno",
      },
    ];

    for (const conta of contas) {
      const hash = await gerarHashSenha(senhaTeste);

      await pool.query(
        `INSERT INTO usuarios
           (nome, email, senha_hash, perfil)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email)
         DO UPDATE SET
           nome = EXCLUDED.nome,
           senha_hash = EXCLUDED.senha_hash,
           perfil = EXCLUDED.perfil`,
        [conta.nome, conta.email, hash, conta.perfil],
      );
    }

    // Login real do professor
    const loginProfessor = await request(app).post("/login").send({
      email: emailProfessor,
      senha: senhaTeste,
    });

    if (loginProfessor.status !== 200) {
      throw new Error("Falha no login do professor de teste.");
    }

    tokenProfessor = `Bearer ${loginProfessor.body.token}`;

    // Login real do aluno
    const loginAluno = await request(app).post("/login").send({
      email: emailAluno,
      senha: senhaTeste,
    });

    if (loginAluno.status !== 200) {
      throw new Error("Falha no login do aluno de teste.");
    }

    tokenAluno = `Bearer ${loginAluno.body.token}`;
  });

  beforeEach(async () => {
    // Limpa somente as postagens do banco de testes
    await pool.query("DELETE FROM posts");
  });

  afterAll(async () => {
    await pool.end();
  });

  it("retorna 401 sem token", async () => {
    const resposta = await request(app).post("/posts").send({
      titulo: "Teste",
      conteudo: "Conteudo",
      autor: "Professor",
    });

    expect(resposta.status).toBe(401);
  });

  it("retorna 401 com token invalido", async () => {
    const resposta = await request(app)
      .post("/posts")
      .set("Authorization", "Bearer invalido")
      .send({
        titulo: "Teste",
        conteudo: "Conteudo",
        autor: "Professor",
      });

    expect(resposta.status).toBe(401);
  });

  it("impede aluno de criar post", async () => {
    const resposta = await request(app)
      .post("/posts")
      .set("Authorization", tokenAluno)
      .send({
        titulo: "Post do aluno",
        conteudo: "Nao permitido",
        autor: "Aluno",
      });

    expect(resposta.status).toBe(403);
  });

  it("permite professor criar post", async () => {
    const resposta = await request(app)
      .post("/posts")
      .set("Authorization", tokenProfessor)
      .send({
        titulo: "Post de teste",
        conteudo: "Conteudo de teste",
        autor: "Professor",
      });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toHaveProperty("id");
    expect(resposta.body.titulo).toBe("Post de teste");
  });

  it("rejeita postagem incompleta", async () => {
    const resposta = await request(app)
      .post("/posts")
      .set("Authorization", tokenProfessor)
      .send({
        titulo: "Post incompleto",
      });

    expect(resposta.status).toBe(400);
  });

  it("lista as postagens", async () => {
    await pool.query(
      `INSERT INTO posts (titulo, conteudo, autor)
       VALUES ($1, $2, $3)`,
      ["Aula de React", "Conteudo React", "Professor"],
    );

    const resposta = await request(app).get("/posts");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(1);
    expect(resposta.body[0].titulo).toBe("Aula de React");
  });

  it("pesquisa postagens", async () => {
    await pool.query(
      `INSERT INTO posts (titulo, conteudo, autor)
       VALUES ($1, $2, $3)`,
      ["Aula de React", "Hooks", "Professor"],
    );

    const resposta = await request(app)
      .get("/posts/search")
      .query({ termo: "React" });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(1);
  });

  it("busca postagem pelo ID", async () => {
    const resultado = await pool.query(
      `INSERT INTO posts (titulo, conteudo, autor)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ["Post por ID", "Conteudo", "Professor"],
    );

    const id = resultado.rows[0].id;

    const resposta = await request(app).get(`/posts/${id}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.id).toBe(id);
  });

  it("retorna 404 para ID inexistente", async () => {
    const resposta = await request(app).get("/posts/999999999");

    expect(resposta.status).toBe(404);
  });

  it("permite professor editar post", async () => {
    const resultado = await pool.query(
      `INSERT INTO posts (titulo, conteudo, autor)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ["Original", "Conteudo", "Professor"],
    );

    const id = resultado.rows[0].id;

    const resposta = await request(app)
      .put(`/posts/${id}`)
      .set("Authorization", tokenProfessor)
      .send({
        titulo: "Atualizado",
        conteudo: "Novo conteudo",
        autor: "Professor",
      });

    expect(resposta.status).toBe(200);

    const consulta = await pool.query(
      "SELECT titulo FROM posts WHERE id = $1",
      [id],
    );

    expect(consulta.rows[0].titulo).toBe("Atualizado");
  });

  it("permite professor excluir post", async () => {
    const resultado = await pool.query(
      `INSERT INTO posts (titulo, conteudo, autor)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ["Para excluir", "Conteudo", "Professor"],
    );

    const id = resultado.rows[0].id;

    const resposta = await request(app)
      .delete(`/posts/${id}`)
      .set("Authorization", tokenProfessor);

    expect([200, 204]).toContain(resposta.status);

    const consulta = await pool.query("SELECT id FROM posts WHERE id = $1", [
      id,
    ]);

    expect(consulta.rows).toHaveLength(0);
  });
});
