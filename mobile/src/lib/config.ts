import { Platform } from 'react-native';

/**
 * Laravel API base. Set EXPO_PUBLIC_API_URL in mobile/.env (for a real phone on your Wi-Fi use your
 * computer's address, e.g. http://192.168.1.5:8000/api/v1). The Android emulator reaches the host
 * machine at 10.0.2.2.
 */
const fallback = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api/v1' : 'http://localhost:8000/api/v1';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? fallback).replace(/\/$/, '');

/** Helpline shown under More > Help. Set EXPO_PUBLIC_SUPPORT_PHONE (digits with country code) once the real number is known. */
export const SUPPORT_PHONE = (process.env.EXPO_PUBLIC_SUPPORT_PHONE ?? '').replace(/\D/g, '');
