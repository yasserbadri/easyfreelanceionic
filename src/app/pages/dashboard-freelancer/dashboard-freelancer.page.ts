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
  selectedProject: any = null;
  posts: any[] = [];
  loadingPosts = false;
  newPost: any = { description: '', mediaData: '', mediaType: '' };

  newProposal: any = {
    projectId: '',
    description: '',
    price: ''
  };

  freelancerUid: string | null = null;
  freelancerName: string = '';
  freelancerEmail: string = '';
  
  // Navigation
  activeSection: string = 'dashboard';
  
  // États de chargement
  loadingProjects = false;
  loadingProposals = false;
  loadingAcceptedProjects = false;
  loadingStats = false;
  submitting = false;

  // Statistiques
  stats = {
    totalProposals: 0,
    acceptedProjects: 0,
    pendingProposals: 0,
    totalEarnings: 0
  };

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.warn('Aucun utilisateur Firebase connecté');
      return;
    }
    this.freelancerUid = user.uid;
    this.freelancerEmail = user.email || '';
    
    await this.loadFreelancerProfile();
    await this.loadAllData();
    await this.loadPosts();
  }

  // 🔹 Méthodes pour les titres de section
  getSectionTitle(): string {
    switch (this.activeSection) {
      case 'dashboard':
        return 'Tableau de Bord';
      case 'available-projects':
        return 'Projets Disponibles';
      case 'my-proposals':
        return 'Mes Propositions';
      case 'accepted-projects':
        return 'Projets Acceptés';
      case 'my-posts':
        return 'Mon Portfolio';
      default:
        return 'Tableau de Bord';
    }
  }

  getSectionSubtitle(): string {
    switch (this.activeSection) {
      case 'dashboard':
        return 'Vue d\'ensemble de votre activité freelance';
      case 'available-projects':
        return 'Postulez aux projets qui correspondent à vos compétences';
      case 'my-proposals':
        return 'Suivez l\'état de vos propositions';
      case 'accepted-projects':
        return 'Gérez vos projets en cours';
      case 'my-posts':
        return 'Partagez vos réalisations et montrez votre talent';
      default:
        return 'Vue d\'ensemble de votre activité';
    }
  }

  // 🔹 Charger toutes les données
  async loadAllData() {
    await Promise.all([
      this.loadProjects(),
      this.loadProposals(),
      this.loadAcceptedProjects()
    ]);
    this.calculateStats();
  }

  // 🔹 Navigation entre sections
  setActiveSection(section: string) {
    this.activeSection = section;
  }

  // 🔹 Récupérer le profil du freelancer
  async loadFreelancerProfile() {
    if (!this.freelancerUid) return;
    
    try {
      const userDocRef = doc(this.firestore, 'users', this.freelancerUid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.freelancerName = userData['username'] || userData['displayName'] || 'Freelance Anonyme';
        console.log('👤 Profil freelancer récupéré:', this.freelancerName);
      } else {
        this.freelancerName = 'Freelance Anonyme';
      }
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      this.freelancerName = 'Freelance Anonyme';
    }
  }

  // 🔹 Charger les projets disponibles
  async loadProjects() {
    try {
      this.loadingProjects = true;
      const colRef = collection(this.firestore, 'projects');
      const snap = await getDocs(colRef);
      
      this.projects = snap.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() }))
        .filter((project: any) => 
          !project.freelancerId && 
          project.status !== 'En cours' && 
          project.status !== 'Terminé'
        );
        
    } catch (err) {
      console.error('Erreur loadProjects:', err);
    } finally {
      this.loadingProjects = false;
    }
  }

  // 🔹 Charger les propositions
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

  // 🔹 Charger les projets acceptés
  async loadAcceptedProjects() {
    if (!this.freelancerUid) return;
    
    try {
      this.loadingAcceptedProjects = true;
      const projectsRef = collection(this.firestore, 'projects');
      const q = query(projectsRef, where('freelancerId', '==', this.freelancerUid));
      const snap = await getDocs(q);
      
      this.acceptedProjects = snap.docs.map((docSnap: any) => ({ 
        id: docSnap.id, 
        ...docSnap.data() 
      }));
      
    } catch (error) {
      console.error('Erreur loadAcceptedProjects:', error);
      this.acceptedProjects = [];
    } finally {
      this.loadingAcceptedProjects = false;
    }
  }

  // 🔹 Calculer les statistiques
  calculateStats() {
    this.stats = {
      totalProposals: this.proposals.length,
      acceptedProjects: this.acceptedProjects.length,
      pendingProposals: this.proposals.filter(p => p.status === 'En attente').length,
      totalEarnings: this.acceptedProjects.reduce((sum, project) => sum + (project.budget || 0), 0)
    };
  }

  // 🔹 Gestion de la modal de proposition
  openProposalModal(project: any) {
    this.selectedProject = project;
    this.newProposal.projectId = project.id;
  }

  closeProposalModal() {
    this.selectedProject = null;
    this.newProposal = { projectId: '', description: '', price: '' };
  }

  // 🔹 Soumettre une proposition
  async submitProposal() {
    if (!this.newProposal.projectId || !this.newProposal.description || !this.newProposal.price) {
      this.showToast('Veuillez remplir tous les champs');
      return;
    }
    if (!this.freelancerUid) return;

    try {
      this.submitting = true;
      
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

      this.showToast('Proposition envoyée avec succès ✅');
      this.closeProposalModal();
      await this.loadProposals();
      this.calculateStats();
    } catch (err) {
      console.error('Erreur submitProposal:', err);
      this.showToast('Erreur lors de l\'envoi de la proposition');
    } finally {
      this.submitting = false;
    }
  }

  // 🔹 Définir date estimée
  async setEstimatedDate(projectId: string, date: string) {
    if (!date) return;
    
    try {
      const projectRef = doc(this.firestore, `projects/${projectId}`);
      await updateDoc(projectRef, { 
        estimatedEndDate: date,
        status: 'En cours'
      });
      
      await this.loadAcceptedProjects();
      this.showToast('Date estimée définie avec succès ✅');
    } catch (error) {
      console.error('Erreur setEstimatedDate:', error);
      this.showToast('Erreur lors de la définition de la date');
    }
  }

  // 🔹 Demander paiement
  async requestPayment(projectId: string) {
    try {
      const projectRef = doc(this.firestore, `projects/${projectId}`);
      await updateDoc(projectRef, { 
        paymentRequested: true,
        paymentRequestedAt: serverTimestamp()
      });
      
      await this.loadAcceptedProjects();
      this.showToast('Demande de paiement envoyée ✅');
    } catch (error) {
      console.error('Erreur requestPayment:', error);
      this.showToast('Erreur lors de la demande de paiement');
    }
  }

  // 🔹 Demander date estimée
  async askEstimatedDate(projectId: string) {
    const date = window.prompt('Date estimée de fin (YYYY-MM-DD)');
    if (date && this.isValidDate(date)) {
      await this.setEstimatedDate(projectId, date);
    } else if (date) {
      this.showToast('Format de date invalide. Utilisez YYYY-MM-DD');
    }
  }

  // 🔹 MÉTHODES POUR LES POSTS BASE64

  // Convertir fichier en Base64
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  // Optimiser l'image pour Base64
  // Optimiser l'image pour Base64
async optimizeImageForBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Pour les vidéos, on ne peut pas les optimiser facilement
    if (file.type.startsWith('video/')) {
      this.fileToBase64(file).then(resolve).catch(reject);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // ✅ FIX: Check if context is available immediately
    if (!ctx) {
      const error = new Error('Canvas context is not available');
      console.warn(error.message);
      // Fallback to original file conversion
      this.fileToBase64(file).then(resolve).catch(reject);
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      try {
        // Réduire la taille pour Base64
        const maxWidth = 800;
        const maxHeight = 600;
        
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en Base64 avec compression
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(base64);
      } catch (error) {
        console.error('Error optimizing image:', error);
        // Fallback to original file conversion
        this.fileToBase64(file).then(resolve).catch(reject);
      }
    };
    
    img.onerror = () => {
      const error = new Error('Failed to load image for optimization');
      console.error(error.message);
      // Fallback to original file conversion
      this.fileToBase64(file).then(resolve).catch(reject);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

  // Gérer la sélection de fichier
  async onFileSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier la taille
    if (file.size > 2 * 1024 * 1024) { // 2MB max
      this.showToast('Fichier trop volumineux (max 2MB)');
      return;
    }

    try {
      this.showToast('Conversion du fichier...');
      
      const base64Data = await this.optimizeImageForBase64(file);
      this.newPost.mediaData = base64Data;
      this.newPost.mediaType = file.type.startsWith('video') ? 'video' : 'image';
      
      console.log('✅ Fichier converti en Base64, taille:', base64Data.length);
      this.showToast('Fichier prêt pour publication ✅');
      
    } catch (error) {
      console.error('❌ Erreur conversion Base64:', error);
      this.showToast('Erreur lors de la conversion du fichier');
    }
  }

  // Supprimer le média sélectionné
  removeMedia() {
    this.newPost.mediaData = '';
    this.newPost.mediaType = '';
    
    // Réinitialiser l'input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    this.showToast('Média supprimé');
  }

  // Publier le post avec Base64
  async submitPost() {
    console.log('🔄 Début de submitPost', this.newPost);
    
    if (!this.newPost.description && !this.newPost.mediaData) {
      this.showToast('❌ Ajoutez au moins une description ou un média');
      return;
    }

    if (!this.freelancerUid || !this.freelancerName) {
      this.showToast('❌ Profil freelancer non chargé');
      return;
    }

    const postData = {
      freelancerId: this.freelancerUid,
      freelancerName: this.freelancerName,
      description: this.newPost.description || '',
      mediaData: this.newPost.mediaData || '', // Base64 stocké directement
      mediaType: this.newPost.mediaType || '',
      isBase64: true,
      createdAt: serverTimestamp()
    };

    console.log('📤 Publication avec Base64, taille données:', postData.mediaData.length);

    try {
      const colRef = collection(this.firestore, 'posts');
      await addDoc(colRef, postData);

      this.showToast('🎉 Post publié avec succès ✅');
      this.resetPostForm();
      await this.loadPosts();
      
    } catch (error) {
      console.error('❌ Erreur submitPost:', error);
      this.showToast('❌ Erreur lors de la publication du post');
    }
  }

  // Réinitialiser le formulaire de post
  resetPostForm() {
    this.newPost = { 
      description: '', 
      mediaData: '', 
      mediaType: '' 
    };
    
    // Réinitialiser l'input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Charger les posts
  async loadPosts() {
    if (!this.freelancerUid) return;
    this.loadingPosts = true;

    try {
      const postsRef = collection(this.firestore, 'posts');
      const q = query(postsRef, where('freelancerId', '==', this.freelancerUid));
      const snap = await getDocs(q);

      this.posts = snap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null
      }));

      console.log('📝 Posts chargés:', this.posts.length);
      
    } catch (error) {
      console.error('❌ Erreur loadPosts:', error);
    } finally {
      this.loadingPosts = false;
    }
  }

  // Ouvrir le média en plein écran
  openMediaSimple(mediaData: string) {
    if (!mediaData) {
      this.showToast('Média non disponible');
      return;
    }

    // Ouvrir dans un nouvel onglet
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>Média</title></head>
          <body style="margin:0; display:flex; justify-content:center; align-items:center; height:100vh; background:#000;">
            <img src="${mediaData}" style="max-width:100%; max-height:100%; object-fit:contain;" />
          </body>
        </html>
      `);
    }
  }

  // Refresh
  handleRefresh(event: any) {
    this.loadAllData().then(() => {
      if (this.activeSection === 'my-posts') {
        this.loadPosts();
      }
      event.target.complete();
    });
  }

  // 🔹 Utilitaires
  isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

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

  getProjectName(projectId: string): string {
    const project = this.projects.find((p: any) => p.id === projectId);
    return project ? project.name : `Projet ${projectId}`;
  }

  getStatusColor(status: string): string {
    if (!status) return 'medium';
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'acceptée':
      case 'en cours':
      case 'terminé':
      case 'completed': return 'success';
      case 'en attente':
      case 'pending': return 'warning';
      case 'refusée':
      case 'rejected':
      case 'cancelled': return 'danger';
      case 'disponible':
      case 'available': return 'primary';
      default: return 'medium';
    }
  }

  async showToast(message: string) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 3000;
    toast.color = 'primary';
    document.body.appendChild(toast);
    return toast.present();
  }

  // 🔹 Rafraîchir les données
  async refreshData() {
    await this.loadAllData();
    if (this.activeSection === 'my-posts') {
      await this.loadPosts();
    }
    this.showToast('Données rafraîchies');
  }
}