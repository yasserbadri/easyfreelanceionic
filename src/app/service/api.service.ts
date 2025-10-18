import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private BASE_URL = 'http://localhost:8089'; // URL backend
private base_URL = 'http://localhost:8089/graphql'; // URL GraphQL
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

  

  // 🔹 Nouvelle méthode pour récupérer l’email Firebase
  getEmailByUsernameOrEmail(usernameOrEmail: string): Observable<string> {
    return this.http.get(`${this.BASE_URL}/api/auth/email/${usernameOrEmail}`, { responseType: 'text' });
  }
  graphqlQuery(query: string, variables?: any): Observable<any> {
    const body = { query, variables };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(this.base_URL, body, { headers });
  }

  createProject(projectData: any): Observable<any> {
  const query = `
    mutation CreateProject($input: ProjectInput!) {
      createProject(input: $input) {
        id
        name
        status
      }
    }
  `;
  return this.graphqlQuery(query, { input: projectData });
}

getProjects(): Observable<any> {
  const query = `
    query {
      availableProjects {
        id
        name
        description
        budget
        status
      }
    }
  `;
  return this.graphqlQuery(query);
}

  
}
