import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import api from "../services/api";

type Perfil = "aluno" | "professor";

type Usuario = {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
};

type RespostaLista = {
  usuarios: Usuario[];
  pagina: number;
  total: number;
  totalPaginas: number;
};

export default function AdminScreen() {
  const [perfil, setPerfil] = useState<Perfil>("aluno");
  const [pagina, setPagina] = useState(1);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [totalPaginas, setTotalPaginas] = useState(0);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [atualizacao, setAtualizacao] = useState(0);

  // Estados do formulário
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const caminho = perfil === "aluno" ? "alunos" : "professores";

  // Consulta os usuários no backend
  useEffect(() => {
    let ativo = true;

    async function carregarUsuarios() {
      setCarregando(true);
      setErro("");

      try {
        const token = await SecureStore.getItemAsync("token");

        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await api.get<RespostaLista>(`/usuarios/${caminho}`, {
          params: { pagina },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (ativo) {
          setUsuarios(response.data.usuarios);
          setTotalPaginas(response.data.totalPaginas);
        }
      } catch (error) {
        if (!ativo) return;

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          await SecureStore.deleteItemAsync("token");
          await SecureStore.deleteItemAsync("usuario");
          router.replace("/login");
        } else if (
          axios.isAxiosError(error) &&
          error.response?.status === 403
        ) {
          setErro("Você não possui permissão para acessar esta área.");
        } else {
          setErro("Não foi possível carregar os usuários.");
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarUsuarios();

    return () => {
      ativo = false;
    };
  }, [perfil, pagina, atualizacao]);

  function atualizarLista() {
    setAtualizacao((valor) => valor + 1);
  }

  function trocarPerfil(novoPerfil: Perfil) {
    setPerfil(novoPerfil);
    setPagina(1);
    setFormularioAberto(false);
  }

  // Abre formulário vazio para cadastro
  function novoUsuario() {
    setEditandoId(null);
    setNome("");
    setEmail("");
    setSenha("");
    setFormularioAberto(true);
  }

  // Preenche formulário para edição
  function editarUsuario(usuario: Usuario) {
    setEditandoId(usuario.id);
    setNome(usuario.nome);
    setEmail(usuario.email);
    setSenha("");
    setFormularioAberto(true);
  }

  function cancelarFormulario() {
    setFormularioAberto(false);
    setEditandoId(null);
  }

  // Cadastra ou atualiza um usuário
  async function salvarUsuario() {
    if (!nome.trim() || !email.trim()) {
      Alert.alert("Atenção", "Preencha nome e e-mail.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Atenção", "Informe um e-mail válido.");
      return;
    }

    if (editandoId === null && senha.length < 8) {
      Alert.alert("Atenção", "A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setSalvando(true);

    try {
      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (editandoId === null) {
        // POST - Cadastro
        await api.post(
          `/usuarios/${caminho}`,
          {
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            senha,
          },
          config,
        );
      } else {
        // PUT - Edição
        await api.put(
          `/usuarios/${caminho}/${editandoId}`,
          {
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
          },
          config,
        );
      }

      Alert.alert("Sucesso", "Usuário salvo com sucesso.");

      cancelarFormulario();
      atualizarLista();
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;

      if (status === 409) {
        Alert.alert("Erro", "E-mail já cadastrado ou operação não permitida.");
      } else if (status === 401) {
        Alert.alert("Erro", "Sessão expirada. Faça login novamente.");
        await SecureStore.deleteItemAsync("token");
        await SecureStore.deleteItemAsync("usuario");
        router.replace("/login");
      } else if (status === 403) {
        Alert.alert("Erro", "Você não tem permissão.");
      } else {
        Alert.alert("Erro", "Não foi possível salvar o usuário.");
      }
    } finally {
      setSalvando(false);
    }
  }

  // Solicita confirmação antes da exclusão
  function confirmarExclusao(usuario: Usuario) {
    Alert.alert("Excluir usuário", `Deseja excluir ${usuario.nome}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => excluirUsuario(usuario.id),
      },
    ]);
  }

  // DELETE - Exclusão
  async function excluirUsuario(id: number) {
    try {
      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      await api.delete(`/usuarios/${caminho}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert("Sucesso", "Usuário excluído.");

      if (usuarios.length === 1 && pagina > 1) {
        setPagina(pagina - 1);
      } else {
        atualizarLista();
      }
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;

      if (status === 401) {
        Alert.alert("Erro", "Sessão expirada. Faça login novamente.");
        await SecureStore.deleteItemAsync("token");
        await SecureStore.deleteItemAsync("usuario");
        router.replace("/login");
      } else if (status === 403 || status === 409) {
        Alert.alert(
          "Ação não permitida",
          "Este usuário não pode ser excluído.",
        );
      } else {
        Alert.alert("Erro", "Não foi possível excluir o usuário.");
      }
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
    >
      <Text style={styles.titulo}>Painel administrativo</Text>

      <Text style={styles.subtitulo}>
        Gerenciamento de professores e alunos
      </Text>

      {/* Seleção de perfil */}
      <View style={styles.abas}>
        <Pressable
          style={[styles.aba, perfil === "aluno" && styles.abaAtiva]}
          onPress={() => trocarPerfil("aluno")}
        >
          <Text style={styles.textoBotao}>Alunos</Text>
        </Pressable>

        <Pressable
          style={[styles.aba, perfil === "professor" && styles.abaAtiva]}
          onPress={() => trocarPerfil("professor")}
        >
          <Text style={styles.textoBotao}>Professores</Text>
        </Pressable>
      </View>

      <Pressable style={styles.botaoPrincipal} onPress={novoUsuario}>
        <Text style={styles.textoBotao}>+ Cadastrar {perfil}</Text>
      </Pressable>

      {/* Formulário de cadastro/edição */}
      {formularioAberto && (
        <View style={styles.formulario}>
          <Text style={styles.nome}>
            {editandoId === null ? "Novo usuário" : "Editar usuário"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Nome"
            value={nome}
            onChangeText={setNome}
          />

          <TextInput
            style={styles.input}
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {editandoId === null && (
            <TextInput
              style={styles.input}
              placeholder="Senha (mínimo 8 caracteres)"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />
          )}

          <Pressable
            style={styles.botaoPrincipal}
            onPress={salvarUsuario}
            disabled={salvando}
          >
            <Text style={styles.textoBotao}>
              {salvando ? "Salvando..." : "Salvar"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.botaoSecundario}
            onPress={cancelarFormulario}
            disabled={salvando}
          >
            <Text style={styles.textoBotao}>Cancelar</Text>
          </Pressable>
        </View>
      )}

      {/* Lista de usuários */}
      {carregando ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : erro ? (
        <Text style={styles.erro}>{erro}</Text>
      ) : usuarios.length === 0 ? (
        <Text style={styles.vazio}>Nenhum usuário encontrado.</Text>
      ) : (
        usuarios.map((usuario) => (
          <View key={usuario.id} style={styles.card}>
            <Text style={styles.nome}>{usuario.nome}</Text>
            <Text style={styles.email}>{usuario.email}</Text>
            <Text style={styles.email}>Perfil: {usuario.perfil}</Text>

            <View style={styles.acoes}>
              <Pressable
                style={styles.botaoEditar}
                onPress={() => editarUsuario(usuario)}
              >
                <Text style={styles.textoBotao}>Editar</Text>
              </Pressable>

              <Pressable
                style={styles.botaoExcluir}
                onPress={() => confirmarExclusao(usuario)}
              >
                <Text style={styles.textoBotao}>Excluir</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      {/* Paginação */}
      <View style={styles.paginacao}>
        <Pressable
          disabled={carregando || pagina <= 1}
          onPress={() => setPagina((p) => p - 1)}
        >
          <Text style={styles.link}>Anterior</Text>
        </Pressable>

        <Text>
          Página {pagina} de {Math.max(totalPaginas, 1)}
        </Text>

        <Pressable
          disabled={carregando || pagina >= totalPaginas}
          onPress={() => setPagina((p) => p + 1)}
        >
          <Text style={styles.link}>Próxima</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  conteudo: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  subtitulo: {
    color: "#64748b",
    marginTop: 5,
    marginBottom: 20,
  },
  abas: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  aba: {
    flex: 1,
    padding: 13,
    borderRadius: 8,
    backgroundColor: "#64748b",
    alignItems: "center",
  },
  abaAtiva: {
    backgroundColor: "#2563eb",
  },
  botaoPrincipal: {
    backgroundColor: "#2563eb",
    padding: 13,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  botaoSecundario: {
    backgroundColor: "#64748b",
    padding: 13,
    borderRadius: 8,
    alignItems: "center",
  },
  textoBotao: {
    color: "#fff",
    fontWeight: "bold",
  },
  formulario: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  nome: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1e293b",
  },
  email: {
    color: "#64748b",
    marginTop: 4,
  },
  acoes: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  botaoEditar: {
    flex: 1,
    backgroundColor: "#475569",
    padding: 11,
    borderRadius: 8,
    alignItems: "center",
  },
  botaoExcluir: {
    flex: 1,
    backgroundColor: "#dc2626",
    padding: 11,
    borderRadius: 8,
    alignItems: "center",
  },
  paginacao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  link: {
    color: "#2563eb",
    fontWeight: "bold",
  },
  erro: {
    color: "#dc2626",
    textAlign: "center",
    marginTop: 20,
  },
  vazio: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 30,
  },
});
