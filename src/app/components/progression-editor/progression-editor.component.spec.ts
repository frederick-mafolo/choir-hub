import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressionEditorComponent } from './progression-editor.component';

describe('ProgressionEditorComponent', () => {
  let component: ProgressionEditorComponent;
  let fixture: ComponentFixture<ProgressionEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressionEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgressionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
