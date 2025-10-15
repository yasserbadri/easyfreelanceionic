import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-dashboard-client',
  templateUrl: './dashboard-client.page.html',
  styleUrls: ['./dashboard-client.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class DashboardClientPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
