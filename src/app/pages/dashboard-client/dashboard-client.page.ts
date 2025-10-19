import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonList,
  IonChip,
  IonSpinner,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonMenu,
  IonMenuButton,
  IonButtons,
  IonRefresher,
  IonRefresherContent,
  ToastController
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/service/auth.service';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ApiService } from 'src/app/service/api.service';
import { Firestore, collection, doc, setDoc, getDocs, query, where, updateDoc, getDoc, addDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';
// Import correct pour serverTimestamp depuis firebase/firestore
import { serverTimestamp } from 'firebase/firestore';

@Component({
  selector: 'app-dashboard-client',
  templateUrl: './dashboard-client.page.html',
  styleUrls: ['./dashboard-client.page.scss'],
  standalone: true,
  imports: [ 
    CommonModule, 
    FormsModule,
    IonicModule,
    RouterModule
  ]
})
export class DashboardClientPage implements OnInit {
  user: any = null;
  projects: any[] = [];
  proposals: any[] = [];
  activeProjects: any[] = [];
  posts: any[] = [];
  firestore = inject(Firestore);

  // Navigation
  activeSection: string = 'dashboard';
  
  // États de chargement
  isLoading = false;
  isCreating = false;
  loadingProposals = false;
  loadingActiveProjects = false;
  loadingPosts = false;

  // Formulaire projet
  newProject = {
    name: '',
    description: '',
    budget: null as number | null
  };

  // Statistiques
  stats = {
    totalProjects: 0,
    activeProjects: 0,
    totalProposals: 0,
    totalBudget: 0
  };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  async ngOnInit() {
    this.user = await this.auth.getUser();

    if (!this.user) {
      console.warn('Aucun utilisateur connecté');
      await this.showToast('Erreur : utilisateur non connecté');
      this.router.navigate(['/login']);
      return;
    }

    console.log('🔍 Client dans dashboard:', {
      user: this.user,
      mysqlId: this.auth.getCurrentUserId(),
      username: this.user.username
    });

    await this.loadAllData();
  }

  // 🔹 Méthodes pour les titres de section
  getSectionTitle(): string {
    switch (this.activeSection) {
      case 'dashboard':
        return 'Tableau de Bord Client';
      case 'my-projects':
        return 'Mes Projets';
      case 'proposals':
        return 'Propositions Reçues';
      case 'active-projects':
        return 'Projets en Cours';
      case 'freelancer-posts':
        return 'Portfolios Freelancers';
      default:
        return 'Tableau de Bord';
    }
  }

  getSectionSubtitle(): string {
    switch (this.activeSection) {
      case 'dashboard':
        return 'Vue d\'ensemble de vos projets et activités';
      case 'my-projects':
        return 'Créez et gérez vos projets';
      case 'proposals':
        return 'Consultez les propositions des freelancers';
      case 'active-projects':
        return 'Suivez vos projets en cours';
      case 'freelancer-posts':
        return 'Découvrez le travail des freelancers';
      default:
        return 'Vue d\'ensemble de vos activités';
    }
  }

  // 🔹 Charger toutes les données
  async loadAllData() {
    await Promise.all([
      this.loadProjects(),
      this.loadProposals(),
      this.loadActiveProjects(),
      this.loadPosts()
    ]);
    this.calculateStats();
  }

  // 🔹 Navigation entre sections
  setActiveSection(section: string) {
    this.activeSection = section;
    if (section === 'freelancer-posts') {
      this.loadPosts();
    }
  }

  // 🔹 Charger les projets du client
  async loadProjects() {
    this.isLoading = true;
    const currentUserId = this.auth.getCurrentUserId();
    
    try {
      // Charger depuis MySQL via l'API
      this.api.getProjects().subscribe({
        next: (res: any) => {
          this.projects = res.data?.availableProjects || [];
          this.isLoading = false;
          console.log('📋 Projets chargés:', this.projects);
        },
        error: (err) => {
          console.error('Erreur API projets:', err);
          // Convertir en string pour Firestore
          if (currentUserId) {
            this.loadProjectsFromFirestore(currentUserId.toString());
          } else {
            this.isLoading = false;
          }
        }
      });
    } catch (error) {
      // Convertir en string pour Firestore
      if (currentUserId) {
        this.loadProjectsFromFirestore(currentUserId.toString());
      } else {
        this.isLoading = false;
      }
    }
  }

  // Fallback: Charger depuis Firestore
  async loadProjectsFromFirestore(clientId: string) {
    try {
      const projectsRef = collection(this.firestore, 'projects');
      const q = query(projectsRef, where('clientId', '==', clientId));
      const snap = await getDocs(q);
      
      this.projects = snap.docs.map((doc: any) => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      this.isLoading = false;
    } catch (error) {
      console.error('Erreur Firestore projets:', error);
      this.isLoading = false;
    }
  }

  // 🔹 Charger les propositions
  async loadProposals() {
    const currentUserId = this.auth.getCurrentUserId();
    if (!currentUserId) return;

    this.loadingProposals = true;
    try {
      const proposalsRef = collection(this.firestore, 'proposals');
      const projectsRef = collection(this.firestore, 'projects');
      
      // Récupérer les projets du client
      const projectsQuery = query(projectsRef, where('clientId', '==', currentUserId.toString()));
      const projectsSnap = await getDocs(projectsQuery);
      const clientProjectIds = projectsSnap.docs.map((doc: any) => doc.id);

      if (clientProjectIds.length === 0) {
        this.proposals = [];
        this.loadingProposals = false;
        return;
      }

      // Récupérer les propositions pour ces projets
      const allProposals: any[] = [];
      for (const projectId of clientProjectIds) {
        const proposalsQuery = query(proposalsRef, where('projectId', '==', projectId));
        const proposalsSnap = await getDocs(proposalsQuery);
        const projectProposals = proposalsSnap.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
          projectName: projectsSnap.docs.find((p: any) => p.id === projectId)?.data()['name'] || 'Projet inconnu'
        }));
        allProposals.push(...projectProposals);
      }

      this.proposals = allProposals;
    } catch (error) {
      console.error('Erreur loadProposals:', error);
    } finally {
      this.loadingProposals = false;
    }
  }

  // 🔹 Charger les projets actifs
  async loadActiveProjects() {
    const currentUserId = this.auth.getCurrentUserId();
    if (!currentUserId) return;

    this.loadingActiveProjects = true;
    try {
      const projectsRef = collection(this.firestore, 'projects');
      const q = query(
        projectsRef, 
        where('clientId', '==', currentUserId.toString()),
        where('status', 'in', ['En cours', 'acceptée', 'active'])
      );
      
      const snap = await getDocs(q);
      this.activeProjects = snap.docs.map((doc: any) => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
    } catch (error) {
      console.error('Erreur loadActiveProjects:', error);
    } finally {
      this.loadingActiveProjects = false;
    }
  }

  // 🔹 Charger les posts des freelancers
  async loadPosts() {
    this.loadingPosts = true;
    try {
      const postsRef = collection(this.firestore, 'posts');
      const snap = await getDocs(postsRef);
      
      this.posts = snap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null
      }));

      console.log('📝 Posts freelancers chargés:', this.posts.length);
    } catch (error) {
      console.error('❌ Erreur loadPosts:', error);
    } finally {
      this.loadingPosts = false;
    }
  }

  // 🔹 Calculer les statistiques
  calculateStats() {
    this.stats = {
      totalProjects: this.projects.length,
      activeProjects: this.activeProjects.length,
      totalProposals: this.proposals.length,
      totalBudget: this.projects.reduce((sum, project) => sum + (project.budget || 0), 0)
    };
  }

  // 🔹 Créer un projet
  async createProject() {
    if (!this.newProject.name || !this.newProject.description || !this.newProject.budget) {
      this.showToast('Veuillez remplir tous les champs');
      return;
    }

    const currentUserId = this.auth.getCurrentUserId();
    if (!currentUserId) {
      this.showToast('Erreur : ID utilisateur non disponible.');
      return;
    }

    this.isCreating = true;

    const payload = {
      name: this.newProject.name,
      description: this.newProject.description,
      budget: this.newProject.budget,
      clientId: currentUserId,
    };

    this.api.createProject(payload).subscribe({
      next: async (res: any) => {
        const createdProject = res.data?.createProject;
        const projectId = createdProject?.id;

        if (projectId) {
          const projectRef = doc(collection(this.firestore, 'projects'), projectId.toString());
          await setDoc(projectRef, {
            id: projectId,
            name: payload.name,
            description: payload.description,
            budget: payload.budget,
            clientId: currentUserId.toString(),
            clientEmail: this.user.email,
            clientName: this.user.username,
            status: 'disponible',
            createdAt: new Date().toISOString(),
          });

          this.showToast(`Projet créé avec succès (ID: ${projectId})`);
          this.newProject = { name: '', description: '', budget: null };
          await this.loadAllData();
        }
        this.isCreating = false;
      },
      error: (err) => {
        this.isCreating = false;
        console.error('Erreur création projet:', err);
        this.showToast('Erreur lors de la création du projet');
      },
    });
  }

  // 🔹 Accepter une proposition
  async acceptProposal(proposal: any) {
    try {
      // Mettre à jour la proposition
      const proposalRef = doc(this.firestore, `proposals/${proposal.id}`);
      await updateDoc(proposalRef, { 
        status: 'acceptée',
        acceptedAt: serverTimestamp()
      });

      // Mettre à jour le projet
      const projectRef = doc(this.firestore, `projects/${proposal.projectId}`);
      await updateDoc(projectRef, { 
        freelancerId: proposal.freelancerId,
        freelancerName: proposal.freelancerName,
        status: 'En cours',
        acceptedProposalId: proposal.id
      });

      this.showToast('Proposition acceptée ✅');
      await this.loadAllData();
    } catch (error) {
      console.error('Erreur acceptProposal:', error);
      this.showToast('Erreur lors de l\'acceptation de la proposition');
    }
  }

  // 🔹 Refuser une proposition
  async rejectProposal(proposalId: string) {
    try {
      const proposalRef = doc(this.firestore, `proposals/${proposalId}`);
      await updateDoc(proposalRef, { 
        status: 'refusée',
        rejectedAt: serverTimestamp()
      });

      this.showToast('Proposition refusée');
      await this.loadProposals();
    } catch (error) {
      console.error('Erreur rejectProposal:', error);
      this.showToast('Erreur lors du refus de la proposition');
    }
  }

  // 🔹 Marquer un projet comme terminé
  async completeProject(projectId: string) {
    try {
      const projectRef = doc(this.firestore, `projects/${projectId}`);
      await updateDoc(projectRef, { 
        status: 'Terminé',
        completedAt: serverTimestamp()
      });

      this.showToast('Projet marqué comme terminé ✅');
      await this.loadActiveProjects();
      this.calculateStats();
    } catch (error) {
      console.error('Erreur completeProject:', error);
      this.showToast('Erreur lors de la mise à jour du projet');
    }
  }

  // 🔹 Ouvrir le média en plein écran
  openMediaSimple(mediaData: string) {
    if (!mediaData) {
      this.showToast('Média non disponible');
      return;
    }

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

  // 🔹 Rafraîchir les données
  async refreshData() {
    await this.loadAllData();
    this.showToast('Données rafraîchies');
  }

  handleRefresh(event: any) {
    this.loadAllData().then(() => {
      event.target.complete();
    });
  }

  // 🔹 Utilitaires
  getStatusColor(status: string): string {
    if (!status) return 'medium';
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'acceptée':
      case 'en cours':
      case 'terminé':
      case 'completed': 
      case 'active': return 'success';
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

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color: 'primary',
      position: 'bottom'
    });
    await toast.present();
  }

  // 🔹 Déconnexion
  logout() {
    this.auth.logout().then(() => {
      this.router.navigate(['/login']);
    });
  }
}