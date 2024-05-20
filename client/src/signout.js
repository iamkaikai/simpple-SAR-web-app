// GoogleSignOut.js
import React from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { auth } from './firebase';

const GoogleSignOut = () => {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('User signed out');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  return (
    <button onClick={handleSignOut}>Sign out</button>
  );
};

export default GoogleSignOut;
