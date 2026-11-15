import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import api from "../services/api";

type RespostaLogin = {
  token: string;
  usuario: {
    id: number;
    nome: string;
    perfil: "professor" | "aluno";
  };
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!email.trim() || !senha) {
      Alert.alert("Atenção", "Informe e-mail e senha.");
      return;
    }

    setCarregando(true);

    try {
      // 1. Envia as credenciais para a API
      const response = await api.post<RespostaLogin>("/login", {
        email: email.trim().toLowerCase(),
        senha,
      });

      // 2. Salva o token JWT
      await SecureStore.setItemAsync("token", response.data.token);

      // 3. Salva as informações públicas do usuário
      await SecureStore.setItemAsync(
        "usuario",
        JSON.stringify(response.data.usuario),
      );

      // 4. Exibe uma mensagem de sucesso
      Alert.alert(
        "Login realizado",
        `Bem-vindo, ${response.data.usuario.nome}!`,
      );

      // 5. Retorna para a Home
      router.replace("/");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        Alert.alert("Erro", "E-mail ou senha inválidos.");
      } else {
        Alert.alert("Erro", "Não foi possível realizar o login.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Login FIAP</Text>

      <Text style={styles.subtitulo}>
        Entre com sua conta de professor ou aluno
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Digite seu e-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Digite sua senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <Pressable style={styles.botao} onPress={entrar} disabled={carregando}>
        {carregando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.textoBotao}>Entrar</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#f5f6fa",
    padding: 24,
    gap: 16,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
  },
  subtitulo: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 14,
  },
  botao: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  textoBotao: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
