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
import { getDoc } from 'firebase/firestore';

@Component({
  selector: 'app-dashboard-freelancer',
  templateUrl: './dashboard-freelancer.page.html',
  styleUrls: ['./dashboard-freelancer.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class DashboardFreelancerPage implements OnInit {
  projects: any[] = [];
  proposals: any[] = [];
  acceptedProjects: any[] = [];

  newProposal: any = {
    projectId: '',
    description: '',
    price: ''
  };

  freelancerUid: string | null = null;
  freelancerName: string = '';
  loadingProjects = false;
  loadingProposals = false;
  loadingAcceptedProjects = false;
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
    
    // 🔹 RÉCUPÉRER LE NOM DU FREELANCER
    await this.loadFreelancerProfile();
    await this.loadProjects();
    await this.loadProposals();
    await this.loadAcceptedProjects();
  }

  // 🔹 NOUVELLE MÉTHODE : Récupérer le profil du freelancer
  async loadFreelancerProfile() {
    if (!this.freelancerUid) return;
    
    try {
      const userDocRef = doc(this.firestore, 'users', this.freelancerUid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.freelancerName = userData['username'] || userData['displayName'] || 'Freelance Anonyme';
        console.log('👤 Nom du freelancer récupéré:', this.freelancerName);
      } else {
        console.warn('Profil utilisateur non trouvé dans Firestore');
        this.freelancerName = 'Freelance Anonyme';
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      this.freelancerName = 'Freelance Anonyme';
    }
  }

  // Charger tous les projets (collection 'projects')
  async loadProjects() {
    try {
      this.loadingProjects = true;
      const colRef = collection(this.firestore, 'projects');
      const snap = await getDocs(colRef);
      
      // 🔹 CORRECTION : Ajouter le type explicitement pour 'project'
      this.projects = snap.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() }))
        .filter((project: any) => 
          !project.freelancerId && 
          project.status !== 'En cours' && 
          project.status !== 'Terminé'
        );
        
      console.log('📋 Projets disponibles:', this.projects);
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
      console.log('📋 Mes propositions:', this.proposals);
    } catch (err) {
      console.error('Erreur loadProposals:', err);
    } finally {
      this.loadingProposals = false;
    }
  }

  // 🔹 CORRIGÉ : Charger les projets acceptés
  async loadAcceptedProjects() {
    if (!this.freelancerUid) return;
    
    try {
      this.loadingAcceptedProjects = true;
      const projectsRef = collection(this.firestore, 'projects');
      
      // 🔹 CORRECTION : Utiliser freelancerUid au lieu de freelancerId
      const q = query(projectsRef, where('freelancerId', '==', this.freelancerUid));
      const snap = await getDocs(q);
      
      this.acceptedProjects = snap.docs.map((docSnap: any) => ({ 
        id: docSnap.id, 
        ...docSnap.data() 
      }));
      
      console.log('✅ Projets acceptés:', this.acceptedProjects);
    } catch (error) {
      console.error('Erreur loadAcceptedProjects:', error);
      this.acceptedProjects = [];
    } finally {
      this.loadingAcceptedProjects = false;
    }
  }

  // 🔹 CORRIGÉ : Soumettre une proposition avec le nom du freelancer
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
      
      // 🔹 AJOUT DU NOM DU FREELANCER DANS LA PROPOSITION
      const payload = {
        projectId: this.newProposal.projectId,
        description: this.newProposal.description,
        price: Number(this.newProposal.price),
        freelancerId: this.freelancerUid,
        freelancerName: this.freelancerName,
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
      alert('Erreur lors de l\'envoi de la proposition');
    } finally {
      this.submitting = false;
    }
  }

  // 🔹 CORRIGÉ : Définir la date estimée
  async setEstimatedDate(projectId: string, date: string) {
    if (!date) return;
    
    try {
      const projectRef = doc(this.firestore, `projects/${projectId}`);
      await updateDoc(projectRef, { 
        estimatedEndDate: date,
        status: 'En cours'
      });
      
      await this.loadAcceptedProjects();
      alert('Date estimée définie avec succès ✅');
    } catch (error) {
      console.error('Erreur setEstimatedDate:', error);
      alert('Erreur lors de la définition de la date');
    }
  }

  // 🔹 CORRIGÉ : Demander le paiement
  async requestPayment(projectId: string) {
    try {
      const projectRef = doc(this.firestore, `projects/${projectId}`);
      await updateDoc(projectRef, { 
        paymentRequested: true,
        paymentRequestedAt: serverTimestamp()
      });
      
      await this.loadAcceptedProjects();
      alert('Demande de paiement envoyée ✅');
    } catch (error) {
      console.error('Erreur requestPayment:', error);
      alert('Erreur lors de la demande de paiement');
    }
  }

  // 🔹 CORRIGÉ : Demander la date estimée
  async askEstimatedDate(projectId: string) {
    const date = window.prompt('Date estimée de fin (YYYY-MM-DD)');
    if (date) {
      // Validation simple de la date
      if (!this.isValidDate(date)) {
        alert('Format de date invalide. Utilisez YYYY-MM-DD');
        return;
      }
      await this.setEstimatedDate(projectId, date);
    }
  }

  // 🔹 MÉTHODE UTILITAIRE : Valider le format de date
  isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  // 🔹 MÉTHODE : Formater la date pour l'affichage
  formatDate(dateString: string): string {
    if (!dateString) return 'Non définie';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  }

  // 🔹 MÉTHODE : Obtenir le nom du projet par ID
  getProjectName(projectId: string): string {
    const project = this.projects.find((p: any) => p.id === projectId);
    return project ? project.name : `Projet ${projectId}`;
  }

  // 🔹 MÉTHODE : Obtenir la couleur selon le statut
  getStatusColor(status: string): string {
    if (!status) return 'medium';
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'acceptée':
      case 'en cours':
      case 'terminé':
      case 'completed':
        return 'success';
      
      case 'en attente':
      case 'pending':
        return 'warning';
      
      case 'refusée':
      case 'rejected':
      case 'cancelled':
        return 'danger';
      
      case 'disponible':
      case 'available':
        return 'primary';
      
      default:
        return 'medium';
    }
  }
}