import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Firestore, collection, collectionData, doc, updateDoc } from '@angular/fire/firestore';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-view-proposals',
  templateUrl: './view-proposals.page.html',
  styleUrls: ['./view-proposals.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule], // <-- Ajout de RouterModule
})
export class ViewProposalsPage {
  proposals: any[] = [];
  projectId: string = '';

  constructor(private firestore: Firestore, private route: ActivatedRoute) {}

  ngOnInit() {
    this.loadProposals();
  }

  loadProposals() {
    this.projectId = this.route.snapshot.paramMap.get('projectId') || '';
    const proposalsCollection = collection(this.firestore, 'proposals');

    collectionData(proposalsCollection, { idField: 'id' }).subscribe((data: any[]) => {
      this.proposals = data.filter(p => p.projectId === this.projectId);
    });
  }

  async updateProposalStatus(proposalId: string, status: string) {
    const proposalRef = doc(this.firestore, `proposals/${proposalId}`);
    await updateDoc(proposalRef, { status });

    // Mise à jour locale
    this.proposals = this.proposals.map(p => p.id === proposalId ? { ...p, status } : p);
  }
}
