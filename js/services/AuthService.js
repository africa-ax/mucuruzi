// ============================================================
//  MUCURUZI — AuthService.js (UPDATED)
// ============================================================

const AuthService = (() => {
  let _isRegistering = false;

  // ── Private: Save user profile to Firestore ──────────────────
  const _saveUserProfile = async (uid, profileData) => {
    // Explicitly use .doc(uid) to keep IDs synced
    return db.collection(Collections.USERS).doc(uid).set({
      ...profileData,
      uid: uid,
      createdAt: serverTimestamp(),
      isActive: true
    });
  };

  const _getUserProfile = async (uid) => {
    const doc = await db.collection(Collections.USERS).doc(uid).get();
    return doc.exists ? doc.data() : null;
  };

  // ── 1. Register (Improved logic) ──────────────────────────────
  
const register = async (userData) => {
    try {
      const { email, password, role, ...rest } = userData;
      _isRegistering = true; // Prevent auth state listener from firing early

      // 1. Create the AUTH account first
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // 2. Prepare the Firestore data using the REAL UID from Auth
      const profile = {
        uid: user.uid, // Use the real Firebase Auth UID
        email: email.trim().toLowerCase(),
        role,
        ...rest,
        createdAt: serverTimestamp(),
        isActive: true
      };

      // 3. Save to Firestore using the UID as the Document ID
      // This is crucial: .doc(user.uid)
      await db.collection(Collections.USERS).doc(user.uid).set(profile);

      _isRegistering = false;
      return { success: true, user: profile };

    } catch (err) {
      _isRegistering = false;
      console.error("Registration failed:", err.code);

      // CRITICAL CLEANUP: 
      // If Auth succeeded but Firestore failed, we must delete the Auth user
      // so the email isn't "trapped" for the next attempt.
      if (auth.currentUser) {
        await auth.currentUser.delete().catch(() => {});
      }

      return { success: false, error: _parseAuthError(err) };
    }
  };
  // ... (Keep login, loginWithGoogle, logout, and _parseAuthError as they were) ...

  const login = async (email, password) => {
    try {
      const credential = await auth.signInWithEmailAndPassword(email, password);
      const profile = await _getUserProfile(credential.user.uid);
      if (!profile) {
        await auth.signOut();
        return { success: false, error: 'Account profile not found. Please register.' };
      }
      return { success: true, user: profile };
    } catch (err) {
      return { success: false, error: _parseAuthError(err) };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await auth.signInWithPopup(provider);
      const profile = await _getUserProfile(credential.user.uid);

      if (!profile) {
        await auth.signOut();
        return { success: false, needsRegistration: true, error: 'No account found. Please register first.' };
      }
      return { success: true, user: profile };
    } catch (err) {
      return { success: false, error: _parseAuthError(err) };
    }
  };

  const logout = async () => {
    try { await auth.signOut(); return { success: true }; }
    catch (err) { return { success: false, error: err.message }; }
  };

  const onAuthStateChanged = (callback) => {
    return auth.onAuthStateChanged(async (firebaseUser) => {
      if (_isRegistering) return;
      if (firebaseUser) {
        const profile = await _getUserProfile(firebaseUser.uid);
        callback(profile || null);
      } else {
        callback(null);
      }
    });
  };

  const _parseAuthError = (err) => {
    const map = {
      'auth/email-already-in-use': 'This email is already registered.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/network-request-failed': 'Network error. Check your connection.',
    };
    return map[err.code] || err.message || 'Something went wrong.';
  };

  return { register, login, loginWithGoogle, logout, onAuthStateChanged, getCurrentUser: () => auth.currentUser };
})();
