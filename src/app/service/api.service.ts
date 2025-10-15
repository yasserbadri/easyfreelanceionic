import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private BASE_URL = 'http://localhost:8089'; // URL backend

  constructor(private http: HttpClient) {}

  // Authentification
  login(data: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}/api/auth/signin`, data);
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}/api/auth/signup`, data);
  }

  // Récupérer les freelances
  getFreelancers(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/freelancers`);
  }

  // Récupérer les projets
  getProjects(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/projects`);
  }
}
