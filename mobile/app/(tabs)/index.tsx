import React from "react";
import { View, Text, StyleSheet, Image, Platform } from "react-native";
import Swiper from "react-native-swiper";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.homePage}>
      {/* Text Section */}
      <View style={styles.textContainer}>
        <View style={styles.wrapper}>
          <View style={styles.logoContainer}>
            <Image source={require("../../assets/logo.png")} style={styles.logoImage} />
          </View>
          <Text style={styles.title}>Welcome to EV CONNECT</Text>
          <Text style={styles.description}>
            Your Ultimate EV Charging Companion
            {"\n"}The simplest way to power up your electric journey! Our mission is to make charging your EV as seamless as possible, whether you're at home, at work, or on the go!
          </Text>
        </View>
      </View>

      {/* Slideshow Section */}
      <View style={styles.imgContainer}>
        <Swiper
          style={styles.swiper}
          showsPagination
          autoplay
          autoplayTimeout={3}
          dotStyle={styles.dot}
          activeDotStyle={styles.activeDot}
        >
          <Image source={require("../../assets/bg.png")} style={styles.slideImage} />
          <Image source={require("../../assets/slide2.jpeg")} style={styles.slideImage} />
          <Image source={require("../../assets/slide3.jpeg")} style={styles.slideImage} />
        </Swiper>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  homePage: {
    flex: 1,
    backgroundColor: "#ffffff", // Light blue background
    paddingVertical: 20,
    paddingHorizontal: 25,
  },
  textContainer: {
    flex: 2,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    paddingVertical: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 15,
    elevation: 6,
    borderWidth: 2,
    borderColor: "#3bc449", // Green border
  },
  wrapper: {
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  logoImage: {
    width: 180,
    height: 140,
    resizeMode: "contain",
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "#1e3a8a", // Deep blue accent
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: "#1e3a8a", // Deep blue text
    marginBottom: 12,
    textTransform: "uppercase",
  },
  description: {
    fontSize: 18,
    textAlign: "center",
    color: "#4b5563", // Muted gray text
    lineHeight: 26,
    paddingHorizontal: 15,
  },
  imgContainer: {
    flex: 1,
    marginTop: 25,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#1e3a8a", // Deep blue border
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 15,
    elevation: 6,
  },
  swiper: {
    height: "100%",
  },
  slideImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 15,
  },
  dot: {
    backgroundColor: "#d1d5db", // Light gray dots
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeDot: {
    backgroundColor: "#3bc449", // Green active dot
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
