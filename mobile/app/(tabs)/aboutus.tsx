import React from "react";
import { View, Text, StyleSheet } from "react-native";

const AboutUs = () => {
  return (
    <View style={styles.container}>
      <View style={[styles.section, styles.elevation]}>
        <Text style={styles.title}>About Us</Text>
        <Text style={styles.description}>
          Leaders in EV charging solutions, partnering globally to provide innovative energy services.
        </Text>
      </View>

      <View style={[styles.section, styles.elevation]}>
        <Text style={styles.subtitle}>Our Core Values</Text>
        <View style={styles.valuesList}>
          <Text style={styles.valueItem}>
            <Text style={styles.valueTitle}>🌟 Innovation:</Text> Cutting-edge technology to lead the way
          </Text>
          <Text style={styles.valueItem}>
            <Text style={styles.valueTitle}>🤝 Honesty:</Text> Transparent solutions to build trust
          </Text>
          <Text style={styles.valueItem}>
            <Text style={styles.valueTitle}>💼 Service:</Text> Customer service is at the heart of everything we do
          </Text>
          <Text style={styles.valueItem}>
            <Text style={styles.valueTitle}>📈 Development:</Text> We strive for continuous growth and improvement
          </Text>
        </View>
      </View>

      <View style={[styles.section, styles.elevation]}>
        <Text style={styles.subtitle}>Global Reach</Text>
        <Text style={styles.description}>
          Our services span multiple countries, working with top companies to deliver premium EV solutions globally.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 20,
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
  },
  elevation: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#4b5563",
    textAlign: "center",
  },
  valuesList: {
    marginTop: 10,
  },
  valueItem: {
    fontSize: 16,
    color: "#4b5563",
    marginBottom: 8,
  },
  valueTitle: {
    fontWeight: "bold",
    color: "#1f2937",
  },
});

export default AboutUs;
