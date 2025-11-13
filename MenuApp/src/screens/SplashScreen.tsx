import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar, Dimensions } from 'react-native';

interface SplashScreenProps {
  navigation: any;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigation]);

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const aspect = 260 / 64; // width / height
  // Adaptive sizing: cap by 200% of screen width and 200% of screen height
  const widthCap = Math.round(screenWidth * 2.0);
  const heightCap = Math.round(screenHeight * 2.0);
  const widthFromHeightCap = Math.round(heightCap * aspect);
  const idealWidth = Math.min(widthCap, widthFromHeightCap);
  const logoWidth = Math.max(120, idealWidth); // ensure reasonable minimum
  const logoHeight = Math.round(logoWidth / aspect);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#d96709" />
      <Image
        source={require('../../assets/AppLogo.png')}
        style={{ width: logoWidth, height: logoHeight, resizeMode: 'contain' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d96709',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {},
});

export default SplashScreen;


