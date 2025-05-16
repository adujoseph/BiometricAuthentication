/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Animatable from 'react-native-animatable';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import axios from 'axios';

const App = () => {
  const rnBiometrics = new ReactNativeBiometrics();
  const userId = '3334323333'

  const [isKeyExist, setKeyExist] = useState(false)

  useEffect(() => {
    checkIfKeyExists()
  }, [])

  const checkIfKeyExists = async () => {
    const { keysExist } = await rnBiometrics.biometricKeysExist();
    setKeyExist(keysExist)
  };

  const handleBiometricAuth = async () => {
    if (isKeyExist) {
      biometricLogin()
    } else {
      setupBiometric()
    }

  };

  const setupBiometric = async () => {
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      if (available && biometryType) {
        Alert.alert(biometryType, 'Would you like to enable biometric authentication for the next time?', [
          {
            text: 'Yes please',
            onPress: () => generateKeys(),
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Biometrics not supported', 'This device does not support biometric authentication.');
      }    
    } catch (err) {
      console.log(err)
    }
  }

  const generateKeys = async () => {
    const { publicKey } = await rnBiometrics.createKeys()

    await axios.post('http://localhost:3000/api/register', {
      userId,
      publicKey
    });

    Alert.alert('Biometric key registered.');
  }

  const biometricLogin = async () => {
    const payload = `login-${Date.now()}`;

    const { success, signature } = await rnBiometrics.createSignature({
      promptMessage: 'Login with Biometrics',
      payload,
    });

    if (!success) {
      return Alert.alert('Biometric authentication failed');
    }

    const res = await axios.post('http://localhost:3000/api/verify', {
      userId,
      payload,
      signature,
    });

    Alert.alert(res.data.message);
  };

  return (
    <View style={styles.container}>
      <View style={styles.centered}>
        <Animatable.Text animation="fadeInDown" style={styles.welcome}>
          Welcome back!
        </Animatable.Text>
        <Text style={styles.subText}>Unlock your account securely</Text>
        <Animatable.View animation="pulse" iterationCount="infinite" style={styles.iconContainer}>
          <Icon name={Platform.OS === 'android' ? "finger-print-outline" : "scan-circle-outline"} size={64} color="#fff" />
        </Animatable.View>

        <TouchableOpacity style={styles.authButton} onPress={handleBiometricAuth}>
          <Text style={styles.authText}>Authenticate Now</Text>
        </TouchableOpacity>
      </View>
      <View>
        <Text style={styles.orText}>────────  or  ────────</Text>

        <TouchableOpacity style={styles.altButton}>
          <Icon name="keypad-outline" size={20} color="#fff" />
          <Text style={styles.altText}>  Login with PIN</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.altButton}>
          <Icon name="key-outline" size={20} color="#fff" />
          <Text style={styles.altText}>  Use Password Instead</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.supportText}>Having trouble? Contact Support</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A183D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcome: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: '#AAB2C8',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  authButton: {
    backgroundColor: 'blue',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 30,
  },
  authText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  orText: {
    color: '#ccc',
    marginVertical: 8,
  },
  altButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  altText: {
    color: '#fff',
    fontSize: 15,
  },
  supportText: {
    color: '#AAB2C8',
    marginTop: 40,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});


export default App;
