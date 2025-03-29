import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Image, Platform, Animated, Dimensions } from "react-native";
import Swiper from "react-native-swiper";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.homePage}>
      {/* Text Section */}
      <Animated.View 
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <View style={styles.wrapper}>
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                transform: [
                  { scale: scaleAnim.interpolate({
                    inputRange: [0.9, 1],
                    outputRange: [0.9, 1]
                  })}
                ]
              }
            ]}
          >
            <Image source={require("../../assets/logo.png")} style={styles.logoImage} />
          </Animated.View>
          <Animated.Text 
            style={[
              styles.title,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            Welcome to EV CONNECT
          </Animated.Text>
          <Animated.Text 
            style={[
              styles.description,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            Your Ultimate EV Charging Companion
            {"\n"}The simplest way to power up your electric journey! Our mission is to make charging your EV as seamless as possible, whether you're at home, at work, or on the go!
          </Animated.Text>
        </View>
      </Animated.View>

      {/* Slideshow Section */}
      <Animated.View 
        style={[
          styles.imgContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <Swiper
          style={styles.swiper}
          showsPagination
          autoplay
          autoplayTimeout={3}
          dotStyle={styles.dot}
          activeDotStyle={styles.activeDot}
          loop
          removeClippedSubviews={false}
        >
          <View style={styles.slideContainer}>
            <Image source={require("../../assets/bg.png")} style={styles.slideImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)']}
              style={styles.gradient}
            />
          </View>
          <View style={styles.slideContainer}>
            <Image source={require("../../assets/slide2.jpeg")} style={styles.slideImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)']}
              style={styles.gradient}
            />
          </View>
          <View style={styles.slideContainer}>
            <Image source={require("../../assets/slide3.jpeg")} style={styles.slideImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)']}
              style={styles.gradient}
            />
          </View>
        </Swiper>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  homePage: {
    flex: 1,
    backgroundColor: "#ffffff",
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
    borderColor: "#3bc449",
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
    borderColor: "#1e3a8a",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: "#1e3a8a",
    marginBottom: 12,
    textTransform: "uppercase",
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 18,
    textAlign: "center",
    color: "#4b5563",
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
    borderColor: "#1e3a8a",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 15,
    elevation: 6,
  },
  swiper: {
    height: "100%",
  },
  slideContainer: {
    flex: 1,
    position: 'relative',
  },
  slideImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 15,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    borderRadius: 15,
  },
  dot: {
    backgroundColor: "#d1d5db",
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#3bc449",
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
});
