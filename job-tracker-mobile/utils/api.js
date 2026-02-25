import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// For local development on a physical device or emulator, we need the local IP
// Getting the IP from Expo Constants manifest helps automatically route requests
const debuggerHost = Constants.expoConfig?.hostUri;
let backendHost = 'localhost:3001';

if (debuggerHost) {
    backendHost = debuggerHost.split(':')[0] + ':3001';
} else if (Platform.OS === 'android') {
    // Android emulator fallback
    backendHost = '10.0.2.2:3001';
}

const API_URL = `http://${backendHost}/api`;

const api = axios.create({
    baseURL: API_URL,
});

export default api;
