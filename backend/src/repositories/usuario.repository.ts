import { pool } from "../database/db";

export type Perfil = "professor" | "aluno";

export async function criarUsuarioNoBanco(
  nome: string,
  email: string,
  senhaHash: string,
  perfil: Perfil,
) {
  const resultado = await pool.query(
    `
      INSERT INTO usuarios (nome, email, senha_hash, perfil)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nome, email, perfil
    `,
    [nome, email, senhaHash, perfil],
  );

  return resultado.rows[0];
}

type UsuarioLogin = {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  perfil: Perfil;
};

export async function buscarUsuarioPorEmail(email: string) {
  const resultado = await pool.query<UsuarioLogin>(
    `
      SELECT id, nome, email, senha_hash, perfil
      FROM usuarios
      WHERE email = $1
    `,
    [email],
  );

  return resultado.rows[0] ?? null;
}

export async function listarUsuariosPorPerfil(perfil: Perfil, pagina: number) {
  const limite = 10;
  const offset = (pagina - 1) * limite;

  const resultado = await pool.query(
    `SELECT id, nome, email, perfil,
            criado_em AS "criadoEm"
     FROM usuarios
     WHERE perfil = $1
     ORDER BY id ASC
     LIMIT $2 OFFSET $3`,
    [perfil, limite, offset],
  );

  const contagem = await pool.query<{ total: string }>(
    "SELECT COUNT(*) AS total FROM usuarios WHERE perfil = $1",
    [perfil],
  );

  const total = Number(contagem.rows[0].total);

  return {
    usuarios: resultado.rows,
    pagina,
    total,
    totalPaginas: Math.ceil(total / limite),
  };
}

export async function atualizarUsuarioNoBanco(
  id: number,
  perfil: Perfil,
  nome: string,
  email: string,
) {
  const resultado = await pool.query(
    `UPDATE usuarios
     SET nome = $1, email = $2
     WHERE id = $3 AND perfil = $4
     RETURNING id, nome, email, perfil`,
    [nome, email, id, perfil],
  );

  return resultado.rows[0] ?? null;
}

export async function excluirUsuarioNoBanco(id: number, perfil: Perfil) {
  const resultado = await pool.query(
    `DELETE FROM usuarios
     WHERE id = $1 AND perfil = $2
     RETURNING id, nome, email, perfil`,
    [id, perfil],
  );

  return resultado.rows[0] ?? null;
}

export async function buscarUsuarioPorId(id: number) {
  const resultado = await pool.query<{
    id: number;
    perfil: Perfil;
  }>(
    `SELECT id, perfil
     FROM usuarios
     WHERE id = $1`,
    [id],
  );

  return resultado.rows[0] ?? null;
}
