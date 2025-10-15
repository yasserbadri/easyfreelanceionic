import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/service/auth.service';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RegisterPage {
  name = '';
  email = '';
  password = '';
  role = 'freelancer'; // rôle par défaut

  constructor(private auth: AuthService, private router: Router) {}

  /**
   * Méthode pour créer un nouvel utilisateur
   * Appelle AuthService.register
   * Redirige vers login après succès
   */
  register() {
    if (!this.name || !this.email || !this.password) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    this.auth.register({
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role
    }).subscribe({
      next: (res) => {
        alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Erreur register', err);
        alert('Erreur lors de l\'inscription');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
