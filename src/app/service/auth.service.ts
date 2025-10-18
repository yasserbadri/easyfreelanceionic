import { Injectable, NgZone } from '@angular/core';
import { ApiService } from './api.service';
import { FirestoreService } from './firestore.service';
import { Auth,createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { from, Observable, throwError } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user: any = null;
  private readonly firebaseCollection = 'users';

  constructor(
    private api: ApiService,
    private firestore: FirestoreService,
    private afAuth: Auth,
    private ngZone: NgZone
  ) {}

  /**
   * 🔹 REGISTER
   * Étape 1: Création dans le backend
   * Étape 2: Création dans Firestore
   */
  // 🔹 Register utilisateur : backend d'abord, puis Firebase
 register(data: { username: string; email: string; password: string; role: string }): Observable<any> {
  if (!data.email || !data.password || !data.username) {
    throw new Error('Username, email et mot de passe requis');
  }

  // Préparer le payload exact pour Spring Boot
  const payload = {
    username: data.username.trim(),
    email: data.email.trim(),
    password: data.password,
    role: [data.role] // MUST be an array, pas une chaîne
  };

  return this.api.register(payload).pipe(
    tap(res => console.log('Backend response', res)),
    switchMap(() => {
      // Une fois que backend valide, créer l'utilisateur dans Firebase
      return from(createUserWithEmailAndPassword(this.afAuth, data.email, data.password)).pipe(
        switchMap(userCredential => {
          const uid = userCredential.user.uid;
          const profile = {
            uid,
            username: data.username,
            email: data.email,
            role: data.role,
            createdAt: new Date().toISOString()
          };
          return from(this.firestore.setDocument(this.firebaseCollection, uid, profile));
        })
      );
    }),
    catchError(err => {
      console.error('AuthService.register error', err);
      return throwError(() => err);
    })
  );
}


  /**
   * 🔹 LOGIN
   * On utilise Firebase pour la session côté frontend, backend pour JWT
   */
  login(credentials: { usernameOrEmail: string; password: string }): Observable<any> {
  if (!credentials.usernameOrEmail || !credentials.password) {
    return throwError(() => new Error('Email ou mot de passe requis.'));
  }

  // 🔹 Étape 1 : récupérer l’email exact depuis backend si nécessaire
  return this.api.getEmailByUsernameOrEmail(credentials.usernameOrEmail).pipe(
    switchMap(email => {
      // 🔹 Étape 2 : login sur backend pour JWT
      return this.api.login({
        username: credentials.usernameOrEmail,
        password: credentials.password
      }).pipe(
        switchMap(backendData => {
          // 🔹 Étape 3 : login Firebase avec l’email exact
          return from(signInWithEmailAndPassword(this.afAuth, email, credentials.password)).pipe(
            switchMap(firebaseUserCredential => {
              const firebaseUser = firebaseUserCredential.user;

              // 🔹 Étape 4 : récupérer le profil depuis Firestore
              return from(this.firestore.getDocument(this.firebaseCollection, firebaseUser.uid)).pipe(
                tap(firestoreUser => {
                  // Stocker l’utilisateur complet côté frontend
                  this.setUser({
                    ...firestoreUser,
                    token: backendData.token,
                    backendUser: backendData
                  });
                })
              );
            })
          );
        })
      );
    }),
    catchError(err => {
      console.error('❌ Erreur login :', err);
      return throwError(() => err);
    })
  );
}


  /**
   * 🔹 LOGOUT
   */
  logout(): Promise<void> {
    this.user = null;
    return signOut(this.afAuth);
  }

  /**
   * 🔹 UTILISATEUR
   */
  setUser(user: any) { this.user = user; }
  getUser() { return this.user; }
  isLoggedIn(): boolean { return this.user !== null; }
  getUserRole(): string { return this.user?.role; }
  getCurrentUserId(): string | null {
  return this.user?.uid || null;
}
}
