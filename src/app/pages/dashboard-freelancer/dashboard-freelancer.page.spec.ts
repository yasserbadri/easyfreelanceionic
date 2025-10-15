import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardFreelancerPage } from './dashboard-freelancer.page';

describe('DashboardFreelancerPage', () => {
  let component: DashboardFreelancerPage;
  let fixture: ComponentFixture<DashboardFreelancerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardFreelancerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
