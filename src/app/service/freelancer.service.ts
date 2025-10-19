import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where } from '@angular/fire/firestore';
import { from } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FreelancerService {

  constructor(private firestore: Firestore) {}

  // 🔹 Récupérer tous les projets disponibles (créés par clients)
  getAvailableProjects() {
    const ref = collection(this.firestore, 'projects');
    return from(getDocs(ref));
  }

  // 🔹 Soumettre une proposition à un projet
  submitProposal(proposalData: any) {
    const ref = collection(this.firestore, 'proposals');
    return from(addDoc(ref, {
      ...proposalData,
      status: 'pending',
      createdAt: new Date().toISOString()
    }));
  }

  // 🔹 Voir les propositions envoyées par un freelancer
  getProposalsByFreelancer(freelancerId: string) {
    const ref = collection(this.firestore, 'proposals');
    const q = query(ref, where('freelancerId', '==', freelancerId));
    return from(getDocs(q));
  }
}
