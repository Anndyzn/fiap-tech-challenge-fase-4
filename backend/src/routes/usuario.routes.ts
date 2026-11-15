import { Router } from "express";

import {
  cadastrarAluno,
  cadastrarProfessor,
  listarAlunos,
  listarProfessores,
  editarAluno,
  editarProfessor,
  excluirAluno,
  excluirProfessor,
} from "../controllers/usuario.controller";

import {
  authMiddleware,
  somenteProfessor,
} from "../middlewares/auth.middleware";

const usuarioRoutes = Router();

usuarioRoutes.post("/alunos", authMiddleware, somenteProfessor, cadastrarAluno);
usuarioRoutes.post(
  "/professores",
  authMiddleware,
  somenteProfessor,
  cadastrarProfessor,
);

usuarioRoutes.get(
  "/professores",
  authMiddleware,
  somenteProfessor,
  listarProfessores,
);

usuarioRoutes.get("/alunos", authMiddleware, somenteProfessor, listarAlunos);

usuarioRoutes.put("/alunos/:id", authMiddleware, somenteProfessor, editarAluno);

usuarioRoutes.delete(
  "/alunos/:id",
  authMiddleware,
  somenteProfessor,
  excluirAluno,
);

usuarioRoutes.put(
  "/professores/:id",
  authMiddleware,
  somenteProfessor,
  editarProfessor,
);

usuarioRoutes.delete(
  "/professores/:id",
  authMiddleware,
  somenteProfessor,
  excluirProfessor,
);

export default usuarioRoutes;
