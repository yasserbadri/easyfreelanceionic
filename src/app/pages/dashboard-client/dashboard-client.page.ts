import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/service/auth.service';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ApiService } from 'src/app/service/api.service';
import { ToastController } from '@ionic/angular';
import { Firestore, collection, doc, setDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { RouterModule } from '@angular/router'; // <-- Ajouter RouterModule

@Component({
  selector: 'app-dashboard-client',
  templateUrl: './dashboard-client.page.html',
  styleUrls: ['./dashboard-client.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule,IonicModule,    RouterModule, // <-- nécessaire pour [routerLink]
]
})
export class DashboardClientPage implements OnInit {
  user: any = null;
  projects: any[] = [];
  firestore = inject(Firestore); // ✅ nouvelle façon d'injecter Firestore


  // 🔹 Formulaire projet
  newProject = {
    name: '',
    description: '',
    budget: null
  };

  isLoading = false;
  isCreating = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  async ngOnInit() {
    // 🔸 Récupère l'utilisateur connecté
    this.user = await this.auth.getUser();

    if (!this.user) {
      console.warn('Aucun utilisateur connecté');
      await this.showToast('Erreur : utilisateur non connecté');
      this.router.navigate(['/login']);
      return;
    }

    // 🔹 DEBUG: Afficher les informations utilisateur
    console.log('🔍 User dans dashboard:', {
      user: this.user,
      mysqlId: this.auth.getCurrentUserId(),
      username: this.user.username
    });

    this.loadProjects();
  }

  // ✅ Charger les projets du client
  loadProjects() {
    this.isLoading = true;
    this.api.getProjects().subscribe({
      next: (res: any) => {
        this.projects = res.data?.availableProjects || [];
        this.isLoading = false;
        console.log('📋 Projets chargés:', this.projects);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des projets', err);
        this.isLoading = false;
        this.showToast('Erreur lors du chargement des projets');
      }
    });
  }

  // ✅ Créer un projet avec le VRAI ID MySQL
  createProject() {
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

        // ✅ Ajout Firestore (sans AngularFirestoreCompat)
        if (projectId) {
          const projectRef = doc(collection(this.firestore, 'projects'), projectId.toString());
          await setDoc(projectRef, {
            id: projectId,
            name: payload.name,
            description: payload.description,
            budget: payload.budget,
            clientId: currentUserId,
            clientEmail: this.user.email,
            status: 'disponible',
            createdAt: new Date().toISOString(),
          });

          this.showToast(`Projet créé avec succès (ID: ${projectId})`);
          this.newProject = { name: '', description: '', budget: null };
          this.loadProjects();
        }
      },
      error: (err) => {
        this.isCreating = false;
        console.error('Erreur création projet:', err);
        this.showToast('Erreur lors de la création du projet');
      },
    });
  }

  // ✅ Toast d'affichage
  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color: 'primary',
      position: 'bottom'
    });
    await toast.present();
  }

  // 🔹 Méthode pour forcer la déconnexion si problème
  logout() {
    this.auth.logout().then(() => {
      this.router.navigate(['/login']);
    });
  }

  viewProposals(projectId: string) {
    this.router.navigate(['/view-proposals', projectId]);
  }
}