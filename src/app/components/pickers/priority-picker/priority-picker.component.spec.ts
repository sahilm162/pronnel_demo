import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriorityPickerComponent } from './priority-picker.component';

describe('PriorityPickerComponent', () => {
  let component: PriorityPickerComponent;
  let fixture: ComponentFixture<PriorityPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ PriorityPickerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PriorityPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
