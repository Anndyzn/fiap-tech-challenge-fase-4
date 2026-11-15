import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";

import api from "../../services/api";

type Post = {
  id: number;
  titulo: string;
  autor: string;
  conteudo: string;
};

export default function PostDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [post, setPost] = useState<Post | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function buscarPost() {
      setCarregando(true);
      setErro("");
      setPost(null);

      if (!/^\d+$/.test(id ?? "")) {
        setErro("ID da postagem inválido.");
        setCarregando(false);
        return;
      }

      try {
        const response = await api.get<Post>(`/posts/${id}`);

        if (ativo) {
          setPost(response.data);
        }
      } catch (error) {
        if (ativo) {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            setErro("Postagem não encontrada.");
          } else {
            setErro("Erro ao carregar a postagem.");
          }
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    buscarPost();

    return () => {
      ativo = false;
    };
  }, [id]);

  if (carregando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#172554" />
        <Text>Carregando postagem...</Text>
      </View>
    );
  }

  if (erro || !post) {
    return (
      <View style={styles.center}>
        <Text>{erro || "Postagem indisponível."}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{post.titulo}</Text>

      <Text style={styles.author}>Por {post.autor}</Text>

      <View style={styles.card}>
        <Text style={styles.content}>{post.conteudo}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F4F6F9",
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#172554",
  },
  author: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 10,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  content: {
    fontSize: 16,
    color: "#334155",
    lineHeight: 26,
  },
});
