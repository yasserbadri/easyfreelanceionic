import { Injectable, NgZone } from '@angular/core';
import { ApiService } from './api.service';
import { FirestoreService } from './firestore.service';
import { Auth,createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { from, Observable, throwError } from 'rxjs';
import { switchMap, tap, catchError, map } from 'rxjs/operators';

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
   * 🔹 REGISTER - Version automatique
   */
  register(data: { username: string; email: string; password: string; role: string }): Observable<any> {
    if (!data.email || !data.password || !data.username) {
      throw new Error('Username, email et mot de passe requis');
    }

    const payload = {
      username: data.username.trim(),
      email: data.email.trim(),
      password: data.password,
      role: [data.role]
    };

    return this.api.register(payload).pipe(
      switchMap((backendResponse: any) => {
        console.log('✅ Backend register réussi:', backendResponse);
        
        // 🔹 ATTENDRE QUE L'UTILISATEUR SOIT CRÉÉ PUIS RÉCUPÉRER SON ID
        return this.waitAndGetUserId(data.username).pipe(
          switchMap((mysqlId: number | null) => {
            if (!mysqlId) {
              console.warn('⚠️ ID MySQL non récupéré automatiquement pour:', data.username);
              // Continuer quand même sans ID pour ne pas bloquer l'inscription
            }

            // Créer l'utilisateur Firebase
            return from(createUserWithEmailAndPassword(this.afAuth, data.email, data.password)).pipe(
              switchMap(userCredential => {
                const uid = userCredential.user.uid;
                
                const profile = {
                  uid,
                  mysqlId: mysqlId, // Stocker l'ID MySQL récupéré
                  username: data.username,
                  email: data.email,
                  role: data.role,
                  createdAt: new Date().toISOString()
                };
                
                console.log('💾 Profil créé dans Firestore avec ID MySQL:', mysqlId);
                return from(this.firestore.setDocument(this.firebaseCollection, uid, profile));
              })
            );
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
   * 🔹 ATTENDRE ET RÉCUPÉRER L'ID MYSQL - VERSION CORRIGÉE
   */
  private waitAndGetUserId(username: string, maxAttempts: number = 5): Observable<number | null> {
    console.log('🕐 Tentative de récupération ID MySQL pour:', username);
    
    return this.api.getUserIdByUsername(username).pipe(
      map((response: any) => {
        if (response && response.id) {
          console.log('✅ ID MySQL récupéré automatiquement:', response.id);
          return response.id;
        }
        throw new Error('ID non trouvé');
      }),
      catchError(error => {
        console.log('❌ Échec récupération ID, nouvelle tentative dans 1s...');
        // Attendre 1 seconde et réessayer
        return new Observable<number | null>(observer => {
          setTimeout(() => {
            if (maxAttempts > 1) {
              this.waitAndGetUserId(username, maxAttempts - 1).subscribe(observer);
            } else {
              console.error('❌ Échec après plusieurs tentatives pour:', username);
              observer.next(null);
              observer.complete();
            }
          }, 1000);
        });
      })
    );
  }

  /**
   * 🔹 LOGIN - Version automatique
   */
  /**
 * 🔹 LOGIN - Version corrigée
 */
/**
 * 🔹 LOGIN - Version corrigée avec meilleur debug
 */
login(credentials: { usernameOrEmail: string; password: string }): Observable<any> {
  if (!credentials.usernameOrEmail || !credentials.password) {
    return throwError(() => new Error('Email ou mot de passe requis.'));
  }

  return this.api.getEmailByUsernameOrEmail(credentials.usernameOrEmail).pipe(
    switchMap(email => {
      console.log('📧 Email récupéré pour Firebase:', email);
      
      return this.api.login({
        username: credentials.usernameOrEmail,
        password: credentials.password
      }).pipe(
        switchMap(backendData => {
          console.log('✅ Backend login réussi:', backendData);

          // Stocker le token
          if (backendData.token) {
            localStorage.setItem('token', backendData.token);
          }

          // Login Firebase
          return from(signInWithEmailAndPassword(this.afAuth, email, credentials.password)).pipe(
            switchMap(firebaseUserCredential => {
              const firebaseUser = firebaseUserCredential.user;
              console.log('🔥 Utilisateur Firebase connecté:', firebaseUser.uid);

              // Récupérer le profil Firestore
              return from(this.firestore.getDocument(this.firebaseCollection, firebaseUser.uid)).pipe(
                switchMap(firestoreUser => {
                  console.log('📋 Profil Firestore complet:', firestoreUser);
                  
                  // 🔹 CORRECTION : Utiliser le username du backendData
                  const username = backendData.username || credentials.usernameOrEmail;
                  console.log('👤 Username pour récupération ID MySQL:', username);
                  
                  // 🔹 CORRECTION : Récupérer l'ID MySQL avec le bon username
                  return this.getUserIdByUsername(username).pipe(
                    switchMap((mysqlId: number) => {
                      console.log('🔑 ID MySQL récupéré:', mysqlId);

                      // 🔹 CORRECTION : Construire l'utilisateur AVANT de le stocker
                      const userData = {
                        // 🔹 PRIORITÉ : Stocker l'ID MySQL dans 'id'
                        id: mysqlId,
                        mysqlId: mysqlId,
                        username: backendData.username,
                        email: backendData.email,
                        role: backendData.roles && backendData.roles.length > 0 ? backendData.roles[0] : 'client',
                        token: backendData.token,
                        uid: firebaseUser.uid,
                        refreshToken: backendData.refreshToken,
                        ...firestoreUser,
                        backendUser: backendData
                      };

                      console.log('💾 Données utilisateur FINALES à stocker:', userData);
                      console.log('👤 Utilisateur connecté avec ID MySQL:', userData.id);
                      
                      this.setUser(userData);
                      
                      // 🔹 VÉRIFICATION IMMÉDIATE
                      setTimeout(() => {
                        console.log('✅ Vérification après setUser:', this.getUser());
                        console.log('✅ ID MySQL disponible:', this.getCurrentUserId());
                      }, 100);
                      
                      return [userData];
                    }),
                    catchError(mysqlError => {
                      console.error('❌ Erreur récupération ID MySQL:', mysqlError);
                      
                      // 🔹 FALLBACK : Utiliser mysqlId de Firestore si disponible
                      const fallbackMysqlId = firestoreUser?.mysqlId;
                      console.log('🔄 Fallback - mysqlId depuis Firestore:', fallbackMysqlId);
                      
                      const userData = {
                        id: fallbackMysqlId || null,
                        mysqlId: fallbackMysqlId || null,
                        username: backendData.username,
                        email: backendData.email,
                        role: backendData.roles && backendData.roles.length > 0 ? backendData.roles[0] : 'client',
                        token: backendData.token,
                        uid: firebaseUser.uid,
                        refreshToken: backendData.refreshToken,
                        ...firestoreUser,
                        backendUser: backendData
                      };

                      console.log('💾 Données utilisateur FALLBACK:', userData);
                      this.setUser(userData);
                      return [userData];
                    })
                  );
                })
              );
            })
          );
        })
      );
    }),
    catchError(err => {
      console.error('❌ Erreur login:', err);
      return throwError(() => err);
    })
  );
}
  /**
   * 🔹 RÉCUPÉRER L'ID MYSQL PAR USERNAME - VERSION CORRIGÉE
   */
  /**
 * 🔹 RÉCUPÉRER L'ID MYSQL AVEC FALLBACK
 */
private getUserIdByUsername(username: string): Observable<number> {
  return this.api.getUserIdByUsername(username).pipe(
    map((response: any) => {
      if (response && response.id) {
        console.log('✅ ID MySQL trouvé:', response.id);
        return response.id;
      }
      throw new Error('ID non trouvé dans la réponse');
    }),
    catchError(error => {
      console.error('❌ Erreur récupération ID MySQL, tentative avec email...', error);
      
      // 🔹 FALLBACK : Essayer avec l'email si le username échoue
      return this.getUserByEmail(username).pipe(
        map(user => {
          if (user && user.id) {
            console.log('✅ ID MySQL trouvé via email fallback:', user.id);
            return user.id;
          }
          throw new Error('ID non trouvé via email fallback');
        })
      );
    })
  );
}

/**
 * 🔹 FALLBACK : Récupérer l'ID MySQL par email
 */
private getUserByEmail(email: string): Observable<any> {
  // Cette méthode devrait exister dans votre ApiService
  return this.api.getUserByEmail(email);
}

  /**
   * 🔹 RÉCUPÉRER L'ID MYSQL ACTUEL
   */
  /**
 * 🔹 RÉCUPÉRER L'ID MYSQL ACTUEL - VERSION CORRIGÉE
 */
getCurrentUserId(): number | null {
  const user = this.getUser();
  
  // 🔹 SOLUTION DIRECTE : Toujours utiliser mysqlId
  const mysqlId = user?.mysqlId;
  
  console.log('🔍 mysqlId direct:', mysqlId);
  
  if (mysqlId && !isNaN(Number(mysqlId))) {
    console.log('✅ ID MySQL valide:', mysqlId);
    return Number(mysqlId);
  }
  
  console.warn('⚠️ ID MySQL non disponible dans mysqlId');
  return null;
}
  /**
   * 🔹 MÉTHODE POUR RAFRAÎCHIR L'ID MYSQL - VERSION CORRIGÉE
   */
  refreshUserId(): Observable<number> {
    const user = this.getUser();
    if (!user?.username) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }

    return this.getUserIdByUsername(user.username).pipe(
      tap((newId: number) => {
        if (this.user) {
          console.log('🔄 ID MySQL mis à jour:', newId);
          this.user.id = newId;
          this.setUser(this.user);
        }
      })
    );
  }

  // 🔹 MÉTHODE DEBUG
  debugUser() {
    console.log('🔍 Debug User:', {
      user: this.user,
      mysqlId: this.getCurrentUserId(),
      fromStorage: localStorage.getItem('user')
    });
  }

  // ... les autres méthodes restent inchangées ...
  logout(): Promise<void> {
    this.user = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return signOut(this.afAuth);
  }

  setUser(user: any) { 
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): any {
    if (!this.user) {
      const stored = localStorage.getItem('user');
      if (stored) {
        this.user = JSON.parse(stored);
      }
    }
    return this.user;
  }

  isLoggedIn(): boolean { 
    return this.getUser() !== null; 
  }

  getUserRole(): string { 
    return this.getUser()?.role; 
  }
}