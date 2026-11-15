import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import api from "../services/api";

type Post = {
  id: number;
  titulo: string;
  conteudo: string;
  autor: string;
};

type Usuario = {
  nome: string;
  perfil: "professor" | "aluno";
};

export default function GerenciarPostsScreen() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [autorizado, setAutorizado] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [formulario, setFormulario] = useState(false);
  const [postEditando, setPostEditando] = useState<Post | null>(null);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");

  // Verifica a sessão antes de abrir o painel
  useEffect(() => {
    async function iniciar() {
      try {
        const token = await SecureStore.getItemAsync("token");
        const dados = await SecureStore.getItemAsync("usuario");

        if (!token || !dados) {
          router.replace("/login");
          return;
        }

        const pessoa = JSON.parse(dados) as Usuario;

        if (pessoa.perfil !== "professor") {
          router.replace("/");
          return;
        }

        setUsuario(pessoa);
        setAutorizado(true);
        await carregarPosts();
      } catch (error) {
        console.error("Erro na sessão:", error);
        router.replace("/login");
      }
    }

    void iniciar();
  }, []);

  // GET - Busca as postagens
  async function carregarPosts() {
    setCarregando(true);
    setErro("");

    try {
      const response = await api.get<Post[]>("/posts");
      setPosts(response.data);
    } catch (error) {
      console.error("Erro ao carregar posts:", error);
      setErro("Não foi possível carregar as postagens.");
    } finally {
      setCarregando(false);
    }
  }

  // Abre o formulário de cadastro
  function novoPost() {
    setPostEditando(null);
    setTitulo("");
    setConteudo("");
    setFormulario(true);
  }

  // Preenche o formulário para edição
  function editarPost(post: Post) {
    setPostEditando(post);
    setTitulo(post.titulo);
    setConteudo(post.conteudo);
    setFormulario(true);
  }

  function cancelar() {
    setFormulario(false);
    setPostEditando(null);
    setTitulo("");
    setConteudo("");
  }

  // Trata erros de autenticação e permissão
  async function tratarErro(error: unknown) {
    const status = axios.isAxiosError(error)
      ? error.response?.status
      : undefined;

    if (status === 401) {
      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("usuario");
      Alert.alert("Sessão expirada", "Faça login novamente.");
      router.replace("/login");
    } else if (status === 403) {
      Alert.alert("Acesso negado", "Somente professores podem alterar posts.");
    } else {
      Alert.alert("Erro", "Não foi possível concluir a operação.");
    }
  }

  // POST ou PUT
  async function salvarPost() {
    if (!titulo.trim() || !conteudo.trim()) {
      Alert.alert("Atenção", "Informe o título e o conteúdo.");
      return;
    }

    if (!usuario) return;

    setSalvando(true);

    try {
      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const dados = {
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        autor: postEditando ? postEditando.autor : usuario.nome,
      };

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (postEditando) {
        await api.put(`/posts/${postEditando.id}`, dados, config);
      } else {
        await api.post("/posts", dados, config);
      }

      cancelar();
      await carregarPosts();
      Alert.alert("Sucesso", "Postagem salva com sucesso.");
    } catch (error) {
      await tratarErro(error);
    } finally {
      setSalvando(false);
    }
  }

  // DELETE
  function confirmarExclusao(post: Post) {
    Alert.alert("Excluir postagem", `Deseja excluir "${post.titulo}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => void excluirPost(post.id),
      },
    ]);
  }

  async function excluirPost(id: number) {
    setSalvando(true);

    try {
      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      await api.delete(`/posts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (postEditando?.id === id) cancelar();

      await carregarPosts();
      Alert.alert("Sucesso", "Postagem excluída.");
    } catch (error) {
      await tratarErro(error);
    } finally {
      setSalvando(false);
    }
  }

  if (!autorizado) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Gerenciar postagens</Text>
      <Text style={styles.subtitulo}>
        Crie, edite e exclua publicações do blog.
      </Text>

      <Pressable style={styles.botaoAzul} onPress={novoPost}>
        <Text style={styles.textoBotao}>+ Nova postagem</Text>
      </Pressable>

      {formulario && (
        <View style={styles.card}>
          <Text style={styles.nome}>
            {postEditando ? "Editar postagem" : "Nova postagem"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Título"
            value={titulo}
            onChangeText={setTitulo}
          />

          <TextInput
            style={[styles.input, styles.campoConteudo]}
            placeholder="Conteúdo da postagem"
            value={conteudo}
            onChangeText={setConteudo}
            multiline
            textAlignVertical="top"
          />

          <Pressable
            style={styles.botaoAzul}
            onPress={salvarPost}
            disabled={salvando}
          >
            <Text style={styles.textoBotao}>
              {salvando ? "Salvando..." : "Salvar postagem"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.botaoCinza}
            onPress={cancelar}
            disabled={salvando}
          >
            <Text style={styles.textoBotao}>Cancelar</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.nome}>Postagens cadastradas</Text>

      {carregando ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : erro ? (
        <Text style={styles.erro}>{erro}</Text>
      ) : posts.length === 0 ? (
        <Text style={styles.subtitulo}>Nenhuma postagem cadastrada.</Text>
      ) : (
        posts.map((post) => (
          <View key={post.id} style={styles.card}>
            <Text style={styles.nome}>{post.titulo}</Text>
            <Text style={styles.autor}>Por {post.autor}</Text>

            <Text style={styles.resumo} numberOfLines={3}>
              {post.conteudo}
            </Text>

            <View style={styles.acoes}>
              <Pressable
                style={[styles.botaoCinza, styles.metade]}
                onPress={() => editarPost(post)}
                disabled={salvando}
              >
                <Text style={styles.textoBotao}>Editar</Text>
              </Pressable>

              <Pressable
                style={[styles.botaoVermelho, styles.metade]}
                onPress={() => confirmarExclusao(post)}
                disabled={salvando}
              >
                <Text style={styles.textoBotao}>Excluir</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
    backgroundColor: "#f5f6fa",
    flexGrow: 1,
    gap: 12,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  subtitulo: {
    color: "#64748b",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 16,
    gap: 10,
  },
  nome: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1e293b",
  },
  autor: {
    color: "#64748b",
    fontSize: 13,
  },
  resumo: {
    color: "#475569",
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
  },
  campoConteudo: {
    minHeight: 120,
  },
  botaoAzul: {
    backgroundColor: "#2563eb",
    padding: 13,
    borderRadius: 8,
    alignItems: "center",
  },
  botaoCinza: {
    backgroundColor: "#475569",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  botaoVermelho: {
    backgroundColor: "#dc2626",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  textoBotao: {
    color: "#fff",
    fontWeight: "bold",
  },
  acoes: {
    flexDirection: "row",
    gap: 10,
  },
  metade: {
    flex: 1,
  },
  erro: {
    color: "#dc2626",
  },
});
