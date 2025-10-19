import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Firestore, collection, collectionData, doc, updateDoc, getDoc } from '@angular/fire/firestore';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-view-proposals',
  templateUrl: './view-proposals.page.html',
  styleUrls: ['./view-proposals.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
})
export class ViewProposalsPage {
  proposals: any[] = [];
  projectId: string = '';

  constructor(
    private firestore: Firestore,
    private route: ActivatedRoute,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.loadProposals();
  }

  loadProposals() {
    this.projectId = this.route.snapshot.paramMap.get('projectId') || '';
    const proposalsCollection = collection(this.firestore, 'proposals');

    collectionData(proposalsCollection, { idField: 'id' }).subscribe(async (data: any[]) => {
      // Filtrer les propositions pour ce projet
      const filteredProposals = data.filter(p => p.projectId === this.projectId);
      
      // 🔹 AMÉLIORATION : Si pas de nom, essayer de le récupérer
      this.proposals = await this.enrichProposalsWithFreelancerInfo(filteredProposals);
    });
  }

  // 🔹 NOUVELLE MÉTHODE : Enrichir les propositions avec les infos freelancer
  async enrichProposalsWithFreelancerInfo(proposals: any[]): Promise<any[]> {
    const enrichedProposals = [];
    
    for (const proposal of proposals) {
      let freelancerName = proposal.freelancerName;
      
      // Si pas de nom dans la proposition, essayer de le récupérer depuis Firestore
      if (!freelancerName && proposal.freelancerId) {
        freelancerName = await this.getFreelancerName(proposal.freelancerId);
      }
      
      enrichedProposals.push({
        ...proposal,
        freelancerName: freelancerName || 'Freelance Anonyme'
      });
    }
    
    return enrichedProposals;
  }

  // 🔹 NOUVELLE MÉTHODE : Récupérer le nom d'un freelancer par son ID
  async getFreelancerName(freelancerId: string): Promise<string> {
    try {
      const userDocRef = doc(this.firestore, 'users', freelancerId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData['username'] || userData['displayName'] || 'Freelance Anonyme';
      }
    } catch (error) {
      console.error('Erreur récupération nom freelancer:', error);
    }
    
    return 'Freelance Anonyme';
  }

  async confirmAction(proposalId: string, status: string) {
    const proposal = this.proposals.find(p => p.id === proposalId);
    const freelancerName = proposal?.freelancerName || 'ce freelancer';
    
    const alert = await this.alertCtrl.create({
      header: status === 'accepted' ? 'Accepter la proposition' : 'Refuser la proposition',
      message:
        status === 'accepted'
          ? `Voulez-vous vraiment accepter la proposition de ${freelancerName} ?`
          : `Voulez-vous vraiment refuser la proposition de ${freelancerName} ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Confirmer',
          handler: () => this.updateProposalStatus(proposalId, status),
        },
      ],
    });

    await alert.present();
  }

  async updateProposalStatus(proposalId: string, status: string) {
    const proposalRef = doc(this.firestore, `proposals/${proposalId}`);

    const newStatus =
      status === 'accepted'
        ? 'Acceptée'
        : status === 'rejected'
        ? 'Refusée'
        : 'En attente';

    await updateDoc(proposalRef, { status: newStatus });

    // Mettre à jour aussi le projet si la proposition est acceptée
    if (status === 'accepted') {
      const proposal = this.proposals.find(p => p.id === proposalId);
      if (proposal) {
        await this.assignFreelancerToProject(proposal.projectId, proposal.freelancerId, proposal.freelancerName);
      }
    }

    this.proposals = this.proposals.map(p =>
      p.id === proposalId ? { ...p, status: newStatus } : p
    );
  }

  // 🔹 NOUVELLE MÉTHODE : Assigner le freelancer au projet quand accepté
  async assignFreelancerToProject(projectId: string, freelancerId: string, freelancerName: string) {
    try {
      const projectRef = doc(this.firestore, `projects/${projectId}`);
      await updateDoc(projectRef, {
        freelancerId: freelancerId,
        freelancerName: freelancerName,
        status: 'En cours',
        assignedAt: new Date()
      });
      console.log(`✅ Freelancer ${freelancerName} assigné au projet ${projectId}`);
    } catch (error) {
      console.error('Erreur assignation freelancer:', error);
    }
  }
  getStatusColor(status: string): string {
  switch (status) {
    case 'Acceptée': return 'success';
    case 'Refusée': return 'danger';
    case 'En attente': return 'warning';
    default: return 'medium';
  }
}

// Méthode pour formater la date
formatDate(timestamp: any): string {
  if (!timestamp) return 'Date inconnue';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Date invalide';
  }
}
}