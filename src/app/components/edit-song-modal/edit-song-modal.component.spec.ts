import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSongModalComponent } from './edit-song-modal.component';

describe('EditSongModalComponent', () => {
  let component: EditSongModalComponent;
  let fixture: ComponentFixture<EditSongModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditSongModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditSongModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
