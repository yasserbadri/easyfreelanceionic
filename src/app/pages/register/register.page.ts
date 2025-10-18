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
   username = '';
  email = '';
  password = '';
  role = 'client'; // valeur par défaut
  isLoading = false;

  constructor(private auth: AuthService, private router: Router) {}

  register() {
    if (!this.username || !this.email || !this.password) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    this.isLoading = true;

    this.auth.register({
      username: this.username,
      email: this.email,
      password: this.password,
      role: this.role
    }).subscribe({
      next: (res) => {
        console.log('Inscription réussie', res);
        this.isLoading = false;
        alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Erreur lors de l\'inscription', err);
        this.isLoading = false;
        let msg = 'Erreur lors de l\'inscription';
        if (err.error?.message) msg += ': ' + err.error.message;
        alert(msg);
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
