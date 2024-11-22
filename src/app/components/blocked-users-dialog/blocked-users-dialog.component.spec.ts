import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockedUsersDialogComponent } from './blocked-users-dialog.component';

describe('BlockedUsersDialogComponent', () => {
  let component: BlockedUsersDialogComponent;
  let fixture: ComponentFixture<BlockedUsersDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BlockedUsersDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlockedUsersDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
