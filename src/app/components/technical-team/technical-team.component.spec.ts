import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechnicalTeamComponent } from './technical-team.component';

describe('TechnicalTeamComponent', () => {
  let component: TechnicalTeamComponent;
  let fixture: ComponentFixture<TechnicalTeamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechnicalTeamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TechnicalTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
