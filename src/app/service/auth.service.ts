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
  login(credentials: { email: string; password: string }): Observable<any> {
    if (!credentials.email || !credentials.password) {
      return throwError(() => new Error('Email et mot de passe requis.'));
    }

    // 1️⃣ Login backend pour JWT
    return this.api.login(credentials).pipe(
      switchMap((backendData: any) => {
        // 2️⃣ Login Firebase pour session frontend
        return from(signInWithEmailAndPassword(this.afAuth, credentials.email, credentials.password)).pipe(
          switchMap(userCredential => {
            const uid = userCredential.user.uid;

            // 3️⃣ Récupérer infos Firestore
            return from(this.firestore.getDocument(this.firebaseCollection, uid)).pipe(
              tap(firestoreUser => {
                // 4️⃣ Combiner backend + Firebase
                this.setUser({
                  ...firestoreUser,
                  token: backendData.token,
                  backendUser: backendData
                });
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
}
