import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/service/auth.service';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ApiService } from 'src/app/service/api.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-dashboard-client',
  templateUrl: './dashboard-client.page.html',
  styleUrls: ['./dashboard-client.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule,IonicModule]
})
export class DashboardClientPage implements OnInit {
  user: any = null;
  projects: any[] = [];

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

    // 🔹 RÉCUPÉRER LE VRAI ID MYSQL
    const currentUserId = this.auth.getCurrentUserId();
    
    if (!currentUserId) {
      console.error('❌ ID MySQL non disponible');
      console.log('🔍 Debug user:', this.user);
      this.auth.debugUser();
      this.showToast('Erreur : ID utilisateur non disponible. Veuillez vous reconnecter.');
      return;
    }

    this.isCreating = true;

    const payload = {
      name: this.newProject.name,
      description: this.newProject.description,
      budget: this.newProject.budget,
      clientId: currentUserId // 🔹 MAINTENANT LE VRAI ID MYSQL
    };

    console.log('🚀 Création projet avec payload:', payload);

    this.api.createProject(payload).subscribe({
      next: (res: any) => {
        this.isCreating = false;
        
        console.log('✅ Réponse création projet:', res);
        
        const createdProject = res.data?.createProject;
        const projectId = createdProject?.id;

        if (projectId) {
          this.showToast(`Projet créé avec succès (ID: ${projectId})`);
          this.newProject = { name: '', description: '', budget: null };
          this.loadProjects(); // Recharger la liste
        } else {
          this.showToast('Projet créé mais ID non reçu');
        }
      },
      error: (err) => {
        this.isCreating = false;
        console.error('❌ Erreur création projet:', err);
        
        // 🔹 Afficher plus de détails sur l'erreur
        if (err.error) {
          console.error('Détails erreur:', err.error);
        }
        
        this.showToast('Erreur lors de la création du projet');
      }
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
}