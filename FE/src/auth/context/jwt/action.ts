'use client';

import axios, { endpoints } from 'src/utils/axios';

import { setSession } from './utils';

// ----------------------------------------------------------------------

export type SignInParams = {
  email: string;
  password: string;
};

export type SignUpParams = {
  email: string;
  password: string;
  name?: string;
  passwordConfirmation?: string;
  firstName?: string;
  lastName?: string;
};

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ email, password }: SignInParams): Promise<void> => {
  try {
    const res = await axios.post(endpoints.auth.signIn, { email, password });
    const accessToken = res.data?.data?.accessToken || res.data?.accessToken;

    if (!accessToken) {
      throw new Error(res.data?.message || 'Access token missing in response');
    }

    await setSession(accessToken);
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({
  email,
  password,
  name,
  passwordConfirmation,
  firstName,
  lastName,
}: SignUpParams): Promise<void> => {
  const resolvedName = name || `${firstName || ''} ${lastName || ''}`.trim();
  const params = {
    name: resolvedName,
    email,
    password,
    passwordConfirmation: passwordConfirmation || password,
  };

  try {
    const res = await axios.post(endpoints.auth.signUp, params);
    const accessToken = res.data?.data?.accessToken || res.data?.accessToken;

    if (accessToken) {
      await setSession(accessToken);
    }
  } catch (error) {
    console.error('Error during sign up:', error);
    throw error;
  }
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async (): Promise<void> => {
  try {
    await setSession(null);
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};
