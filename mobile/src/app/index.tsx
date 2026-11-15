import { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { router, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import api from "../services/api";

type Post = {
  id: number;
  titulo: string;
  conteudo: string;
  autor?: string;
};

type Usuario = {
  id: number;
  nome: string;
  perfil: "professor" | "aluno";
};

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  // Guarda o usuário logado
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useFocusEffect(
    useCallback(() => {
      void carregarPosts();
    }, []),
  );

  // Verifica a sessão sempre que a Home recebe foco
  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregarSessao() {
        try {
          const token = await SecureStore.getItemAsync("token");
          const dados = await SecureStore.getItemAsync("usuario");

          if (!ativo) return;

          if (token && dados) {
            const usuarioSalvo = JSON.parse(dados) as Usuario;
            setUsuario(usuarioSalvo);
          } else {
            setUsuario(null);
          }
        } catch (error) {
          console.error("Erro ao carregar sessão:", error);
          if (ativo) setUsuario(null);
        }
      }

      carregarSessao();

      return () => {
        ativo = false;
      };
    }, []),
  );

  // Busca postagens na API
  async function carregarPosts(termo: string = "") {
    setCarregando(true);
    setErro("");

    try {
      const response = termo.trim()
        ? await api.get<Post[]>("/posts/search", {
            params: { termo: termo.trim() },
          })
        : await api.get<Post[]>("/posts");

      setPosts(response.data);
    } catch (error) {
      console.error("Erro ao carregar posts:", error);
      setErro("Não foi possível carregar as postagens.");
    } finally {
      setCarregando(false);
    }
  }

  // Pesquisa postagens
  function pesquisarPosts() {
    carregarPosts(busca);
  }

  // Abre os detalhes de uma postagem
  function abrirPost(id: number) {
    router.push({
      pathname: "/posts/[id]",
      params: { id: String(id) },
    });
  }

  // Encerra a sessão
  async function sair() {
    try {
      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("usuario");
      setUsuario(null);
    } catch (error) {
      console.error("Erro ao sair da conta:", error);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Blog FIAP</Text>

      <Text style={styles.subtitulo}>Confira as últimas postagens</Text>

      {/* Pesquisa de postagens */}
      <TextInput
        style={styles.input}
        placeholder="Pesquisar postagens..."
        value={busca}
        onChangeText={setBusca}
        onSubmitEditing={pesquisarPosts}
        returnKeyType="search"
      />

      <Pressable style={styles.botaoPesquisa} onPress={pesquisarPosts}>
        <Text style={styles.textoBotao}>Pesquisar</Text>
      </Pressable>

      {/* Área de autenticação */}
      {usuario ? (
        <View style={styles.areaUsuario}>
          <Text style={styles.boasVindas}>Olá, {usuario.nome}!</Text>

          <Text style={styles.perfil}>Perfil: {usuario.perfil}</Text>

          {/* Botões exclusivos do professor */}
          {usuario.perfil === "professor" && (
            <View style={{ gap: 8, marginTop: 12 }}>
              <Pressable
                onPress={() => router.push("/admin")}
                style={styles.botaoLogin}
              >
                <Text style={styles.textoBotao}>Gerenciar usuários</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/gerenciar-posts")}
                style={styles.botaoLogin}
              >
                <Text style={styles.textoBotao}>Gerenciar postagens</Text>
              </Pressable>
            </View>
          )}

          {/* Botão para sair */}
          <Pressable style={styles.botaoSair} onPress={sair}>
            <Text style={styles.textoBotao}>Sair da conta</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={styles.botaoLogin}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.textoBotao}>Fazer login</Text>
        </Pressable>
      )}

      {/* Listagem de postagens */}
      <Text style={styles.tituloLista}>Postagens</Text>

      {carregando && <ActivityIndicator size="large" color="#2563eb" />}

      {erro !== "" && <Text style={styles.erro}>{erro}</Text>}

      {!carregando && erro === "" && (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhuma postagem encontrada.</Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => abrirPost(item.id)}>
              <Text style={styles.tituloPost}>{item.titulo}</Text>

              <Text style={styles.conteudoPost} numberOfLines={3}>
                {item.conteudo}
              </Text>

              <Text style={styles.verMais}>Ler postagem</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
    padding: 20,
    paddingTop: 45,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
  },
  subtitulo: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 5,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  botaoPesquisa: {
    backgroundColor: "#475569",
    padding: 13,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  botaoLogin: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  botaoSair: {
    backgroundColor: "#dc2626",
    padding: 13,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  textoBotao: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  areaUsuario: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  boasVindas: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  perfil: {
    color: "#64748b",
    marginTop: 5,
  },
  tituloLista: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
  },
  lista: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tituloPost: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  conteudoPost: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 21,
  },
  verMais: {
    color: "#2563eb",
    fontWeight: "bold",
    marginTop: 12,
  },
  erro: {
    color: "#dc2626",
    textAlign: "center",
    marginTop: 15,
  },
  vazio: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 25,
  },
});
