import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BucketPickerComponent } from './bucket-picker.component';

describe('BucketPickerComponent', () => {
  let component: BucketPickerComponent;
  let fixture: ComponentFixture<BucketPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ BucketPickerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BucketPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
