
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { buscarUsuarioPorEmail } from "../repositories/usuario.repository";
import { verificarSenha } from "../utils/senha";

export async function login(req: Request, res: Response) {
  const { email, senha } = req.body ?? {};

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof senha !== "string" ||
    !senha
  ) {
    return res.status(400).json({
      mensagem: "E-mail e senha são obrigatórios.",
    });
  }

  try {
    const usuario = await buscarUsuarioPorEmail(
      email.trim().toLowerCase()
    );

    if (!usuario) {
      return res.status(401).json({
        mensagem: "E-mail ou senha inválidos.",
      });
    }

    const senhaCorreta = await verificarSenha(
      senha,
      usuario.senha_hash
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        mensagem: "E-mail ou senha inválidos.",
      });
    }

    const segredo = process.env.JWT_SECRET;

    if (!segredo) {
      return res.status(500).json({
        mensagem: "Autenticação não configurada.",
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        perfil: usuario.perfil,
      },
      segredo,
      { expiresIn: "2h" }
    );

    return res.status(200).json({
      mensagem: "Login realizado com sucesso.",
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);

    return res.status(500).json({
      mensagem: "Erro interno ao realizar login.",
    });
  }
}
