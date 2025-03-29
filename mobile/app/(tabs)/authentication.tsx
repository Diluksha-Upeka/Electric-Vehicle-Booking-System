import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Authentication() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Register state
  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  

  // Handle login form changes
  const handleLoginChange = (field: string, value: string) => {
    setLoginData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle register form changes
  const handleRegisterChange = (field: string, value: string) => {
    setRegisterData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Toggle between login and register forms
  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError("");
    setSuccess("");
  };

  // API base URL
  const getApiBaseUrl = () => {
    return __DEV__
      ? Platform.select({
          android: "http://192.168.170.216:5000",
          ios: "http://localhost:5000",
          default: "http://192.168.170.216:5000",
        })
      : "http://192.168.170.216:5000";
  };

  // Handle login submission
  const handleLogin = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    const { email, password } = loginData;

    if (!email || !password) {
      setError("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    try {
      const API_BASE_URL = getApiBaseUrl();

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        { email, password },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200) {
        setError("");
        setSuccess("Successfully logged in!");

        // Store auth token and user ID in AsyncStorage
        try {
          await AsyncStorage.setItem("authToken", response.data.token);
          await AsyncStorage.setItem("userId", response.data.user._id);

          // Retrieve to confirm it's stored
          const storedToken = await AsyncStorage.getItem("authToken");
          const storedUserId = await AsyncStorage.getItem("userId");
          console.log("🟢 Stored Token (after saving):", storedToken);
          console.log("🟢 Stored User ID (after saving):", storedUserId);

          if (storedToken && storedUserId) {
            // Redirect only if token is stored correctly
            setTimeout(() => {
              router.push("/booking");
            }, 2000);
          } else {
            setError("Failed to store authentication data. Please try again.");
          }
        } catch (storageError) {
          console.error("🔴 Error saving token:", storageError);
          setError("Error saving login session. Try again.");
        }
      }
    } catch (error: any) {
      console.error("🔴 Login Error:", error);
      setError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Login failed."
          : "An unexpected error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration submission
  const handleRegister = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    const { firstName, lastName, email, password, confirmPassword } = registerData;

    if (!firstName || !lastName || !email || !password) {
      setError("All fields are required.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const API_BASE_URL = getApiBaseUrl();

      // Combine first and last name into a single name field
      const payload = {
        name: `${firstName} ${lastName}`,
        email: email.toLowerCase(),
        password,
        firstName,
        lastName
      };

      console.log("Attempting registration with payload:", payload);

      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, payload, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log("Registration response:", response.data);

      if (response.status === 201 || response.status === 200) {
        setSuccess("User registered successfully!");
        
        // Automatically switch to login form after successful registration
        setTimeout(() => {
          setIsLogin(true);
          setLoginData({
            email: email,
            password: ""
          });
        }, 1500);
      }
    } catch (err: any) {
      console.error("Registration error details:", err);
      
      if (err.response) {
        console.error("Error response status:", err.response.status);
        console.error("Error response data:", err.response.data);
        
        let errorMsg = err.response.data?.message || `Server error: ${err.response.status}`;
        setError(errorMsg);
        
        if (err.response.status === 500) {
          errorMsg = "Registration failed. Please try again later.";
          setError(errorMsg);
        }
      } else if (err.request) {
        console.error("No response received:", err.request);
        setError("No response from server. Check your connection.");
      } else {
        console.error("Error setting up request:", err.message);
        setError(`Error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <Text style={styles.heading}>
            {isLogin ? "Welcome back" : "Create account"}
          </Text>

          {!isLogin && (
            <Image
              source={require("../../public/logo.png")}
              style={styles.logo}
            />
          )}

          {/* Login Form */}
          {isLogin ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={loginData.email}
                onChangeText={(value) => handleLoginChange("email", value)}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#9ca3af"
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                value={loginData.password}
                onChangeText={(value) => handleLoginChange("password", value)}
                secureTextEntry
                placeholderTextColor="#9ca3af"
              />

              <TouchableOpacity
                style={styles.forgotPasswordLink}
                onPress={() => router.push("/forgot-password")}
              >
                <Text style={styles.link}>Forgot password?</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* Registration Form */
            <>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={registerData.firstName}
                onChangeText={(value) => handleRegisterChange("firstName", value)}
                placeholderTextColor="#9ca3af"
              />

              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={registerData.lastName}
                onChangeText={(value) => handleRegisterChange("lastName", value)}
                placeholderTextColor="#9ca3af"
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                value={registerData.email}
                onChangeText={(value) => handleRegisterChange("email", value)}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                value={registerData.password}
                onChangeText={(value) => handleRegisterChange("password", value)}
                secureTextEntry
                placeholderTextColor="#9ca3af"
              />

              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={registerData.confirmPassword}
                onChangeText={(value) => handleRegisterChange("confirmPassword", value)}
                secureTextEntry
                placeholderTextColor="#9ca3af"
              />
            </>
          )}

          {/* Action Button (Login or Register) */}
          <TouchableOpacity
            style={styles.button}
            onPress={isLogin ? handleLogin : handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? "Login" : "Register"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Error and Success Messages */}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          {/* Toggle between Login and Register */}
          <TouchableOpacity onPress={toggleForm} style={styles.toggleButton}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </Text>
            <Text style={styles.toggleAction}>
              {isLogin ? "Sign up" : "Log in"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 25,
  },
  formContainer: {
    width: "100%",
    alignItems: "center",
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 20,
    textAlign: "center",
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: "contain",
    marginBottom: 20,
  },
  input: {
    width: "85%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#ffffff",
    fontSize: 16,
    color: "#111827",
  },
  forgotPasswordLink: {
    alignSelf: "flex-end",
    marginRight: "7.5%",
    marginBottom: 15,
  },
  button: {
    width: "85%",
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#3bc449",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#ef4444",
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
  },
  success: {
    color: "#22c55e",
    marginTop: 10,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  toggleButton: {
    flexDirection: "row",
    marginTop: 15,
    alignItems: "center",
  },
  toggleText: {
    color: "#6b7280",
    fontSize: 14,
    marginRight: 5,
  },
  toggleAction: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
  },
  link: {
    color: "#2563eb",
    fontSize: 14,
  },
});