import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/service/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LoginPage {
  username = '';
  password = '';
  isLoading = false; // ✅ Pour désactiver le bouton pendant le login

  constructor(private auth: AuthService, private router: Router) {}

  /**
   * Méthode pour se connecter
   * Auth backend → Firebase → Récupération Firestore
   */
  login() {
  if (!this.username || !this.password) {
    alert('Veuillez remplir tous les champs');
    return;
  }

  this.isLoading = true;

  this.auth.login({ usernameOrEmail: this.username, password: this.password })
    .subscribe({
      next: () => {
        this.isLoading = false;

        const user = this.auth.getUser();

        // Redirection selon rôle
        if (user?.role === 'Client') {
          this.router.navigate(['/dashboard-client']);
        } else {
          this.router.navigate(['/dashboard-freelancer']);
        }
      },
      error: (err) => {
        this.isLoading = false;

        console.error('Erreur login', err);
        if (err.code?.includes('auth')) {
          alert('Erreur Firebase : email ou mot de passe incorrect / problème réseau');
        } else {
          alert('Email ou mot de passe incorrect');
        }
      }
    });
}

  goToRegister() {
    this.router.navigate(['/register']);
  }
}