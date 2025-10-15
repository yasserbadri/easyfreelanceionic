import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user: any = null; // utilisateur connecté

  constructor(private api: ApiService) {}

  login(credentials: any) {
    return this.api.login(credentials);
  }

  register(data: any) {
    return this.api.register(data);
  }

  setUser(user: any) { this.user = user; }
  getUser() { return this.user; }
  isLoggedIn(): boolean { return this.user !== null; }
  getUserRole(): string { return this.user?.role; } // 'client' ou 'freelancer'
}
