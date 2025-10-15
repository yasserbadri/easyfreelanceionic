import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardClientPage } from './dashboard-client.page';

describe('DashboardClientPage', () => {
  let component: DashboardClientPage;
  let fixture: ComponentFixture<DashboardClientPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardClientPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
