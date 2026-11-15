
import { readFileSync } from "node:fs";
import { pool } from "../database/db";
import { gerarHashSenha } from "../utils/senha";
import {
  buscarUsuarioPorEmail,
  criarUsuarioNoBanco,
} from "../repositories/usuario.repository";

async function criarAdmin() {
  try {
    const nome = "Professor Administrador";
    const email = "admin@fiap.local";

    // Recebe a senha pela entrada do terminal
    const senha = readFileSync(0, "utf8").trimEnd();

    if (senha.length < 12) {
      throw new Error("A senha precisa ter 12 caracteres.");
    }

    const existente = await buscarUsuarioPorEmail(email);

    if (existente) {
      console.log("Administrador já cadastrado.");
      return;
    }

    const senhaHash = await gerarHashSenha(senha);

    const usuario = await criarUsuarioNoBanco(
      nome,
      email,
      senhaHash,
      "professor"
    );

    console.log("Administrador criado:", usuario.email);
  } catch (error) {
    console.error("Erro ao criar administrador:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void criarAdmin();
