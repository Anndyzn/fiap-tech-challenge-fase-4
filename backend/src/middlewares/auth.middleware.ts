import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { buscarUsuarioPorId } from "../repositories/usuario.repository";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      mensagem: "Token não informado.",
    });
  }

  const segredo = process.env.JWT_SECRET;

  if (!segredo) {
    return res.status(500).json({
      mensagem: "Autenticação não configurada.",
    });
  }

  let dados: jwt.JwtPayload | string;

  // Verifica a assinatura e a validade do token
  try {
    const token = authorization.slice(7);
    dados = jwt.verify(token, segredo);
  } catch {
    return res.status(401).json({
      mensagem: "Token inválido ou expirado.",
    });
  }

  if (
    typeof dados === "string" ||
    typeof dados.id !== "number" ||
    (dados.perfil !== "professor" && dados.perfil !== "aluno")
  ) {
    return res.status(401).json({
      mensagem: "Token inválido.",
    });
  }

  try {
    // Verifica se o usuário continua no banco
    const usuario = await buscarUsuarioPorId(dados.id);

    if (!usuario || usuario.perfil !== dados.perfil) {
      return res.status(401).json({
        mensagem: "Sessão inválida. Faça login novamente.",
      });
    }

    res.locals.usuario = {
      id: usuario.id,
      perfil: usuario.perfil,
    };

    next();
  } catch (error) {
    console.error("Erro ao verificar usuário:", error);

    return res.status(500).json({
      mensagem: "Erro interno na autenticação.",
    });
  }
}

// Autoriza somente professores
export function somenteProfessor(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.locals.usuario?.perfil !== "professor") {
    return res.status(403).json({
      mensagem: "Acesso permitido somente a professores.",
    });
  }

  next();
}
