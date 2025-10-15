import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  constructor(private firestore: Firestore) {}

  getCollection(collectionName: string): Observable<any[]> {
    const colRef = collection(this.firestore, collectionName);
    return collectionData(colRef, { idField: 'id' });
  }

  addDocument(collectionName: string, data: any) {
    const colRef = collection(this.firestore, collectionName);
    return addDoc(colRef, data);
  }

  updateDocument(collectionName: string, id: string, data: any) {
    const docRef = doc(this.firestore, `${collectionName}/${id}`);
    return updateDoc(docRef, data);
  }

  deleteDocument(collectionName: string, id: string) {
    const docRef = doc(this.firestore, `${collectionName}/${id}`);
    return deleteDoc(docRef);
  }
}
