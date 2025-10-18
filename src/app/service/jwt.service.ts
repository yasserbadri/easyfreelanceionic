// jwt.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class JwtService {

 decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = atob(base64);
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('❌ Erreur décodage JWT:', error);
      return null;
    }
  }

  getUserIdFromToken(token: string): number | null {
    const decoded = this.decodeToken(token);
    if (decoded) {
      // Essayer différents noms de champs
      const userId = decoded.id || decoded.userId || decoded.user_id || decoded.sub;
      
      console.log('🔍 Structure du token JWT:', {
        id: decoded.id,
        userId: decoded.userId, 
        user_id: decoded.user_id,
        sub: decoded.sub,
        username: decoded.username,
        email: decoded.email,
        roles: decoded.roles
      });
      
      if (userId && !isNaN(Number(userId))) {
        return Number(userId);
      }
    }
    return null;
  }

  getTokenInfo(token: string): any {
    const decoded = this.decodeToken(token);
    return decoded;
  }
}