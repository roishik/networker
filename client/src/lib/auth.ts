export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

class AuthManager {
  private user: AuthUser | null = null;

  getCurrentUser(): AuthUser | null {
    return this.user;
  }

  setUser(user: AuthUser | null) {
    this.user = user;
    if (user) {
      localStorage.setItem('networker_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('networker_user');
    }
  }

  initializeAuth(): AuthUser | null {
    const stored = localStorage.getItem('networker_user');
    if (stored) {
      try {
        this.user = JSON.parse(stored);
        return this.user;
      } catch {
        localStorage.removeItem('networker_user');
      }
    }
    return null;
  }

  async signInWithGoogle(): Promise<AuthUser> {
    // Mock Google OAuth - in real app would use Google SDK
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUser: AuthUser = {
          id: `user_${Date.now()}`,
          email: 'user@example.com',
          name: 'Demo User'
        };
        this.setUser(mockUser);
        resolve(mockUser);
      }, 1000);
    });
  }

  signOut() {
    this.setUser(null);
  }

  getAuthHeaders(): Record<string, string> {
    if (!this.user) return {};
    return {
      'x-user-id': this.user.id
    };
  }
}

export const auth = new AuthManager();
