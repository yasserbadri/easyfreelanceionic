import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor(private authService: AuthService) {}

  // 🔹 Créer un projet lié à l’utilisateur connecté
  async createProject(projectData: any) {
    const clientId = this.authService.getCurrentUserId();

    if (!clientId) {
      throw new Error('Utilisateur non connecté');
    }

    const query = `
      mutation CreateProject($input: ProjectInput!) {
        createProject(input: $input) {
          id
          name
          status
        }
      }
    `;

    const input = {
      name: projectData.name,
      description: projectData.description,
      budget: projectData.budget,
      clientId: clientId // 🔹 UID Firebase de l’utilisateur connecté
    };

    // Exemple : envoi via ton helper GraphQL
    return this.graphqlQuery(query, { input });
  }

  // 🔹 Récupérer les projets du client connecté
  async getProjectsByClient() {
    const clientId = this.authService.getCurrentUserId();

    if (!clientId) {
      throw new Error('Utilisateur non connecté');
    }

    const query = `
      query ($clientId: ID!) {
        projectsByClient(clientId: $clientId) {
          id
          name
          description
          budget
          status
        }
      }
    `;

    return this.graphqlQuery(query, { clientId });
  }

  // 🔹 Méthode générique pour interagir avec ton backend GraphQL
  async graphqlQuery(query: string, variables?: any) {
    const res = await fetch('http://localhost:8089/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables })
    });

    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data;
  }
}
