import { Request, Response } from "express";
import { gerarHashSenha } from "../utils/senha";
import {
  atualizarUsuarioNoBanco,
  criarUsuarioNoBanco,
  excluirUsuarioNoBanco,
} from "../repositories/usuario.repository";
import {
  listarUsuariosPorPerfil,
  type Perfil,
} from "../repositories/usuario.repository";

async function cadastrarPorPerfil(req: Request, res: Response, perfil: Perfil) {
  const { nome, email, senha } = req.body ?? {};

  if (typeof nome !== "string" || !nome.trim()) {
    return res.status(400).json({
      mensagem: "Informe um nome válido.",
    });
  }

  if (typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({
      mensagem: "Informe um e-mail válido.",
    });
  }

  if (typeof senha !== "string" || senha.length < 8) {
    return res.status(400).json({
      mensagem: "A senha deve ter pelo menos 8 caracteres.",
    });
  }

  try {
    const senhaHash = await gerarHashSenha(senha);

    const usuario = await criarUsuarioNoBanco(
      nome.trim(),
      email.trim().toLowerCase(),
      senhaHash,
      perfil,
    );

    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso.",
      usuario,
    });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);

    if (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return res.status(409).json({
        mensagem: "E-mail já cadastrado.",
      });
    }

    return res.status(500).json({
      mensagem: "Erro interno ao cadastrar usuário.",
    });
  }
}

async function listarPorPerfil(req: Request, res: Response, perfil: Perfil) {
  const valor = req.query.pagina ?? "1";

  if (
    typeof valor !== "string" ||
    !/^[1-9]\d*$/.test(valor) ||
    !Number.isSafeInteger(Number(valor))
  ) {
    return res.status(400).json({
      mensagem: "Página inválida.",
    });
  }

  try {
    const pagina = Number(valor);

    const resultado = await listarUsuariosPorPerfil(perfil, pagina);

    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);

    return res.status(500).json({
      mensagem: "Erro ao consultar usuários.",
    });
  }
}

export function listarProfessores(req: Request, res: Response) {
  return listarPorPerfil(req, res, "professor");
}

export function listarAlunos(req: Request, res: Response) {
  return listarPorPerfil(req, res, "aluno");
}

function obterId(req: Request): number | null {
  const valor = req.params.id;

  if (typeof valor !== "string" || !/^[1-9]\d*$/.test(valor)) {
    return null;
  }

  const id = Number(valor);
  return Number.isSafeInteger(id) ? id : null;
}

async function editarPorPerfil(req: Request, res: Response, perfil: Perfil) {
  const id = obterId(req);
  const { nome, email } = req.body ?? {};

  if (id === null) {
    return res.status(400).json({
      mensagem: "ID inválido.",
    });
  }

  if (
    typeof nome !== "string" ||
    !nome.trim() ||
    nome.trim().length > 150 ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    email.trim().length > 255
  ) {
    return res.status(400).json({
      mensagem: "Nome ou e-mail inválidos.",
    });
  }

  try {
    const usuario = await atualizarUsuarioNoBanco(
      id,
      perfil,
      nome.trim(),
      email.trim().toLowerCase(),
    );

    if (!usuario) {
      return res.status(404).json({
        mensagem: "Usuário não encontrado.",
      });
    }

    return res.status(200).json(usuario);
  } catch (error) {
    if (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return res.status(409).json({
        mensagem: "E-mail já cadastrado.",
      });
    }

    console.error("Erro ao editar usuário:", error);

    return res.status(500).json({
      mensagem: "Erro interno ao editar usuário.",
    });
  }
}

async function excluirPorPerfil(req: Request, res: Response, perfil: Perfil) {
  const id = obterId(req);

  if (id === null) {
    return res.status(400).json({
      mensagem: "ID inválido.",
    });
  }

  if (perfil === "professor" && res.locals.usuario?.id === id) {
    return res.status(403).json({
      mensagem: "Não é permitido excluir sua própria conta.",
    });
  }

  try {
    if (perfil === "professor") {
      const { total } = await listarUsuariosPorPerfil("professor", 1);

      if (total <= 1) {
        return res.status(409).json({
          mensagem: "Não é permitido excluir o último professor.",
        });
      }
    }

    const usuario = await excluirUsuarioNoBanco(id, perfil);

    if (!usuario) {
      return res.status(404).json({
        mensagem: "Usuário não encontrado.",
      });
    }

    return res.status(200).json({
      mensagem: "Usuário excluído com sucesso.",
      usuario,
    });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);

    return res.status(500).json({
      mensagem: "Erro interno ao excluir usuário.",
    });
  }
}

export const editarAluno = (req: Request, res: Response) =>
  editarPorPerfil(req, res, "aluno");

export const editarProfessor = (req: Request, res: Response) =>
  editarPorPerfil(req, res, "professor");

export const excluirAluno = (req: Request, res: Response) =>
  excluirPorPerfil(req, res, "aluno");

export const excluirProfessor = (req: Request, res: Response) =>
  excluirPorPerfil(req, res, "professor");

export function cadastrarAluno(req: Request, res: Response) {
  return cadastrarPorPerfil(req, res, "aluno");
}

export function cadastrarProfessor(req: Request, res: Response) {
  return cadastrarPorPerfil(req, res, "professor");
}
