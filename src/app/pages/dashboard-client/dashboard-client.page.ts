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
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    // 🔸 Récupère l'utilisateur connecté
    this.user = await this.auth.getUser();

    if (!this.user || !this.user.id) {
      console.warn('Aucun utilisateur connecté ou ID manquant');
      await this.showToast('Erreur : utilisateur non connecté');
      return;
    }

    this.loadProjects();
  }

  // ✅ Charger les projets du client
  loadProjects() {
    this.isLoading = true;
    this.api.getProjects().subscribe({
      next: (res: any) => {
        this.projects = res.data?.availableProjects || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des projets', err);
        this.isLoading = false;
        this.showToast('Erreur lors du chargement des projets');
      }
    });
  }

  // ✅ Créer un projet (avec clientId)
  createProject() {
  if (!this.newProject.name || !this.newProject.description || !this.newProject.budget) {
    this.showToast('Veuillez remplir tous les champs');
    return;
  }

  this.isCreating = true;

  const payload = {
    name: this.newProject.name,
    description: this.newProject.description,
    budget: this.newProject.budget,
    clientId: 1 // 🔹 ID temporaire (le vrai mapping se fera plus tard)
  };

  this.api.createProject(payload).subscribe({
    next: (res: any) => {
      this.isCreating = false;

      // ✅ Récupération du projet créé depuis la réponse GraphQL
      const createdProject = res.data?.createProject;
      const projectId = createdProject?.id;

      console.log('✅ Projet créé avec ID :', projectId);
      this.showToast(`Projet ajouté avec succès (ID: ${projectId})`);

      // 🔹 Rafraîchir la liste
      this.newProject = { name: '', description: '', budget: null };
      this.loadProjects();
    },
    error: (err) => {
      this.isCreating = false;
      console.error('Erreur lors de la création du projet', err);
      this.showToast('Erreur lors de la création du projet');
    }
  });
}



  // ✅ Toast d’affichage
  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color: 'primary',
      position: 'bottom'
    });
    await toast.present();
  }
}