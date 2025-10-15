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
  username = '';        // Email de l'utilisateur
  password = '';     // Mot de passe

  constructor(private auth: AuthService, private router: Router) {}

  /**
   * Méthode pour se connecter
   * Appelle le service AuthService pour vérifier les identifiants
   * Redirige vers le dashboard correspondant au rôle
   */
  login() {
    if (!this.username || !this.password) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        this.auth.setUser(res.user); // Stocker l'utilisateur
        // Redirection selon rôle
        if (res.user.role === 'Freelancer') this.router.navigate(['/dashboard-client']);
        else this.router.navigate(['/dashboard-freelancer']);
      },
      error: (err) => {
        console.error('Erreur login', err);
        alert('Email ou mot de passe incorrect');
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
