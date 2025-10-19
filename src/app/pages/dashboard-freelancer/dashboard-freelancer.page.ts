import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Firestore, collection, doc, setDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { getAuth } from 'firebase/auth';
import { addDoc } from 'firebase/firestore';
import { query } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { where } from 'firebase/firestore';
import { getDocs } from 'firebase/firestore';
  import { IonicModule } from '@ionic/angular';
import { updateDoc } from 'firebase/firestore';

@Component({
  selector: 'app-dashboard-freelancer',
  templateUrl: './dashboard-freelancer.page.html',
  styleUrls: ['./dashboard-freelancer.page.scss'],
  standalone: true,
   
  imports: [ CommonModule, FormsModule,IonicModule]

})
export class DashboardFreelancerPage implements OnInit {
  projects: any[] = [];
  proposals: any[] = [];
  acceptedProjects: any[] = [];
  freelancerId: string = '';


  newProposal: any = {
    projectId: '',
    description: '',
    price: ''
  };

  freelancerUid: string | null = null;
  loadingProjects = false;
  loadingProposals = false;
  submitting = false;

  constructor(private firestore: Firestore) {}
 async ngOnInit() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.warn('Aucun utilisateur Firebase connecté');
      return;
    }
    this.freelancerUid = user.uid;
    await this.loadProjects();
    await this.loadProposals();
    await this.loadAcceptedProjects();

  }

  // Charger tous les projets (collection 'projects')
  async loadProjects() {
    try {
      this.loadingProjects = true;
      const colRef = collection(this.firestore, 'projects');
      const snap = await getDocs(colRef);
      this.projects = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Erreur loadProjects:', err);
    } finally {
      this.loadingProjects = false;
    }
  }

  // Charger les propositions envoyées par le freelancer connecté (collection 'proposals')
  async loadProposals() {
    if (!this.freelancerUid) return;
    try {
      this.loadingProposals = true;
      const colRef = collection(this.firestore, 'proposals');
      const q = query(colRef, where('freelancerId', '==', this.freelancerUid));
      const snap = await getDocs(q);
      this.proposals = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Erreur loadProposals:', err);
    } finally {
      this.loadingProposals = false;
    }
  }

  // Soumettre une proposition (ajoute doc dans 'proposals')
  async submitProposal() {
    if (!this.newProposal.projectId || !this.newProposal.description || !this.newProposal.price) {
      alert('Veuillez remplir tous les champs de la proposition');
      return;
    }
    if (!this.freelancerUid) {
      alert('Utilisateur non connecté');
      return;
    }

    try {
      this.submitting = true;
      const payload = {
        projectId: this.newProposal.projectId,
        description: this.newProposal.description,
        price: Number(this.newProposal.price),
        freelancerId: this.freelancerUid,
        status: 'En attente',
        createdAt: serverTimestamp()
      };
      const colRef = collection(this.firestore, 'proposals');
      await addDoc(colRef, payload);

      alert('Proposition envoyée ✅');
      this.newProposal = { projectId: '', description: '', price: '' };
      await this.loadProposals();
    } catch (err) {
      console.error('Erreur submitProposal:', err);
      alert('Erreur lors de l’envoi de la proposition');
    } finally {
      this.submitting = false;
    }
  }

 async loadAcceptedProjects() {
    const projectsRef = collection(this.firestore, 'projects');
    const q = query(projectsRef, where('freelancerId', '==', this.freelancerId));
    const snap = await getDocs(q);
    this.acceptedProjects = snap.docs.map((docSnap: any) => ({ id: docSnap.id, ...docSnap.data() }));
  }

  async setEstimatedDate(projectId: string, date: string) {
    if (!date) return;
    const projectRef = doc(this.firestore, `projects/${projectId}`);
    await updateDoc(projectRef, { estimatedEndDate: date });
    await this.loadAcceptedProjects();
  }

  async requestPayment(projectId: string) {
    const projectRef = doc(this.firestore, `projects/${projectId}`);
    await updateDoc(projectRef, { paymentRequested: true });
    await this.loadAcceptedProjects();
  }
  async askEstimatedDate(projectId: string) {
  const date = window.prompt('Date estimée (YYYY-MM-DD)');
  if (date) {
    await this.setEstimatedDate(projectId, date);
  }
}
}
