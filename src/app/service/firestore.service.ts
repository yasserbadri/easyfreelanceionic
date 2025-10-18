import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
} from '@angular/fire/firestore';
import { DocumentReference, DocumentSnapshot, DocumentData } from '@firebase/firestore';
import { from, Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(private firestore: Firestore) {}

  addDocument(collectionName: string, data: any): Observable<any> {
    try {
      const colRef = collection(this.firestore, collectionName);
      return from(addDoc(colRef, data));
    } catch (error) {
      console.error('Erreur Firestore (addDocument):', error);
      return throwError(() => error);
    }
  }

  setDocument(collectionName: string, docId: string, data: any): Observable<void> {
    try {
      const docRef: DocumentReference<DocumentData> = doc(this.firestore, `${collectionName}/${docId}`);
      return from(setDoc(docRef, data, { merge: true })) as Observable<void>;
    } catch (error) {
      console.error('Erreur Firestore (setDocument):', error);
      return throwError(() => error);
    }
  }

  getDocument(collectionName: string, docId: string): Observable<any> {
    try {
      const docRef: DocumentReference<DocumentData> = doc(this.firestore, `${collectionName}/${docId}`);
      return from(getDoc(docRef) as Promise<DocumentSnapshot<DocumentData>>).pipe(
        map((snapshot: DocumentSnapshot<DocumentData>) => {
          if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data()! };
          } else {
            throw new Error(`Document ${docId} non trouvé dans ${collectionName}`);
          }
        })
      );
    } catch (error) {
      console.error('Erreur Firestore (getDocument):', error);
      return throwError(() => error);
    }
  }

  updateDocument(collectionName: string, docId: string, data: any): Observable<void> {
    try {
      const docRef: DocumentReference<DocumentData> = doc(this.firestore, `${collectionName}/${docId}`);
      return from(updateDoc(docRef, data)) as Observable<void>;
    } catch (error) {
      console.error('Erreur Firestore (updateDocument):', error);
      return throwError(() => error);
    }
  }

  deleteDocument(collectionName: string, docId: string): Observable<void> {
    try {
      const docRef: DocumentReference<DocumentData> = doc(this.firestore, `${collectionName}/${docId}`);
      return from(deleteDoc(docRef)) as Observable<void>;
    } catch (error) {
      console.error('Erreur Firestore (deleteDocument):', error);
      return throwError(() => error);
    }
  }
}